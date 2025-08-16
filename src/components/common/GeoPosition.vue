<script setup lang="ts">
import { watch, onMounted, shallowRef } from "vue";
import { Vector3, Euler, Object3D, Matrix4 } from "three";
import { lonlatToECEF } from "@/utils/controls";
import { Point } from "@/config/type";

const props = defineProps<{
  point?: Point;
}>();

const position = shallowRef(new Vector3());
const rotation = shallowRef(new Euler());

const updatePosition = () => {
  const ecef = lonlatToECEF(props.point?.lon, props.point?.lat, props.point?.height || 0);
  position.value = ecef;

  // 计算局部坐标系
  // 1. up向量：从地心指向当前位置（径向向外）
  const up = ecef.clone().normalize();

  // 2. north向量：指向北极方向
  // 北极在ECEF坐标系中是(0, 0, 1)
  const northPole = new Vector3(0, 0, 1);
  // 计算从当前位置指向北极的方向，但要投影到切平面上
  const north = northPole
    .clone()
    .sub(up.clone().multiplyScalar(northPole.dot(up)))
    .normalize();

  // 3. east向量：通过叉积计算东向
  const east = north.clone().cross(up).normalize();

  // 重新计算north确保正交性
  north.copy(up.clone().cross(east)).normalize();

  // 构建旋转矩阵
  // 使用标准的东北天（ENU）坐标系：
  // - X轴（右）对应东向 (east)
  // - Y轴（上）对应天向 (up) - 径向向外
  // - Z轴（前）对应北向 (north)
  const matrix = new Matrix4();
  matrix.makeBasis(
    east, // X轴：东向
    up, // Y轴：天向（径向向外）
    north // Z轴：北向（正前方）
  );

  // 从矩阵提取旋转
  const tempObject = new Object3D();
  tempObject.matrix.copy(matrix);
  tempObject.matrix.decompose(tempObject.position, tempObject.quaternion, tempObject.scale);

  rotation.value.setFromQuaternion(tempObject.quaternion);

  // 必须克隆，否则不生效
  rotation.value = rotation.value.clone();
};

watch([() => props.point?.lon, () => props.point?.lat, () => props.point?.height], () => {
  updatePosition();
});

onMounted(() => {
  updatePosition();
});
</script>

<template>
  <TresGroup :position="position" :rotation="rotation">
    <slot />
  </TresGroup>
</template>
