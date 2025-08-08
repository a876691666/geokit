<script setup lang="ts">
import { onMounted, onUnmounted, shallowRef, ref, watch, inject } from "vue";
import {
  TubeGeometry,
  MeshBasicMaterial,
  Mesh,
  Group,
  Vector3,
  LineCurve3,
  CurvePath,
  Texture,
  DoubleSide,
} from "three";
import {
  calculateCenterPoint,
  calculateRelativePositions,
  convertGeoPointsToVector3,
} from "./utils";
import { Point } from "@/config/type";
import {
  GeoEventEmits,
  GeoInteractiveProps,
  createEventHandler,
  hijackRaycast,
} from "../common/event";

interface GeoTubelineProps extends GeoInteractiveProps {
  points: Point[];
  color?: string;
  width?: number;
  tubularSegments?: number;
  map?: Texture;
  renderOrder?: number;
}

const props = withDefaults(defineProps<GeoTubelineProps>(), {
  renderOrder: 1,
  raycastMultiplier: 1,
  raycastActive: true,
});

const emit = defineEmits<GeoEventEmits>();
const group = shallowRef<Group>();
const tube = shallowRef<Mesh<TubeGeometry, MeshBasicMaterial>>();
const positions = ref<Vector3[]>([]);
const centerPoint = ref<Vector3>(new Vector3());

// 创建事件处理器
const eventHandlers = createEventHandler(emit, props, props.raycastActive, tube);

// 注入动画注册方法
const registerAnimationTarget = inject<(target: any, type: "meshline" | "texture", texture?: Texture) => void>("registerAnimationTarget");
const unregisterAnimationTarget = inject<(target: any) => void>("unregisterAnimationTarget");

// 将宽度转换为半径 (宽度的一半作为半径)
const getRadius = () => {
  return (props.width || 2) * 0.3; // 宽度转换为合适的半径值
};

const createTube = () => {
  group.value = new Group();

  positions.value = convertGeoPointsToVector3(props.points);

  centerPoint.value = calculateCenterPoint(positions.value);
  const relativePositions = calculateRelativePositions(positions.value, centerPoint.value);

  const path = new CurvePath<Vector3>();
  for (let i = 0; i < relativePositions.length - 1; i++) {
    const line = new LineCurve3(relativePositions[i], relativePositions[i + 1]);
    path.add(line);
  }

  const geometry = new TubeGeometry(path, props.tubularSegments || 64, getRadius(), 8, false);

  const materialOptions: any = {
    color: props.color || "#ffffff",
    transparent: true,
    side: DoubleSide,
  };

  // 设置贴图
  if (props.map) {
    materialOptions.map = props.map;
  }

  const material = new MeshBasicMaterial(materialOptions);

  tube.value = new Mesh(geometry, material);
  tube.value.renderOrder = props.renderOrder;

  // 添加交互事件支持
  if (props.raycastActive) {
    hijackRaycast(tube.value, props.raycastMultiplier);
  }

  group.value.add(tube.value);
  group.value.position.copy(centerPoint.value);

  // 注册到动画组件
  if (registerAnimationTarget) {
    registerAnimationTarget(tube.value, "texture", props.map);
  }
};

const updateGeometryPositions = () => {
  if (tube.value) {
    const oldGeometry = tube.value.geometry;
    oldGeometry.dispose();

    positions.value = convertGeoPointsToVector3(props.points);

    centerPoint.value = calculateCenterPoint(positions.value);
    const relativePositions = calculateRelativePositions(positions.value, centerPoint.value);

    const path = new CurvePath<Vector3>();
    for (let i = 0; i < relativePositions.length - 1; i++) {
      const line = new LineCurve3(relativePositions[i], relativePositions[i + 1]);
      path.add(line);
    }

    const geometry = new TubeGeometry(path, props.tubularSegments || 64, getRadius(), 8, false);

    tube.value.geometry = geometry;
    group.value!.position.copy(centerPoint.value);
  }
};

watch(
  () => props.points,
  () => {
    updateGeometryPositions();
  },
  { immediate: true }
);

watch(
  () => props.color,
  (newColor) => {
    if (tube.value) {
      tube.value.material.color.set(newColor || "#ffffff");
      tube.value.material.needsUpdate = true;
    }
  }
);

watch(
  () => [props.width, props.tubularSegments],
  () => {
    updateGeometryPositions();
  }
);

watch(
  () => props.map,
  (newMap) => {
    if (tube.value) {
      if (newMap) {
        tube.value.material.map = newMap;
        tube.value.material.needsUpdate = true;
        // 重新注册动画目标，更新纹理
        if (registerAnimationTarget) {
          registerAnimationTarget(tube.value, "texture", newMap);
        }
      } else {
        tube.value.material.map = null;
        tube.value.material.needsUpdate = true;
        // 重新注册动画目标，移除纹理
        if (registerAnimationTarget) {
          registerAnimationTarget(tube.value, "texture", undefined);
        }
      }
    }
  }
);

onMounted(() => {
  createTube();
});

onUnmounted(() => {
  if (tube.value) {
    // 注销动画目标
    if (unregisterAnimationTarget) {
      unregisterAnimationTarget(tube.value);
    }
    
    tube.value.geometry.dispose();
    tube.value.material.dispose();
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
