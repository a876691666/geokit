<template>
  <slot :textures="clonedTextures" />
</template>

<script setup lang="ts">
import { computed } from "vue";
import type { Texture } from "three";

interface TextureMap {
  map?: Texture;
  displacementMap?: Texture;
  normalMap?: Texture;
  roughnessMap?: Texture;
  metalnessMap?: Texture;
  aoMap?: Texture;
  alphaMap?: Texture;
  matcap?: Texture;
}

const props = withDefaults(defineProps<TextureMap>(), {});

// 克隆贴图的函数
const cloneTexture = (texture?: Texture): Texture | undefined => {
  if (!texture) return undefined;
  return texture.clone();
};

// 计算属性，返回克隆后的贴图对象
const clonedTextures = computed(() => {
  const cloned: Required<TextureMap> = {
    map: cloneTexture(props.map)!,
    displacementMap: cloneTexture(props.displacementMap)!,
    normalMap: cloneTexture(props.normalMap)!,
    roughnessMap: cloneTexture(props.roughnessMap)!,
    metalnessMap: cloneTexture(props.metalnessMap)!,
    aoMap: cloneTexture(props.aoMap)!,
    alphaMap: cloneTexture(props.alphaMap)!,
    matcap: cloneTexture(props.matcap)!,
  };

  return cloned;
});

// 组件销毁时清理克隆的贴图
const cleanup = () => {
  Object.values(clonedTextures.value).forEach((texture) => {
    if (texture) {
      texture.dispose();
    }
  });
};

// 在组件卸载时清理资源
import { onUnmounted } from "vue";
onUnmounted(() => {
  cleanup();
});
</script>
