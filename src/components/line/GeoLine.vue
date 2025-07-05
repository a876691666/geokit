<script setup lang="ts">
import { onMounted, onUnmounted, shallowRef, ref, watch } from "vue";
import {
  Line,
  BufferGeometry,
  Float32BufferAttribute,
  LineBasicMaterial,
  Group,
  Vector3,
  Texture,
} from "three";
import {
  calculateCenterPoint,
  calculateRelativePositions,
  convertGeoPointsToVector3,
  loadTexture,
} from "./utils";
import { Point } from "@/config/type";

interface GeoLineProps {
  points: Point[];
  color?: string;
  width?: number;
  texture?: string;
}

const props = defineProps<GeoLineProps>();
const group = shallowRef<Group>();
const line = shallowRef<Line<BufferGeometry, LineBasicMaterial>>();
const positions = ref<Vector3[]>([]);
const centerPoint = ref<Vector3>(new Vector3());
const textureRef = shallowRef<Texture>();

const createLine = async () => {
  // 创建组
  group.value = new Group();

  // 转换所有点到Three.js坐标
  positions.value = convertGeoPointsToVector3(props.points);

  centerPoint.value = calculateCenterPoint(positions.value);
  const relativePositions = calculateRelativePositions(positions.value, centerPoint.value);

  const geometry = new BufferGeometry();
  const positionsArray = relativePositions.flatMap((pos) => [pos.x, pos.y, pos.z]);
  geometry.setAttribute("position", new Float32BufferAttribute(positionsArray, 3));

  const materialOptions: any = {
    color: props.color || "#ffffff",
    linewidth: props.width || 1,
  };

  // 加载纹理
  if (props.texture) {
    try {
      textureRef.value = await loadTexture(props.texture);
      textureRef.value.wrapS = textureRef.value.wrapT = 1000; // RepeatWrapping
      materialOptions.map = textureRef.value;
    } catch (error) {
      console.warn("Failed to load texture:", error);
    }
  }

  const material = new LineBasicMaterial(materialOptions);

  line.value = new Line(geometry, material);
  group.value.add(line.value);
  group.value.position.copy(centerPoint.value);
};

const updateGeometryPositions = () => {
  if (line.value) {
    const geometry = line.value.geometry;
    const positionAttribute = geometry.getAttribute("position");

    positions.value = convertGeoPointsToVector3(props.points);

    centerPoint.value = calculateCenterPoint(positions.value);
    const relativePositions = calculateRelativePositions(positions.value, centerPoint.value);

    relativePositions.forEach((pos, index) => {
      positionAttribute.setXYZ(index, pos.x, pos.y, pos.z);
    });

    positionAttribute.needsUpdate = true;
    group.value!.position.copy(centerPoint.value);
  }
};

watch(
  () => props.points,
  () => {
    updateGeometryPositions();
  },
  { immediate: true }
);

watch(
  () => props.color,
  (newColor) => {
    if (line.value) {
      line.value.material.color.set(newColor || "#ffffff");
      line.value.material.needsUpdate = true;
    }
  }
);

watch(
  () => props.width,
  (newWidth) => {
    if (line.value) {
      line.value.material.linewidth = newWidth || 1;
      line.value.material.needsUpdate = true;
    }
  }
);

watch(
  () => props.texture,
  async (newTexture) => {
    if (line.value) {
      if (newTexture) {
        try {
          if (textureRef.value) {
            textureRef.value.dispose();
          }
          textureRef.value = await loadTexture(newTexture);
          textureRef.value.wrapS = textureRef.value.wrapT = 1000; // RepeatWrapping
          line.value.material.map = textureRef.value;
          line.value.material.needsUpdate = true;
        } catch (error) {
          console.warn("Failed to load texture:", error);
        }
      } else {
        if (textureRef.value) {
          textureRef.value.dispose();
          textureRef.value = undefined;
        }
        line.value.material.map = null;
        line.value.material.needsUpdate = true;
      }
    }
  }
);

onMounted(() => {
  createLine();
});

onUnmounted(() => {
  if (textureRef.value) {
    textureRef.value.dispose();
  }
  if (line.value) {
    line.value.geometry.dispose();
    line.value.material.dispose();
  }
  if (group.value) {
    group.value.clear();
  }
});
</script>

<template>
  <primitive :object="group" v-if="group"></primitive>
</template>
