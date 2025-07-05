<script setup lang="ts">
import { onMounted, onUnmounted, shallowRef, ref, watch } from "vue";
import {
  Mesh,
  BufferGeometry,
  Float32BufferAttribute,
  MeshBasicMaterial,
  Group,
  Vector3,
  DoubleSide,
  Color,
  Texture,
} from "three";
// @ts-ignore
import Delaunator from "delaunator";
import { calculateCenterPoint, convertGeoPointsToVector3 } from "../line/utils";
import { lonlatToECEF } from "../../utils/controls";
import { useResourceId } from "../common/hooks";
import { Point } from "@/config/type";

interface GeoPolygonProps {
  points: Point[];
  color?: string;
  opacity?: number;
  wireframe?: boolean;
  subdivisions?: number; // 细分程度，用于生成更均匀的三角面
  height?: number; // 独立的高度参数
  textureId?: string; // 贴图资源ID
}

const props = withDefaults(defineProps<GeoPolygonProps>(), {
  color: "#ffffff",
  opacity: 1,
  wireframe: false,
  subdivisions: 2,
  height: 30, // 默认高度
  textureId: "", // 默认无贴图
});

const group = shallowRef<Group>();
const mesh = shallowRef<Mesh<BufferGeometry, MeshBasicMaterial>>();
const positions = ref<Vector3[]>([]);
const centerPoint = ref<Vector3>(new Vector3());

// 使用资源管理器
const { getResourceById } = useResourceId();

// 贴图资源的 shallowRef
let textureRef = shallowRef<Texture | null>(null);

/**
 * 判断点是否在多边形内部
 */
const isPointInPolygon = (testPoint: [number, number], polygon: [number, number][]): boolean => {
  let inside = false;
  const x = testPoint[0];
  const y = testPoint[1];

  let j = polygon.length - 1;
  for (let i = 0; i < polygon.length; i++) {
    const xi = polygon[i][0];
    const yi = polygon[i][1];
    const xj = polygon[j][0];
    const yj = polygon[j][1];

    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) {
      inside = !inside;
    }
    j = i;
  }

  return inside;
};

/**
 * 使用Delaunator库进行Delaunay三角剖分生成三角面
 */
const createTriangulatedGeometry = (points: Point[]): BufferGeometry => {
  if (points.length < 3) {
    throw new Error("多边形至少需要3个点");
  }

  // 1. 准备边界点（经纬度）
  const boundaryPoints: [number, number][] = points.map((p) => [p.lon, p.lat]);

  // 2. 计算边界框
  const minLon = Math.min(...boundaryPoints.map((p) => p[0]));
  const maxLon = Math.max(...boundaryPoints.map((p) => p[0]));
  const minLat = Math.min(...boundaryPoints.map((p) => p[1]));
  const maxLat = Math.max(...boundaryPoints.map((p) => p[1]));

  // 3. 根据subdivisions参数生成内部网格点
  const gridWidth = maxLon - minLon;
  const gridHeight = maxLat - minLat;
  const stepLon = gridWidth / (props.subdivisions * 5);
  const stepLat = gridHeight / (props.subdivisions * 5);

  // 4. 生成内部点
  const interiorPoints: [number, number][] = [];
  for (let lon = minLon + stepLon; lon < maxLon; lon += stepLon) {
    for (let lat = minLat + stepLat; lat < maxLat; lat += stepLat) {
      if (isPointInPolygon([lon, lat], boundaryPoints)) {
        interiorPoints.push([lon, lat]);
      }
    }
  }

  // 5. 合并所有点（边界点 + 内部点）
  const allPoints: [number, number][] = [...boundaryPoints, ...interiorPoints];

  // 6. 准备delaunator输入数据（扁平数组）
  const coords: number[] = [];
  allPoints.forEach((point) => {
    coords.push(point[0], point[1]); // [lon1, lat1, lon2, lat2, ...]
  });

  // 7. 执行Delaunay三角剖分
  const delaunay = Delaunator.from(allPoints);

  // 8. 获取三角形索引
  const triangles = delaunay.triangles;

  // 9. 转换为ECEF坐标并构建几何体
  const vertices: number[] = [];
  const indices: number[] = [];

  // 将所有点转换为ECEF坐标
  // 使用独立的height参数，如果没有则尝试从第一个点获取，最后默认为0
  const height = props.height ?? 0;
  allPoints.forEach(([lon, lat]) => {
    const ecefPos = lonlatToECEF(lon, lat, height);
    vertices.push(ecefPos.x, ecefPos.y, ecefPos.z);
  });

  // 构建三角形索引
  for (let i = 0; i < triangles.length; i += 3) {
    indices.push(triangles[i], triangles[i + 1], triangles[i + 2]);
  }

  // 10. 构建UV坐标（基于经纬度bbox，左上(0,1)到右下(1,0)）
  const uvs: number[] = [];
  allPoints.forEach(([lon, lat]) => {
    // 计算归一化的UV坐标
    const u = (lon - minLon) / gridWidth; // 经度：左(0)到右(1)
    const v = 1 - (lat - minLat) / gridHeight; // 纬度：上(1)到下(0)
    uvs.push(u, v);
  });

  // 11. 创建BufferGeometry
  const geometry = new BufferGeometry();
  geometry.setAttribute("position", new Float32BufferAttribute(vertices, 3));
  geometry.setAttribute("uv", new Float32BufferAttribute(uvs, 2));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();

  return geometry;
};

// 更新材质贴图的函数
const updateMaterialTexture = () => {
  if (mesh.value) {
    if (textureRef.value) {
      mesh.value.material.map = textureRef.value;
    } else {
      mesh.value.material.map = null;
    }
    mesh.value.material.needsUpdate = true;
  }
};

const createPolygon = () => {
  if (props.points.length < 3) {
    console.warn("多边形至少需要3个点");
    return;
  }

  // 创建组
  group.value = new Group();

  // 转换所有点到Three.js坐标
  positions.value = convertGeoPointsToVector3(props.points);
  centerPoint.value = calculateCenterPoint(positions.value);

  // 创建三角剖分几何体
  const geometry = createTriangulatedGeometry(props.points);

  // 调整几何体位置为相对坐标
  const positionAttribute = geometry.getAttribute("position");
  const positionArray = positionAttribute.array as Float32Array;

  for (let i = 0; i < positionArray.length; i += 3) {
    positionArray[i] -= centerPoint.value.x;
    positionArray[i + 1] -= centerPoint.value.y;
    positionArray[i + 2] -= centerPoint.value.z;
  }
  positionAttribute.needsUpdate = true;

  // 创建材质
  const materialOptions: any = {
    color: new Color(props.color),
    transparent: props.opacity < 1,
    opacity: props.opacity,
    side: DoubleSide,
    wireframe: props.wireframe,
  };

  // 如果有贴图ID，通过资源管理器获取纹理
  if (props.textureId && textureRef.value) {
    materialOptions.map = textureRef.value;
  }

  const material = new MeshBasicMaterial(materialOptions);

  // 创建网格
  mesh.value = new Mesh(geometry, material);
  group.value.add(mesh.value);
  group.value.position.copy(centerPoint.value);
};

const updateGeometry = () => {
  if (mesh.value && props.points.length >= 3) {
    // 重新创建几何体
    const oldGeometry = mesh.value.geometry;
    const newGeometry = createTriangulatedGeometry(props.points);

    // 更新位置
    positions.value = convertGeoPointsToVector3(props.points);
    centerPoint.value = calculateCenterPoint(positions.value);

    // 调整几何体位置为相对坐标
    const positionAttribute = newGeometry.getAttribute("position");
    const positionArray = positionAttribute.array as Float32Array;

    for (let i = 0; i < positionArray.length; i += 3) {
      positionArray[i] -= centerPoint.value.x;
      positionArray[i + 1] -= centerPoint.value.y;
      positionArray[i + 2] -= centerPoint.value.z;
    }
    positionAttribute.needsUpdate = true;

    mesh.value.geometry = newGeometry;
    group.value!.position.copy(centerPoint.value);

    // 清理旧几何体
    oldGeometry.dispose();
  }
};

// 监听属性变化
watch(
  () => props.points,
  () => {
    updateGeometry();
  },
  { deep: true }
);

watch(
  () => props.color,
  (newColor) => {
    if (mesh.value) {
      mesh.value.material.color.set(newColor);
      mesh.value.material.needsUpdate = true;
    }
  }
);

watch(
  () => props.opacity,
  (newOpacity) => {
    if (mesh.value) {
      mesh.value.material.opacity = newOpacity;
      mesh.value.material.transparent = newOpacity < 1;
      mesh.value.material.needsUpdate = true;
    }
  }
);

watch(
  () => props.wireframe,
  (newWireframe) => {
    if (mesh.value) {
      mesh.value.material.wireframe = newWireframe;
      mesh.value.material.needsUpdate = true;
    }
  }
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

// 监听贴图ID变化
watch(
  () => props.textureId,
  (newTextureId) => {
    if (newTextureId) {
      // 获取贴图的 shallowRef
      textureRef = getResourceById(newTextureId);
    } else {
      textureRef = shallowRef<Texture | null>(null);
    }
  },
  { immediate: true }
);

// 监听贴图资源的变化
watch(
  () => textureRef.value,
  () => {
    updateMaterialTexture();
  }
);

onMounted(() => {
  createPolygon();
});

onUnmounted(() => {
  if (mesh.value) {
    mesh.value.geometry?.dispose?.();
    mesh.value.material?.dispose?.();
  }
  if (group.value) {
    group.value?.clear?.();
  }
});
</script>

<template>
  <primitive :object="group" v-if="group"></primitive>
</template>
