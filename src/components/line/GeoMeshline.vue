<script setup lang="ts">
import { onMounted, onUnmounted, shallowRef, ref, watch } from "vue";
import { Group, Vector3, Mesh, BufferGeometry, BufferAttribute, Texture } from "three";
import { useRenderLoop } from "@tresjs/core";
import {
  calculateCenterPoint,
  calculateRelativePositions,
  convertGeoPointsToVector3,
  loadTexture,
  AnimationState,
  startAnimation,
  stopAnimation,
  updateMeshLineAnimation,
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
  texture?: string;
  duration?: number;
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
const textureRef = shallowRef<Texture>();
const animationState = ref<AnimationState>({ startTime: 0, isAnimating: false });

// 创建事件处理器
const eventHandlers = createEventHandler(emit, props, props.raycastActive, lineMesh);

const { onLoop } = useRenderLoop();

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

onLoop(({ elapsed }) => {
  if (!animationState.value.isAnimating || !lineMesh.value || !props.duration) return;

  const material = lineMesh.value.material as any;
  updateMeshLineAnimation(material, elapsed, props.duration, animationState.value);
});

const createMeshline = async () => {
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
    depthTest: true,
    depthWrite: false,
  };

  // 加载纹理
  if (props.texture) {
    try {
      textureRef.value = await loadTexture(props.texture);
      textureRef.value.wrapS = 1000; // RepeatWrapping
      textureRef.value.wrapT = 1000; // RepeatWrapping
      materialOptions.map = textureRef.value;
      materialOptions.useMap = 1;
    } catch (error) {
      console.warn("Failed to load texture:", error);
    }
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

  // 开始UV动画
  if (textureRef.value && props.duration) {
    startAnimation(animationState.value);
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
  () => props.texture,
  async (newTexture) => {
    if (lineMesh.value) {
      const material = lineMesh.value.material as any;
      if (newTexture) {
        try {
          if (textureRef.value) {
            textureRef.value.dispose();
          }
          textureRef.value = await loadTexture(newTexture);
          textureRef.value.wrapS = 1000; // RepeatWrapping
          textureRef.value.wrapT = 1000; // RepeatWrapping

          if (material.uniforms) {
            material.uniforms.map.value = textureRef.value;
            material.uniforms.useMap.value = 1;
          }

          // 重新开始动画
          if (props.duration) {
            startAnimation(animationState.value);
          }
        } catch (error) {
          console.warn("Failed to load texture:", error);
        }
      } else {
        if (textureRef.value) {
          textureRef.value.dispose();
          textureRef.value = undefined;
        }

        if (material.uniforms) {
          material.uniforms.map.value = null;
          material.uniforms.useMap.value = 0;
        }
        stopAnimation(animationState.value);
      }
    }
  }
);

watch(
  () => props.duration,
  (newDuration) => {
    if (newDuration && textureRef.value) {
      startAnimation(animationState.value);
    } else {
      stopAnimation(animationState.value);
    }
  }
);

onMounted(() => {
  createMeshline();
});

onUnmounted(() => {
  stopAnimation(animationState.value);
  if (textureRef.value) {
    textureRef.value.dispose();
  }
  if (lineMesh.value) {
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
  ></primitive>
</template>
