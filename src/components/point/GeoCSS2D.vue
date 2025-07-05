<script setup lang="ts">
import { watch, onUnmounted, onMounted, defineSlots, render } from "vue";
import { CSS2DObject } from "three/addons/renderers/CSS2DRenderer.js";
import { Group } from "three";
import { lonlatToECEF } from "@/utils/controls";
import { Point } from "@/config/type";

const rootDiv = document.createElement("div");

const props = defineProps<{
  point: Point;
}>();

const slots = defineSlots<{
  default(): any;
}>();

const update = () => {
  render(slots.default()[0], rootDiv);
};

const rootCSS2DObj = new CSS2DObject(rootDiv);

const group = new Group();

group.layers.enableAll();
group.add(rootCSS2DObj);
rootCSS2DObj.layers.set(1);

const updatePosition = () => {
  const ecef = lonlatToECEF(props.point.lon, props.point.lat, props.point.height);
  rootCSS2DObj.position.copy(ecef);
};

watch([() => props.point.lon, () => props.point.lat, () => props.point.height], () => {
  updatePosition();
});

onMounted(() => {
  updatePosition();
  update();
});

onUnmounted(() => {
  group.clear();
});

defineExpose({
  update,
});
</script>

<template>
  <primitive :object="group"></primitive>
</template>
