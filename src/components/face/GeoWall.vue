<script setup lang="ts">
import { onMounted, onUnmounted, shallowRef, ref, watch } from "vue";
import {
  Mesh,
  BufferGeometry,
  Float32BufferAttribute,
  Vector3,
} from "three";

import { lonlatToECEF } from "../../utils/controls";
import { Point, GeoJSONGeometry } from "@/config/type";
import { GeoEventEmits, GeoInteractiveProps, createEventHandler, hijackRaycast } from "../common/event";

interface GeoWallProps extends GeoInteractiveProps {
  geometry: GeoJSONGeometry; // 支持所有 GeoJSON 几何类型
  height?: number; // 墙体高度
  baseHeight?: number; // 底部高度
  renderOrder?: number;
}

const props = withDefaults(defineProps<GeoWallProps>(), {
  height: 100, // 默认墙体高度
  baseHeight: 0, // 默认底部高度
  renderOrder: 1,
  raycastMultiplier: 1,
  raycastActive: true,
});

const emit = defineEmits<GeoEventEmits>();

const mesh = shallowRef<Mesh<BufferGeometry>>();
const centerPoint = ref<Vector3>(new Vector3());

// 创建事件处理器
const eventHandlers = createEventHandler(emit, props, props.raycastActive, mesh);

/**
 * 将 GeoJSON 坐标转换为 Point 格式
 */
const coordinatesToPoints = (coordinates: number[][]): Point[] => {
  return coordinates.map(([lon, lat, height = 0]) => ({
    lon,
    lat,
    height,
  }));
};

/**
 * 解析 GeoJSON 几何体，提取所有线段
 */
const parseGeoJSONGeometry = (geometry: GeoJSONGeometry): Point[][] => {
  const lineSegments: Point[][] = [];

  switch (geometry.type) {
    case "LineString":
      lineSegments.push(coordinatesToPoints(geometry.coordinates));
      break;
    
    case "MultiLineString":
      geometry.coordinates.forEach(lineCoords => {
        lineSegments.push(coordinatesToPoints(lineCoords));
      });
      break;
    
    case "Polygon":
      // 对于多边形，将所有环（外环和内环）作为线段处理
      geometry.coordinates.forEach(ringCoords => {
        lineSegments.push(coordinatesToPoints(ringCoords));
      });
      break;
    
    case "MultiPolygon":
      // 对于多重多边形，将所有多边形的所有环作为线段处理
      geometry.coordinates.forEach(polygonCoords => {
        polygonCoords.forEach(ringCoords => {
          lineSegments.push(coordinatesToPoints(ringCoords));
        });
      });
      break;
    
    default:
      throw new Error(`不支持的几何类型: ${(geometry as any).type}`);
  }

  return lineSegments;
};

/**
 * 创建墙体几何体
 * 通过将线段向上拉伸形成立体墙面
 */
const createWallGeometry = (lineSegments: Point[][], geometryCenter: Vector3): BufferGeometry => {
  if (lineSegments.length === 0) {
    throw new Error("没有有效的线段数据");
  }

  const vertices: number[] = [];
  const indices: number[] = [];
  const uvs: number[] = [];
  let vertexIndex = 0;

  // 处理每个线段
  lineSegments.forEach(points => {
    if (points.length < 2) {
      console.warn("线段至少需要2个点，跳过");
      return;
    }

    // 确保线段有足够的点来形成墙面
    const segmentPoints = [...points];
    
    // 为每个线段点创建底部和顶部顶点
    const bottomVertices: Vector3[] = [];
    const topVertices: Vector3[] = [];

    segmentPoints.forEach((point) => {
      // 底部顶点
      const bottomPos = lonlatToECEF(point.lon, point.lat, props.baseHeight);
      bottomVertices.push(new Vector3(
        bottomPos.x - geometryCenter.x,
        bottomPos.y - geometryCenter.y,
        bottomPos.z - geometryCenter.z
      ));

      // 顶部顶点
      const topPos = lonlatToECEF(point.lon, point.lat, props.baseHeight + props.height);
      topVertices.push(new Vector3(
        topPos.x - geometryCenter.x,
        topPos.y - geometryCenter.y,
        topPos.z - geometryCenter.z
      ));
    });

    // 计算沿边界的累积距离，用于UV的x坐标
    const distances: number[] = [0]; // 起点距离为0
    let totalDistance = 0;

    for (let i = 1; i < bottomVertices.length; i++) {
      const distance = bottomVertices[i - 1].distanceTo(bottomVertices[i]);
      totalDistance += distance;
      distances.push(totalDistance);
    }

    // 添加底部顶点和对应的UV坐标
    bottomVertices.forEach((vertex, index) => {
      vertices.push(vertex.x, vertex.y, vertex.z);
      // 底部UV: x为归一化的距离，y为0
      const normalizedDistance = totalDistance > 0 ? distances[index] / totalDistance : 0;
      uvs.push(normalizedDistance, 0);
    });

    // 添加顶部顶点和对应的UV坐标
    topVertices.forEach((vertex, index) => {
      vertices.push(vertex.x, vertex.y, vertex.z);
      // 顶部UV: x为归一化的距离，y为1
      const normalizedDistance = totalDistance > 0 ? distances[index] / totalDistance : 0;
      uvs.push(normalizedDistance, 1);
    });

    const numPoints = bottomVertices.length;

    // 创建墙面（每两个相邻点之间的四边形，分解为两个三角形）
    for (let i = 0; i < numPoints - 1; i++) {
      const bottomCurrent = vertexIndex + i;
      const bottomNext = vertexIndex + i + 1;
      const topCurrent = vertexIndex + i + numPoints;
      const topNext = vertexIndex + i + 1 + numPoints;

      // 第一个三角形 (底部当前 -> 底部下一个 -> 顶部当前)
      indices.push(bottomCurrent, bottomNext, topCurrent);

      // 第二个三角形 (底部下一个 -> 顶部下一个 -> 顶部当前)
      indices.push(bottomNext, topNext, topCurrent);
    }

    // 更新顶点索引偏移量
    vertexIndex += numPoints * 2;
  });

  // 创建BufferGeometry
  const geometry = new BufferGeometry();
  geometry.setAttribute("position", new Float32BufferAttribute(vertices, 3));
  geometry.setAttribute("uv", new Float32BufferAttribute(uvs, 2));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();

  return geometry;
};

const createWall = () => {
  try {
    // 解析几何体获取线段
    const lineSegments = parseGeoJSONGeometry(props.geometry);
    
    if (lineSegments.length === 0) {
      console.warn("没有有效的线段数据");
      return;
    }

    // 计算几何体中心点用于偏移
    const geometryCenter = calculateGeometryCenter(props.geometry);
    centerPoint.value = geometryCenter;

    // 创建墙体几何体
    const geometry = createWallGeometry(lineSegments, geometryCenter);

    // 创建网格（不创建材质，通过slot传入）
    mesh.value = new Mesh(geometry);
    mesh.value.renderOrder = props.renderOrder;
    
    // 添加交互事件支持
    if (props.raycastActive) {
      hijackRaycast(mesh.value, props.raycastMultiplier);
    }
  } catch (error) {
    console.error("创建墙体失败:", error);
  }
};

const updateGeometry = () => {
  if (mesh.value) {
    try {
      // 重新解析几何体
      const lineSegments = parseGeoJSONGeometry(props.geometry);
      
      if (lineSegments.length === 0) {
        console.warn("没有有效的线段数据");
        return;
      }

      // 重新创建几何体
      const oldGeometry = mesh.value.geometry;
      
      // 计算几何体中心点用于偏移
      const geometryCenter = calculateGeometryCenter(props.geometry);
      centerPoint.value = geometryCenter;
      
      const newGeometry = createWallGeometry(lineSegments, geometryCenter);

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
  () => props.height,
  () => {
    updateGeometry();
  }
);

watch(
  () => props.baseHeight,
  () => {
    updateGeometry();
  }
);

// 中心点偏移机制 - 计算几何体的中心点用于偏移
const calculateGeometryCenter = (geometry: GeoJSONGeometry): Vector3 => {
  const lineSegments = parseGeoJSONGeometry(geometry);
  if (lineSegments.length === 0) return new Vector3();

  let totalLon = 0;
  let totalLat = 0;
  let totalPoints = 0;

  lineSegments.forEach((segment) => {
    segment.forEach((point) => {
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
  createWall();
});

onUnmounted(() => {
  if (mesh.value) {
    mesh.value.geometry.dispose();
  }
});
</script>

<template>
  <TresGroup v-if="mesh" :position="centerPoint">
    <primitive 
      :object="mesh"
      @click="eventHandlers.handleClick"
      @double-click="eventHandlers.handleDoubleClick"
      @context-menu="eventHandlers.handleContextMenu"
      @pointer-enter="eventHandlers.handlePointerEnter"
      @pointer-leave="eventHandlers.handlePointerLeave"
      @pointer-over="eventHandlers.handlePointerOver"
      @pointer-down="eventHandlers.handlePointerDown"
      @pointer-up="eventHandlers.handlePointerUp"
      @wheel="eventHandlers.handleWheel"
    >
      <slot />
    </primitive>
  </TresGroup>
</template>
