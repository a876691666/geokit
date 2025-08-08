<script setup lang="ts">
import { ref, watch, onMounted, inject, computed } from "vue";
import GeoTubeline from "./GeoTubeline.vue";
import GeoMeshline from "./GeoMeshline.vue";
import GeoLineAnimation from "./GeoLineAnimation.vue";
import { Point } from "@/config/type";
import { GeoEventEmits, GeoInteractiveProps } from "../common/event";
import { Texture } from "three";

interface GeoFlylineProps extends GeoInteractiveProps {
  start: Point; // 起始点
  end: Point; // 结束点
  type?: "mesh" | "tube";
  color?: string;
  width?: number;
  map?: Texture; // 纹理贴图
  autoStart?: boolean; // 自动启动动画
  arcHeight?: number; // 弧度高度，默认为两点距离的20%
  segments?: number; // 弧线分段数，默认20
  // Tube专属属性
  tubularSegments?: number;
  renderOrder?: number;
  // 动画相关属性
  duration?: number; // 动画持续时间（毫秒）
  reverse?: boolean; // 是否逆向动画
}

const props = withDefaults(defineProps<GeoFlylineProps>(), {
  type: "mesh",
  color: "#ffffff",
  width: 1,
  autoStart: true,
  arcHeight: 0,
  segments: 20,
  renderOrder: 1,
  raycastMultiplier: 1,
  raycastActive: true,
  duration: 2000, // 默认2秒动画
  reverse: false,
});

const emit = defineEmits<GeoEventEmits>();

const calculatedPoints = ref<Point[]>([]);
const animationRef = ref<InstanceType<typeof GeoLineAnimation>>();

// 检测是否已经被 GeoLineAnimation 包裹
const registerAnimationTarget = inject<((target: any, type: "meshline" | "texture", texture?: Texture) => void) | null>("registerAnimationTarget", null);
const hasParentAnimation = computed(() => registerAnimationTarget !== null);

// 计算两点之间的距离（简化计算）
const calculateDistance = (start: Point, end: Point): number => {
  const deltaLng = end.lon - start.lon;
  const deltaLat = end.lat - start.lat;
  return Math.sqrt(deltaLng * deltaLng + deltaLat * deltaLat);
};

// 生成弧线路径点
const generateArcPoints = () => {
  const { start, end, arcHeight, segments } = props;
  const points: Point[] = [];

  // 计算默认弧度高度（如果未指定）
  const distance = calculateDistance(start, end);
  const height = arcHeight || distance * 0.2;

  const startHeight = start.height || 0;
  const endHeight = end.height || 0;

  for (let i = 0; i <= segments; i++) {
    const t = i / segments;

    // 线性插值经纬度
    const lng = start.lon + (end.lon - start.lon) * t;
    const lat = start.lat + (end.lat - start.lat) * t;

    // 计算抛物线高度 (二次贝塞尔曲线)
    const baseHeight = startHeight + (endHeight - startHeight) * t;
    const arcOffset = 4 * height * t * (1 - t); // 抛物线公式

    points.push({
      lon: lng,
      lat: lat,
      height: baseHeight + arcOffset,
    });
  }

  calculatedPoints.value = points;
};

// 监听属性变化，重新计算路径
watch(
  () => [props.start, props.end, props.arcHeight, props.segments],
  () => {
    generateArcPoints();
  },
  { deep: true, immediate: true }
);

onMounted(() => {
  generateArcPoints();
});

// 暴露动画控制方法给父组件
defineExpose({
  startAnimation: () => {
    if (hasParentAnimation.value) {
      // 如果有父级动画，则无法直接控制，需要通过父级控制
      console.warn('GeoFlyline is wrapped by GeoLineAnimation, please control animation through parent component');
      return;
    }
    return animationRef.value?.start();
  },
  stopAnimation: () => {
    if (hasParentAnimation.value) {
      console.warn('GeoFlyline is wrapped by GeoLineAnimation, please control animation through parent component');
      return;
    }
    return animationRef.value?.stop();
  },
  isAnimating: () => {
    if (hasParentAnimation.value) {
      return false; // 无法直接获取父级动画状态
    }
    return animationRef.value?.isAnimating() || false;
  },
});
</script>

<template>
  <!-- 如果没有父级 GeoLineAnimation，则创建自己的动画容器 -->
  <GeoLineAnimation
    v-if="!hasParentAnimation"
    ref="animationRef"
    :texture="props.map"
    :autoStart="props.autoStart"
    :duration="props.duration"
    :reverse="props.reverse"
  >
    <GeoTubeline
      v-if="props.type === 'tube'"
      :points="calculatedPoints"
      :color="props.color"
      :width="props.width"
      :map="props.map"
      :tubularSegments="props.tubularSegments"
      :renderOrder="props.renderOrder"
      :id="props.id"
      :raycastActive="props.raycastActive"
      :raycastMultiplier="props.raycastMultiplier"
      @click="(...args) => emit('click', ...args)"
      @double-click="(...args) => emit('double-click', ...args)"
      @context-menu="(...args) => emit('context-menu', ...args)"
      @pointer-enter="(...args) => emit('pointer-enter', ...args)"
      @pointer-leave="(...args) => emit('pointer-leave', ...args)"
      @pointer-over="(...args) => emit('pointer-over', ...args)"
      @pointer-down="(...args) => emit('pointer-down', ...args)"
      @pointer-up="(...args) => emit('pointer-up', ...args)"
      @wheel="(...args) => emit('wheel', ...args)"
    />
    <GeoMeshline
      v-else
      :points="calculatedPoints"
      :color="props.color"
      :width="props.width"
      :map="props.map"
      :renderOrder="props.renderOrder"
      :id="props.id"
      :raycastActive="props.raycastActive"
      :raycastMultiplier="props.raycastMultiplier"
      @click="(...args) => emit('click', ...args)"
      @double-click="(...args) => emit('double-click', ...args)"
      @context-menu="(...args) => emit('context-menu', ...args)"
      @pointer-enter="(...args) => emit('pointer-enter', ...args)"
      @pointer-leave="(...args) => emit('pointer-leave', ...args)"
      @pointer-over="(...args) => emit('pointer-over', ...args)"
      @pointer-down="(...args) => emit('pointer-down', ...args)"
      @pointer-up="(...args) => emit('pointer-up', ...args)"
      @wheel="(...args) => emit('wheel', ...args)"
    />
  </GeoLineAnimation>
  
  <!-- 如果已有父级 GeoLineAnimation，则直接渲染线条组件 -->
  <template v-else>
    <GeoTubeline
      v-if="props.type === 'tube'"
      :points="calculatedPoints"
      :color="props.color"
      :width="props.width"
      :map="props.map"
      :tubularSegments="props.tubularSegments"
      :renderOrder="props.renderOrder"
      :id="props.id"
      :raycastActive="props.raycastActive"
      :raycastMultiplier="props.raycastMultiplier"
      @click="(...args) => emit('click', ...args)"
      @double-click="(...args) => emit('double-click', ...args)"
      @context-menu="(...args) => emit('context-menu', ...args)"
      @pointer-enter="(...args) => emit('pointer-enter', ...args)"
      @pointer-leave="(...args) => emit('pointer-leave', ...args)"
      @pointer-over="(...args) => emit('pointer-over', ...args)"
      @pointer-down="(...args) => emit('pointer-down', ...args)"
      @pointer-up="(...args) => emit('pointer-up', ...args)"
      @wheel="(...args) => emit('wheel', ...args)"
    />
    <GeoMeshline
      v-else
      :points="calculatedPoints"
      :color="props.color"
      :width="props.width"
      :map="props.map"
      :renderOrder="props.renderOrder"
      :id="props.id"
      :raycastActive="props.raycastActive"
      :raycastMultiplier="props.raycastMultiplier"
      @click="(...args) => emit('click', ...args)"
      @double-click="(...args) => emit('double-click', ...args)"
      @context-menu="(...args) => emit('context-menu', ...args)"
      @pointer-enter="(...args) => emit('pointer-enter', ...args)"
      @pointer-leave="(...args) => emit('pointer-leave', ...args)"
      @pointer-over="(...args) => emit('pointer-over', ...args)"
      @pointer-down="(...args) => emit('pointer-down', ...args)"
      @pointer-up="(...args) => emit('pointer-up', ...args)"
      @wheel="(...args) => emit('wheel', ...args)"
    />
  </template>
</template>
