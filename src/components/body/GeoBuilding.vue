<script setup lang="ts">
import { onMounted, onUnmounted, shallowRef, ref, watch } from "vue";
import { Mesh, BufferGeometry, Float32BufferAttribute, Vector3, MeshPhongMaterial } from "three";
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

interface GeoBuildingProps {
  geometry: GeoJSONGeometry; // 只支持 Polygon 和 MultiPolygon
  subdivisions?: number;
  height?: number; // 楼体高度
  baseHeight?: number; // 底部高度
  showTop?: boolean; // 是否显示顶面
  showBottom?: boolean; // 是否显示底面
  showWalls?: boolean; // 是否显示墙体
  renderOrder?: number;
}

const props = withDefaults(defineProps<GeoBuildingProps>(), {
  subdivisions: 2,
  height: 100,
  baseHeight: 0,
  showTop: true,
  showBottom: false,
  showWalls: true,
  renderOrder: 1,
});

const topMesh = shallowRef<Mesh<BufferGeometry, MeshPhongMaterial>>();
const bottomMesh = shallowRef<Mesh<BufferGeometry, MeshPhongMaterial>>();
const wallMesh = shallowRef<Mesh<BufferGeometry, MeshPhongMaterial>>();
const centerPoint = ref<Vector3>(new Vector3());

/**
 * 将GeoJSON坐标转换为Point格式（本地版本，使用props.baseHeight）
 */
const coordinatesToPoints = (coordinates: number[][]): Point[] => {
  return coordinates.map(([lon, lat, height = props.baseHeight]) => ({
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
    multiPolygonCoords = [geometry.coordinates];
  } else if (geometry.type === "MultiPolygon") {
    multiPolygonCoords = geometry.coordinates;
  } else {
    throw new Error("GeoBuilding 只支持 Polygon 和 MultiPolygon 类型");
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
 * 创建多边形面几何体（顶面或底面）- 使用中心点偏移
 */
const createPolygonGeometry = (heightOffset: number, geometryCenter: Vector3): BufferGeometry => {
  const { contours, holes } = parseGeoJSONGeometryLocal(props.geometry);
  if (contours.length === 0) {
    throw new Error("没有有效的多边形轮廓");
  }

  const allVertices: number[] = [];
  const allUVs: number[] = [];

  contours.forEach((contour, polygonIndex) => {
    if (contour.length < 3) {
      console.warn(`多边形${polygonIndex}的顶点数少于3，跳过`);
      return;
    }

    const polygonHoles = holes[polygonIndex] || [];

    let boundaryPoints: [number, number][] = contour.map((p) => [p.lon, p.lat]);
    let holePoints: [number, number][][] = polygonHoles.map((hole) =>
      hole.map((p) => [p.lon, p.lat])
    );

    const reverse = !isClockWise(boundaryPoints);
    if (reverse) {
      boundaryPoints.reverse();
    }

    for (let h = 0; h < holePoints.length; h++) {
      const hole = holePoints[h];
      if (isClockWise(hole)) {
        holePoints[h] = hole.reverse();
      }
    }

    mergeOverlappingPoints(boundaryPoints);
    holePoints.forEach((hole) => mergeOverlappingPoints(hole));

    // 限制细分程度以避免过多顶点
    const subdivisionFactor = Math.min(Math.max(1, props.subdivisions), 5);
    boundaryPoints = subdividePolygonBoundary(boundaryPoints, subdivisionFactor);
    holePoints = holePoints.map((hole) => subdividePolygonBoundary(hole, subdivisionFactor));

    const interiorPoints = generateInteriorPoints(boundaryPoints, holePoints, subdivisionFactor);

    const triangleVertices = triangulateWithDelaunator(boundaryPoints, holePoints, interiorPoints);

    // 检查顶点数量，避免过多顶点
    if (triangleVertices.length > 10000) {
      console.warn(
        `多边形${polygonIndex}顶点数过多(${triangleVertices.length})，建议减少subdivisions`
      );
    }

    const xtList = triangleVertices.map((p) => p[0]);
    const ytList = triangleVertices.map((p) => p[1]);

    const uvMinLon = Math.min.apply(null, xtList);
    const uvMaxLon = Math.max.apply(null, xtList);
    const uvMinLat = Math.min.apply(null, ytList);
    const uvMaxLat = Math.max.apply(null, ytList);

    const uvGridWidth = uvMaxLon - uvMinLon;
    const uvGridHeight = uvMaxLat - uvMinLat;

    triangleVertices.forEach(([lon, lat]) => {
      const ecefPos = lonlatToECEF(lon, lat, props.baseHeight + heightOffset);
      // 应用中心点偏移，减少顶点数值大小
      allVertices.push(
        ecefPos.x - geometryCenter.x,
        ecefPos.y - geometryCenter.y,
        ecefPos.z - geometryCenter.z
      );

      const u = uvGridWidth > 0 ? (lon - uvMinLon) / uvGridWidth : 0;
      const v = uvGridHeight > 0 ? 1 - (lat - uvMinLat) / uvGridHeight : 0;
      allUVs.push(u, v);
    });
  });

  const geometry = new BufferGeometry();
  geometry.setAttribute("position", new Float32BufferAttribute(allVertices, 3));
  geometry.setAttribute("uv", new Float32BufferAttribute(allUVs, 2));
  geometry.computeVertexNormals();

  return geometry;
};

/**
 * 创建墙体几何体 - 使用中心点偏移
 */
const createWallGeometry = (geometryCenter: Vector3): BufferGeometry => {
  const { contours, holes } = parseGeoJSONGeometryLocal(props.geometry);

  if (contours.length === 0) {
    throw new Error("没有有效的多边形轮廓");
  }

  const vertices: number[] = [];
  const indices: number[] = [];
  const uvs: number[] = [];
  let vertexIndex = 0;

  // 处理每个多边形的轮廓和洞
  contours.forEach((contour, polygonIndex) => {
    const polygonHoles = holes[polygonIndex] || [];

    // 处理外环（轮廓）
    const processRing = (ring: Point[]) => {
      if (ring.length < 3) return;

      const bottomVertices: Vector3[] = [];
      const topVertices: Vector3[] = [];

      ring.forEach((point) => {
        const bottomPos = lonlatToECEF(point.lon, point.lat, props.baseHeight);
        bottomVertices.push(
          new Vector3(
            bottomPos.x - geometryCenter.x,
            bottomPos.y - geometryCenter.y,
            bottomPos.z - geometryCenter.z
          )
        );

        const topPos = lonlatToECEF(point.lon, point.lat, props.baseHeight + props.height);
        topVertices.push(
          new Vector3(
            topPos.x - geometryCenter.x,
            topPos.y - geometryCenter.y,
            topPos.z - geometryCenter.z
          )
        );
      });

      // 计算沿边界的累积距离
      const distances: number[] = [0];
      let totalDistance = 0;

      for (let i = 1; i < bottomVertices.length; i++) {
        const distance = bottomVertices[i - 1].distanceTo(bottomVertices[i]);
        totalDistance += distance;
        distances.push(totalDistance);
      }

      // 添加底部顶点
      bottomVertices.forEach((vertex, index) => {
        vertices.push(vertex.x, vertex.y, vertex.z);
        const normalizedDistance = totalDistance > 0 ? distances[index] / totalDistance : 0;
        uvs.push(normalizedDistance, 0);
      });

      // 添加顶部顶点
      topVertices.forEach((vertex, index) => {
        vertices.push(vertex.x, vertex.y, vertex.z);
        const normalizedDistance = totalDistance > 0 ? distances[index] / totalDistance : 0;
        uvs.push(normalizedDistance, 1);
      });

      const numPoints = bottomVertices.length;

      // 创建墙面
      for (let i = 0; i < numPoints - 1; i++) {
        const bottomCurrent = vertexIndex + i;
        const bottomNext = vertexIndex + i + 1;
        const topCurrent = vertexIndex + i + numPoints;
        const topNext = vertexIndex + i + 1 + numPoints;

        indices.push(bottomCurrent, bottomNext, topCurrent);
        indices.push(bottomNext, topNext, topCurrent);
      }

      vertexIndex += numPoints * 2;
    };

    // 处理外环
    processRing(contour);

    // 处理内环（洞）
    polygonHoles.forEach((hole) => {
      processRing(hole);
    });
  });

  const geometry = new BufferGeometry();
  geometry.setAttribute("position", new Float32BufferAttribute(vertices, 3));
  geometry.setAttribute("uv", new Float32BufferAttribute(uvs, 2));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();

  return geometry;
};

const createBuilding = () => {
  try {
    const { contours } = parseGeoJSONGeometryLocal(props.geometry);

    if (contours.length === 0 || contours[0].length < 3) {
      console.warn("多边形至少需要3个点");
      return;
    }

    // 计算几何体中心点用于偏移
    const geometryCenter = calculateGeometryCenter(props.geometry);
    centerPoint.value = geometryCenter;

    // 创建底面
    if (props.showBottom) {
      const bottomGeometry = createPolygonGeometry(0, geometryCenter);
      bottomMesh.value = new Mesh(bottomGeometry);
      bottomMesh.value.renderOrder = props.renderOrder;
    }

    // 创建顶面
    if (props.showTop) {
      const topGeometry = createPolygonGeometry(props.height, geometryCenter);
      topMesh.value = new Mesh(topGeometry);
      topMesh.value.renderOrder = props.renderOrder;
    }

    // 创建墙体
    if (props.showWalls) {
      const wallGeometry = createWallGeometry(geometryCenter);
      wallMesh.value = new Mesh(wallGeometry);
      wallMesh.value.renderOrder = props.renderOrder;
    }
  } catch (error) {
    console.error("创建建筑失败:", error);
  }
};

const updateGeometry = () => {
  // 清理旧的几何体
  if (topMesh.value) {
    topMesh.value.geometry.dispose();
  }
  if (bottomMesh.value) {
    bottomMesh.value.geometry.dispose();
  }
  if (wallMesh.value) {
    wallMesh.value.geometry.dispose();
  }

  // 重新创建建筑
  createBuilding();
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
  () => [
    props.subdivisions,
    props.height,
    props.baseHeight,
    props.showTop,
    props.showBottom,
    props.showWalls,
  ],
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
  const centerHeight = props.baseHeight + props.height / 2;

  return new Vector3(...lonlatToECEF(centerLon, centerLat, centerHeight));
};

onMounted(() => {
  createBuilding();
});

onUnmounted(() => {
  if (topMesh.value) {
    topMesh.value.geometry.dispose();
  }
  if (bottomMesh.value) {
    bottomMesh.value.geometry.dispose();
  }
  if (wallMesh.value) {
    wallMesh.value.geometry.dispose();
  }
});
</script>

<template>
  <TresGroup v-if="bottomMesh || topMesh || wallMesh" :position="centerPoint">
    <primitive v-if="showBottom" :object="bottomMesh">
      <slot name="bottom" />
    </primitive>
    <primitive v-if="showTop" :object="topMesh">
      <slot name="top" />
    </primitive>
    <primitive v-if="showWalls" :object="wallMesh">
      <slot name="walls" />
    </primitive>
  </TresGroup>
</template>
