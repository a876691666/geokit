<template></template>
<script setup lang="ts">
import { moveTo, getCameraLonLat } from "../utils/controls";
import { watch, type WatchHandle, type WatchCallback, type WatchOptions } from "vue";
import { useTresContext, useLoop } from "@tresjs/core";
import { GeoPositionConfig } from "../config/type";

const { camera } = useTresContext();

const positionModel = defineModel<GeoPositionConfig>("position", { required: true });

const { onAfterRender } = useLoop();

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
  if (camera.value) {
    const result = getCameraLonLat(camera.value);
    stopWatch(async () => {
      positionModel.value = result;
    });
  }
});
</script>

<style scoped></style>
