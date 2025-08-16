<template></template>
<script setup lang="ts">
import { moveTo, getCameraLonLat, lonlatToECEF } from "../utils/controls";
import {
  watch,
  type WatchHandle,
  type WatchCallback,
  type WatchOptions,
  onMounted,
  onUnmounted,
  shallowRef,
} from "vue";
import { useTresContext, useLoop } from "@tresjs/core";
import { GeoPositionConfig, GeoSpherical, Point } from "../config/type";
import {
  GeoMapControls,
  GeoGlobeControls,
  getECEFUpVector,
} from "@/components/controls/GeoMapControls";

const { scene, camera, renderer } = useTresContext();

const positionModel = defineModel<GeoPositionConfig>("position", { required: true });
const targetPositionModel = defineModel<GeoSpherical>("target-position", { required: false });

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

const props = withDefaults(
  defineProps<{
    enableDamping?: boolean;
    adjustHeight?: boolean;
    minDistance?: number;
    target?: Point | null;
  }>(),
  {
    enableDamping: true,
    adjustHeight: false,
    minDistance: 150,
    target: null,
  }
);

const { onAfterRender } = useLoop();

let globeControls: GeoGlobeControls | null = null;
let mapControls = shallowRef<GeoMapControls | null>(null);
let activeControls: GeoGlobeControls | GeoMapControls | null = null;

const updateMapControls = () => {
  if (props.target) {
    const targetECEF = lonlatToECEF(props.target.lon, props.target.lat, props.target.height || 0);
    mapControls.value?.target.copy(targetECEF);
    mapControls.value?.updateUp(getECEFUpVector(targetECEF));
  }
};

const stopTargetWatch = sleepWatch(
  [targetPositionModel],
  () => {
    if (targetPositionModel.value && mapControls.value) {
      mapControls.value.setCameraPosition(targetPositionModel.value);
    }
  },
  { immediate: true, deep: true }
);

watch(
  [mapControls],
  () => {
    if (targetPositionModel.value && mapControls.value) {
      mapControls.value.setCameraPosition(targetPositionModel.value);
    }
  },
  { immediate: true }
);

// 切换控制器
const switchControls = () => {
  if (props.target) {
    // 有 target 时使用 MapControls
    if (globeControls) {
      globeControls.isWorldPosition = true;
      globeControls.enabled = false;
    }

    if (!mapControls.value && camera.value && renderer.value) {
      mapControls.value = new GeoMapControls(camera.value, renderer.value.domElement);
      mapControls.value.enableDamping = props.enableDamping;
      mapControls.value.minDistance = props.minDistance;
      mapControls.value.addEventListener("target-change" as any, () => {
        stopTargetWatch(async () => {
          targetPositionModel.value =
            mapControls.value?.targetPosition || targetPositionModel.value;
        });
      });
    }

    if (mapControls.value) {
      mapControls.value.enabled = true;
      mapControls.value.resetPanOffset();
      updateMapControls();
      activeControls = mapControls.value;
    }
  } else {
    if (globeControls) {
      globeControls.isWorldPosition = false;
    }
    // 无 target 时使用 GlobeControls，将 camera 放回原位
    if (mapControls.value) {
      mapControls.value.enabled = false;
    }

    if (globeControls) {
      globeControls.enabled = true;
      activeControls = globeControls;
      camera.value?.up.set(0, 1, 0);
    }
  }
};

onMounted(() => {
  if (camera.value && renderer.value && scene.value) {
    globeControls = new GeoGlobeControls(scene.value, camera.value, renderer.value.domElement);
    // @ts-ignore
    globeControls.setTilesRenderer({ group: scene.value });
    globeControls.enableDamping = props.enableDamping;
    globeControls.adjustHeight = props.adjustHeight;
    globeControls.minDistance = props.minDistance;

    switchControls();
  }
});

const updatePosition = () => {
  if (camera.value && !props.target) {
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

// 监听 target 变化
watch(
  () => props.target,
  () => {
    switchControls();
    if (!props.target) {
      updatePosition();
    }
  },
  { immediate: true, deep: true }
);

const stopWatch = sleepWatch(
  [positionModel, camera],
  () => {
    updatePosition();
  },
  { immediate: true }
);

onAfterRender(() => {
  // 更新当前激活的控制器
  if (props.target && mapControls.value?.enabled) {
    mapControls.value.update();
    if (camera.value) globeControls?.adjustCamera(camera.value, mapControls.value.target);
  } else if (!props.target) {
    globeControls?.update();
  }

  if (camera.value && !props.target) {
    const result = getCameraLonLat(camera.value);
    if (result) {
      stopWatch(async () => {
        positionModel.value = result;
      });
    }
  }
});

onUnmounted(() => {
  globeControls?.dispose();
  mapControls.value?.dispose();
});
</script>

<style scoped></style>
