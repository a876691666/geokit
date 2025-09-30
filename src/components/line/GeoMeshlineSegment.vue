<script setup lang="ts">
import {
  withDefaults,
  defineProps,
  defineEmits,
  shallowRef,
  ref,
  watch,
  onMounted,
  onUnmounted,
  inject,
} from "vue";
import {
  Group,
  Vector3,
  Vector2,
  Mesh,
  BufferGeometry,
  BufferAttribute,
  Texture,
  Quaternion,
} from "three";
// @ts-ignore
import { MeshLine, MeshLineMaterial } from "./THREE.MeshLine";
import { Point } from "@/config/type";
import { lonlatToECEF } from "@/utils/controls";
import {
  GeoEventEmits,
  GeoInteractiveProps,
  createEventHandler,
  hijackRaycast,
} from "../common/event";

interface GeoMeshlineSegmentProps extends GeoInteractiveProps {
  start: Point; // 起点
  end: Point; // 终点
  color?: string;
  width?: number;
  sizeAttenuation?: boolean;
  map?: any | Texture;
  renderOrder?: number;
  opacity?: number;
  repeat?: number[]; // 纹理平铺
}

const props = withDefaults(defineProps<GeoMeshlineSegmentProps>(), {
  renderOrder: 1,
  sizeAttenuation: true,
  raycastMultiplier: 1,
  raycastActive: true,
  opacity: 1,
  repeat: () => [1, 1],
});

const emit = defineEmits<GeoEventEmits>();

// 对象引用
const group = shallowRef<Group>();
const meshLine = shallowRef<any>();
const lineMesh = shallowRef<Mesh>();

// 记录当前中心与长度以避免不必要的更新
const centerPoint = ref(new Vector3());
const direction = new Vector3();
const startVec = new Vector3();
const endVec = new Vector3();
const xAxis = new Vector3(1, 0, 0);
const quat = new Quaternion();

// 事件
const eventHandlers = createEventHandler(emit, props, props.raycastActive, lineMesh);

// 动画注入
const registerAnimationTarget =
  inject<(target: any, type: "meshline" | "texture", texture?: Texture) => void>(
    "registerAnimationTarget"
  );
const unregisterAnimationTarget = inject<(target: any) => void>("unregisterAnimationTarget");

// 创建基础几何（局部空间：[-0.5,0,0] 到 [0.5,0,0]）
const createBaseGeometry = () => {
  const geometry = new BufferGeometry();
  const points = new Float32Array([-0.5, 0, 0, 0.5, 0, 0]);
  geometry.setAttribute("position", new BufferAttribute(points, 3));
  return geometry;
};

const createSegment = () => {
  if (!props.start || !props.end) return;

  group.value = new Group();

  // 基础几何 -> MeshLine
  const geometry = createBaseGeometry();
  meshLine.value = new MeshLine();
  meshLine.value.setGeometry(geometry);

  const materialOptions: any = {
    color: props.color || "#ffffff",
    lineWidth: props.width || 1,
    sizeAttenuation: props.sizeAttenuation ? 1 : 0,
    transparent: true,
    depthTest: false,
    depthWrite: false,
    repeat: new Vector2(...props.repeat),
  };

  if (props.map) {
    materialOptions.map = props.map;
    materialOptions.useMap = 1;
  }

  const material = new MeshLineMaterial(materialOptions);
  lineMesh.value = new Mesh(meshLine.value.geometry, material);
  lineMesh.value.renderOrder = props.renderOrder;

  if (props.raycastActive) {
    hijackRaycast(lineMesh.value, props.raycastMultiplier);
  }

  group.value.add(lineMesh.value);

  // 设置初始变换
  updateTransform();

  if (registerAnimationTarget) {
    registerAnimationTarget(lineMesh.value, "meshline", props.map);
  }
};

// 仅通过变换更新而不重建 geometry -> 高效
const updateTransform = () => {
  if (!lineMesh.value) return;
  if (!props.start || !props.end) return;

  // 地理坐标 -> ECEF
  startVec.copy(lonlatToECEF(props.start.lon, props.start.lat, props.start.height || 0));
  endVec.copy(lonlatToECEF(props.end.lon, props.end.lat, props.end.height || 0));

  // 方向与长度
  direction.copy(endVec).sub(startVec);
  const length = direction.length();

  if (length === 0) {
    // 重合时隐藏或设一个极小长度防止 NaN
    lineMesh.value.visible = false;
    return;
  } else if (!lineMesh.value.visible) {
    lineMesh.value.visible = true;
  }

  // 中心点
  centerPoint.value.copy(startVec).add(endVec).multiplyScalar(0.5);
  group.value!.position.copy(centerPoint.value);

  // 旋转：从 x 轴对齐到方向
  quat.setFromUnitVectors(xAxis, direction.clone().normalize());
  lineMesh.value.setRotationFromQuaternion(quat);

  // 缩放：x 方向 = length，其它维度 1
  lineMesh.value.scale.set(length, 1, 1);
  lineMesh.value.updateMatrixWorld();
};

// 监听 start / end 深度变化
watch(() => props.start, updateTransform, { deep: true });
watch(() => props.end, updateTransform, { deep: true });

// 其它属性监听
watch(
  () => props.repeat,
  (val) => {
    if (lineMesh.value) {
      const mat: any = lineMesh.value.material;
      if (mat.uniforms?.repeat) {
        mat.uniforms.repeat.value.set(val[0], val[1]);
        mat.needsUpdate = true;
      }
    }
  },
  { immediate: true }
);

watch(
  () => props.opacity,
  (val) => {
    if (lineMesh.value) {
      const mat: any = lineMesh.value.material;
      mat.opacity = val ?? 1;
      mat.needsUpdate = true;
    }
  },
  { immediate: true }
);

watch(
  () => [props.color, props.width],
  () => {
    if (lineMesh.value) {
      const mat: any = lineMesh.value.material;
      if (mat.uniforms) {
        if (mat.uniforms.color) mat.uniforms.color.value.set(props.color || "#ffffff");
        if (mat.uniforms.lineWidth) mat.uniforms.lineWidth.value = props.width || 1;
      }
    }
  }
);

watch(
  () => props.map,
  (newMap) => {
    if (lineMesh.value) {
      const mat: any = lineMesh.value.material;
      if (mat.uniforms) {
        mat.uniforms.map.value = newMap || null;
        mat.uniforms.useMap.value = newMap ? 1 : 0;
      }
      if (registerAnimationTarget) {
        registerAnimationTarget(lineMesh.value, "meshline", newMap || undefined);
      }
    }
  }
);

onMounted(() => {
  createSegment();
});

onUnmounted(() => {
  if (lineMesh.value) {
    if (unregisterAnimationTarget) unregisterAnimationTarget(lineMesh.value);
    if (lineMesh.value.geometry) lineMesh.value.geometry.dispose();
    if (lineMesh.value.material) {
      const material = lineMesh.value.material as any;
      if (material.dispose) {
        material.dispose();
      }
    }
  }
  if (group.value) group.value.clear();
});
</script>

<template>
  <primitive
    v-if="group"
    :object="group"
    @click="eventHandlers.handleClick"
    @doubleclick="eventHandlers.handleDoubleClick"
    @contextmenu="eventHandlers.handleContextMenu"
    @pointerenter="eventHandlers.handlePointerEnter"
    @pointerleave="eventHandlers.handlePointerLeave"
    @pointerover="eventHandlers.handlePointerOver"
    @pointerdown="eventHandlers.handlePointerDown"
    @pointerup="eventHandlers.handlePointerUp"
    @wheel="eventHandlers.handleWheel"
  >
    <slot />
  </primitive>
</template>
