<script setup lang="ts">
import { onMounted, onBeforeUnmount, shallowRef } from "vue";
import { useLoop, useTresContext } from "@tresjs/core";
import { CSS2DRenderer } from "three/addons/renderers/CSS2DRenderer.js";

const { camera, renderer } = useTresContext();
const css2dRenderer = shallowRef<CSS2DRenderer>();

const onResize = () => {
  css2dRenderer.value?.setSize(window.innerWidth, window.innerHeight);
};

onMounted(() => {
  if (camera.value) {
    camera.value.layers.enableAll();
  }

  css2dRenderer.value = new CSS2DRenderer();
  css2dRenderer.value.setSize(window.innerWidth, window.innerHeight);
  css2dRenderer.value.domElement.style.position = "fixed";
  css2dRenderer.value.domElement.style.top = "0";
  css2dRenderer.value.domElement.style.left = "0";
  css2dRenderer.value.domElement.style.pointerEvents = "none";

  renderer.value.domElement?.parentElement?.appendChild(css2dRenderer.value.domElement);

  const { onAfterRender } = useLoop();

  onAfterRender(({ scene, camera }) => {
    css2dRenderer.value?.render(scene, camera);
  });

  window.addEventListener("resize", onResize);
});

onBeforeUnmount(() => {
  window.removeEventListener("resize", onResize);
  renderer.value.domElement?.parentElement?.removeChild(css2dRenderer.value!.domElement);
});
</script>
