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
    <!-- 简化控制面板 -->
    <div
      style="
        position: absolute;
        top: 20px;
        left: 20px;
        background: rgba(0, 0, 0, 0.8);
        color: white;
        padding: 15px;
        border-radius: 8px;
        pointer-events: auto;
        max-width: 350px;
      "
    >
      <h3 style="margin: 0 0 15px 0; color: #4caf50; text-align: center">
        GeoKit 面相关组件控制器
      </h3>

      <!-- 基础控制 -->
      <div style="margin-bottom: 15px">
        <h4 style="margin: 0 0 8px 0; color: #2196f3; font-size: 14px">🎨 基础控制</h4>
        <button
          @click="changeColor"
          style="
            margin: 2px;
            padding: 8px 12px;
            background: #2196f3;
            color: white;
            border: none;
            border-radius: 4px;
            cursor: pointer;
          "
        >
          切换颜色
        </button>
        <button
          @click="changeOpacity"
          style="
            margin: 2px;
            padding: 8px 12px;
            background: #2196f3;
            color: white;
            border: none;
            border-radius: 4px;
            cursor: pointer;
          "
        >
          调节透明度
        </button>
        <button
          @click="toggleWireframe"
          style="
            margin: 2px;
            padding: 8px 12px;
            background: #2196f3;
            color: white;
            border: none;
            border-radius: 4px;
            cursor: pointer;
          "
        >
          {{ isWireframe ? "关闭线框" : "开启线框" }}
        </button>
      </div>

      <!-- 多边形控制 -->
      <div style="margin-bottom: 15px; border-top: 1px solid #444; padding-top: 10px">
        <h4 style="margin: 0 0 8px 0; color: #9c27b0; font-size: 14px">🔺 多边形控制</h4>
        <button
          @click="changePolygonShape"
          style="
            margin: 2px;
            padding: 8px 12px;
            background: #9c27b0;
            color: white;
            border: none;
            border-radius: 4px;
            cursor: pointer;
          "
        >
          切换形状
        </button>
        <button
          @click="changeSubdivisions"
          style="
            margin: 2px;
            padding: 8px 12px;
            background: #9c27b0;
            color: white;
            border: none;
            border-radius: 4px;
            cursor: pointer;
          "
        >
          调节细分度
        </button>
        <button
          @click="changeHeight"
          style="
            margin: 2px;
            padding: 8px 12px;
            background: #9c27b0;
            color: white;
            border: none;
            border-radius: 4px;
            cursor: pointer;
          "
        >
          调节高度
        </button>
      </div>

      <!-- 其他控制 -->
      <div style="margin-bottom: 15px; border-top: 1px solid #444; padding-top: 10px">
        <h4 style="margin: 0 0 8px 0; color: #e91e63; font-size: 14px">🎛️ 其他控制</h4>
        <button
          @click="resetToDefault"
          style="
            margin: 2px;
            padding: 8px 12px;
            background: #607d8b;
            color: white;
            border: none;
            border-radius: 4px;
            cursor: pointer;
          "
        >
          重置所有
        </button>
      </div>

      <!-- 当前状态显示 -->
      <div style="background: rgba(255, 255, 255, 0.1); padding: 10px; border-radius: 6px">
        <h4 style="margin: 0 0 8px 0; color: #fff; font-size: 14px">当前参数</h4>
        <div style="font-size: 12px; color: #ccc; line-height: 1.6">
          <div>🎨 颜色: {{ currentColor }}</div>
          <div>🌫️ 透明度: {{ currentOpacity.toFixed(1) }}</div>
          <div>📐 线框模式: {{ isWireframe ? "开启" : "关闭" }}</div>
          <div>🔺 当前形状: {{ polygonShapes[currentShapeIndex].name }}</div>
          <div>🏗️ 细分程度: {{ currentSubdivisions }}</div>
          <div>📏 面片高度: {{ currentFaceHeight }}m</div>
        </div>
      </div>

      <!-- 组件说明 -->
      <div style="margin-top: 10px; font-size: 11px; color: #aaa">
        <div>🔺 地理多边形 (GeoPolygon) - 基于地理坐标的多边形面片</div>
        <div>🧱 地理墙体 (GeoWall) - 基于多边形边界的立体墙面</div>
        <div style="margin-top: 5px; color: #4caf50">💡 支持动态纹理旋转效果</div>
      </div>
    </div>
  </div>

  <GeoCanvas v-model:position="cameraPosition">
    <GeoControls v-model:position="cameraPosition" />
    <GeoScene />
    <TDTTiles tk="60e749f74ee948da9887c8a82fc20e09" />

    <!-- 地理多边形 - 使用统一的颜色、透明度、线框设置 -->
    <GeoTexture
      id="wall-polygon-1"
      url="/public/plugins/digitalCity/image/rain.png"
      :rotate="(Math.PI / 180) * time"
      :center="[0.5, 0.5]"
    >
      <GeoPolygon
        :points="currentPolygonPoints"
        :color="currentColor"
        :opacity="currentOpacity"
        :wireframe="isWireframe"
        :subdivisions="currentSubdivisions"
        :height="currentFaceHeight"
        textureId="wall-polygon-1"
      />
    </GeoTexture>

    <!-- 地理墙体 - 始终显示，使用统一的颜色、透明度、线框设置 -->
    <GeoTexture
      id="wall-texture-1"
      url="/public/plugins/digitalCity/image/line2.png"
      :rotate="(Math.PI / 180) * time"
      :center="[0.5, 0.5]"
    >
      <GeoWall
        :points="currentPolygonPoints"
        :color="currentColor"
        :opacity="currentOpacity"
        :wireframe="isWireframe"
        :height="50"
        :baseHeight="0"
        textureId="wall-texture-1"
      />
    </GeoTexture>
  </GeoCanvas>
</template>

<script setup lang="ts">
import { GeoCanvas, GeoControls, TDTTiles, GeoPolygon, GeoWall, GeoTexture, GeoScene } from "..";
import { ref, computed, onMounted, onUnmounted } from "vue";
import { GeoPositionConfig } from "../config/type";

// 相机位置
const cameraPosition = ref<GeoPositionConfig>({
  heading: 90,
  pitch: -45,
  distance: 400,
  longitude: 118.78,
  latitude: 32.044,
});

// 保留time的使用 - 用于纹理旋转动画
const time = ref(0);
let animationFrameId: number;

const animate = () => {
  time.value += 0.1;
  animationFrameId = requestAnimationFrame(animate);
};

onMounted(() => {
  animationFrameId = requestAnimationFrame(animate);
});

onUnmounted(() => {
  cancelAnimationFrame(animationFrameId);
});

// 基础控制参数
const currentColor = ref("#ff6b6b");
const currentOpacity = ref(0.8);
const isWireframe = ref(false);

// 多边形专属参数
const currentSubdivisions = ref(2);
const currentFaceHeight = ref(0.5);

// 多边形形状配置
const polygonShapes = [
  {
    name: "三角形",
    points: [
      { lon: 118.778, lat: 32.044, height: 30 },
      { lon: 118.782, lat: 32.044, height: 30 },
      { lon: 118.78, lat: 32.048, height: 30 },
    ],
  },
  {
    name: "矩形",
    points: [
      { lon: 118.778, lat: 32.044, height: 30 },
      { lon: 118.782, lat: 32.044, height: 30 },
      { lon: 118.782, lat: 32.048, height: 30 },
      { lon: 118.778, lat: 32.048, height: 30 },
    ],
  },
  {
    name: "五边形",
    points: [
      { lon: 118.78, lat: 32.05, height: 30 },
      { lon: 118.783, lat: 32.047, height: 30 },
      { lon: 118.782, lat: 32.043, height: 30 },
      { lon: 118.778, lat: 32.043, height: 30 },
      { lon: 118.777, lat: 32.047, height: 30 },
    ],
  },
  {
    name: "六边形",
    points: [
      { lon: 118.78, lat: 32.05, height: 30 },
      { lon: 118.783, lat: 32.048, height: 30 },
      { lon: 118.783, lat: 32.045, height: 30 },
      { lon: 118.78, lat: 32.043, height: 30 },
      { lon: 118.777, lat: 32.045, height: 30 },
      { lon: 118.777, lat: 32.048, height: 30 },
    ],
  },
  {
    name: "复杂形状",
    points: [
      { lon: 118.775, lat: 32.045, height: 30 },
      { lon: 118.779, lat: 32.052, height: 30 },
      { lon: 118.783, lat: 32.049, height: 30 },
      { lon: 118.785, lat: 32.045, height: 30 },
      { lon: 118.783, lat: 32.041, height: 30 },
      { lon: 118.779, lat: 32.038, height: 30 },
      { lon: 118.775, lat: 32.041, height: 30 },
    ],
  },
];

const currentShapeIndex = ref(0);
const currentPolygonPoints = computed(() => {
  return polygonShapes[currentShapeIndex.value].points.map((point) => ({
    lon: point.lon,
    lat: point.lat,
    height: point.height,
  }));
});

// 配置选项
const colors = ["#ff6b6b", "#4ecdc4", "#45b7d1", "#96ceb4", "#fcc468", "#f38ba8", "#a8dadc"];
const opacities = [0.3, 0.5, 0.7, 0.8, 0.9, 1.0];
const subdivisions = [1, 2, 3, 4, 5, 10, 20];
const heights = [0.1, 0.2, 0.3, 0.4, 0.5, 1, 5, 10, 20];

// 当前索引
let colorIndex = 0;
let opacityIndex = 3;
let subdivisionsIndex = 1;
let heightIndex = 2;

// 控制方法
const changeColor = () => {
  colorIndex = (colorIndex + 1) % colors.length;
  currentColor.value = colors[colorIndex];
};

const changeOpacity = () => {
  opacityIndex = (opacityIndex + 1) % opacities.length;
  currentOpacity.value = opacities[opacityIndex];
};

const toggleWireframe = () => {
  isWireframe.value = !isWireframe.value;
};

const changePolygonShape = () => {
  currentShapeIndex.value = (currentShapeIndex.value + 1) % polygonShapes.length;
};

const changeSubdivisions = () => {
  subdivisionsIndex = (subdivisionsIndex + 1) % subdivisions.length;
  currentSubdivisions.value = subdivisions[subdivisionsIndex];
};

const changeHeight = () => {
  heightIndex = (heightIndex + 1) % heights.length;
  currentFaceHeight.value = heights[heightIndex];
};

const resetToDefault = () => {
  colorIndex = 0;
  opacityIndex = 3;
  subdivisionsIndex = 1;
  heightIndex = 2;

  currentColor.value = colors[colorIndex];
  currentOpacity.value = opacities[opacityIndex];
  currentSubdivisions.value = subdivisions[subdivisionsIndex];
  currentFaceHeight.value = heights[heightIndex];
  currentShapeIndex.value = 0;

  isWireframe.value = false;
};
</script>

<style scoped>
/* 基础样式 */
button:hover {
  opacity: 0.8;
  transform: translateY(-1px);
}

button:active {
  opacity: 0.6;
  transform: translateY(0);
}

button {
  transition: all 0.2s ease;
}
</style>
