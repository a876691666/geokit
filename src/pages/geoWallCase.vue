<template>
  <div class="geo-wall-case">
    <div class="controls">
      <h2>GeoWall 测试页面</h2>
      <div class="control-group">
        <label>几何类型:</label>
        <select v-model="currentGeometryIndex" @change="changeGeometry">
          <option v-for="(item, index) in geometryTypes" :key="index" :value="index">
            {{ item.name }}
          </option>
        </select>
      </div>
      <div class="control-group">
        <label>颜色:</label>
        <button @click="changeColor">{{ currentColor }}</button>
      </div>
      <div class="control-group">
        <label>透明度:</label>
        <button @click="changeOpacity">{{ currentOpacity }}</button>
      </div>
      <div class="control-group">
        <label>线框模式:</label>
        <button @click="toggleWireframe">{{ isWireframe ? '开启' : '关闭' }}</button>
      </div>
      <div class="control-group">
        <label>墙体高度:</label>
        <button @click="changeHeight">{{ currentHeight }}m</button>
      </div>
      <div class="control-group">
        <label>底部高度:</label>
        <button @click="changeBaseHeight">{{ currentBaseHeight }}m</button>
      </div>
    </div>

    <GeoScene :config="config">
      <GeoWall
        :geometry="currentGeometry"
        :color="currentColor"
        :opacity="currentOpacity"
        :wireframe="isWireframe"
        :height="currentHeight"
        :baseHeight="currentBaseHeight"
      />
    </GeoScene>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import GeoScene from '@/components/GeoScene.vue';
import { GeoWall } from '@/components/face';
import { GeoJSONGeometry } from '@/config/type';

// 配置
const config = {
  position: {
    longitude: 118.78,
    latitude: 32.046,
    distance: 2000,
    heading: 0,
    pitch: -30,
  },
};

// 几何类型定义
const geometryTypes = [
  {
    name: "LineString - 简单线段",
    geometry: {
      type: "LineString" as const,
      coordinates: [
        [118.778, 32.044],
        [118.782, 32.044],
        [118.782, 32.048],
        [118.778, 32.048],
      ]
    }
  },
  {
    name: "MultiLineString - 多线段",
    geometry: {
      type: "MultiLineString" as const,
      coordinates: [
        [
          [118.775, 32.042],
          [118.780, 32.042],
          [118.780, 32.046],
        ],
        [
          [118.782, 32.046],
          [118.787, 32.046],
          [118.787, 32.050],
        ]
      ]
    }
  },
  {
    name: "Polygon - 简单多边形",
    geometry: {
      type: "Polygon" as const,
      coordinates: [
        [
          [118.778, 32.044],
          [118.782, 32.044],
          [118.782, 32.048],
          [118.778, 32.048],
          [118.778, 32.044]
        ]
      ]
    }
  },
  {
    name: "Polygon - 带洞多边形",
    geometry: {
      type: "Polygon" as const,
      coordinates: [
        // 外环
        [
          [118.775, 32.042],
          [118.785, 32.042],
          [118.785, 32.052],
          [118.775, 32.052],
          [118.775, 32.042]
        ],
        // 内环（洞）
        [
          [118.778, 32.045],
          [118.782, 32.045],
          [118.782, 32.049],
          [118.778, 32.049],
          [118.778, 32.045]
        ]
      ]
    }
  },
  {
    name: "MultiPolygon - 多重多边形",
    geometry: {
      type: "MultiPolygon" as const,
      coordinates: [
        // 第一个多边形
        [
          [
            [118.775, 32.040],
            [118.780, 32.040],
            [118.780, 32.044],
            [118.775, 32.044],
            [118.775, 32.040]
          ]
        ],
        // 第二个多边形
        [
          [
            [118.782, 32.046],
            [118.787, 32.046],
            [118.787, 32.050],
            [118.782, 32.050],
            [118.782, 32.046]
          ]
        ]
      ]
    }
  },
  {
    name: "MultiPolygon - 带洞多重多边形",
    geometry: {
      type: "MultiPolygon" as const,
      coordinates: [
        // 第一个多边形（带洞）
        [
          // 外环
          [
            [118.773, 32.039],
            [118.779, 32.039],
            [118.779, 32.045],
            [118.773, 32.045],
            [118.773, 32.039]
          ],
          // 内环（洞）
          [
            [118.775, 32.041],
            [118.777, 32.041],
            [118.777, 32.043],
            [118.775, 32.043],
            [118.775, 32.041]
          ]
        ],
        // 第二个多边形（带洞）
        [
          // 外环
          [
            [118.781, 32.047],
            [118.787, 32.047],
            [118.787, 32.053],
            [118.781, 32.053],
            [118.781, 32.047]
          ],
          // 内环（洞）
          [
            [118.783, 32.049],
            [118.785, 32.049],
            [118.785, 32.051],
            [118.783, 32.051],
            [118.783, 32.049]
          ]
        ]
      ]
    }
  }
];

// 控制状态
const currentGeometryIndex = ref(0);
const currentColor = ref("#ff6b6b");
const currentOpacity = ref(0.8);
const isWireframe = ref(false);
const currentHeight = ref(100);
const currentBaseHeight = ref(0);

// 当前几何体
const currentGeometry = computed(() => {
  return geometryTypes[currentGeometryIndex.value].geometry;
});

// 控制选项
const colors = ["#ff6b6b", "#4ecdc4", "#45b7d1", "#96ceb4", "#fcc468", "#f38ba8", "#a8dadc"];
const opacities = [0.3, 0.5, 0.7, 0.8, 0.9, 1.0];
const heights = [50, 100, 150, 200, 300, 500];
const baseHeights = [0, 10, 20, 30, 50];

// 当前索引
let colorIndex = 0;
let opacityIndex = 3;
let heightIndex = 1;
let baseHeightIndex = 0;

// 控制方法
const changeGeometry = () => {
  console.log('切换几何类型:', geometryTypes[currentGeometryIndex.value].name);
};

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

const changeHeight = () => {
  heightIndex = (heightIndex + 1) % heights.length;
  currentHeight.value = heights[heightIndex];
};

const changeBaseHeight = () => {
  baseHeightIndex = (baseHeightIndex + 1) % baseHeights.length;
  currentBaseHeight.value = baseHeights[baseHeightIndex];
};
</script>

<style scoped>
.geo-wall-case {
  width: 100%;
  height: 100vh;
  position: relative;
}

.controls {
  position: absolute;
  top: 20px;
  left: 20px;
  background: rgba(0, 0, 0, 0.8);
  color: white;
  padding: 20px;
  border-radius: 10px;
  z-index: 1000;
  min-width: 300px;
}

.controls h2 {
  margin: 0 0 20px 0;
  font-size: 18px;
}

.control-group {
  display: flex;
  align-items: center;
  margin-bottom: 15px;
}

.control-group label {
  width: 120px;
  font-size: 14px;
}

.control-group select,
.control-group button {
  padding: 8px 12px;
  border: none;
  border-radius: 5px;
  background: #333;
  color: white;
  cursor: pointer;
  font-size: 14px;
}

.control-group select {
  width: 200px;
}

.control-group button:hover {
  background: #555;
}

.control-group select:focus,
.control-group button:focus {
  outline: 2px solid #4ecdc4;
}
</style> 