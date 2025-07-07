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

// 辅助函数：比较Vector2是否相等
function vector2Equals(vector: { x: number; y: number }, array: [number, number]): boolean {
  return vector.x === array[0] && vector.y === array[1];
}

// 辅助函数：设置纹理属性
function setTextureProperty<T>(
  currentValue: T,
  newValue: T | undefined,
  setter: (value: T) => void
): void {
  if (newValue !== undefined && currentValue !== newValue) {
    setter(newValue);
  }
}

// 辅助函数：设置Vector2属性
function setVector2Property(
  currentVector: { x: number; y: number },
  newValue: [number, number] | undefined
): void {
  if (newValue && !vector2Equals(currentVector, newValue)) {
    currentVector.x = newValue[0];
    currentVector.y = newValue[1];
  }
}

// 初始化函数：应用所有属性
function initializeTexture() {
  if (!props.texture) return;

  // 应用基本变换属性
  if (props.center) {
    props.texture.center.x = props.center[0];
    props.texture.center.y = props.center[1];
  }

  if (props.rotation !== undefined) {
    props.texture.rotation = props.rotation;
  }

  if (props.scale) {
    props.texture.repeat.x = props.scale[0];
    props.texture.repeat.y = props.scale[1];
  }

  if (props.repeat) {
    props.texture.repeat.x = props.repeat[0];
    props.texture.repeat.y = props.repeat[1];
  }

  if (props.offset) {
    props.texture.offset.x = props.offset[0];
    props.texture.offset.y = props.offset[1];
  }

  // 应用包装模式
  if (props.wrapS !== undefined) {
    props.texture.wrapS = props.wrapS;
  }

  if (props.wrapT !== undefined) {
    props.texture.wrapT = props.wrapT;
  }

  // 应用过滤器
  if (props.magFilter !== undefined) {
    props.texture.magFilter = props.magFilter;
  }

  if (props.minFilter !== undefined) {
    props.texture.minFilter = props.minFilter;
  }

  // 应用纹理格式和类型
  if (props.flipY !== undefined) {
    props.texture.flipY = props.flipY;
  }

  if (props.format !== undefined) {
    props.texture.format = props.format;
  }

  if (props.type !== undefined) {
    props.texture.type = props.type;
  }

  // 应用颜色空间
  if (props.colorSpace !== undefined) {
    props.texture.colorSpace = props.colorSpace;
  }

  // 应用生成和更新控制
  if (props.generateMipmaps !== undefined) {
    props.texture.generateMipmaps = props.generateMipmaps;
  }

  if (props.premultiplyAlpha !== undefined) {
    props.texture.premultiplyAlpha = props.premultiplyAlpha;
  }

  if (props.unpackAlignment !== undefined) {
    props.texture.unpackAlignment = props.unpackAlignment;
  }

  // 应用各向异性过滤
  if (props.anisotropy !== undefined) {
    props.texture.anisotropy = props.anisotropy;
  }

  // 应用编码（兼容性）
  if (props.encoding !== undefined) {
    (props.texture as any).encoding = props.encoding;
  }

  // 应用用户数据
  if (props.userData !== undefined) {
    props.texture.userData = props.userData;
  }

  // 应用名称
  if (props.name !== undefined) {
    props.texture.name = props.name;
  }
}

// 监听texture变化，当texture改变时重新初始化
watch(
  () => props.texture,
  (newTexture) => {
    if (newTexture) {
      initializeTexture();
    }
  },
  { immediate: true } // 立即执行，确保初始化时就触发
);

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
      });
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
      });
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
      });
    }
  }
);
</script>
