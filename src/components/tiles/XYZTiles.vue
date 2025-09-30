<template>
  <primitive :object="tiles.group" v-if="tiles" />
</template>

<script setup lang="ts">
import { useTres, useLoop } from "@tresjs/core";
import { TilesRenderer } from "3d-tiles-renderer";
import { TilesFadePlugin, UpdateOnChangePlugin, XYZTilesPlugin } from "3d-tiles-renderer/plugins";
import { markRaw, watch, onUnmounted } from "vue";

const { camera, renderer } = useTres() as any;

const props = withDefaults(
  defineProps<{
    url: string;
    lruCacheMinSize?: number;
    lruCacheMaxSize?: number;
    parseQueueMaxJobs?: number;
    errorTarget?: number;
    displayActiveTiles?: boolean;
    autoDisableRendererCulling?: boolean;
    tilesPlugins?: {
      fadePlugin: {
        maximumFadeOutTiles: number;
      };
      xyzPlugin: {
        center: boolean;
        shape: "ellipsoid" | "planar";
      };
    };
  }>(),
  {
    lruCacheMinSize: 900,
    lruCacheMaxSize: 1300,
    parseQueueMaxJobs: 10,
    errorTarget: 10,
    displayActiveTiles: true,
    autoDisableRendererCulling: true,
    tilesPlugins: () => ({
      fadePlugin: {
        maximumFadeOutTiles: 200,
      },
      xyzPlugin: {
        center: true,
        shape: "ellipsoid",
      },
    }),
  }
);

let tiles = markRaw<TilesRenderer>(new TilesRenderer(props.url));
function reinstantiateTiles() {
  // 清理旧的实例
  if (tiles) {
    tiles.dispose();
  }

  // 创建新的 tiles 实例
  tiles = markRaw<TilesRenderer>(new TilesRenderer(props.url));

  tiles.registerPlugin(new TilesFadePlugin(props.tilesPlugins.fadePlugin));
  tiles.registerPlugin(new UpdateOnChangePlugin());
  tiles.registerPlugin(new XYZTilesPlugin(props.tilesPlugins.xyzPlugin));

  tiles.lruCache.minSize = props.lruCacheMinSize;
  tiles.lruCache.maxSize = props.lruCacheMaxSize;
  tiles.parseQueue.maxJobs = props.parseQueueMaxJobs;
  tiles.setCamera(camera.value);

  tiles.setResolutionFromRenderer(camera.value, renderer);
  tiles.errorTarget = props.errorTarget;
  tiles.displayActiveTiles = props.displayActiveTiles;
  tiles.autoDisableRendererCulling = props.autoDisableRendererCulling;
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
  () => props,
  () => {
    reinstantiateTiles();
  },
  { deep: true }
);

const { onBeforeRender } = useLoop();

onBeforeRender(() => {
  if (tiles) {
    tiles.setResolutionFromRenderer(camera.value, renderer);
    tiles.update();
  }
});

// 组件卸载时清理资源
onUnmounted(() => {
  if (tiles) {
    tiles.dispose();
  }
});
</script>
