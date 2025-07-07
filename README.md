## 组件总览

`@icegl/geokit` 提供了丰富的地理空间 3D 组件，按功能分类如下：

| 分类         | 组件名             | 描述                |
| ------------ | ------------------ | ------------------- |
| **基础容器** | `GeoCanvas`        | 三维地理画布容器    |
|              | `GeoScene`         | 地理场景管理        |
|              | `GeoControls`      | 地理空间相机控制    |
|              | `GeoCSS2DRenderer` | CSS2D 渲染器        |
| **瓦片地图** | `XYZTiles`         | 栅格瓦片地图        |
|              | `TDTTiles`         | 天地图瓦片          |
|              | `Tileset`          | 3D 瓦片模型         |
| **点状要素** | `GeoPoint`         | 地理点标记          |
|              | `GeoIcon`          | 地理图标            |
|              | `GeoText`          | 地理文本标签        |
|              | `GeoParticle`      | 地理粒子效果        |
|              | `GeoCSS2D`         | 地理位置 CSS2D 标签 |
| **线状要素** | `GeoLine`          | 地理线条            |
|              | `GeoTubeline`      | 地理管道线          |
|              | `GeoMeshline`      | 地理网格线          |
|              | `GeoFlyline`       | 地理飞线            |
| **面状要素** | `GeoPolygon`       | 地理多边形          |
|              | `GeoWall`          | 地理围墙            |
| **工具组件** | `GeoPosition`      | 地理位置定位        |
|              | `GeoTexture`       | 地理纹理管理        |

## 安装

### 该库依赖包

- @icegl/geokit

```bash
yarn add @icegl/geokit
# or
pnpm i @icegl/geokit
```

## 组件说明

### 🌍 基础容器组件

#### GeoCanvas

**三维地理画布容器组件**

- **核心功能**：提供基础的 Three.js 地理空间渲染画布
- **主要特性**：
  - 集成 TresCanvas 作为 3D 渲染容器
  - 内置地理坐标系统支持
  - 自动处理相机和场景配置
  - 支持自定义画布参数（抗锯齿、透明度、像素比等）
  - 提供 CSS2D 渲染器支持

#### GeoScene

**地理场景管理组件**

- **核心功能**：管理地理空间 3D 场景的基础设置
- **主要特性**：
  - 场景环境配置
  - 光照和阴影管理
  - 地理坐标系统初始化

#### GeoControls

**地理空间相机控制组件**

- **核心功能**：管理 3D 地理场景中的相机位置和视角控制
- **主要特性**：
  - 响应式地理位置绑定（经度、纬度、距离、航向、俯仰角）
  - 实时同步相机位置与地理坐标
  - 支持平滑的视角过渡动画
  - 自动处理地球坐标系与 3D 空间坐标的转换
  - 双向数据绑定，支持程序化控制和用户交互

### 🗺️ 瓦片地图组件

#### XYZTiles

**栅格瓦片地图组件**

- **核心功能**：渲染标准 XYZ 格式的栅格瓦片地图
- **主要特性**：
  - 支持任意 XYZ 瓦片服务（如 OpenStreetMap、Google Maps 等）
  - 智能瓦片缓存管理（LRU 缓存）
  - 自适应分辨率调整
  - 内置淡入淡出动画效果
  - 可配置的性能参数（缓存大小、解析队列、错误容差等）

#### TDTTiles

**天地图瓦片组件**

- **核心功能**：专门用于天地图服务的瓦片渲染组件
- **主要特性**：
  - 支持天地图官方服务
  - 内置天地图服务配置
  - 支持多种地图类型（影像、矢量、地形等）

#### Tileset

**3D 瓦片模型组件**

- **核心功能**：加载和渲染 3D Tiles 格式的三维模型数据
- **主要特性**：
  - 支持标准 3D Tiles 规范
  - 智能 LOD（细节层次）管理
  - 内置瓦片显示/隐藏动画效果
  - 支持大规模 3D 场景渲染
  - 可配置的调试模式

### 📍 点状要素组件

#### GeoPoint

**地理点标记组件**

- **核心功能**：在地理位置渲染点状标记
- **主要特性**：
  - 支持多种点样式（圆形、方形、自定义形状）
  - 可配置颜色、大小、透明度
  - 支持批量渲染优化

#### GeoIcon

**地理图标组件**

- **核心功能**：在地理位置显示图标标记
- **主要特性**：
  - 支持图片图标和字体图标
  - 自动缩放和朝向控制
  - 支持图标动画效果

#### GeoText

**地理文本标签组件**

- **核心功能**：在地理位置渲染 3D 文本
- **主要特性**：
  - 支持多种字体和样式
  - 3D 文本渲染
  - 自动朝向相机功能

#### GeoParticle

**地理粒子效果组件**

- **核心功能**：在地理位置创建粒子效果
- **主要特性**：
  - 支持多种粒子类型
  - 可配置粒子动画
  - 高性能粒子系统

#### GeoCSS2D

**地理位置 CSS2D 标签组件**

- **核心功能**：在地理位置上渲染 HTML/CSS 内容
- **主要特性**：
  - 基于 Three.js CSS2DRenderer 实现
  - 支持任意 HTML 内容和 CSS 样式
  - 自动跟随地理坐标位置
  - 支持动态内容更新（通过 ref.update() 方法）
  - 适用于地理标注、信息面板、UI 覆盖层等场景

### 📏 线状要素组件

#### GeoLine

**地理线条组件**

- **核心功能**：在地理坐标间绘制线条
- **主要特性**：
  - 支持多点连线
  - 可配置线条样式（颜色、宽度、虚线等）
  - 支持曲线和直线模式

#### GeoTubeline

**地理管道线组件**

- **核心功能**：创建具有体积的管道状线条
- **主要特性**：
  - 3D 管道渲染
  - 可配置管道半径和材质
  - 支持复杂路径

#### GeoMeshline

**地理网格线组件**

- **核心功能**：使用网格技术渲染的高质量线条
- **主要特性**：
  - 高质量线条渲染
  - 支持渐变色和纹理
  - 优化的性能表现

#### GeoFlyline

**地理飞线组件**

- **核心功能**：创建带动画效果的飞行线条
- **主要特性**：
  - 流动动画效果
  - 可配置飞行速度和方向
  - 支持多种飞行模式

### 🏢 面状要素组件

#### GeoPolygon

**地理多边形组件**

- **核心功能**：渲染地理多边形区域
- **主要特性**：
  - 支持复杂多边形
  - 可配置填充色
  - ~~支持挖洞和多环多边形~~

#### GeoWall

**地理围墙组件**

- **核心功能**：创建垂直的围墙效果
- **主要特性**：
  - 基于多边形边界创建立体围墙
  - 可配置高度和材质
  - 支持渐变和纹理效果

### 🛠️ 通用工具组件

#### GeoPosition

**地理位置定位组件**

- **核心功能**：将 3D 对象精确定位到地理坐标位置
- **主要特性**：
  - 基于经纬度和高度的精确定位
  - 自动计算地理坐标系的局部坐标变换
  - 支持正确的东北天（ENU）坐标系方向
  - 实时响应位置参数变化
  - 为子对象提供正确的地理空间参考框架

#### GeoTexture

**地理纹理管理组件**

- **核心功能**：管理和优化地理空间纹理资源
- **主要特性**：
  - 纹理资源缓存管理
  - 支持多种纹理格式
  - 自动纹理优化

#### GeoCSS2DRenderer

**CSS2D 渲染器组件**

- **核心功能**：提供 CSS2D 渲染能力
- **主要特性**：
  - 集成 Three.js CSS2DRenderer
  - 支持 HTML 元素在 3D 空间中的渲染
  - 自动处理层级和遮挡关系

### 🔧 组件协作关系

这些组件通常配合使用，形成完整的地理空间 3D 应用：

#### 核心架构

- **GeoCanvas** 作为根容器，提供渲染环境
- **GeoScene** 管理场景基础设置
- **GeoControls** 提供相机交互控制
- **GeoCSS2DRenderer** 提供 HTML 标签渲染支持

#### 地图底图层

- **XYZTiles** 提供通用瓦片底图支撑
- **TDTTiles** 提供天地图服务支撑
- **Tileset** 加载具体的 3D 模型数据

#### 要素渲染层

- **点状要素**：`GeoPoint`、`GeoIcon`、`GeoText`、`GeoParticle`、`GeoCSS2D`
- **线状要素**：`GeoLine`、`GeoTubeline`、`GeoMeshline`、`GeoFlyline`
- **面状要素**：`GeoPolygon`、`GeoWall`

#### 工具组件

- **GeoPosition** 为 3D 对象提供地理定位
- **GeoTexture** 管理纹理资源
- **GeoCSS2DRenderer** 处理 HTML 元素渲染

#### 典型应用架构

```
GeoCanvas (根容器)
├── GeoScene (场景管理)
├── GeoControls (相机控制)
├── XYZTiles/TDTTiles (底图)
├── Tileset (3D 模型)
├── GeoPosition (定位容器)
│   ├── GeoPoint/GeoIcon (点标记)
│   ├── GeoLine/GeoFlyline (线要素)
│   └── GeoPolygon/GeoWall (面要素)
└── GeoCSS2D (HTML 标签)
```

所有组件都基于 `@icegl/geokit` 库构建，确保了地理坐标系统的一致性和高性能的 3D 渲染能力。

## 使用

基本用法如下：

### 基础用法

```vue
<template>
  <GeoCanvas v-model:position="position">
    <GeoControls v-model:position="position" />
    <XYZTiles url="https://tile.openstreetmap.org/{z}/{x}/{y}.png" />
    <Tileset url="/plugins/geokit/TilesetWithDiscreteLOD/tileset.json" />
    <Tileset url="/plugins/geokit/tiles/tileset.json" />

    <!-- 在地理位置放置3D对象 -->
    <GeoPosition :longitude="118.778677" :latitude="32.043848" :height="20">
      <TresMesh>
        <TresBoxGeometry :args="[20, 20, 20]" />
        <TresMeshBasicMaterial color="red" />
      </TresMesh>
    </GeoPosition>

    <!-- 在地理位置添加HTML标签 -->
    <GeoCSS2D :longitude="118.778677" :latitude="32.043848" :height="50" ref="geoCSS2D">
      <div style="background: rgba(0,0,0,0.8); color: white; padding: 8px; border-radius: 4px;">
        地理位置标签
      </div>
    </GeoCSS2D>
  </GeoCanvas>
</template>

<script setup lang="ts">
import {
  GeoCanvas,
  GeoControls,
  XYZTiles,
  Tileset,
  GeoPosition,
  GeoCSS2D,
  GeoPositionConfig,
} from "PLS/geokit";
import { ref } from "vue";

const position = ref<GeoPositionConfig>({
  heading: 90,
  pitch: -51,
  distance: 200,
  longitude: 118.778677,
  latitude: 32.043848,
});

const geoCSS2D = ref<InstanceType<typeof GeoCSS2D>>();

// 受Tres影响，若CSS2D内容需要更新，则调用update
const updateLabel = () => {
  geoCSS2D.value?.update();
};
</script>
```

### 完整功能示例

```vue
<template>
  <GeoCanvas v-model:position="position">
    <!-- 场景和控制 -->
    <GeoScene />
    <GeoControls v-model:position="position" />

    <!-- 底图层 -->
    <XYZTiles url="https://tile.openstreetmap.org/{z}/{x}/{y}.png" />
    <!-- 或使用天地图 -->
    <!-- <TDTTiles type="img" :token="tdtToken" /> -->

    <!-- 3D模型 -->
    <Tileset url="/plugins/geokit/tiles/tileset.json" />

    <!-- 点状要素 -->
    <GeoPoint :longitude="118.778677" :latitude="32.043848" :height="10" color="red" :size="5" />

    <GeoIcon
      :longitude="118.779677"
      :latitude="32.044848"
      :height="15"
      url="/path/to/icon.png"
      :size="32"
    />

    <GeoText
      :longitude="118.780677"
      :latitude="32.045848"
      :height="20"
      text="地理文本标签"
      color="blue"
      :size="16"
    />

    <GeoParticle
      :longitude="118.781677"
      :latitude="32.046848"
      :height="25"
      :count="100"
      color="yellow"
    />

    <!-- 线状要素 -->
    <GeoLine
      :points="[
        [118.778677, 32.043848, 0],
        [118.779677, 32.044848, 0],
        [118.780677, 32.045848, 0],
      ]"
      color="green"
      :width="2"
    />

    <GeoFlyline
      :points="[
        [118.778677, 32.043848, 0],
        [118.785677, 32.050848, 0],
      ]"
      color="cyan"
      :speed="2"
    />

    <!-- 面状要素 -->
    <GeoPolygon
      :points="[
        [118.776677, 32.041848],
        [118.777677, 32.041848],
        [118.777677, 32.042848],
        [118.776677, 32.042848],
      ]"
      color="rgba(255,0,0,0.5)"
      :height="10"
    />

    <GeoWall
      :points="[
        [118.782677, 32.047848],
        [118.783677, 32.047848],
        [118.783677, 32.048848],
        [118.782677, 32.048848],
      ]"
      :height="50"
      color="blue"
    />

    <!-- 地理定位容器 -->
    <GeoPosition :longitude="118.778677" :latitude="32.043848" :height="30">
      <TresMesh>
        <TresBoxGeometry :args="[10, 10, 10]" />
        <TresMeshBasicMaterial color="purple" />
      </TresMesh>
    </GeoPosition>

    <!-- HTML标签 -->
    <GeoCSS2D :longitude="118.778677" :latitude="32.043848" :height="60" ref="geoCSS2D">
      <div class="geo-label">
        <h3>建筑信息</h3>
        <p>高度: 60m</p>
        <p>类型: 商业建筑</p>
      </div>
    </GeoCSS2D>
  </GeoCanvas>
</template>

<script setup lang="ts">
import {
  GeoCanvas,
  GeoScene,
  GeoControls,
  XYZTiles,
  TDTTiles,
  Tileset,
  GeoPoint,
  GeoIcon,
  GeoText,
  GeoParticle,
  GeoLine,
  GeoFlyline,
  GeoPolygon,
  GeoWall,
  GeoPosition,
  GeoCSS2D,
  GeoPositionConfig,
} from "@icegl/geokit";
import { ref } from "vue";

const position = ref<GeoPositionConfig>({
  heading: 90,
  pitch: -51,
  distance: 200,
  longitude: 118.778677,
  latitude: 32.043848,
});

// 天地图密钥（如果使用天地图）
const tdtToken = ref("your-tianditu-token");

const geoCSS2D = ref<InstanceType<typeof GeoCSS2D>>();

// 更新HTML标签
const updateLabel = () => {
  geoCSS2D.value?.update();
};
</script>

<style scoped>
.geo-label {
  background: rgba(0, 0, 0, 0.8);
  color: white;
  padding: 12px;
  border-radius: 6px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
  font-family: Arial, sans-serif;
}

.geo-label h3 {
  margin: 0 0 8px 0;
  font-size: 16px;
}

.geo-label p {
  margin: 4px 0;
  font-size: 12px;
  opacity: 0.9;
}
</style>
```
