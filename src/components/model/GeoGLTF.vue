<template>
  <primitive :object="scene" v-if="scene" :scale="1" :position="[0, 0, 0]" />
</template>

<script setup lang="ts">
import { shallowRef, onMounted } from "vue";
import { useGLTF } from "./useGLTF";

const props = withDefaults(
  defineProps<{
    url: string;
    draco?: boolean;
    decoderPath?: string;
    renderOrder?: number;
  }>(),
  {
    draco: false,
    decoderPath: "./draco/",
    renderOrder: 1,
  }
);

const scene = shallowRef<any>();

onMounted(async () => {
  const { scene: gltfScene } = await useGLTF(props.url, {
    draco: props.draco,
    decoderPath: props.draco ? props.decoderPath : undefined,
  });

  scene.value = gltfScene;
  scene.value.userData.tiles = [];
  scene.value.renderOrder = props.renderOrder;
});
</script>
