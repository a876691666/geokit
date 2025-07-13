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

interface GeoPointProps {
  point: Point;
  color?: string;
  size?: number;
  icon?: string;
  renderOrder?: number;
}

const props = withDefaults(defineProps<GeoPointProps>(), {
  renderOrder: 1,
});
const point = shallowRef<Points<BufferGeometry, PointsMaterial>>();

const createPoint = () => {
  const geometry = new BufferGeometry();
  geometry.setAttribute("position", new Float32BufferAttribute([0, 0, 0], 3));

  const material = new PointsMaterial({
    size: props.size || 32,
    transparent: true,
    sizeAttenuation: true,
    color: props.color || "#ffffff",
  });

  if (props.icon) {
    const textureLoader = new TextureLoader();
    material.map = textureLoader.load(props.icon);
    material.needsUpdate = true;
  }

  point.value = new Points(geometry, material);
  point.value.renderOrder = props.renderOrder;
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
    <primitive :object="point" v-if="point"></primitive>
  </GeoPosition>
</template>
