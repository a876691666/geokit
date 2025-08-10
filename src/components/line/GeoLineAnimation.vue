<script setup lang="ts">
import { ref, watch, onMounted, onUnmounted, provide } from "vue";
import { useRenderLoop } from "@tresjs/core";
import { Texture } from "three";
import {
  AnimationState,
  startAnimation,
  stopAnimation,
  updateMeshLineAnimation,
  updateTextureAnimation,
} from "./utils";

interface GeoLineAnimationProps {
  texture?: Texture;
  autoStart?: boolean;
  duration?: number;
  reverse?: boolean; // 是否启用逆向动画
}

const props = withDefaults(defineProps<GeoLineAnimationProps>(), {
  autoStart: true,
  duration: 1000,
  reverse: false,
});

const animationState = ref<AnimationState>({ startTime: 0, isAnimating: false });
const animationTargets = ref<
  Array<{ target: any; type: "meshline" | "texture"; texture?: any }>
>([]);

const { onLoop } = useRenderLoop();

// 提供给子组件注册动画目标的方法
provide(
  "registerAnimationTarget",
  (target: any, type: "meshline" | "texture", texture?: Texture) => {
    // 检查是否已经注册过同一个目标
    const existingIndex = animationTargets.value.findIndex((item) => item.target === target);

    if (existingIndex >= 0) {
      // 更新已存在的目标
      animationTargets.value[existingIndex] = { target, type, texture };
    } else {
      // 添加新的目标
      animationTargets.value.push({ target, type, texture });
    }
  }
);

// 提供注销动画目标的方法
provide("unregisterAnimationTarget", (target: any) => {
  const index = animationTargets.value.findIndex((item) => item.target === target);
  if (index >= 0) {
    animationTargets.value.splice(index, 1);
  }
});

// 动画循环
onLoop(({ elapsed }) => {
  // 如果没有启用自动启动或没有设置持续时间，则不执行动画
  if (!props.autoStart || !props.duration || !animationState.value.isAnimating) return;

  if (animationTargets.value.length === 0) return;

  // 遍历所有注册的动画目标
  animationTargets.value.forEach(({ target, type, texture }) => {
    if (!target) return;

    if (type === "meshline") {
      // MeshLine 动画（修改材质的 uniform）
      updateMeshLineAnimation(
        target.material,
        elapsed * 1000,
        props.duration,
        animationState.value,
        props.reverse
      );
    } else if (type === "texture") {
      // 纹理动画（修改纹理的 offset）
      // 优先使用注册时提供的texture，否则使用props中的texture
      const targetTexture = texture || props.texture;
      if (targetTexture) {
        updateTextureAnimation(targetTexture, elapsed * 1000, props.duration, animationState.value, props.reverse);
      }
    }
  });
});

// 启动动画
const start = () => {
  if (props.duration) {
    startAnimation(animationState.value);
  }
};

// 停止动画
const stop = () => {
  stopAnimation(animationState.value);
};

// 监听 duration 变化
watch(
  () => props.duration,
  (newDuration) => {
    if (newDuration && props.autoStart && animationTargets.value.length > 0) {
      start();
    } else {
      stop();
    }
  }
);

// 监听 texture 变化
watch(
  () => props.texture,
  (newTexture) => {
    if (newTexture && props.duration && props.autoStart && animationTargets.value.length > 0) {
      start();
    } else {
      stop();
    }
  }
);

// 监听 reverse 变化
watch(
  () => props.reverse,
  () => {
    if (props.autoStart && props.duration && animationTargets.value.length > 0) {
      // 重新启动动画以应用新的方向
      stop();
      setTimeout(() => {
        start();
      }, 10);
    }
  }
);

// 自动启动
onMounted(() => {
  if (props.autoStart && props.duration) {
    // 延迟启动，等待子组件注册
    setTimeout(() => {
      if (animationTargets.value.length > 0) {
        start();
      }
    }, 100);
  }
});

// 清理
onUnmounted(() => {
  stop();
});

// 暴露方法给父组件
defineExpose({
  start,
  stop,
  isAnimating: () => animationState.value.isAnimating,
  getAnimationTargets: () => animationTargets.value,
  getTargetCount: () => animationTargets.value.length,
});
</script>

<template>
  <slot />
</template>
