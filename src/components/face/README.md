# GeoPolygon 组件

一个由地理坐标点组成的多边形组件，支持对内部区域进行三角剖分生成均匀的三角面。

## 功能特性

- 🌍 支持地理坐标系（经纬度）输入
- 🔺 自动三角剖分生成均匀三角面
- 🎨 支持颜色、透明度、线框模式配置
- ⚡ 响应式更新，支持动态修改点位
- 🎯 可调节细分程度控制三角面密度

## 基本用法

```vue
<template>
  <GeoScene>
    <GeoPolygon 
      :points="polygonPoints"
      color="#ff6b6b"
      :opacity="0.8"
      :subdivisions="3"
    />
  </GeoScene>
</template>

<script setup>
import { GeoPolygon, GeoScene } from '@/plugins/geoKit'

const polygonPoints = [
  { longitude: 116.4074, latitude: 39.9042, height: 0 }, // 北京
  { longitude: 121.4737, latitude: 31.2304, height: 0 }, // 上海  
  { longitude: 113.2644, latitude: 23.1292, height: 0 }, // 广州
  { longitude: 114.0579, latitude: 22.5431, height: 0 }, // 深圳
]
</script>
```

## 属性配置

| 属性名 | 类型 | 默认值 | 说明 |
|--------|------|--------|------|
| `points` | `Array<{longitude: number, latitude: number, height?: number}>` | `[]` | 多边形顶点数组，至少需要3个点 |
| `color` | `string` | `'#ffffff'` | 多边形颜色，支持十六进制、RGB等格式 |
| `opacity` | `number` | `1` | 透明度，取值范围0-1 |
| `wireframe` | `boolean` | `false` | 是否显示为线框模式 |
| `subdivisions` | `number` | `2` | 细分程度，数值越大三角面越密集 |

## 使用示例

### 基础多边形
```vue
<GeoPolygon 
  :points="basicPoints"
  color="#3498db"
/>
```

### 半透明多边形
```vue
<GeoPolygon 
  :points="polygonPoints"
  color="#e74c3c"
  :opacity="0.6"
/>
```

### 线框模式
```vue
<GeoPolygon 
  :points="polygonPoints"
  color="#2ecc71"
  :wireframe="true"
/>
```

### 高密度三角剖分
```vue
<GeoPolygon 
  :points="polygonPoints"
  color="#9b59b6"
  :subdivisions="5"
/>
```

## 技术实现

- 使用 **Turf.js** 进行地理计算和Delaunay三角剖分
- 基于 **Three.js** 的 `BufferGeometry` 和 `Mesh` 创建3D几何体
- 支持 **ECEF坐标系** 转换，确保地理精度
- 自动计算中心点并使用相对坐标优化性能

## 注意事项

1. 至少需要3个点才能形成有效多边形
2. 点的顺序会影响多边形的形状，建议按顺时针或逆时针顺序排列
3. `subdivisions` 参数过大可能影响性能，建议根据实际需求调整
4. 支持动态更新点位，组件会自动重新计算三角剖分 