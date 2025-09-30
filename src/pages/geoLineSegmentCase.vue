<template>
  <div
    style="position:absolute;top:0;left:0;width:100%;height:100%;z-index:1000;pointer-events:none;"
  >
    <div
      style="position:absolute;top:20px;left:20px;background:rgba(0,0,0,.75);color:#fff;padding:14px 16px;border-radius:8px;pointer-events:auto;font-size:12px;line-height:1.5;max-width:360px;"
    >
      <h3 style="margin:0 0 10px;color:#4caf50;text-align:center;font-size:16px;">GeoMeshlineSegment 实时更新示例</h3>
      <div style="display:flex;flex-wrap:wrap;gap:4px;margin-bottom:8px;">
        <button @click="jitterStart" style="padding:6px 10px;cursor:pointer;border:none;border-radius:4px;background:#2196f3;color:#fff;">抖动起点</button>
        <button @click="jitterEnd" style="padding:6px 10px;cursor:pointer;border:none;border-radius:4px;background:#2196f3;color:#fff;">抖动终点</button>
        <button @click="swapPoints" style="padding:6px 10px;cursor:pointer;border:none;border-radius:4px;background:#9c27b0;color:#fff;">起终互换</button>
        <button @click="autoMove = !autoMove" style="padding:6px 10px;cursor:pointer;border:none;border-radius:4px;background:#ff9800;color:#fff;">{{ autoMove ? '停止自动' : '开启自动' }}</button>
        <button @click="changeColor" style="padding:6px 10px;cursor:pointer;border:none;border-radius:4px;background:#00bcd4;color:#fff;">换颜色</button>
        <button @click="changeWidth" style="padding:6px 10px;cursor:pointer;border:none;border-radius:4px;background:#795548;color:#fff;">线宽</button>
      </div>
      <div style="margin-top:4px;background:rgba(255,255,255,.08);padding:8px;border-radius:6px;">
        <div>起点: {{ start.lon.toFixed(4) }}, {{ start.lat.toFixed(4) }}, h={{ start.height||0 }}</div>
        <div>终点: {{ end.lon.toFixed(4) }}, {{ end.lat.toFixed(4) }}, h={{ end.height||0 }}</div>
        <div>颜色: <span :style="{color:color}">{{ color }}</span> 宽度: {{ width }}</div>
        <div>自动移动: {{ autoMove ? '是' : '否' }} 速度倍率: {{ speed.toFixed(2) }}</div>
        <div style="margin-top:4px;">说明: GeoMeshlineSegment 通过更新 props.start / props.end 实时调整方向、长度与位置，只执行 transform 而不重建几何。</div>
      </div>
    </div>
  </div>
  <GeoCanvas v-model:position="cameraPosition">
    <GeoControls v-model:position="cameraPosition" />
    <GeoScene />
    <TDTTiles tk="60e749f74ee948da9887c8a82fc20e09" />
    <Suspense>
      <UseTexture v-slot="{ state }" :path="textureUrl" v-if="useTexture">
        <GeoTextureProps :texture="state" :repeat="[1,1]" :wrapS="THREE.RepeatWrapping" :wrapT="THREE.RepeatWrapping" />
        <GeoMeshlineSegment :start="start" :end="end" :color="color" :width="width" :map="state" :opacity="0.95" />
      </UseTexture>
      <template v-else>
        <GeoMeshlineSegment :start="start" :end="end" :color="color" :width="width" />
      </template>
    </Suspense>
  </GeoCanvas>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import { GeoCanvas, GeoControls, TDTTiles, GeoScene, GeoMeshlineSegment, GeoTextureProps, GeoPositionConfig } from '..';
import { UseTexture } from '@tresjs/cientos';
import * as THREE from 'three';

const cameraPosition = ref<GeoPositionConfig>({
  heading: 60,
  pitch: -50,
  distance: 400,
  longitude: 118.778677,
  latitude: 32.043848,
});

// 起终点（以南京附近为例）
const start = ref({ lon: 118.778677, lat: 32.043848, height: 10 });
const end   = ref({ lon: 118.783000, lat: 32.046500, height: 120 });

const colorList = ['#ff5722', '#4caf50', '#2196f3', '#ffc107', '#9c27b0', '#00bcd4'];
let colorIndex = 0;
const color = ref(colorList[colorIndex]);
const widthList = [1,2,3,4,5];
let widthIndex = 2;
const width = ref(widthList[widthIndex]);
const textureUrl = '/line2.png';
const useTexture = ref(true);

// 自动运动控制
const autoMove = ref(true);
const speed = ref(1.0);
let t = 0;
let raf = 0;

const loop = () => {
  if (autoMove.value) {
    t += 0.005 * speed.value; // 时间推进
    // 让终点在一个小椭圆上移动
    const dLon = 0.004 * Math.cos(t);
    const dLat = 0.0025 * Math.sin(t * 1.2);
    end.value = { ...end.value, lon: 118.783000 + dLon, lat: 32.046500 + dLat, height: 80 + 40*Math.sin(t*1.5) };
    // 起点缓慢绕圈
    const dLon2 = 0.002 * Math.cos(t * 0.8 + Math.PI);
    const dLat2 = 0.0015 * Math.sin(t * 0.8 + Math.PI/3);
    start.value = { ...start.value, lon: 118.778677 + dLon2, lat: 32.043848 + dLat2, height: 20 + 10*Math.sin(t) };
  }
  raf = requestAnimationFrame(loop);
};

onMounted(() => {
  loop();
});

onUnmounted(() => {
  cancelAnimationFrame(raf);
});

// 交互操作
const jitterStart = () => {
  start.value = { ...start.value, lon: start.value.lon + (Math.random()-0.5)*0.002, lat: start.value.lat + (Math.random()-0.5)*0.002 };
};
const jitterEnd = () => {
  end.value = { ...end.value, lon: end.value.lon + (Math.random()-0.5)*0.002, lat: end.value.lat + (Math.random()-0.5)*0.002 };
};
const swapPoints = () => {
  const s = start.value; start.value = end.value; end.value = s;
};
const changeColor = () => {
  colorIndex = (colorIndex + 1) % colorList.length; color.value = colorList[colorIndex];
};
const changeWidth = () => {
  widthIndex = (widthIndex + 1) % widthList.length; width.value = widthList[widthIndex];
};
</script>

<style scoped>
button { font-size:12px; }
button:active { transform:scale(.95); }
</style>
