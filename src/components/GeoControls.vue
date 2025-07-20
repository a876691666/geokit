<template></template>
<script setup lang="ts">
import { moveTo, getCameraLonLat } from "../utils/controls";
import {
  watch,
  type WatchHandle,
  type WatchCallback,
  type WatchOptions,
  onMounted,
  onUnmounted,
} from "vue";
import { useTresContext, useLoop } from "@tresjs/core";
import { GeoPositionConfig } from "../config/type";
import { GlobeControls } from "3d-tiles-renderer";

const { scene, camera, renderer } = useTresContext();

const positionModel = defineModel<GeoPositionConfig>("position", { required: true });

const props = withDefaults(
  defineProps<{
    enableDamping?: boolean;
    adjustHeight?: boolean;
    minDistance?: number;
  }>(),
  {
    enableDamping: true,
    adjustHeight: false,
    minDistance: 150,
  }
);

const { onAfterRender } = useLoop();

let controls: GlobeControls | null = null;
onMounted(() => {
  controls = new GlobeControls(scene.value, camera.value, renderer.value.domElement);
  // @ts-ignore
  controls.setTilesRenderer({ group: scene.value });
  controls.enableDamping = props.enableDamping;
  controls.adjustHeight = props.adjustHeight;
  controls.minDistance = props.minDistance;
});

const updatePosition = () => {
  if (camera.value) {
    moveTo(
      camera.value,
      positionModel.value.distance,
      positionModel.value.heading,
      positionModel.value.pitch,
      positionModel.value.longitude,
      positionModel.value.latitude
    );
  }
};

const sleepWatch = (source: any, cb: WatchCallback, options?: WatchOptions) => {
  let unwatch: WatchHandle;
  const start = () => {
    unwatch = watch(source, cb, options);
  };
  const stop = () => {
    unwatch();
  };
  start();
  return (callback: () => Promise<void>) => {
    stop();
    callback().then(() => {
      start();
    });
  };
};

const stopWatch = sleepWatch(
  [positionModel, camera],
  () => {
    updatePosition();
  },
  { immediate: true }
);

onAfterRender(() => {
  controls?.update?.();
  if (camera.value) {
    const result = getCameraLonLat(camera.value);
    stopWatch(async () => {
      positionModel.value = result;
    });
  }
});

onUnmounted(() => {
  controls?.dispose();
});
</script>

<style scoped></style>
