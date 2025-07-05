<template>
  <div
    style="
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      z-index: 1000;
      pointer-events: none;
    "
  >
    {{ position }}
    <br />
    <br />
    <button
      style="pointer-events: auto"
      @click="position = { ...position, distance: position.distance + 100 }"
    >
      距离 + 100
    </button>
    <button
      style="pointer-events: auto"
      @click="position = { ...position, distance: position.distance - 100 }"
    >
      距离 - 100
    </button>
    <button
      style="pointer-events: auto"
      @click="position = { ...position, heading: position.heading + 10 }"
    >
      航向 + 10
    </button>
    <button
      style="pointer-events: auto"
      @click="position = { ...position, heading: position.heading - 10 }"
    >
      航向 - 10
    </button>
    <button
      style="pointer-events: auto"
      @click="position = { ...position, pitch: position.pitch + 10 }"
    >
      俯仰 + 10
    </button>
    <button
      style="pointer-events: auto"
      @click="position = { ...position, pitch: position.pitch - 10 }"
    >
      俯仰 - 10
    </button>
    <br />
    <br />
    <button
      style="pointer-events: auto"
      @click="textPosition = { ...textPosition, lon: textPosition.lon + 0.001 }"
    >
      经度 + 0.001
    </button>
    <button
      style="pointer-events: auto"
      @click="textPosition = { ...textPosition, lon: textPosition.lon - 0.001 }"
    >
      经度 - 0.001
    </button>
    <button
      style="pointer-events: auto"
      @click="textPosition = { ...textPosition, lat: textPosition.lat + 0.001 }"
    >
      纬度 + 0.001
    </button>
    <button
      style="pointer-events: auto"
      @click="textPosition = { ...textPosition, lat: textPosition.lat - 0.001 }"
    >
      纬度 - 0.001
    </button>
  </div>
  <GeoCanvas v-model:position="position">
    <GeoControls v-model:position="position" />
    <GeoScene />
    <XYZTiles url="https://tile.openstreetmap.org/{z}/{x}/{y}.png" />
    <!-- <Tileset url="/plugins/geoKit/TilesetWithDiscreteLOD/tileset.json" />
        <Tileset url="/plugins/geoKit/tiles/tileset.json" /> -->
    <GeoCSS2D :point="textPosition" ref="geoCSS2D">
      <div>{{ text }}</div>
    </GeoCSS2D>
    <GeoPosition name="GeoPosition" :point="textPosition">
      <TresMesh>
        <TresBoxGeometry :args="[20, 20, 20]" />
        <TresMeshBasicMaterial color="red" />
      </TresMesh>
    </GeoPosition>
  </GeoCanvas>
</template>

<script setup lang="ts">
import { GeoCanvas, GeoControls, XYZTiles, GeoCSS2D, GeoPosition, GeoScene } from "..";
import { ref } from "vue";
import { GeoPositionConfig } from "../config/type";

const textPosition = ref({
  height: 20,
  lon: 118.778677,
  lat: 32.043848,
});

const baseText = "GeoCSS2D 提供的文字，内容更新通过ref.update()";
const text = ref(baseText);

const geoCSS2D = ref<InstanceType<typeof GeoCSS2D>>();

setInterval(() => {
  text.value = baseText + " " + new Date().toLocaleTimeString();
  geoCSS2D.value?.update();
}, 1000);

const position = ref<GeoPositionConfig>({
  heading: 90,
  pitch: -51,
  distance: 200,
  longitude: 118.778677,
  latitude: 32.043848,
});
</script>

<style scoped></style>
