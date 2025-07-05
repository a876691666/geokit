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

export interface GeoTilesConfig {
  lruCacheMinSize: number;
  lruCacheMaxSize: number;
  parseQueueMaxJobs: number;
  errorTarget: number;
  displayActiveTiles: boolean;
  autoDisableRendererCulling: boolean;
  controlsConfig: ControlsConfig;
  tilesPlugins: TilesPlugins;
}

export interface GeoPositionConfig {
  heading: number;
  pitch: number;
  distance: number;
  longitude: number;
  latitude: number;
}

export type Point<T = {}> = {
  lon: number;
  lat: number;
  height?: number;
} & T;

export type Line<T = {}> = Point<T>[];
