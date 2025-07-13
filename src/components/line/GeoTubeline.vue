<script setup lang="ts">
import { onMounted, onUnmounted, shallowRef, ref, watch } from "vue";
import {
  TubeGeometry,
  MeshBasicMaterial,
  Mesh,
  Group,
  Vector3,
  LineCurve3,
  CurvePath,
  Texture,
} from "three";
import { useRenderLoop } from "@tresjs/core";
import {
  calculateCenterPoint,
  calculateRelativePositions,
  convertGeoPointsToVector3,
  loadTexture,
  AnimationState,
  startAnimation,
  stopAnimation,
  updateTextureAnimation,
} from "./utils";
import { Point } from "@/config/type";

interface GeoTubelineProps {
  points: Point[];
  color?: string;
  width?: number;
  tubularSegments?: number;
  texture?: string;
  duration?: number;
  renderOrder?: number;
}

const props = withDefaults(defineProps<GeoTubelineProps>(), {
  renderOrder: 1,
});
const group = shallowRef<Group>();
const tube = shallowRef<Mesh<TubeGeometry, MeshBasicMaterial>>();
const positions = ref<Vector3[]>([]);
const centerPoint = ref<Vector3>(new Vector3());
const textureRef = shallowRef<Texture>();
const animationState = ref<AnimationState>({ startTime: 0, isAnimating: false });

const { onLoop } = useRenderLoop();

// 将宽度转换为半径 (宽度的一半作为半径)
const getRadius = () => {
  return (props.width || 2) * 0.3; // 宽度转换为合适的半径值
};

onLoop(({ elapsed }) => {
  if (!animationState.value.isAnimating || !textureRef.value || !props.duration) return;

  updateTextureAnimation(textureRef.value, elapsed, props.duration, animationState.value);
});

const createTube = async () => {
  group.value = new Group();

  positions.value = convertGeoPointsToVector3(props.points);

  centerPoint.value = calculateCenterPoint(positions.value);
  const relativePositions = calculateRelativePositions(positions.value, centerPoint.value);

  const path = new CurvePath<Vector3>();
  for (let i = 0; i < relativePositions.length - 1; i++) {
    const line = new LineCurve3(relativePositions[i], relativePositions[i + 1]);
    path.add(line);
  }

  const geometry = new TubeGeometry(path, props.tubularSegments || 64, getRadius(), 8, false);

  const materialOptions: any = {
    color: props.color || "#ffffff",
    transparent: true,
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

  const material = new MeshBasicMaterial(materialOptions);

  tube.value = new Mesh(geometry, material);
  tube.value.renderOrder = props.renderOrder;
  group.value.add(tube.value);
  group.value.position.copy(centerPoint.value);

  // 开始UV动画
  if (textureRef.value && props.duration) {
    startAnimation(animationState.value);
  }
};

const updateGeometryPositions = async () => {
  if (tube.value) {
    const oldGeometry = tube.value.geometry;
    oldGeometry.dispose();

    positions.value = convertGeoPointsToVector3(props.points);

    centerPoint.value = calculateCenterPoint(positions.value);
    const relativePositions = calculateRelativePositions(positions.value, centerPoint.value);

    const path = new CurvePath<Vector3>();
    for (let i = 0; i < relativePositions.length - 1; i++) {
      const line = new LineCurve3(relativePositions[i], relativePositions[i + 1]);
      path.add(line);
    }

    const geometry = new TubeGeometry(path, props.tubularSegments || 64, getRadius(), 8, false);

    tube.value.geometry = geometry;
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
    if (tube.value) {
      tube.value.material.color.set(newColor || "#ffffff");
      tube.value.material.needsUpdate = true;
    }
  }
);

watch(
  () => [props.width, props.tubularSegments],
  () => {
    updateGeometryPositions();
  }
);

watch(
  () => props.texture,
  async (newTexture) => {
    if (tube.value) {
      if (newTexture) {
        try {
          if (textureRef.value) {
            textureRef.value.dispose();
          }
          textureRef.value = await loadTexture(newTexture);
          textureRef.value.wrapS = textureRef.value.wrapT = 1000; // RepeatWrapping
          tube.value.material.map = textureRef.value;
          tube.value.material.needsUpdate = true;

          // 重新开始动画
          if (props.duration) {
            startAnimation(animationState.value);
          }
        } catch (error) {
          console.warn("Failed to load texture:", error);
        }
      } else {
        if (textureRef.value) {
          textureRef.value.dispose();
          textureRef.value = undefined;
        }
        tube.value.material.map = null;
        tube.value.material.needsUpdate = true;
        stopAnimation(animationState.value);
      }
    }
  }
);

watch(
  () => props.duration,
  (newDuration) => {
    if (newDuration && textureRef.value) {
      startAnimation(animationState.value);
    } else {
      stopAnimation(animationState.value);
    }
  }
);

onMounted(() => {
  createTube();
});

onUnmounted(() => {
  stopAnimation(animationState.value);
  if (textureRef.value) {
    textureRef.value.dispose();
  }
  if (tube.value) {
    tube.value.geometry.dispose();
    tube.value.material.dispose();
  }
  if (group.value) {
    group.value.clear();
  }
});
</script>

<template>
  <primitive :object="group" v-if="group"></primitive>
</template>
