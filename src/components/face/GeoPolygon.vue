<script setup lang="ts">
import { onMounted, onUnmounted, shallowRef, ref, watch } from "vue";
import { Mesh, BufferGeometry, Float32BufferAttribute, Vector3 } from "three";
// @ts-ignore
import Delaunator from "delaunator";

import { lonlatToECEF } from "../../utils/controls";
import { Point, GeoJSONGeometry } from "@/config/type";
import {
  isClockWise,
  mergeOverlappingPoints,
  subdividePolygonBoundary,
  triangulateWithDelaunator,
  generateInteriorPoints,
} from "../../utils/geometry";

interface GeoPolygonProps {
  geometry: GeoJSONGeometry; // 只支持GeoJSON格式
  subdivisions?: number;
  height?: number;
  renderOrder?: number;
}

const props = withDefaults(defineProps<GeoPolygonProps>(), {
  subdivisions: 2,
  height: 30,
  renderOrder: 1,
});

const mesh = shallowRef<Mesh<BufferGeometry>>();
const centerPoint = ref<Vector3>(new Vector3());

/**
 * 将GeoJSON坐标转换为Point格式（本地版本，使用props.height）
 */
const coordinatesToPoints = (coordinates: number[][]): Point[] => {
  return coordinates.map(([lon, lat, height = props.height]) => ({
    lon,
    lat,
    height,
  }));
};

/**
 * 解析GeoJSON几何体，统一转换为MultiPolygon格式（本地版本）
 */
const parseGeoJSONGeometryLocal = (
  geometry: GeoJSONGeometry
): { contours: Point[][]; holes: Point[][][] } => {
  let multiPolygonCoords: number[][][][];

  if (geometry.type === "Polygon") {
    // 将Polygon转换为MultiPolygon格式
    multiPolygonCoords = [geometry.coordinates];
  } else if (geometry.type === "MultiPolygon") {
    multiPolygonCoords = geometry.coordinates;
  } else {
    throw new Error("不支持的几何类型，仅支持Polygon和MultiPolygon");
  }

  const contours: Point[][] = [];
  const holes: Point[][][] = [];

  multiPolygonCoords.forEach((polygonCoords) => {
    if (polygonCoords.length === 0) return;

    // 第一个环是外环（轮廓）
    const contour = coordinatesToPoints(polygonCoords[0]);
    contours.push(contour);

    // 其余的环是内环（洞）
    const polygonHoles: Point[][] = [];
    for (let i = 1; i < polygonCoords.length; i++) {
      const hole = coordinatesToPoints(polygonCoords[i]);
      polygonHoles.push(hole);
    }
    holes.push(polygonHoles);
  });

  return { contours, holes };
};

/**
 * 创建多边形几何体（支持MultiPolygon）
 */
const createMultiPolygonGeometry = (geometryCenter: Vector3): BufferGeometry => {
  const { contours, holes } = parseGeoJSONGeometryLocal(props.geometry);

  if (contours.length === 0) {
    throw new Error("没有有效的多边形轮廓");
  }

  const allVertices: number[] = [];
  const allUVs: number[] = [];

  // 处理每个多边形
  contours.forEach((contour, polygonIndex) => {
    if (contour.length < 3) {
      console.warn(`多边形${polygonIndex}的顶点数少于3，跳过`);
      return;
    }

    const polygonHoles = holes[polygonIndex] || [];

    // 准备边界点（经纬度）
    let boundaryPoints: [number, number][] = contour.map((p) => [p.lon, p.lat]);

    // 准备洞的点
    let holePoints: [number, number][][] = polygonHoles.map((hole) =>
      hole.map((p) => [p.lon, p.lat])
    );

    // 检查和修正方向
    const reverse = !isClockWise(boundaryPoints);
    if (reverse) {
      boundaryPoints.reverse();
    }

    // 检查洞的方向
    for (let h = 0; h < holePoints.length; h++) {
      const hole = holePoints[h];
      if (isClockWise(hole)) {
        holePoints[h] = hole.reverse();
      }
    }

    // 合并重叠点
    mergeOverlappingPoints(boundaryPoints);
    holePoints.forEach((hole) => mergeOverlappingPoints(hole));

    // 根据细分程度对边界进行细分
    const subdivisionFactor = Math.max(1, props.subdivisions);
    boundaryPoints = subdividePolygonBoundary(boundaryPoints, subdivisionFactor);
    holePoints = holePoints.map((hole) => subdividePolygonBoundary(hole, subdivisionFactor));

    // 根据subdivisions参数生成内部网格点
    const interiorPoints = generateInteriorPoints(boundaryPoints, holePoints, subdivisionFactor);

    // 不再需要添加洞边界附近的约束点，因为我们已经通过边界细分来处理了

    // 执行三角剖分，直接返回三角形顶点
    const triangleVertices = triangulateWithDelaunator(boundaryPoints, holePoints, interiorPoints);

    // 转换为ECEF坐标
    const height = props.height ?? 0;

    const xtList = triangleVertices.map((p) => p[0]);
    const ytList = triangleVertices.map((p) => p[1]);

    // 计算边界框用于UV映射
    const uvMinLon = Math.min.apply(null, xtList);
    const uvMaxLon = Math.max.apply(null, xtList);
    const uvMinLat = Math.min.apply(null, ytList);
    const uvMaxLat = Math.max.apply(null, ytList);

    const uvGridWidth = uvMaxLon - uvMinLon;
    const uvGridHeight = uvMaxLat - uvMinLat;

    // 处理每个三角形顶点
    triangleVertices.forEach(([lon, lat]) => {
      // 转换为ECEF坐标
      const ecefPos = lonlatToECEF(lon, lat, height);
      // 应用中心点偏移，减少顶点数值大小
      allVertices.push(
        ecefPos.x - geometryCenter.x,
        ecefPos.y - geometryCenter.y,
        ecefPos.z - geometryCenter.z
      );

      // 计算UV坐标
      const u = uvGridWidth > 0 ? (lon - uvMinLon) / uvGridWidth : 0;
      const v = uvGridHeight > 0 ? 1 - (lat - uvMinLat) / uvGridHeight : 0;
      allUVs.push(u, v);
    });
  });

  // 创建BufferGeometry（不使用索引）
  const geometry = new BufferGeometry();
  geometry.setAttribute("position", new Float32BufferAttribute(allVertices, 3));
  geometry.setAttribute("uv", new Float32BufferAttribute(allUVs, 2));
  geometry.computeVertexNormals();

  return geometry;
};

const createPolygon = () => {
  try {
    const { contours } = parseGeoJSONGeometryLocal(props.geometry);

    if (contours.length === 0 || contours[0].length < 3) {
      console.warn("多边形至少需要3个点");
      return;
    }

    // 计算几何体中心点用于偏移
    const geometryCenter = calculateGeometryCenter(props.geometry);
    centerPoint.value = geometryCenter;

    // 创建多边形几何体
    const geometry = createMultiPolygonGeometry(geometryCenter);

    // 创建网格（不创建材质，通过slot传入）
    mesh.value = new Mesh(geometry);
    mesh.value.renderOrder = props.renderOrder;
  } catch (error) {
    console.error("创建多边形失败:", error);
  }
};

const updateGeometry = () => {
  if (mesh.value) {
    try {
      const { contours } = parseGeoJSONGeometryLocal(props.geometry);

      if (contours.length === 0 || contours[0].length < 3) {
        return;
      }

      // 重新创建几何体
      const oldGeometry = mesh.value.geometry;

      // 计算几何体中心点用于偏移
      const geometryCenter = calculateGeometryCenter(props.geometry);
      centerPoint.value = geometryCenter;

      const newGeometry = createMultiPolygonGeometry(geometryCenter);

      mesh.value.geometry = newGeometry;

      // 清理旧几何体
      oldGeometry.dispose();
    } catch (error) {
      console.error("更新几何体失败:", error);
    }
  }
};

// 监听属性变化
watch(
  () => props.geometry,
  () => {
    updateGeometry();
  },
  { deep: true }
);

watch(
  () => props.subdivisions,
  () => {
    updateGeometry();
  }
);

watch(
  () => props.height,
  () => {
    updateGeometry();
  }
);

// 中心点偏移机制 - 计算几何体的中心点用于偏移
const calculateGeometryCenter = (geometry: GeoJSONGeometry): Vector3 => {
  const { contours } = parseGeoJSONGeometryLocal(geometry);
  if (contours.length === 0) return new Vector3();

  let totalLon = 0;
  let totalLat = 0;
  let totalPoints = 0;

  contours.forEach((contour) => {
    contour.forEach((point) => {
      totalLon += point.lon;
      totalLat += point.lat;
      totalPoints++;
    });
  });

  if (totalPoints === 0) return new Vector3();

  const centerLon = totalLon / totalPoints;
  const centerLat = totalLat / totalPoints;
  const centerHeight = props.height ?? 0;

  return new Vector3(...lonlatToECEF(centerLon, centerLat, centerHeight));
};

onMounted(() => {
  createPolygon();
});

onUnmounted(() => {
  if (mesh.value) {
    mesh.value.geometry?.dispose?.();
  }
});
</script>

<template>
  <TresGroup v-if="mesh" :position="centerPoint">
    <primitive :object="mesh">
      <slot />
    </primitive>
  </TresGroup>
</template>
