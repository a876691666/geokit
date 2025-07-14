<script setup lang="ts">
import { onUnmounted, onMounted, watchEffect } from "vue";
import { CSS2DObject } from "three/addons/renderers/CSS2DRenderer.js";
import { GeoPosition } from "@/index";
import { Point } from "@/config/type";
import { createDOMEventHandlers, unbindDOMEvents, MouseEventHandlers } from "./event";

const rootDiv = document.createElement("img");

const props = withDefaults(defineProps<{
  point: Point;
  size?: number;
  icon: string;
  renderOrder?: number;
  id?: string;
}>(), {
  renderOrder: 1,
});

const emit = defineEmits<MouseEventHandlers>();

const update = () => {
  rootDiv.src = props.icon;
  rootDiv.style.width = props.size + "px";
  rootDiv.style.height = props.size + "px";
  rootDiv.style.left = "0";
  rootDiv.style.top = "0";
};

const rootCSS2DObj = new CSS2DObject(rootDiv);
rootCSS2DObj.renderOrder = props.renderOrder;

// 创建DOM事件处理器
const eventHandlers = createDOMEventHandlers(emit, props);

onMounted(() => {
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

watchEffect(() => {
  update();
});

onUnmounted(() => {
  // 解绑DOM事件
  unbindDOMEvents(rootDiv, eventHandlers);
  rootDiv.remove();
});
</script>

<template>
  <GeoPosition :point="props.point">
    <primitive :object="rootCSS2DObj"></primitive>
  </GeoPosition>
</template>
