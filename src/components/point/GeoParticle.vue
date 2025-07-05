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

const props = defineProps<{
  points: Point<{
    color?: string;
  }>[];
  size?: number;
  icon?: string;
  color?: string;
}>();

const points = shallowRef<Points<BufferGeometry, PointsMaterial>>();
const positions = ref<Vector3[]>([]);
const centerPoint = ref<Vector3>(new Vector3());

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
  <primitive :object="points" v-if="points"></primitive>
</template>
