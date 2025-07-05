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
import { calculateCenterPoint, convertGeoPointsToVector3 } from "../line/utils";
import { lonlatToECEF } from "../../utils/controls";
import { useResourceId } from "../common/hooks";
import { Point } from "@/config/type";

interface GeoWallProps {
  points: Point[];
  color?: string;
  opacity?: number;
  wireframe?: boolean;
  height?: number; // 墙体高度
  baseHeight?: number; // 底部高度
  textureId?: string; // 贴图资源ID
}

const props = withDefaults(defineProps<GeoWallProps>(), {
  color: "#ffffff",
  opacity: 1,
  wireframe: false,
  height: 100, // 默认墙体高度
  baseHeight: 0, // 默认底部高度
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
 * 创建墙体几何体
 * 通过将多边形边界向上拉伸形成立体墙面
 */
const createWallGeometry = (points: Point[]): BufferGeometry => {
  if (points.length < 3) {
    throw new Error("墙体至少需要3个点");
  }

  const vertices: number[] = [];
  const indices: number[] = [];
  const uvs: number[] = [];

  // 确保多边形是闭合的
  const closedPoints = [...points];
  if (
    closedPoints[0].lon !== closedPoints[closedPoints.length - 1].lon ||
    closedPoints[0].lat !== closedPoints[closedPoints.length - 1].lat
  ) {
    closedPoints.push(closedPoints[0]);
  }

  // 为每个边界点创建底部和顶部顶点
  const bottomVertices: Vector3[] = [];
  const topVertices: Vector3[] = [];

  closedPoints.forEach((point) => {
    // 底部顶点
    const bottomPos = lonlatToECEF(point.lon, point.lat, props.baseHeight);
    bottomVertices.push(new Vector3(bottomPos.x, bottomPos.y, bottomPos.z));

    // 顶部顶点
    const topPos = lonlatToECEF(point.lon, point.lat, props.baseHeight + props.height);
    topVertices.push(new Vector3(topPos.x, topPos.y, topPos.z));
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
    const bottomCurrent = i;
    const bottomNext = i + 1;
    const topCurrent = i + numPoints;
    const topNext = i + 1 + numPoints;

    // 第一个三角形 (底部当前 -> 底部下一个 -> 顶部当前)
    indices.push(bottomCurrent, bottomNext, topCurrent);

    // 第二个三角形 (底部下一个 -> 顶部下一个 -> 顶部当前)
    indices.push(bottomNext, topNext, topCurrent);
  }

  // 创建BufferGeometry
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

const createWall = () => {
  if (props.points.length < 3) {
    console.warn("墙体至少需要3个点");
    return;
  }

  // 创建组
  group.value = new Group();

  // 转换所有点到Three.js坐标
  positions.value = convertGeoPointsToVector3(props.points);
  centerPoint.value = calculateCenterPoint(positions.value);

  // 创建墙体几何体
  const geometry = createWallGeometry(props.points);

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
    const newGeometry = createWallGeometry(props.points);

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
  createWall();
});

onUnmounted(() => {
  if (mesh.value) {
    mesh.value.geometry.dispose();
    mesh.value.material.dispose();
  }
  if (group.value) {
    group.value.clear();
  }
});
</script>

<template>
  <primitive :object="group" v-if="group"></primitive>
</template>
