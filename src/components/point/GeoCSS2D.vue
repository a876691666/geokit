<script setup lang="ts">
import { watch, onUnmounted, onMounted, defineSlots, render } from "vue";
import { CSS2DObject } from "three/addons/renderers/CSS2DRenderer.js";
import { Group } from "three";
import { lonlatToECEF } from "@/utils/controls";
import { Point } from "@/config/type";
import { createDOMEventHandlers, unbindDOMEvents, GeoPointEvent, MouseEventHandlers } from "./event";

const rootDiv = document.createElement("div");

const props = withDefaults(defineProps<{
  point: Point;
  renderOrder?: number;
  id?: string;
}>(), {
  renderOrder: 1,
});

const slots = defineSlots<{
  default(): any;
}>();

const emit = defineEmits<MouseEventHandlers>();

const update = () => {
  render(slots.default()[0], rootDiv);
};

const rootCSS2DObj = new CSS2DObject(rootDiv);

const group = new Group();

group.layers.enableAll();
group.add(rootCSS2DObj);
rootCSS2DObj.layers.set(1);
rootCSS2DObj.renderOrder = props.renderOrder;

const updatePosition = () => {
  const ecef = lonlatToECEF(props.point.lon, props.point.lat, props.point.height);
  rootCSS2DObj.position.copy(ecef);
};

// 创建DOM事件处理器
const eventHandlers = createDOMEventHandlers(emit, props);

watch([() => props.point.lon, () => props.point.lat, () => props.point.height], () => {
  updatePosition();
});

onMounted(() => {
  updatePosition();
  update();
  // 绑定DOM事件
  rootDiv.addEventListener("click", eventHandlers.click);
  rootDiv.addEventListener("dblclick", eventHandlers["double-click"]);
  rootDiv.addEventListener("contextmenu", eventHandlers["context-menu"]);
  rootDiv.addEventListener("pointerenter", eventHandlers["pointer-enter"]);
  rootDiv.addEventListener("pointerleave", eventHandlers["pointer-leave"]);
  rootDiv.addEventListener("pointerover", eventHandlers["pointer-over"]);
  rootDiv.addEventListener("pointerdown", eventHandlers["pointer-down"]);
  rootDiv.addEventListener("pointerup", eventHandlers["pointer-up"]);
  rootDiv.addEventListener("wheel", eventHandlers.wheel);
});

onUnmounted(() => {
  // 解绑DOM事件
  unbindDOMEvents(rootDiv, eventHandlers);
  group.clear();
});

defineExpose({
  update,
});
</script>

<template>
  <primitive :object="group"></primitive>
</template>
