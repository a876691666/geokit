import { Vector3, TextureLoader, Texture } from "three";
import { lonlatToECEF } from "../../utils/controls";
import { Point } from "@/config/type";

/**
 * 计算位置数组的中心点
 */
export const calculateCenterPoint = (positions: Vector3[]): Vector3 => {
  if (positions.length === 0) return new Vector3();
  const center = new Vector3();
  positions.forEach((pos) => center.add(pos));
  center.divideScalar(positions.length);
  return center;
};

/**
 * 计算相对于中心点的位置数组
 */
export const calculateRelativePositions = (positions: Vector3[], center: Vector3): Vector3[] => {
  return positions.map((pos) => pos.clone().sub(center));
};

/**
 * 将地理坐标转换为Three.js坐标
 */
export const convertGeoPointsToVector3 = (points: Point[]): Vector3[] => {
  return points.map((point) => lonlatToECEF(point.lon, point.lat, point.height || 0));
};

/**
 * 加载纹理
 */
export const loadTexture = async (url: string): Promise<Texture> => {
  const loader = new TextureLoader();
  return new Promise<Texture>((resolve, reject) => {
    loader.load(url, resolve, undefined, reject);
  });
};

/**
 * 动画相关的工具函数
 */
export interface AnimationState {
  startTime: number;
  isAnimating: boolean;
}

export const startAnimation = (state: AnimationState): void => {
  state.startTime = 0;
  state.isAnimating = true;
};

export const stopAnimation = (state: AnimationState): void => {
  state.isAnimating = false;
};

/**
 * 更新纹理动画进度
 */
export const updateTextureAnimation = (
  texture: Texture,
  elapsed: number,
  duration: number,
  state: AnimationState,
  reverse: boolean = false,
  speed: number = 1
): void => {
  if (state.startTime === 0) {
    state.startTime = elapsed;
  }

  const deltaTime = (elapsed - state.startTime) * Math.max(0, speed);
  let progress = (deltaTime % duration) / duration;
  
  // 如果启用逆向动画，反转进度
  if (reverse) {
    progress = 1 - progress;
  }

  texture.offset.x = -progress;
  texture.needsUpdate = true;
};

/**
 * 更新MeshLine材质动画进度
 */
export const updateMeshLineAnimation = (
  material: any,
  elapsed: number,
  duration: number,
  state: AnimationState,
  reverse: boolean = false,
  speed: number = 1
): void => {
  if (state.startTime === 0) {
    state.startTime = elapsed;
  }

  const deltaTime = (elapsed - state.startTime) * Math.max(0, speed);
  let progress = (deltaTime % duration) / duration;
  
  // 如果启用逆向动画，反转进度
  if (reverse) {
    progress = 1 - progress;
  }

  if (material.uniforms && material.uniforms.offset) {
    material.uniforms.offset.value.x = -progress;
  }
};
