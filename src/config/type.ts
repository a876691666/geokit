import * as THREE from "three";

// Define interfaces for our configuration types
export interface GeoConfig {
  canvas: GeoCanvasConfig;
  camera: GeoCameraConfig;
  scene: GeoSceneConfig;
  tiles: GeoTilesConfig;
  position: GeoPositionConfig;
}

type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

export type GeoConfigPartial = DeepPartial<GeoConfig>;

export interface GeoCanvasConfig {
  windowSize: boolean;
  alpha: boolean;
  antialias: boolean;
  shadows: boolean;
  autoClear: boolean;
  disableRender: boolean;
  outputColorSpace: THREE.ColorSpace;
  toneMapping: THREE.ToneMapping;
  pixelRatio: number;
}

export interface GeoCameraConfig {
  fov: number;
  aspect: number;
  near: number;
  far: number;
  position: THREE.Vector3 | [number, number, number];
  lookAt: THREE.Vector3 | [number, number, number];
}

export interface EffectProps {
  enabled: boolean;
  focusArea: number;
  feather: number;
}

export interface AmbientLight {
  color: string;
  intensity: number;
}

export interface DirectionalLight {
  color: string;
  intensity: number;
  position: THREE.Vector3 | [number, number, number];
}

export interface GeoSceneConfig {
  effectProps: EffectProps;
  ambientLight: AmbientLight;
  directionalLight: DirectionalLight;
  background: string;
}

export interface ControlsConfig {
  enableDamping: boolean;
  adjustHeight: boolean;
  minDistance: number;
}

export interface FadePlugin {
  maximumFadeOutTiles: number;
}

export interface XyzPlugin {
  center: boolean;
  shape: "ellipsoid" | "planar";
}

export interface TilesPlugins {
  fadePlugin: FadePlugin;
  xyzPlugin: XyzPlugin;
}

export interface GeoSpherical {
  pitch: number;
  heading: number;
  distance: number;
}

export interface GeoMapControlsTarget extends GeoSpherical {
  x?: number;
  y?: number;
}

export interface GeoPositionConfig extends GeoSpherical {
  longitude: number;
  latitude: number;
}

export type Point<T = {}> = {
  lon: number;
  lat: number;
  height?: number;
} & T;

export type Line<T = {}> = Point<T>[];

// GeoJSON类型定义
export interface GeoJSONPolygon {
  type: "Polygon";
  coordinates: number[][][]; // [外环, 内环1, 内环2, ...]
}

export interface GeoJSONMultiPolygon {
  type: "MultiPolygon";
  coordinates: number[][][][]; // [[多边形1], [多边形2], ...]
}

export interface GeoJSONLineString {
  type: "LineString";
  coordinates: number[][]; // [[lon, lat], [lon, lat], ...]
}

export interface GeoJSONMultiLineString {
  type: "MultiLineString";
  coordinates: number[][][]; // [[[lon, lat], [lon, lat]], [[lon, lat], [lon, lat]], ...]
}

export type GeoJSONGeometry =
  | GeoJSONPolygon
  | GeoJSONMultiPolygon
  | GeoJSONLineString
  | GeoJSONMultiLineString;
