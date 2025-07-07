<template></template>
<script setup lang="ts">
import { watch, ref } from "vue";
import type {
  Texture,
  Wrapping,
  MagnificationTextureFilter,
  MinificationTextureFilter,
  AnyPixelFormat,
  TextureDataType,
  ColorSpace,
} from "three";

const props = withDefaults(
  defineProps<{
    texture: Texture;
    // 基本变换属性
    center?: [number, number];
    rotation?: number;
    scale?: [number, number];
    repeat?: [number, number];
    offset?: [number, number];

    // 包装模式
    wrapS?: Wrapping;
    wrapT?: Wrapping;

    // 过滤器
    magFilter?: MagnificationTextureFilter;
    minFilter?: MinificationTextureFilter;

    // 纹理格式和类型
    flipY?: boolean;
    format?: AnyPixelFormat;
    type?: TextureDataType;

    // 颜色空间
    colorSpace?: ColorSpace;

    // 生成和更新控制
    generateMipmaps?: boolean;
    premultiplyAlpha?: boolean;
    unpackAlignment?: number;

    // 各向异性过滤
    anisotropy?: number;

    // 编码（用于兼容性）
    encoding?: number;

    // 矩阵变换
    matrixAutoUpdate?: boolean;

    // 用户数据
    userData?: Record<string, any>;

    // 名称
    name?: string;
  }>(),
  {}
);

// 用于跟踪是否需要更新纹理
const needsUpdate = ref(false);

// 辅助函数：比较数组是否相等
function arrayEquals(a: [number, number] | undefined, b: [number, number] | undefined): boolean {
  if (!a && !b) return true;
  if (!a || !b) return false;
  return a[0] === b[0] && a[1] === b[1];
}

// 辅助函数：比较Vector2是否相等
function vector2Equals(vector: { x: number; y: number }, array: [number, number]): boolean {
  return vector.x === array[0] && vector.y === array[1];
}

// 辅助函数：设置纹理属性并标记需要更新
function setTextureProperty<T>(
  currentValue: T,
  newValue: T | undefined,
  setter: (value: T) => void,
  needsTextureUpdate: boolean = true
): void {
  if (newValue !== undefined && currentValue !== newValue) {
    setter(newValue);
    if (needsTextureUpdate) {
      needsUpdate.value = true;
    }
  }
}

// 辅助函数：设置Vector2属性
function setVector2Property(
  currentVector: { x: number; y: number },
  newValue: [number, number] | undefined,
  needsTextureUpdate: boolean = true
): void {
  if (newValue && !vector2Equals(currentVector, newValue)) {
    currentVector.x = newValue[0];
    currentVector.y = newValue[1];
    if (needsTextureUpdate) {
      needsUpdate.value = true;
    }
  }
}

// 监听纹理中心点变化
watch(
  () => props.center,
  (newCenter) => {
    if (props.texture && newCenter) {
      setVector2Property(props.texture.center, newCenter);
    }
  },
  { deep: true }
);

// 监听旋转角度变化
watch(
  () => props.rotation,
  (newRotation) => {
    if (props.texture) {
      setTextureProperty(props.texture.rotation, newRotation, (value) => {
        props.texture.rotation = value;
      });
    }
  }
);

// 监听缩放变化（注意：这里使用repeat属性来实现缩放）
watch(
  () => props.scale,
  (newScale) => {
    if (props.texture && newScale) {
      setVector2Property(props.texture.repeat, newScale);
    }
  },
  { deep: true }
);

// 监听重复变化
watch(
  () => props.repeat,
  (newRepeat) => {
    if (props.texture && newRepeat) {
      setVector2Property(props.texture.repeat, newRepeat);
    }
  },
  { deep: true }
);

// 监听偏移变化
watch(
  () => props.offset,
  (newOffset) => {
    if (props.texture && newOffset) {
      setVector2Property(props.texture.offset, newOffset);
    }
  },
  { deep: true }
);

// 监听包装模式变化
watch(
  () => props.wrapS,
  (newWrapS) => {
    if (props.texture) {
      setTextureProperty(props.texture.wrapS, newWrapS, (value) => {
        props.texture.wrapS = value;
      });
    }
  }
);

watch(
  () => props.wrapT,
  (newWrapT) => {
    if (props.texture) {
      setTextureProperty(props.texture.wrapT, newWrapT, (value) => {
        props.texture.wrapT = value;
      });
    }
  }
);

// 监听过滤器变化
watch(
  () => props.magFilter,
  (newMagFilter) => {
    if (props.texture) {
      setTextureProperty(props.texture.magFilter, newMagFilter, (value) => {
        props.texture.magFilter = value;
      });
    }
  }
);

watch(
  () => props.minFilter,
  (newMinFilter) => {
    if (props.texture) {
      setTextureProperty(props.texture.minFilter, newMinFilter, (value) => {
        props.texture.minFilter = value;
      });
    }
  }
);

// 监听翻转变化
watch(
  () => props.flipY,
  (newFlipY) => {
    if (props.texture) {
      setTextureProperty(props.texture.flipY, newFlipY, (value) => {
        props.texture.flipY = value;
      });
    }
  }
);

// 监听格式变化
watch(
  () => props.format,
  (newFormat) => {
    if (props.texture) {
      setTextureProperty(props.texture.format, newFormat, (value) => {
        props.texture.format = value;
      });
    }
  }
);

// 监听类型变化
watch(
  () => props.type,
  (newType) => {
    if (props.texture) {
      setTextureProperty(props.texture.type, newType, (value) => {
        props.texture.type = value;
      });
    }
  }
);

// 监听颜色空间变化
watch(
  () => props.colorSpace,
  (newColorSpace) => {
    if (props.texture) {
      setTextureProperty(props.texture.colorSpace, newColorSpace, (value) => {
        props.texture.colorSpace = value;
      });
    }
  }
);

// 监听生成mipmap变化
watch(
  () => props.generateMipmaps,
  (newGenerateMipmaps) => {
    if (props.texture) {
      setTextureProperty(props.texture.generateMipmaps, newGenerateMipmaps, (value) => {
        props.texture.generateMipmaps = value;
      });
    }
  }
);

// 监听预乘alpha变化
watch(
  () => props.premultiplyAlpha,
  (newPremultiplyAlpha) => {
    if (props.texture) {
      setTextureProperty(props.texture.premultiplyAlpha, newPremultiplyAlpha, (value) => {
        props.texture.premultiplyAlpha = value;
      });
    }
  }
);

// 监听解包对齐变化
watch(
  () => props.unpackAlignment,
  (newUnpackAlignment) => {
    if (props.texture) {
      setTextureProperty(props.texture.unpackAlignment, newUnpackAlignment, (value) => {
        props.texture.unpackAlignment = value;
      });
    }
  }
);

// 监听各向异性过滤变化
watch(
  () => props.anisotropy,
  (newAnisotropy) => {
    if (props.texture) {
      setTextureProperty(props.texture.anisotropy, newAnisotropy, (value) => {
        props.texture.anisotropy = value;
      });
    }
  }
);

// 监听编码变化（兼容性）
watch(
  () => props.encoding,
  (newEncoding) => {
    if (props.texture) {
      setTextureProperty((props.texture as any).encoding, newEncoding, (value) => {
        (props.texture as any).encoding = value;
      });
    }
  }
);

// 监听矩阵自动更新变化
watch(
  () => props.matrixAutoUpdate,
  (newMatrixAutoUpdate) => {
    if (props.texture) {
      setTextureProperty(props.texture.matrixAutoUpdate, newMatrixAutoUpdate, (value) => {
        props.texture.matrixAutoUpdate = value;
      }, false); // 矩阵自动更新不需要触发纹理更新
    }
  }
);

// 监听用户数据变化
watch(
  () => props.userData,
  (newUserData) => {
    if (props.texture) {
      setTextureProperty(props.texture.userData, newUserData, (value) => {
        props.texture.userData = value;
      }, false); // 用户数据变化不需要触发纹理更新
    }
  },
  { deep: true }
);

// 监听名称变化
watch(
  () => props.name,
  (newName) => {
    if (props.texture) {
      setTextureProperty(props.texture.name, newName, (value) => {
        props.texture.name = value;
      }, false); // 名称变化不需要触发纹理更新
    }
  }
);

// 监听needsUpdate变化，自动设置纹理的needsUpdate标志
watch(
  needsUpdate,
  (shouldUpdate) => {
    if (shouldUpdate && props.texture) {
      props.texture.needsUpdate = true;
      needsUpdate.value = false; // 重置标志
    }
  }
);
</script>
