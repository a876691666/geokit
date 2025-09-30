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
    <!-- 统一控制面板 -->
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
        max-width: 400px;
      "
    >
      <h3 style="margin: 0 0 15px 0; color: #4caf50; text-align: center">统一线条控制器</h3>

      <!-- 统一控制按钮 -->
      <div style="margin-bottom: 15px">
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
          @click="changeWidth"
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
          切换宽度
        </button>
        <button
          @click="toggleDash"
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
          切换虚线
        </button>
      </div>

      <!-- 飞线专属控制 -->
      <div style="margin-bottom: 15px; border-top: 1px solid #444; padding-top: 10px">
        <h4 style="margin: 0 0 8px 0; color: #e91e63; font-size: 14px">✈️ 飞线控制</h4>
        <button
          @click="toggleFlylineType"
          style="
            margin: 2px;
            padding: 8px 12px;
            background: #e91e63;
            color: white;
            border: none;
            border-radius: 4px;
            cursor: pointer;
          "
        >
          {{ flylineType === "mesh" ? "切换到管道" : "切换到网格" }}
        </button>
        <button
          @click="changeArcHeight"
          style="
            margin: 2px;
            padding: 8px 12px;
            background: #e91e63;
            color: white;
            border: none;
            border-radius: 4px;
            cursor: pointer;
          "
        >
          调节弧度
        </button>
        <button
          @click="changeSegments"
          style="
            margin: 2px;
            padding: 8px 12px;
            background: #e91e63;
            color: white;
            border: none;
            border-radius: 4px;
            cursor: pointer;
          "
        >
          调节精度
        </button>
      </div>

      <!-- 动画控制按钮 -->
      <div style="margin-bottom: 15px; border-top: 1px solid #444; padding-top: 10px">
        <h4 style="margin: 0 0 8px 0; color: #ff9800; font-size: 14px">🎬 动画控制</h4>
        <button
          @click="toggleTexture"
          style="
            margin: 2px;
            padding: 8px 12px;
            background: #ff9800;
            color: white;
            border: none;
            border-radius: 4px;
            cursor: pointer;
          "
        >
          {{ hasTexture ? "关闭贴图" : "开启贴图" }}
        </button>
        <button
          @click="toggleAnimation"
          style="
            margin: 2px;
            padding: 8px 12px;
            background: #ff9800;
            color: white;
            border: none;
            border-radius: 4px;
            cursor: pointer;
          "
        >
          {{ isAnimating ? "停止动画" : "开始动画" }}
        </button>
        <button
          @click="changeSpeed"
          style="
            margin: 2px;
            padding: 8px 12px;
            background: #ff9800;
            color: white;
            border: none;
            border-radius: 4px;
            cursor: pointer;
          "
        >
          调节速度
        </button>
        <button
          @click="toggleReverse"
          style="
            margin: 2px;
            padding: 8px 12px;
            background: #ff9800;
            color: white;
            border: none;
            border-radius: 4px;
            cursor: pointer;
          "
        >
          {{ isReverse ? "正向动画" : "逆向动画" }}
        </button>
      </div>

      <!-- 当前状态显示 -->
      <div style="background: rgba(255, 255, 255, 0.1); padding: 10px; border-radius: 6px">
        <h4 style="margin: 0 0 8px 0; color: #fff; font-size: 14px">当前参数</h4>
        <div style="font-size: 12px; color: #ccc; line-height: 1.6">
          <div>🎨 颜色: {{ currentColor }}</div>
          <div>📏 宽度: {{ currentWidth }}</div>
          <div>- - 虚线: {{ isDashed ? "开启" : "关闭" }} (Mesh线条)</div>
          <div>✈️ 飞线类型: {{ flylineType === "mesh" ? "Mesh网格" : "Tube管道" }}</div>
          <div>🏔️ 弧度高度: {{ currentArcHeight }}m</div>
          <div>🔧 弧线精度: {{ currentSegments }}段</div>
          <div>🖼️ 贴图: {{ hasTexture ? "开启" : "关闭" }}</div>
          <div>🎬 动画: {{ isAnimating ? "播放中" : "已停止" }}</div>
          <div>⚡ 速度: {{ currentSpeed }}x</div>
          <div>🔄 方向: {{ isReverse ? "逆向" : "正向" }}</div>
        </div>
      </div>

      <!-- 线条说明 -->
      <div style="margin-top: 10px; font-size: 11px; color: #aaa">
        <div>🟢 基础线条 (GeoLine) - 支持颜色、宽度、贴图、动画</div>
        <div>🟠 管道线条 (GeoTubeline) - 支持颜色、宽度、贴图、动画</div>
        <div>🔵 Mesh线条 (GeoMeshline) - 支持颜色、宽度、虚线、贴图、动画</div>
        <div>✈️ 飞线 (GeoFlyline) - 自动弧线，支持两种类型，内置动画功能</div>
        <div>🎬 绿色飞线 - 演示新的内置动画功能</div>
        <div style="margin-top: 5px; color: #4caf50">💡 贴图图标来自 Icons8</div>
      </div>
    </div>
  </div>

  <GeoCanvas v-model:position="cameraPosition">
    <GeoControls v-model:position="cameraPosition" />
    <GeoScene />
    <TDTTiles tk="60e749f74ee948da9887c8a82fc20e09" />

    <!-- 飞线示例 - 使用内置动画功能 -->
    <Suspense>
      <UseTexture v-slot="{ state }" :path="textureUrl">
        <GeoTextureProps
          :texture="state"
          :repeat="[1, 1]"
          :wrapS="THREE.RepeatWrapping"
          :wrapT="THREE.RepeatWrapping"
        />

        <GeoFlyline
          :start="flylineStart1"
          :end="flylineEnd1"
          type="tube"
          color="#00ff00"
          :width="currentWidth + 1"
          :map="state"
          :arcHeight="currentArcHeight * 0.8"
          :segments="currentSegments"
          autoStart
          :duration="2000"
          :reverse="isReverse"
        />

        <!-- 基础线条 - 使用统一的颜色、宽度、贴图和动画 -->
        <GeoLine :points="linePoints1" :color="currentColor" :width="currentWidth" :map="state" />

        <GeoTextureClone :="{ texture: state }" v-slot="{ texture }">
          <GeoLineAnimation :reverse="isReverse" :duration="300">
            <!-- 管道线条 - 使用统一的颜色、宽度、贴图和动画 -->
            <GeoTubeline
              :points="linePoints2"
              :color="currentColor"
              :width="currentWidth"
              :map="texture"
            />
          </GeoLineAnimation>
        </GeoTextureClone>

        <GeoLineAnimation :reverse="isReverse">
          <!-- Mesh线条 - 使用统一的颜色、宽度、虚线、贴图和动画设置 -->
          <GeoMeshline
            :points="linePoints3"
            :color="currentColor"
            :width="currentWidth"
            :dashArray="isDashed ? 0.2 : 0"
            :dashRatio="0.5"
            :dashOffset="0"
            :map="state"
          />
        </GeoLineAnimation>

        <!-- 飞线示例 - 短距离飞线 -->
        <GeoFlyline
          :start="flylineStart1"
          :end="flylineEnd1"
          type="mesh"
          :color="currentColor"
          :width="currentWidth"
          :map="state"
          :duration="isAnimating ? animationDuration : undefined"
          :arcHeight="currentArcHeight"
          :segments="currentSegments"
          :reverse="isReverse"
        />

        <!-- 飞线示例 - 中距离飞线 -->
        <GeoFlyline
          :start="flylineStart2"
          :end="flylineEnd2"
          type="mesh"
          :color="currentColor"
          :width="currentWidth"
          :map="state"
          :duration="isAnimating ? animationDuration : undefined"
          :arcHeight="currentArcHeight * 1.5"
          :segments="currentSegments"
          :reverse="isReverse"
        />

        <!-- 飞线示例 - 长距离飞线 -->
        <GeoFlyline
          :start="flylineStart3"
          :end="flylineEnd3"
          type="mesh"
          :color="currentColor"
          :width="currentWidth"
          :map="state"
          :duration="isAnimating ? animationDuration : undefined"
          :arcHeight="currentArcHeight * 2"
          :segments="currentSegments"
          :reverse="isReverse"
        />
      </UseTexture>
    </Suspense>
  </GeoCanvas>
</template>

<script setup lang="ts">
import {
  GeoCanvas,
  GeoControls,
  TDTTiles,
  GeoLine,
  GeoTubeline,
  GeoMeshline,
  GeoFlyline,
  GeoScene,
  GeoLineAnimation,
  GeoTextureClone,
  GeoPositionConfig,
} from "..";
import { ref, computed } from "vue";
import { UseTexture } from "@tresjs/cientos";
import GeoTextureProps from "@/components/common/GeoTextureProps.vue";
import * as THREE from "three";

// 相机位置
const cameraPosition = ref<GeoPositionConfig>({
  heading: 90,
  pitch: -45,
  distance: 500,
  longitude: 118.778677,
  latitude: 32.043848,
});

// 统一参数配置
const currentColor = ref("#ff0000");
const currentWidth = ref(2);
const isDashed = ref(false);

// 飞线专属参数
const flylineType = ref<"mesh" | "tube">("mesh");
const currentArcHeight = ref(30);
const currentSegments = ref(20);

// 动画和贴图相关
const hasTexture = ref(false);
const isAnimating = ref(false);
const currentSpeed = ref(1);
const isReverse = ref(false);
const textureUrl = "/line2.png";

// 计算动画持续时间（基于速度）
const animationDuration = computed(() => {
  const baseDuration = 2; // 基础持续时间（秒）
  return baseDuration / currentSpeed.value;
});

// 基础线条坐标
const linePoints1 = ref([
  { lon: 118.778677, lat: 32.043848, height: 0 },
  { lon: 118.778677, lat: 32.044848, height: 50 },
  { lon: 118.779677, lat: 32.044848, height: 100 },
  { lon: 118.779677, lat: 32.043848, height: 50 },
  { lon: 118.778677, lat: 32.043848, height: 0 },
]);

// 管道线条坐标
const linePoints2 = ref([
  { lon: 118.779677, lat: 32.043848, height: 0 },
  { lon: 118.780677, lat: 32.044848, height: 50 },
  { lon: 118.781677, lat: 32.044848, height: 100 },
  { lon: 118.781677, lat: 32.043848, height: 50 },
  { lon: 118.779677, lat: 32.043848, height: 0 },
]);

// Mesh线条坐标
const linePoints3 = ref([
  { lon: 118.781677, lat: 32.043848, height: 0 },
  { lon: 118.782677, lat: 32.044848, height: 50 },
  { lon: 118.783677, lat: 32.044848, height: 100 },
  { lon: 118.783677, lat: 32.043848, height: 50 },
  { lon: 118.781677, lat: 32.043848, height: 0 },
]);

// 飞线坐标 - 短距离
const flylineStart1 = ref({ lon: 118.777, lat: 32.042, height: 0 });
const flylineEnd1 = ref({ lon: 118.78, lat: 32.045, height: 0 });

// 飞线坐标 - 中距离
const flylineStart2 = ref({ lon: 118.775, lat: 32.04, height: 10 });
const flylineEnd2 = ref({ lon: 118.785, lat: 32.047, height: 10 });

// 飞线坐标 - 长距离
const flylineStart3 = ref({ lon: 118.77, lat: 32.035, height: 0 });
const flylineEnd3 = ref({ lon: 118.79, lat: 32.052, height: 0 });

// 配置选项
const colors = ["#ff0000", "#00ff00", "#0000ff", "#ffff00", "#ff00ff", "#00ffff", "#ffa500"];
const widths = [1, 2, 3, 4, 5];
const speeds = [0.5, 1, 1.5, 2, 3];
const arcHeights = [10, 30, 50, 80, 120];
const segmentsOptions = [10, 20, 30, 40, 50];

// 当前索引
let colorIndex = 0;
let widthIndex = 1;
let speedIndex = 1;
let arcHeightIndex = 1;
let segmentsIndex = 1;

// 统一控制方法
const changeColor = () => {
  colorIndex = (colorIndex + 1) % colors.length;
  currentColor.value = colors[colorIndex];
};

const changeWidth = () => {
  widthIndex = (widthIndex + 1) % widths.length;
  currentWidth.value = widths[widthIndex];
};

const toggleDash = () => {
  isDashed.value = !isDashed.value;
};

// 飞线专属控制方法
const toggleFlylineType = () => {
  flylineType.value = flylineType.value === "mesh" ? "tube" : "mesh";
};

const changeArcHeight = () => {
  arcHeightIndex = (arcHeightIndex + 1) % arcHeights.length;
  currentArcHeight.value = arcHeights[arcHeightIndex];
};

const changeSegments = () => {
  segmentsIndex = (segmentsIndex + 1) % segmentsOptions.length;
  currentSegments.value = segmentsOptions[segmentsIndex];
};

// 动画和贴图控制方法
const toggleTexture = () => {
  hasTexture.value = !hasTexture.value;
};

const toggleAnimation = () => {
  isAnimating.value = !isAnimating.value;
};

const changeSpeed = () => {
  speedIndex = (speedIndex + 1) % speeds.length;
  currentSpeed.value = speeds[speedIndex];
};

const toggleReverse = () => {
  isReverse.value = !isReverse.value;
};
</script>

<style scoped>
/* 基础样式 */
button:hover {
  opacity: 0.8;
}

button:active {
  opacity: 0.6;
}
</style>
