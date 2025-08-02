<template>
  <TresGroup :rotation-y="rotateY">
    <slot />
  </TresGroup>
</template>
<script setup lang="ts">
import { computed } from "vue";

const props = withDefaults(
  defineProps<{
    rotate?: number;
  }>(),
  {
    rotate: 0,
  }
);

const rotateY = computed(() => {
  return props.rotate ? props.rotate * (Math.PI / 180) : 0;
});
</script>
