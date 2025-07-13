<script setup lang="ts">
import { onUnmounted, onMounted, watchEffect } from "vue";
import { CSS2DObject } from "three/addons/renderers/CSS2DRenderer.js";
import { GeoPosition } from "@/index";
import { Point } from "@/config/type";

const rootDiv = document.createElement("img");

const props = withDefaults(defineProps<{
  point: Point;
  size?: number;
  icon: string;
  renderOrder?: number;
}>(), {
  renderOrder: 1,
});

const update = () => {
  rootDiv.src = props.icon;
  rootDiv.style.width = props.size + "px";
  rootDiv.style.height = props.size + "px";
};

const rootCSS2DObj = new CSS2DObject(rootDiv);
rootCSS2DObj.renderOrder = props.renderOrder;

onMounted(() => {
  update();
});

watchEffect(() => {
  update();
});

onUnmounted(() => {
  rootDiv.remove();
});
</script>

<template>
  <GeoPosition :point="props.point">
    <primitive :object="rootCSS2DObj"></primitive>
  </GeoPosition>
</template>
