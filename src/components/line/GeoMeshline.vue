<script setup lang="ts">
import { onMounted, onUnmounted, shallowRef, ref, watch, inject } from "vue";
import { Group, Vector3, Mesh, BufferGeometry, BufferAttribute, Texture } from "three";
import {
  calculateCenterPoint,
  calculateRelativePositions,
  convertGeoPointsToVector3,
} from "./utils";
// @ts-ignore
import { MeshLine, MeshLineMaterial } from "./THREE.MeshLine";
import { Point } from "@/config/type";
import {
  GeoEventEmits,
  GeoInteractiveProps,
  createEventHandler,
  hijackRaycast,
} from "../common/event";

interface GeoMeshlineProps extends GeoInteractiveProps {
  points: Point[];
  color?: string;
  width?: number;
  sizeAttenuation?: boolean;
  dashArray?: number;
  dashRatio?: number;
  dashOffset?: number;
  map?: Texture;
  renderOrder?: number;
}

const props = withDefaults(defineProps<GeoMeshlineProps>(), {
  renderOrder: 1,
  sizeAttenuation: true,
  raycastMultiplier: 1,
  raycastActive: true,
});

const emit = defineEmits<GeoEventEmits>();

const group = shallowRef<Group>();
const meshLine = shallowRef<any>();
const lineMesh = shallowRef<Mesh>();
const positions = ref<Vector3[]>([]);
const centerPoint = ref<Vector3>(new Vector3());

// 创建事件处理器
const eventHandlers = createEventHandler(emit, props, props.raycastActive, lineMesh);

// 注入动画注册方法
const registerAnimationTarget = inject<(target: any, type: "meshline" | "texture", texture?: Texture) => void>("registerAnimationTarget");
const unregisterAnimationTarget = inject<(target: any) => void>("unregisterAnimationTarget");

const createGeometry = (relativePositions: Vector3[]) => {
  const geometry = new BufferGeometry();
  const pointsArray = new Float32Array(relativePositions.length * 3);

  relativePositions.forEach((pos, index) => {
    pointsArray[index * 3] = pos.x;
    pointsArray[index * 3 + 1] = pos.y;
    pointsArray[index * 3 + 2] = pos.z;
  });

  geometry.setAttribute("position", new BufferAttribute(pointsArray, 3));
  return geometry;
};

const createMeshline = () => {
  if (props.points.length < 2) return;

  group.value = new Group();

  // 计算世界坐标位置
  positions.value = convertGeoPointsToVector3(props.points);

  // 计算中心点
  centerPoint.value = calculateCenterPoint(positions.value);
  const relativePositions = calculateRelativePositions(positions.value, centerPoint.value);

  // 创建带有 position 属性的几何体
  const geometry = createGeometry(relativePositions);

  // 创建 MeshLine
  meshLine.value = new MeshLine();
  meshLine.value.setGeometry(geometry);

  // 创建材质选项
  const materialOptions: any = {
    color: props.color || "#ffffff",
    lineWidth: props.width || 1,
    // 禁用虚线，改为使用UV贴图动画
    dashArray: 0,
    dashRatio: 0,
    dashOffset: 0,
    useDash: 0,
    sizeAttenuation: props.sizeAttenuation ? 1 : 0,
    transparent: true,
    depthTest: false,
    depthWrite: false,
  };

  // 设置贴图
  if (props.map) {
    materialOptions.map = props.map;
    materialOptions.useMap = 1;
  }

  // 创建材质
  const material = new MeshLineMaterial(materialOptions);

  // 创建网格
  lineMesh.value = new Mesh(meshLine.value.geometry, material);
  lineMesh.value.renderOrder = props.renderOrder;

  // 添加交互事件支持
  if (props.raycastActive) {
    hijackRaycast(lineMesh.value, props.raycastMultiplier);
  }

  group.value.add(lineMesh.value);
  group.value.position.copy(centerPoint.value);

  // 注册到动画组件
  if (registerAnimationTarget) {
    registerAnimationTarget(lineMesh.value, "meshline", props.map);
  }
};

const updateGeometryPositions = () => {
  if (!meshLine.value || !lineMesh.value || props.points.length < 2) return;

  // 重新计算位置
  positions.value = convertGeoPointsToVector3(props.points);

  centerPoint.value = calculateCenterPoint(positions.value);
  const relativePositions = calculateRelativePositions(positions.value, centerPoint.value);

  // 创建新的几何体
  const geometry = createGeometry(relativePositions);

  // 更新几何体
  meshLine.value.setGeometry(geometry);
  group.value!.position.copy(centerPoint.value);
};

watch(
  () => props.points,
  () => {
    if (props.points.length >= 2) {
      updateGeometryPositions();
    }
  },
  { deep: true }
);

watch(
  () => [props.color, props.width],
  () => {
    if (lineMesh.value) {
      const material = lineMesh.value.material as any;
      if (material.uniforms) {
        if (material.uniforms.color) material.uniforms.color.value.set(props.color || "#ffffff");
        if (material.uniforms.lineWidth) material.uniforms.lineWidth.value = props.width || 1;
        // 确保禁用虚线
        if (material.uniforms.useDash) material.uniforms.useDash.value = 0;
        if (material.uniforms.dashArray) material.uniforms.dashArray.value = 0;
      }
    }
  }
);

watch(
  () => props.map,
  (newMap) => {
    if (lineMesh.value) {
      const material = lineMesh.value.material as any;
      if (newMap) {
        if (material.uniforms) {
          material.uniforms.map.value = newMap;
          material.uniforms.useMap.value = 1;
        }
        // 重新注册动画目标，更新纹理
        if (registerAnimationTarget) {
          registerAnimationTarget(lineMesh.value, "meshline", newMap);
        }
      } else {
        if (material.uniforms) {
          material.uniforms.map.value = null;
          material.uniforms.useMap.value = 0;
        }
        // 重新注册动画目标，移除纹理
        if (registerAnimationTarget) {
          registerAnimationTarget(lineMesh.value, "meshline", undefined);
        }
      }
    }
  }
);

onMounted(() => {
  createMeshline();
});

onUnmounted(() => {
  if (lineMesh.value) {
    // 注销动画目标
    if (unregisterAnimationTarget) {
      unregisterAnimationTarget(lineMesh.value);
    }
    
    if (lineMesh.value.geometry) {
      lineMesh.value.geometry.dispose();
    }
    if (lineMesh.value.material) {
      const material = lineMesh.value.material as any;
      if (material.dispose) {
        material.dispose();
      }
    }
  }
  if (group.value) {
    group.value.clear();
  }
});
</script>

<template>
  <primitive
    :object="group"
    v-if="group"
    @click="eventHandlers.handleClick"
    @double-click="eventHandlers.handleDoubleClick"
    @context-menu="eventHandlers.handleContextMenu"
    @pointer-enter="eventHandlers.handlePointerEnter"
    @pointer-leave="eventHandlers.handlePointerLeave"
    @pointer-over="eventHandlers.handlePointerOver"
    @pointer-down="eventHandlers.handlePointerDown"
    @pointer-up="eventHandlers.handlePointerUp"
    @wheel="eventHandlers.handleWheel"
  >
    <slot />
  </primitive>
</template>
