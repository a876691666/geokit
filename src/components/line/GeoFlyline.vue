<script setup lang="ts">
import { ref, watch, onMounted } from "vue";
import GeoTubeline from "./GeoTubeline.vue";
import GeoMeshline from "./GeoMeshline.vue";
import { Point } from "@/config/type";

interface GeoFlylineProps {
  start: Point; // 起始点
  end: Point; // 结束点
  type?: "mesh" | "tube";
  color?: string;
  width?: number;
  texture?: string;
  duration?: number;
  arcHeight?: number; // 弧度高度，默认为两点距离的20%
  segments?: number; // 弧线分段数，默认20
  // Tube专属属性
  tubularSegments?: number;
  renderOrder?: number;
}

const props = withDefaults(defineProps<GeoFlylineProps>(), {
  type: "mesh",
  color: "#ffffff",
  width: 1,
  duration: 2,
  arcHeight: 0,
  segments: 20,
  renderOrder: 1,
});

const calculatedPoints = ref<Point[]>([]);

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
</script>

<template>
  <GeoTubeline
    v-if="props.type === 'tube'"
    :points="calculatedPoints"
    :color="props.color"
    :width="props.width"
    :texture="props.texture"
    :duration="props.duration"
    :tubularSegments="props.tubularSegments"
    :renderOrder="props.renderOrder"
  />
  <GeoMeshline
    v-else
    :points="calculatedPoints"
    :color="props.color"
    :width="props.width"
    :texture="props.texture"
    :duration="props.duration"
    :renderOrder="props.renderOrder"
  />
</template>
