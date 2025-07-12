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
  Raycaster,
  Vector2,
} from "three";
import { useTresContext } from "@tresjs/core";
import { lonlatToECEF } from "../../utils/controls";
import { Point } from "@/config/type";

const props = defineProps<{
  points: Point<{
    color?: string;

    [key: string]: any;
  }>[];
  size?: number;
  icon?: string;
  color?: string;
}>();

const emit = defineEmits<{
  pointClick: [point: Point<{ color?: string; [key: string]: any }>, index: number];
}>();

const { camera } = useTresContext();

const points = shallowRef<Points<BufferGeometry, PointsMaterial>>();
const positions = ref<Vector3[]>([]);
const centerPoint = ref<Vector3>(new Vector3());
const raycaster = new Raycaster();
const mouse = new Vector2();

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
    sizeAttenuation: true,
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

const handleClick = (event: MouseEvent) => {
  if (!points.value) return;

  // 计算鼠标位置
  const rect = (event.target as HTMLElement).getBoundingClientRect();
  mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
  mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

  // 设置射线
  if (camera.value) {
    raycaster.setFromCamera(mouse, camera.value);

    // 检测与点的相交
    const intersects = raycaster.intersectObject(points.value);

    if (intersects.length > 0) {
      const intersect = intersects[0];
      const index = intersect.index;
      
      if (index !== undefined && index < props.points.length) {
        const clickedPoint = props.points[index];
        emit('pointClick', clickedPoint, index);
      }
    }
  }
};

onMounted(() => {
  createParticle();
  updateGeometryPositions();
  
  // 添加点击事件监听器
  document.addEventListener('click', handleClick);
});

onUnmounted(() => {
  if (points.value) {
    points.value.geometry.dispose();
    const material = points.value.material as PointsMaterial;
    material.map?.dispose();
    material.dispose();
  }
  
  // 移除点击事件监听器
  document.removeEventListener('click', handleClick);
});
</script>

<template>
  <primitive :object="points" v-if="points"></primitive>
</template>
