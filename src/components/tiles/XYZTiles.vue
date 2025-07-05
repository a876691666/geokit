<template>
  <primitive :object="tiles.group" v-if="tiles" />
</template>

<script setup lang="ts">
import { useTresContext, useRenderLoop } from "@tresjs/core";
import { TilesRenderer, GlobeControls } from "3d-tiles-renderer";
import { TilesFadePlugin, UpdateOnChangePlugin, XYZTilesPlugin } from "3d-tiles-renderer/plugins";
import { GeoTilesConfig } from "../../config/type";
import { markRaw, watch, onUnmounted } from "vue";

const { camera, renderer, scene } = useTresContext() as any;

const props = withDefaults(
  defineProps<{
    url: string;
    tilesConfig?: GeoTilesConfig;
  }>(),
  {
    tilesConfig: () => ({
      lruCacheMinSize: 900,
      lruCacheMaxSize: 1300,
      parseQueueMaxJobs: 10,
      errorTarget: 10,
      displayActiveTiles: true,
      autoDisableRendererCulling: true,
      controlsConfig: {
        enableDamping: true,
        adjustHeight: false,
        minDistance: 150,
      },
      tilesPlugins: {
        fadePlugin: {
          maximumFadeOutTiles: 200,
        },
        xyzPlugin: {
          center: true,
          shape: "ellipsoid",
        },
      },
    }),
  }
);

const { tilesConfig } = props;

let tiles = markRaw<TilesRenderer>(new TilesRenderer(props.url));
let controls: GlobeControls | null = null;

function reinstantiateTiles() {
  // 清理旧的实例
  if (tiles) {
    tiles.dispose();
  }
  if (controls) {
    controls.dispose();
  }

  // 创建新的 tiles 实例
  tiles = markRaw<TilesRenderer>(new TilesRenderer(props.url));

  tiles.registerPlugin(new TilesFadePlugin(tilesConfig.tilesPlugins.fadePlugin));
  tiles.registerPlugin(new UpdateOnChangePlugin());
  tiles.registerPlugin(new XYZTilesPlugin(tilesConfig.tilesPlugins.xyzPlugin));

  tiles.lruCache.minSize = tilesConfig.lruCacheMinSize;
  tiles.lruCache.maxSize = tilesConfig.lruCacheMaxSize;
  tiles.parseQueue.maxJobs = tilesConfig.parseQueueMaxJobs;
  tiles.setCamera(camera.value);

  tiles.setResolutionFromRenderer(camera.value, renderer.value);
  tiles.errorTarget = tilesConfig.errorTarget;
  tiles.displayActiveTiles = tilesConfig.displayActiveTiles;
  tiles.autoDisableRendererCulling = tilesConfig.autoDisableRendererCulling;

  controls = new GlobeControls(scene.value, camera.value, renderer.value.domElement);
  controls.setTilesRenderer(tiles);
  controls.enableDamping = tilesConfig.controlsConfig.enableDamping;
  controls.adjustHeight = tilesConfig.controlsConfig.adjustHeight;
  controls.minDistance = tilesConfig.controlsConfig.minDistance;
}

reinstantiateTiles();

// 监听 URL 变化
watch(
  () => props.url,
  (newUrl, oldUrl) => {
    if (newUrl !== oldUrl) {
      reinstantiateTiles();
    }
  }
);

// 监听 tilesConfig 变化
watch(
  () => props.tilesConfig,
  () => {
    reinstantiateTiles();
  },
  { deep: true }
);

const { onBeforeLoop } = useRenderLoop();

onBeforeLoop(() => {
  controls?.update?.();

  if (tiles) {
    tiles.setResolutionFromRenderer(camera.value, renderer.value);
    tiles.update();
  }
});

// 组件卸载时清理资源
onUnmounted(() => {
  if (tiles) {
    tiles.dispose();
  }
  if (controls) {
    controls.dispose();
  }
});
</script>
