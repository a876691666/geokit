<script setup lang="ts">
import { onUnmounted, onMounted, watchEffect } from "vue";
import { CSS2DObject } from "three/addons/renderers/CSS2DRenderer.js";
import { GeoPosition } from "@/index";
import { Point } from "@/config/type";

const rootDiv = document.createElement("img");

const props = defineProps<{
  point: Point;
  size?: number;
  icon: string;
}>();

const update = () => {
  rootDiv.src = props.icon;
  rootDiv.style.width = props.size + "px";
  rootDiv.style.height = props.size + "px";
};

const rootCSS2DObj = new CSS2DObject(rootDiv);

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
