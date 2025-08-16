import { Camera, Vector3, Ray, MathUtils } from "three";
import { Ellipsoid } from "./Ellipsoid";
import { Geodetic } from "./Geodetic";
import { PointOfView } from "./PointOfView";

const radians = MathUtils.degToRad;
const degrees = MathUtils.radToDeg;

/**
 * 移动相机到指定位置
 * @param camera - 相机
 * @param distance - 距离
 * @param heading - 航向
 * @param pitch - 俯仰
 * @param longitude - 经度
 * @param latitude - 纬度
 */
export const moveTo = (
  camera: Camera,
  distance: number,
  heading: number,
  pitch: number,
  longitude: number,
  latitude: number
) => {
  new PointOfView(distance, radians(heading), radians(pitch)).decompose(
    new Geodetic(radians(longitude), radians(latitude)).toECEF(),
    camera.position,
    camera.quaternion,
    camera.up
  );

  camera.updateMatrixWorld();
};

/**
 * 将经纬度转换为ECEF坐标
 * @param longitude - 经度
 * @param latitude - 纬度
 * @param height - 高度
 * @returns ECEF坐标
 */
export const lonlatToECEF = (longitude: number, latitude: number, height?: number) => {
  return new Geodetic(radians(longitude), radians(latitude), height).toECEF();
};

const _pov = new PointOfView();
const _geodetic = new Geodetic();

const vectorScratch1 = new Vector3();
const vectorScratch2 = new Vector3();
const rayScratch = new Ray();
const ellipsoid = Ellipsoid.WGS84;
/**
 * 获取相机位置的经纬度
 * @param camera - 相机
 * @returns 经纬度对象 { lon: number, lat: number, heading: number, distance: number, pitch: number }
 */
export const getCameraLonLat = (camera: Camera) => {
  _pov.setFromCamera(camera);

  const eye = vectorScratch1.setFromMatrixPosition(camera.matrixWorld);
  const direction = vectorScratch2.set(0, 0, 0.5).unproject(camera).sub(eye).normalize();
  const target = ellipsoid.getIntersection(rayScratch.set(eye, direction))!;

  if (!target) return null;

  // 使用 Geodetic 将 ECEF 坐标转换为地理坐标
  _geodetic.setFromECEF(target);

  return {
    distance: _pov.distance,
    heading: degrees(_pov.heading),
    pitch: degrees(_pov.pitch),
    longitude: degrees(_geodetic.longitude),
    latitude: degrees(_geodetic.latitude),
  };
};
