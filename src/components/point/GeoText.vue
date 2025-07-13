<script setup lang="ts">
import { onUnmounted, onMounted, watchEffect } from 'vue'
import { CSS2DObject } from 'three/addons/renderers/CSS2DRenderer.js'
import { GeoPosition } from '@/index'
import { Point } from '@/config/type'

const rootDiv = document.createElement('div')
const textDiv = document.createElement('div')
textDiv.style.display = 'flex'
textDiv.style.alignItems = 'center'
textDiv.style.width = '1px'
textDiv.style.height = '1px'
textDiv.style.whiteSpace = 'nowrap'

rootDiv.appendChild(textDiv)

const props = withDefaults(defineProps<{
    point: Point
    text: string
    color?: string
    fontSize?: number
    align?: 'left' | 'right' | 'center'
    renderOrder?: number
}>(), {
    renderOrder: 1
})

const update = () => {
    textDiv.innerHTML = props.text
    if (props.color) {
        textDiv.style.color = props.color
    }
    if (props.fontSize) {
        textDiv.style.fontSize = props.fontSize + 'px'
    }
    if (props.align) {
        textDiv.style.alignContent = props.align
    }
}

const rootCSS2DObj = new CSS2DObject(rootDiv)
rootCSS2DObj.renderOrder = props.renderOrder

onMounted(() => {
    update()
})

watchEffect(() => {
    update()
})

onUnmounted(() => {
    rootDiv.remove()
})
</script>

<template>
    <GeoPosition :point="props.point">
        <primitive :object="rootCSS2DObj"></primitive>
    </GeoPosition>
</template>
