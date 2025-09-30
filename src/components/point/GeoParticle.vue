<script setup lang="ts">
import { onMounted, onUnmounted, shallowRef, ref, watch } from "vue";
import {
  Points,
  BufferGeometry,
  Float32BufferAttribute,
  TextureLoader,
  PointsMaterial,
  Vector3,
  Color,
} from "three";
import { lonlatToECEF } from "../../utils/controls";
import { Point } from "@/config/type";
import { GeoMouseEvent } from "../common/event";

const props = withDefaults(
  defineProps<{
    points: Point<{
      color?: string;

      [key: string]: any;
    }>[];
    size?: number;
    icon?: string;
    color?: string;
    renderOrder?: number;
    raycastActive?: boolean;
    raycastMultiplier?: number;
    sizeAttenuation?: boolean;
  }>(),
  {
    renderOrder: 1,
    raycastMultiplier: 1,
    sizeAttenuation: true,
  }
);

type GeoParticleEvent = GeoMouseEvent<Point<{ color?: string; [key: string]: any }>>;

const emit = defineEmits<{
  click: GeoParticleEvent;
  "doubleclick": GeoParticleEvent;
  "contextmenu": GeoParticleEvent;
  "pointerenter": GeoParticleEvent;
  "pointerleave": GeoParticleEvent;
  "pointerover": GeoParticleEvent;
  "pointerdown": GeoParticleEvent;
  "pointerup": GeoParticleEvent;
  wheel: GeoParticleEvent;
}>();

const points = shallowRef<Points<BufferGeometry, PointsMaterial>>();
const positions = ref<Vector3[]>([]);
const centerPoint = ref<Vector3>(new Vector3());

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

const calculateCenterPoint = (positions: Vector3[]) => {
  if (positions.length === 0) return new Vector3();

  const center = new Vector3();
  positions.forEach((pos) => center.add(pos));
  center.divideScalar(positions.length);
  return center;
};

const calculateRelativePositions = (positions: Vector3[], center: Vector3) => {
  return positions.map((pos) => pos.clone().sub(center));
};

const createParticle = () => {
  const material = new PointsMaterial({
    size: props.size || 32,
    transparent: true,
    sizeAttenuation: props.sizeAttenuation,
    vertexColors: true,
  });

  if (props.icon) {
    const textureLoader = new TextureLoader();
    const texture = textureLoader.load(props.icon);
    material.map = texture;
    material.needsUpdate = true;
  }

  const geometry = new BufferGeometry();
  const positions = new Float32Array(props.points.length * 3);
  const colors = new Float32Array(props.points.length * 3);
  geometry.setAttribute("position", new Float32BufferAttribute(positions, 3));
  geometry.setAttribute("color", new Float32BufferAttribute(colors, 3));

  points.value = new Points(geometry, material);
  points.value.renderOrder = props.renderOrder;
  
  // 劫持 raycast 方法
  hijackRaycast(points.value);
};

const updateGeometryPositions = () => {
  if (points.value) {
    const geometry = points.value.geometry;
    const positionAttribute = geometry.getAttribute("position");
    const colorAttribute = geometry.getAttribute("color");

    positions.value = props.points.map((point) =>
      lonlatToECEF(point.lon, point.lat, point.height || 0)
    );

    centerPoint.value = calculateCenterPoint(positions.value);

    const relativePositions = calculateRelativePositions(positions.value, centerPoint.value);

    relativePositions.forEach((pos, index) => {
      positionAttribute.setXYZ(index, pos.x, pos.y, pos.z);

      const point = props.points[index];
      const color = point.color || props.color || "#ffffff";
      const rgb = new Color(color);
      colorAttribute.setXYZ(index, rgb.r, rgb.g, rgb.b);
    });

    positionAttribute.needsUpdate = true;
    colorAttribute.needsUpdate = true;

    points.value.position.copy(centerPoint.value);
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
  () => props.size,
  () => {
    if (points.value) {
      points.value.material.size = props.size || 32;
      points.value.material.needsUpdate = true;
    }
  }
);

watch(
  () => props.raycastMultiplier,
  (newMultiplier) => {
    if (points.value) {
      // 重新劫持 raycast 方法以使用新的乘数
      hijackRaycast(points.value);
    }
  }
);

const handleEvent = (eventName: string) => (event: MouseEvent & { index: number }) => {
  if (!points.value || !props.raycastActive) return;

  if (event.index !== undefined && event.index < props.points.length) {
    const clickedPoint = props.points[event.index];
    emit(eventName as any, event, clickedPoint, event.index);
  }
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

onMounted(() => {
  createParticle();
  updateGeometryPositions();
});

onUnmounted(() => {
  if (points.value) {
    points.value.geometry.dispose();
    const material = points.value.material as PointsMaterial;
    material.map?.dispose();
    material.dispose();
  }
});
</script>

<template>
  <primitive
    :object="points"
    v-if="points"
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
</template>
