<script setup lang="ts">
import { onMounted, onUnmounted, shallowRef, watch } from "vue";
import {
  Points,
  BufferGeometry,
  Float32BufferAttribute,
  TextureLoader,
  PointsMaterial,
} from "three";
import { GeoPosition } from "@/index";
import { Point } from "@/config/type";
import { GeoMouseEvent } from "../common/event";

interface GeoPointProps {
  point: Point;
  color?: string;
  size?: number;
  icon?: string;
  renderOrder?: number;
  raycastActive?: boolean;
  raycastMultiplier?: number;
  sizeAttenuation?: boolean;
  id?: string;
}

type GeoPointEvent = GeoMouseEvent<any>;

const props = withDefaults(defineProps<GeoPointProps>(), {
  renderOrder: 1,
  raycastMultiplier: 1,
  sizeAttenuation: true,
});

const emit = defineEmits<{
  click: GeoPointEvent;
  "doubleclick": GeoPointEvent;
  "contextmenu": GeoPointEvent;
  "pointerenter": GeoPointEvent;
  "pointerleave": GeoPointEvent;
  "pointerover": GeoPointEvent;
  "pointerdown": GeoPointEvent;
  "pointerup": GeoPointEvent;
  wheel: GeoPointEvent;
}>();

const point = shallowRef<Points<BufferGeometry, PointsMaterial>>();

// 劫持 raycast 方法的公共函数
const hijackRaycast = (pointObject: Points<BufferGeometry, PointsMaterial>) => {
  const originalRaycast = pointObject.raycast;
  pointObject.raycast = function (raycaster, intersects) {
    // 保存原始的阈值
    const originalThreshold = raycaster.params.Points?.threshold || 1;

    // 应用 raycast 乘数
    if (raycaster.params.Points) {
      raycaster.params.Points.threshold = originalThreshold * props.raycastMultiplier;
    } else {
      raycaster.params.Points = { threshold: originalThreshold * props.raycastMultiplier };
    }

    // 调用原始 raycast 方法
    const result = originalRaycast.call(this, raycaster, intersects);

    // 恢复原始阈值
    raycaster.params.Points.threshold = originalThreshold;

    return result;
  };
};

const createPoint = () => {
  const geometry = new BufferGeometry();
  geometry.setAttribute("position", new Float32BufferAttribute([0, 0, 0], 3));

  const material = new PointsMaterial({
    size: props.size || 32,
    transparent: true,
    sizeAttenuation: props.sizeAttenuation,
    color: props.color || "#ffffff",
  });

  if (props.icon) {
    const textureLoader = new TextureLoader();
    material.map = textureLoader.load(props.icon);
    material.needsUpdate = true;
  }

  point.value = new Points(geometry, material);
  point.value.renderOrder = props.renderOrder;
  // 劫持 raycast 方法
  hijackRaycast(point.value);
};

watch(
  () => props.size,
  (newSize) => {
    if (point.value) {
      point.value.material.size = newSize || 32;
      point.value.material.needsUpdate = true;
    }
  }
);

const handleEvent = (eventName: string) => {
  return (event: MouseEvent & { index: number }) => {
    if (!point.value || !props.raycastActive) return;

    // 对于单个点，index 始终为 0，但我们仍然检查事件是否有效
    if (event.index !== undefined) {
      emit(eventName as any, event, props, 0);
    }
  };
};

const handleClick = handleEvent("click");
const handleDoubleClick = handleEvent("doubleclick");
const handleContextMenu = handleEvent("contextmenu");
const handlePointerEnter = handleEvent("pointerenter");
const handlePointerLeave = handleEvent("pointerleave");
const handlePointerOver = handleEvent("pointerover");
const handlePointerDown = handleEvent("pointerdown");
const handlePointerUp = handleEvent("pointerup");
const handleWheel = handleEvent("wheel");

onMounted(createPoint);

onUnmounted(() => {
  if (point.value) {
    point.value.geometry.dispose();
    const material = point.value.material as PointsMaterial;
    material.map?.dispose();
    material.dispose();
  }
});
</script>

<template>
  <GeoPosition :point="props.point">
    <primitive
      :object="point"
      v-if="point"
      @click="handleClick"
      @doubleclick="handleDoubleClick"
      @contextmenu="handleContextMenu"
      @pointerenter="handlePointerEnter"
      @pointerleave="handlePointerLeave"
      @pointerover="handlePointerOver"
      @pointerdown="handlePointerDown"
      @pointerup="handlePointerUp"
      @wheel="handleWheel"
    ></primitive>
  </GeoPosition>
</template>
