<template>
  <TresCanvas clearColor="#fff" v-bind="canvasConfig" ref="canvasRef">
    <TresPerspectiveCamera v-bind="cameraConfig" />
    <GeoCSS2DRenderer />
    <slot />
  </TresCanvas>
</template>

<script setup lang="ts">
import GeoCSS2DRenderer from "./GeoCSS2DRenderer.vue";
import { ref, onMounted, withDefaults } from "vue";
import { GeoCanvasConfig, GeoCameraConfig } from "../config/type";
import { TresCanvas } from "@tresjs/core";
import * as THREE from "three";

const props = withDefaults(
  defineProps<{
    canvasConfig?: GeoCanvasConfig;
    cameraConfig?: GeoCameraConfig;
  }>(),
  {
    canvasConfig: () => ({
      windowSize: true,
      alpha: true,
      antialias: true,
      shadows: false,
      autoClear: true,
      disableRender: true,
      outputColorSpace: THREE.SRGBColorSpace,
      toneMapping: THREE.NoToneMapping,
      pixelRatio: 1,
    }),
    cameraConfig: () => ({
      fov: 29,
      aspect: window.innerWidth / window.innerHeight,
      near: 1,
      far: 10000,
      position: [0, 0, 1.75 * 1e7],
      lookAt: [0, 0, 0],
    }),
  }
);

const { canvasConfig, cameraConfig } = props;

const canvasRef = ref<InstanceType<typeof TresCanvas> | null>(null);

onMounted(() => {
  const renderer = canvasRef.value?.context?.renderer?.instance;
  if (renderer) {
    window.devicePixelRatio = canvasConfig.pixelRatio;
    renderer.setPixelRatio(window.devicePixelRatio);
  }
});
</script>

<style scoped></style>
