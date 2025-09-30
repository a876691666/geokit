<template>
  <slot :texture="clonedTexture" />
</template>

<script setup lang="ts">
import { onUnmounted, watch, shallowRef } from "vue";

import type { Texture } from "three";

interface TextureMap {
  texture?: any | Texture;
}

const props = withDefaults(defineProps<TextureMap>(), {});

// 克隆贴图的函数
const cloneTexture = (texture?: Texture): Texture | undefined => {
  if (!texture) return undefined;
  return texture.clone();
};

// 计算属性，返回克隆后的贴图对象
const clonedTexture = shallowRef<Texture | undefined>();

watch(
  () => props.texture,
  (newTexture) => {
    // 清理旧的贴图
    if (clonedTexture.value) {
      clonedTexture.value.dispose();
    }
    // 克隆新的贴图
    clonedTexture.value = cloneTexture(newTexture);
  },
  { immediate: true }
);

// 组件销毁时清理克隆的贴图
const cleanup = () => {
  if (clonedTexture.value) {
    clonedTexture.value.dispose();
  }
};

// 在组件卸载时清理资源
onUnmounted(() => {
  cleanup();
});
</script>
