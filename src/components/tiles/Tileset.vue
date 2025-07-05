<template>
    <primitive :object="tiles?.group" v-if="tiles" />
</template>

<script setup lang="ts">
import { useTresContext, useRenderLoop } from '@tresjs/core'
import { TilesRenderer } from '3d-tiles-renderer'
import { DebugTilesPlugin } from '3d-tiles-renderer/plugins'
import { markRaw, watch, onUnmounted } from 'vue'
import * as THREE from 'three'
import { useTileHide, useTileShowAfter } from '../../utils/tileset'
import { createYScaleAnimation, AnimationManager, AnimationPresets } from '../../utils/animation'

const props = withDefaults(defineProps<{ url: string }>(), {})

const { camera, renderer } = useTresContext()
let tiles = markRaw<TilesRenderer>(new TilesRenderer(props.url))
tiles.fetchOptions.mode = 'cors'
tiles.lruCache.minSize = 900
tiles.lruCache.maxSize = 1300
tiles.errorTarget = 12
tiles.registerPlugin(new DebugTilesPlugin())
// @ts-ignore
tiles.getPluginByName('DEBUG_TILES_PLUGIN').displayBoxBounds = true

// 创建动画管理器实例
const animationManager = new AnimationManager()

watch(
    camera,
    () => {
        if (camera.value) {
            tiles.setCamera(camera.value)
            tiles.setResolutionFromRenderer(camera.value, renderer.value)
        }
    },
    { immediate: true },
)

tiles.addEventListener('load-model', ({ scene }) => {
    scene.traverse((c) => {
        // 检查对象是否为Mesh并且有material属性
        if ((c as THREE.Mesh).material) {
            const mesh = c as THREE.Mesh
            // doubleside
            if (Array.isArray(mesh.material)) {
                mesh.material.forEach((mat) => {
                    mat.side = THREE.DoubleSide
                })
            } else {
                mesh.material.side = THREE.DoubleSide
            }
            // mesh.material.opacity = 0.5
            // mesh.material.transparent = true
        }
    })
})

// 生成对象的唯一键
function getObjectKey(target: THREE.Object3D): string {
    return `tile_${target.uuid}`
}

useTileShowAfter(tiles, async (scene, _tile) => {
    if (scene) {
        const target = scene.children[0] as THREE.Object3D
        const key = getObjectKey(target)

        // 创建弹性显示动画
        const animation = createYScaleAnimation(target, 0, 1, {
            ...AnimationPresets.quickIn,
            duration: 0.2,
        })

        // 启动动画，替换任何现有的动画
        await animationManager.startAnimation(key, animation, true)
    }
})

useTileHide(tiles, async (scene, _tile) => {
    if (scene) {
        const target = scene.children[0] as THREE.Object3D
        const key = getObjectKey(target)

        // 创建平滑隐藏动画
        const animation = createYScaleAnimation(target, 1, 0, {
            ...AnimationPresets.quickOut,
            duration: 0.2,
        })

        // 启动动画，替换任何现有的动画
        await animationManager.startAnimation(key, animation, true)
    }
})

const { onBeforeLoop } = useRenderLoop()

onBeforeLoop(() => {
    tiles.update()
})

// 组件卸载时清理所有动画
onUnmounted(() => {
    console.log('清理动画管理器')
    animationManager.cleanup()
})

// 暴露动画控制方法供外部使用
defineExpose({
    animationManager,
    pauseAllAnimations: () => animationManager.pauseAllAnimations(),
    resumeAllAnimations: () => animationManager.resumeAllAnimations(),
    stopAllAnimations: () => animationManager.stopAllAnimations(),
    getRunningAnimationsCount: () => animationManager.getRunningAnimationsCount(),
    getAnimationKeys: () => animationManager.getAnimationKeys(),
})
</script>
