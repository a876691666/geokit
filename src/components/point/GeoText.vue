<script setup lang="ts">
import { onUnmounted, onMounted, watchEffect } from "vue";
import { CSS2DObject } from "three/addons/renderers/CSS2DRenderer.js";
import { GeoPosition } from "@/index";
import { Point } from "@/config/type";
import { createDOMEventHandlers, unbindDOMEvents, MouseEventHandlers } from "./event";

const rootDiv = document.createElement("div");

const props = withDefaults(defineProps<{
  point: Point;
  fontSize?: number;
  color?: string;
  text: string;
  renderOrder?: number;
  align?: 'left' | 'center' | 'right';
  id?: string;
}>(), {
  fontSize: 16,
  color: "#333",
  renderOrder: 1,
  align: 'left',
});

const emit = defineEmits<MouseEventHandlers>();

const update = () => {
  rootDiv.innerText = props.text;
  rootDiv.style.fontSize = props.fontSize + "px";
  rootDiv.style.color = props.color;
  rootDiv.style.pointerEvents = "auto";
  rootDiv.style.userSelect = "none";
  
  // 设置文字对齐方式
  switch (props.align) {
    case 'center':
      rootDiv.style.transform = 'translateX(-50%)';
      rootDiv.style.textAlign = 'center';
      break;
    case 'right':
      rootDiv.style.transform = 'translateX(-100%)';
      rootDiv.style.textAlign = 'right';
      break;
    case 'left':
    default:
      rootDiv.style.transform = 'translateX(0)';
      rootDiv.style.textAlign = 'left';
      break;
  }
};

const rootCSS2DObj = new CSS2DObject(rootDiv);
rootCSS2DObj.renderOrder = props.renderOrder;

// 创建DOM事件处理器
const eventHandlers = createDOMEventHandlers(emit, props);

onMounted(() => {
  update();
  // 绑定DOM事件
  rootDiv.addEventListener("click", eventHandlers.click);
  rootDiv.addEventListener("dblclick", eventHandlers["doubleclick"]);
  rootDiv.addEventListener("contextmenu", eventHandlers["contextmenu"]);
  rootDiv.addEventListener("pointerenter", eventHandlers["pointerenter"]);
  rootDiv.addEventListener("pointerleave", eventHandlers["pointerleave"]);
  rootDiv.addEventListener("pointerover", eventHandlers["pointerover"]);
  rootDiv.addEventListener("pointerdown", eventHandlers["pointerdown"]);
  rootDiv.addEventListener("pointerup", eventHandlers["pointerup"]);
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
