<template>
  <XYZTiles :url="url" />
</template>
<script setup lang="ts">
import XYZTiles from "./XYZTiles.vue";
import { computed } from "vue";

const props = withDefaults(
  defineProps<{
    url?: string;
    service?: string;
    request?: string;
    version?: string;
    layer?: string;
    tileStyle?: string;
    tileMatrixSet?: string;
    format?: string;
    tk: string;
  }>(),
  {
    url: "https://t0.tianditu.gov.cn",
    service: "WMTS",
    request: "GetTile",
    version: "1.0.0",
    layer: "vec",
    tileStyle: "default",
    tileMatrixSet: "w",
    format: "tiles",
    tk: "您的密钥",
  }
);

const url = computed(() => {
  return `${props.url}/${props.layer}_${
    props.tileMatrixSet
  }/${props.service.toLowerCase()}?SERVICE=${props.service.toUpperCase()}&REQUEST=${
    props.request
  }&VERSION=${props.version}&LAYER=${props.layer}&STYLE=${props.tileStyle}&TILEMATRIXSET=${
    props.tileMatrixSet
  }&FORMAT=${props.format}&TILEMATRIX={z}&TILEROW={y}&TILECOL={x}&tk=${props.tk}`;
});
</script>
