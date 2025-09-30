<template>
  <TresGroup>
    <slot />
    <!-- <Suspense v-if="effectProps.enabled">
      <EffectComposerPmndrs>
        <TiltShiftPmndrs :focusArea="effectProps.focusArea" :feather="effectProps.feather" />
      </EffectComposerPmndrs>
    </Suspense> -->

    <TresAmbientLight
      ref="ambientLightRef"
      :color="ambientLightConfig.color"
      :intensity="ambientLightConfig.intensity"
    />
    <TresDirectionalLight
      ref="directionalLightRef"
      :color="directionalLightConfig.color"
      :intensity="directionalLightConfig.intensity"
      :position="directionalLightConfig.position"
    />
  </TresGroup>
</template>

<script setup lang="ts">
import { onMounted, ref, reactive, withDefaults } from "vue";
import { useTres } from "@tresjs/core";
// import { EffectComposerPmndrs, TiltShiftPmndrs } from "@tresjs/post-processing";
import * as THREE from "three";
import { GeoSceneConfig } from "../config/type";

const props = withDefaults(
  defineProps<{
    sceneConfig?: GeoSceneConfig;
  }>(),
  {
    sceneConfig: () => ({
      // effectProps: {
      //   enabled: true,
      //   focusArea: 0.7,
      //   feather: 0.1,
      // },
      ambientLight: {
        color: "#fff",
        intensity: 1,
      },
      directionalLight: {
        color: "#fff",
        intensity: 2,
        position: [-1500, 500, 500],
      },
      background: "/farm_field_puresky_2k.jpg",
    }),
  }
);

const { sceneConfig } = props;
// const effectProps = reactive(sceneConfig.effectProps);
const ambientLightConfig = reactive(sceneConfig.ambientLight);
const directionalLightConfig = reactive(sceneConfig.directionalLight);

const ambientLightRef = ref(null);
const directionalLightRef = ref(null);

const { scene } = useTres();
onMounted(() => {
  const textureLoader = new THREE.TextureLoader();

  if (sceneConfig.background) {
    const textureEquirec = textureLoader.load(sceneConfig.background);

    textureEquirec.mapping = THREE.EquirectangularReflectionMapping;
    textureEquirec.colorSpace = THREE.SRGBColorSpace;

    scene.value.background = textureEquirec;
  }
});
</script>

<style></style>
