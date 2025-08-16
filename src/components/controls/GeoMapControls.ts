import {
  Controls,
  MOUSE,
  Quaternion,
  Spherical,
  TOUCH,
  Vector2,
  Object3D,
  Vector3,
  Matrix4,
  Plane,
  Ray,
  MathUtils,
  Mesh,
  MeshBasicMaterial,
  Camera,
  PerspectiveCamera,
  OrthographicCamera,
  BoxGeometry,
} from "three";
import { Ellipsoid } from "@/utils/Ellipsoid";
import { MapControls } from "three/examples/jsm/controls/MapControls";
import { GlobeControls } from "3d-tiles-renderer";
import { GeoMapControlsTarget } from "@/config/type";
import { lonlatToECEF } from "@/utils/controls";

/**
 * Fires when the camera has been transformed by the controls.
 *
 * @event OrbitControls#change
 * @type {Object}
 */
const _changeEvent = { type: "change" };

/**
 * Fires when an interaction was initiated.
 *
 * @event OrbitControls#start
 * @type {Object}
 */
const _startEvent = { type: "start" };

/**
 * Fires when an interaction has finished.
 *
 * @event OrbitControls#end
 * @type {Object}
 */
const _endEvent = { type: "end" };

const _ray = new Ray();
const _plane = new Plane();
const _v = new Vector3();
const boxMesh = new Mesh(new BoxGeometry(10, 10, 10), new MeshBasicMaterial({ color: 0xff0000 }));
const _TILT_LIMIT = Math.cos(70 * MathUtils.DEG2RAD);
const _twoPI = 2 * Math.PI;
const _STATE = {
  NONE: -1,
  ROTATE: 0,
  DOLLY: 1,
  PAN: 2,
  TOUCH_ROTATE: 3,
  TOUCH_PAN: 4,
  TOUCH_DOLLY_PAN: 5,
  TOUCH_DOLLY_ROTATE: 6,
};
const _EPS = 0.000001;

const ECEF_UP = lonlatToECEF(0, 89.99999, 0).normalize();
console.log(ECEF_UP);
// 计算 ECEF 坐标的 up 向量
export const getECEFUpVector = (ecefPosition: Vector3): Vector3 => {
  const up = new Vector3();
  Ellipsoid.WGS84.getSurfaceNormal(ecefPosition, up);
  return up;
};

export class GeoMapControls extends MapControls {
  // 私有属性类型声明（来自 MapControls 基类）
  protected declare _quat: Quaternion;
  protected declare _quatInverse: Quaternion;
  protected declare _spherical: Spherical;
  protected declare _sphericalDelta: Spherical;
  protected declare _panOffset: Vector3;
  protected declare _scale: number;
  protected declare _performCursorZoom: boolean;
  protected declare _dollyDirection: Vector3;
  protected declare _mouse: Vector2;
  protected declare _lastPosition: Vector3;
  protected declare _lastQuaternion: Quaternion;
  protected declare _lastTargetPosition: Vector3;
  protected declare state: number;
  protected declare _rotateLeft: (angle: number) => void;
  protected declare _getAutoRotationAngle: (deltaTime?: number) => number;
  protected declare _clampDistance: (distance: number) => number;

  // 确保 object 是 Camera 类型
  declare object: Camera;

  // 持久化的平移偏移量，不会被重置
  private _persistentPanOffset = new Vector3(0, 0, 0);

  resetPanOffset() {
    this._persistentPanOffset.set(0, 0, 0);
  }

  constructor(camera: Camera, domElement: HTMLElement, debug = false) {
    super(camera, domElement);

    if (debug) {
      camera.parent?.add(boxMesh);
    }
  }

  targetUp = new Vector3(0, 1, 0);

  _panUp(distance: number, objectMatrix: Matrix4) {
    // 获取相机的右向量（X轴）
    _v.setFromMatrixColumn(objectMatrix, 0);
    // 计算与 targetUp 垂直的平移方向：targetUp × rightVector
    _v.crossVectors(this.targetUp, _v);
    _v.multiplyScalar(distance);
    this._panOffset.add(_v);
  }

  _panLeft(distance: number, objectMatrix: Matrix4) {
    _v.setFromMatrixColumn(objectMatrix, 0); // get X column of objectMatrix
    // 将右向量投影到垂直于 this.targetUp 的平面上
    _v.projectOnPlane(this.targetUp);
    _v.normalize();
    _v.multiplyScalar(-distance);

    this._panOffset.add(_v);
  }

  targetPosition: GeoMapControlsTarget = { heading: 0, pitch: 0, distance: 0, x: 0, y: 0 };

  // 根据 x, y 值计算持久化偏移量
  private _calculatePersistentPanOffset(x: number = 0, y: number = 0): Vector3 {
    const offset = new Vector3();
    const objectMatrix = this.object.matrix;

    // 计算左右偏移（类似 _panLeft）
    if (x !== 0) {
      _v.setFromMatrixColumn(objectMatrix, 0); // 获取相机的右向量（X轴）
      _v.projectOnPlane(this.targetUp); // 将右向量投影到垂直于 targetUp 的平面上
      _v.normalize();
      _v.multiplyScalar(-x); // 负值表示左移
      offset.add(_v);
    }

    // 计算上下偏移（类似 _panUp）
    if (y !== 0) {
      _v.setFromMatrixColumn(objectMatrix, 0); // 获取相机的右向量（X轴）
      _v.crossVectors(this.targetUp, _v); // 计算与 targetUp 垂直的平移方向
      _v.multiplyScalar(y);
      offset.add(_v);
    }

    return offset;
  }

  getTarget() {
    if (this._persistentPanOffset) {
      return this.target.clone().add(this._persistentPanOffset);
    } else {
      return this.target;
    }
  }

  lookAt() {
    this.object.lookAt(this.getTarget());
  }

  invertCameraHPD() {
    const position = this.object.position;
    const target = this.getTarget();

    // 计算相机到目标的距离
    const distance = position.distanceTo(target);

    // 获取目标位置的局部坐标系向量
    const east = new Vector3();
    const north = new Vector3();
    const up = new Vector3();
    Ellipsoid.WGS84.getEastNorthUpVectors(this.target, east, north, up);

    // 计算偏移向量 (target - camera.position，与 setCameraPosition 中的 offset 方向相同)
    const offset = new Vector3().subVectors(target, position).normalize();

    // 计算水平分量在 east-north 平面上的投影
    const horizontalOffset = new Vector3().copy(offset);
    horizontalOffset.projectOnPlane(up).normalize();

    // 计算航向角 (heading)
    // horizontalDir = east * cos(heading) + north * sin(heading)
    // 所以：cos(heading) = horizontalOffset·east, sin(heading) = horizontalOffset·north
    const headingRad = Math.atan2(horizontalOffset.dot(north), horizontalOffset.dot(east));
    const heading = MathUtils.radToDeg(headingRad);

    // 计算俯仰角 (pitch)
    // offset = horizontalDir * cos(pitch) + up * sin(-pitch)
    // 所以：sin(-pitch) = offset·up，即 sin(pitch) = -offset·up
    const pitchRad = Math.asin(-offset.dot(up));
    const pitch = MathUtils.radToDeg(pitchRad);

    // 根据 _persistentPanOffset 反向计算 x, y 值
    let x = 0;
    let y = 0;

    if (this._persistentPanOffset.lengthSq() > 0) {
      const objectMatrix = this.object.matrix;

      // 计算 x（左右偏移）
      _v.setFromMatrixColumn(objectMatrix, 0);
      _v.projectOnPlane(this.targetUp);
      _v.normalize();
      x = -this._persistentPanOffset.dot(_v); // 负值表示左移

      // 计算 y（上下偏移）
      _v.setFromMatrixColumn(objectMatrix, 0);
      _v.crossVectors(this.targetUp, _v);
      _v.normalize();
      y = this._persistentPanOffset.dot(_v);
    }

    return { heading, pitch, distance, x, y };
  }

  setCameraPosition(targetPosition: GeoMapControlsTarget) {
    this.targetPosition = targetPosition;
    const { heading, pitch, distance, x = 0, y = 0 } = targetPosition;

    // 根据 x, y 值计算并更新持久化偏移量
    this._persistentPanOffset.copy(this._calculatePersistentPanOffset(x, y));

    const target = this.getTarget();

    // 获取目标位置的局部坐标系向量
    const east = new Vector3();
    const north = new Vector3();
    const up = new Vector3();
    Ellipsoid.WGS84.getEastNorthUpVectors(this.target, east, north, up);

    // 将角度转换为弧度
    const headingRad = MathUtils.degToRad(heading);
    const pitchRad = MathUtils.degToRad(pitch);

    // 使用 PointOfView 类似的计算方法，直接在局部坐标系中计算偏移
    // h = east * cos(heading) + north * sin(heading) (水平方向)
    const horizontalDir = new Vector3()
      .copy(east)
      .multiplyScalar(Math.cos(headingRad))
      .add(north.clone().multiplyScalar(Math.sin(headingRad)));

    // v = h * cos(pitch) + up * sin(pitch) (考虑俯仰角)
    const offset = new Vector3()
      .copy(horizontalDir)
      .multiplyScalar(Math.cos(pitchRad))
      .add(up.clone().multiplyScalar(Math.sin(-pitchRad)))
      .normalize()
      .multiplyScalar(distance);

    // 相机位置 = 目标位置 - 偏移向量（因为相机看向目标）
    this.object.position.copy(target).sub(offset);

    this._lastPosition.copy(this.object.position);
    this._lastQuaternion.copy(this.object.quaternion);
    this._lastTargetPosition.copy(this.target);
    boxMesh.position.copy(this.getTarget());
  }

  updateUp(targetUp: Vector3) {
    this.targetUp.copy(targetUp);
    this._quat = new Quaternion().setFromUnitVectors(targetUp, new Vector3(0, 1, 0));
    this._quatInverse = this._quat.clone().invert();
    this.object?.up.copy(this.targetUp);
    this.setCameraPosition(this.targetPosition);
  }

  update(deltaTime?: number) {
    if (!this._persistentPanOffset) return false;
    let isChange;
    const position = this.object.position;
    let target = this.getTarget();

    _v.copy(position).sub(target);

    // rotate offset to "y-axis-is-up" space
    _v.applyQuaternion(this._quat);

    // angle from z-axis around y-axis
    this._spherical.setFromVector3(_v);

    if (this.autoRotate && this.state === _STATE.NONE) {
      this._rotateLeft(this._getAutoRotationAngle(deltaTime));
    }

    if (this.enableDamping) {
      this._spherical.theta += this._sphericalDelta.theta * this.dampingFactor;
      this._spherical.phi += this._sphericalDelta.phi * this.dampingFactor;
    } else {
      this._spherical.theta += this._sphericalDelta.theta;
      this._spherical.phi += this._sphericalDelta.phi;
    }

    // restrict theta to be between desired limits

    let min = this.minAzimuthAngle;
    let max = this.maxAzimuthAngle;

    if (isFinite(min) && isFinite(max)) {
      if (min < -Math.PI) min += _twoPI;
      else if (min > Math.PI) min -= _twoPI;

      if (max < -Math.PI) max += _twoPI;
      else if (max > Math.PI) max -= _twoPI;

      if (min <= max) {
        this._spherical.theta = Math.max(min, Math.min(max, this._spherical.theta));
      } else {
        this._spherical.theta =
          this._spherical.theta > (min + max) / 2
            ? Math.max(min, this._spherical.theta)
            : Math.min(max, this._spherical.theta);
      }
    }

    // restrict phi to be between desired limits
    this._spherical.phi = Math.max(
      this.minPolarAngle,
      Math.min(this.maxPolarAngle, this._spherical.phi)
    );

    this._spherical.makeSafe();

    // move target to panned location

    if (this.enableDamping === true) {
      this._persistentPanOffset.addScaledVector(this._panOffset, this.dampingFactor);
    } else {
      this._persistentPanOffset.add(this._panOffset);
    }

    // Limit the target distance from the cursor to create a sphere around the center of interest
    this._persistentPanOffset.sub(this.cursor);
    this._persistentPanOffset.clampLength(this.minTargetRadius, this.maxTargetRadius);
    this._persistentPanOffset.add(this.cursor);

    target.copy(this.getTarget());

    let zoomChanged = false;
    // adjust the camera position based on zoom only if we're not zooming to the cursor or if it's an ortho camera
    // we adjust zoom later in these cases
    if (
      ((this as any).zoomToCursor && this._performCursorZoom) ||
      (this.object as any).isOrthographicCamera
    ) {
      this._spherical.radius = this._clampDistance(this._spherical.radius);
    } else {
      const prevRadius = this._spherical.radius;
      this._spherical.radius = this._clampDistance(this._spherical.radius * this._scale);
      zoomChanged = prevRadius != this._spherical.radius;
    }

    _v.setFromSpherical(this._spherical);

    // rotate offset back to "camera-up-vector-is-up" space
    _v.applyQuaternion(this._quatInverse);

    position.copy(target).add(_v);

    this.object.lookAt(target);
    boxMesh.position.copy(this.getTarget());

    if (this.enableDamping === true) {
      this._sphericalDelta.theta *= 1 - this.dampingFactor;
      this._sphericalDelta.phi *= 1 - this.dampingFactor;

      this._panOffset.multiplyScalar(1 - this.dampingFactor);
    } else {
      this._sphericalDelta.set(0, 0, 0);

      this._panOffset.set(0, 0, 0);
    }

    // adjust camera position
    if (this.zoomToCursor && this._performCursorZoom) {
      let newRadius = null;
      if ((this.object as any).isPerspectiveCamera) {
        // move the camera down the pointer ray
        // this method avoids floating point error
        const prevRadius = _v.length();
        newRadius = this._clampDistance(prevRadius * this._scale);

        const radiusDelta = prevRadius - newRadius;
        this.object.position.addScaledVector(this._dollyDirection, radiusDelta);
        this.object.updateMatrixWorld();

        zoomChanged = !!radiusDelta;
      } else if ((this.object as any).isOrthographicCamera) {
        // adjust the ortho camera position based on zoom changes
        const mouseBefore = new Vector3((this._mouse as any).x, (this._mouse as any).y, 0);
        mouseBefore.unproject(this.object as any);

        const prevZoom = (this.object as any).zoom;
        (this.object as any).zoom = Math.max(
          (this as any).minZoom,
          Math.min((this as any).maxZoom, (this.object as any).zoom / this._scale)
        );
        (this.object as any).updateProjectionMatrix();

        zoomChanged = prevZoom !== (this.object as any).zoom;

        const mouseAfter = new Vector3((this._mouse as any).x, (this._mouse as any).y, 0);
        mouseAfter.unproject(this.object as any);

        this.object.position.sub(mouseAfter).add(mouseBefore);
        this.object.updateMatrixWorld();

        newRadius = _v.length();
      } else {
        console.warn(
          "WARNING: OrbitControls.js encountered an unknown camera type - zoom to cursor disabled."
        );
        (this as any).zoomToCursor = false;
      }

      // handle the placement of the target
      if (newRadius !== null) {
        if ((this as any).screenSpacePanning) {
          // position the orbit target in front of the new camera position
          this.target
            .set(0, 0, -1)
            .transformDirection(this.object.matrix)
            .multiplyScalar(newRadius)
            .add(this.object.position);
        } else {
          // get the ray and translation plane to compute target
          _ray.origin.copy(this.object.position);
          _ray.direction.set(0, 0, -1).transformDirection(this.object.matrix);

          // if the camera is 10 degrees above the horizon then don't adjust the focus target to avoid
          // extremely large values
          if (Math.abs(this.object.up.dot(_ray.direction)) < _TILT_LIMIT) {
            this.object.lookAt(target);
          } else {
            _plane.setFromNormalAndCoplanarPoint(this.object.up, this.target);
            _ray.intersectPlane(_plane, this.target);
          }
        }
      }
    } else if ((this.object as any).isOrthographicCamera) {
      const prevZoom = (this.object as any).zoom;
      (this.object as any).zoom = Math.max(
        (this as any).minZoom,
        Math.min((this as any).maxZoom, (this.object as any).zoom / this._scale)
      );

      if (prevZoom !== (this.object as any).zoom) {
        (this.object as any).updateProjectionMatrix();
        zoomChanged = true;
      }
    }

    this._scale = 1;
    this._performCursorZoom = false;

    // update condition is:
    // min(camera displacement, camera rotation in radians)^2 > EPS
    // using small-angle approximation cos(x/2) = 1 - x^2 / 8

    if (
      zoomChanged ||
      this._lastPosition.distanceToSquared(this.object.position) > _EPS ||
      8 * (1 - this._lastQuaternion.dot(this.object.quaternion)) > _EPS ||
      this._lastTargetPosition.distanceToSquared(this.target) > _EPS
    ) {
      this.dispatchEvent(_changeEvent as any);

      this._lastPosition.copy(this.object.position);
      this._lastQuaternion.copy(this.object.quaternion);
      this._lastTargetPosition.copy(this.target);

      isChange = true;
      this.targetPosition = this.invertCameraHPD();

      this.dispatchEvent({ type: "target-change" } as any);
    }

    isChange = false;

    return isChange;
  }
}

const _vec = new Vector3();
const _pos = new Vector3();
const _invMatrix = new Matrix4();
const _latLon: { lon?: number; lat?: number } = {};
const MIN_ELEVATION = 2550;
const _forward = /* @__PURE__ */ new Vector3();
export class GeoGlobeControls extends GlobeControls {
  isWorldPosition: boolean = false;
  adjustCamera(camera: Camera, target?: Vector3) {
    super.adjustCamera(camera);

    const { ellipsoidFrame, ellipsoidFrameInverse, ellipsoid, nearMargin, farMargin } = this;
    const maxRadius = Math.max(...ellipsoid.radius);
    if ("isPerspectiveCamera" in camera) {
      // 计算准确的相机世界位置
      const cameraWorldPosition = new Vector3();

      if (this.isWorldPosition) {
        camera.getWorldPosition(cameraWorldPosition);
      } else {
        cameraWorldPosition.copy(camera.position);
      }

      // adjust the clip planes
      const distanceToCenter = _vec
        .setFromMatrixPosition(ellipsoidFrame)
        .sub(cameraWorldPosition)
        .length();

      // update the projection matrix
      // interpolate from the 25% radius margin around the globe down to the surface
      // so we can avoid z fighting when near value is too far at a high altitude
      const margin = nearMargin * maxRadius;
      const alpha = MathUtils.clamp((distanceToCenter - maxRadius) / margin, 0, 1);
      const minNear = MathUtils.lerp(1, 1000, alpha);
      if (this.isWorldPosition) {
        if (target) {
          (camera as any).near = camera.position.distanceTo(target) * 0.05;
        }
      } else {
        (camera as any).near = Math.max(minNear, distanceToCenter - maxRadius - margin);
      }

      // update the far plane to the horizon distance
      _pos.copy(cameraWorldPosition).applyMatrix4(ellipsoidFrameInverse);
      (ellipsoid as any).getPositionToCartographic(_pos, _latLon);

      // use a minimum elevation for computing the horizon distance to avoid the far clip
      // plane approaching zero or clipping mountains over the horizon in the distance as
      // the camera goes to or below sea level.
      const elevation = Math.max((ellipsoid as any).getPositionElevation(_pos), MIN_ELEVATION);
      const horizonDistance = (ellipsoid as any).calculateHorizonDistance(_latLon.lat, elevation);

      (camera as any).far = horizonDistance + 0.1 + maxRadius * farMargin;
      (camera as any).updateProjectionMatrix();
    } else {
      (this as any)._getVirtualOrthoCameraPosition(camera.position, camera);
      camera.updateMatrixWorld();

      _invMatrix.copy(camera.matrixWorld).invert();
      _vec.setFromMatrixPosition(ellipsoidFrame).applyMatrix4(_invMatrix);

      const distanceToCenter = -_vec.z;
      (camera as any).near = distanceToCenter - maxRadius * (1 + nearMargin);
      (camera as any).far = distanceToCenter + 0.1 + maxRadius * farMargin;

      // adjust the position of the ortho camera such that the near value is 0
      camera.position.addScaledVector(_forward, (camera as any).near);
      (camera as any).far -= (camera as any).near;
      (camera as any).near = 0;

      (camera as any).updateProjectionMatrix();
      camera.updateMatrixWorld();
    }
  }
}
