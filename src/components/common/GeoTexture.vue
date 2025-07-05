<template>
    <slot v-if="isLoadingComplete" :texture="texture" :status="status" :error="error" :progress="loadingProgress" />
</template>

<script setup lang="ts">
import { ref, watch, onMounted, onUnmounted, shallowRef } from 'vue'
import type { Texture, Wrapping, MagnificationTextureFilter, MinificationTextureFilter, AnyPixelFormat, TextureDataType } from 'three'
import { Vector2 } from 'three'
import { useResourceRegister, useResourceManager, useResourceId } from './hooks'
import { ResourceType, ResourceStatus } from './resource'
import type { ResourceItem } from './resource'

interface Props {
    /** 贴图URL */
    url: string
    /** 资源ID，用于外部引用 */
    id?: string
    /** 是否自动加载 */
    autoLoad?: boolean
    /** 是否创建新的贴图实例（true: 克隆独立贴图, false: 共享资源） */
    new?: boolean
    /** 贴图重复模式 */
    wrapS?: Wrapping
    /** 贴图重复模式 */
    wrapT?: Wrapping
    /** 贴图过滤模式 */
    magFilter?: MagnificationTextureFilter
    /** 贴图过滤模式 */
    minFilter?: MinificationTextureFilter
    /** 是否翻转Y轴 */
    flipY?: boolean
    /** 贴图格式 */
    format?: AnyPixelFormat
    /** 贴图类型 */
    type?: TextureDataType
    /** 贴图旋转角度 */
    rotate?: number
    /** 贴图中心点 */
    center?: [number, number]
}

interface Emits {
    /** 贴图加载完成事件 */
    (e: 'loaded', texture: Texture): void
    /** 贴图加载进度事件 */
    (e: 'progress', progress: number): void
    /** 贴图加载错误事件 */
    (e: 'error', error: Error): void
    /** 贴图状态变化事件 */
    (e: 'status-change', status: ResourceStatus): void
}

const props = withDefaults(defineProps<Props>(), {
    autoLoad: true,
    new: false,
    flipY: true,
})

const emit = defineEmits<Emits>()

// 使用资源管理器
const { registerTexture } = useResourceRegister()
const resourceManager = useResourceManager()
const { setResourceId, clearResourceId } = useResourceId()

// 组件状态
const texture = shallowRef<Texture | null>(null)
const loading = ref(false)
const error = ref<Error | null>(null)

// 改为shallowRef
const resourceItem = shallowRef<ResourceItem | undefined>(undefined)
const status = shallowRef<ResourceStatus>(ResourceStatus.PENDING)
const loadingProgress = shallowRef<number>(0)
const isLoadingComplete = shallowRef<boolean>(false)

// 更新状态的辅助函数
const updateStatus = () => {
    status.value = resourceItem.value?.status || ResourceStatus.PENDING
}

const updateProgress = () => {
    loadingProgress.value = resourceItem.value?.progress || 0
}

const updateLoadingComplete = () => {
    const currentStatus = status.value
    isLoadingComplete.value = currentStatus === ResourceStatus.LOADED || currentStatus === ResourceStatus.ERROR
}

/**
 * 加载贴图
 */
const loadTexture = async () => {
    if (!props.url) {
        console.warn('GeoTexture: URL is required')
        return
    }

    // 重置状态
    loading.value = true
    error.value = null
    texture.value = null

    try {
        // 使用资源管理器注册贴图
        const loadedTexture = await registerTexture(props.url)
        // 根据 new 属性决定是否克隆贴图
        let finalTexture: Texture
        if (props.new) {
            // 克隆贴图，创建独立实例
            finalTexture = loadedTexture.clone()
            finalTexture.needsUpdate = true
        } else {
            // 共享资源
            finalTexture = loadedTexture
        }

        // 应用贴图配置
        applyTextureSettings(finalTexture)

        texture.value = finalTexture

        // 如果提供了ID，则注册到ID映射表
        if (props.id) {
            setResourceId(props.id, finalTexture)
        }

        emit('loaded', finalTexture)
    } catch (err) {
        const errorObj = err instanceof Error ? err : new Error(String(err))
        error.value = errorObj
        emit('error', errorObj)
        console.error('GeoTexture: Failed to load texture', props.url, errorObj)
    } finally {
        loading.value = false
    }
}

watch(
    [
        () => props.rotate,
        () => props.type,
        () => props.format,
        () => props.wrapS,
        () => props.wrapT,
        () => props.magFilter,
        () => props.minFilter,
        () => props.flipY,
        () => props.center,
    ],
    () => {
        if (texture.value) {
            applyTextureSettings(texture.value)
        }
    },
)

/**
 * 应用贴图设置
 */
const applyTextureSettings = (tex: Texture) => {
    if (props.wrapS !== undefined) tex.wrapS = props.wrapS
    if (props.wrapT !== undefined) tex.wrapT = props.wrapT
    if (props.magFilter !== undefined) tex.magFilter = props.magFilter
    if (props.minFilter !== undefined) tex.minFilter = props.minFilter
    if (props.flipY !== undefined) tex.flipY = props.flipY
    if (props.format !== undefined) tex.format = props.format
    if (props.type !== undefined) tex.type = props.type
    if (props.rotate !== undefined) tex.rotation = props.rotate
    if (props.center !== undefined) tex.center = new Vector2(props.center[0], props.center[1])
    // 标记需要更新
    tex.needsUpdate = true
}

// 监听URL变化，更新resourceItem
watch(
    () => props.url,
    (newUrl) => {
        if (newUrl) {
            // 获取 shallowRef 包装的资源项
            const resourceRef = resourceManager.getResourceRef(ResourceType.TEXTURE, newUrl)
            resourceItem.value = resourceRef.value
            // 直接监听 resourceRef，因为它是 shallowRef
            const stopWatcher = watch(
                resourceRef,
                (newResource) => {
                    resourceItem.value = newResource
                    updateStatus()
                    updateProgress()
                    updateLoadingComplete()
                },
                { immediate: true },
            )

            // 在组件卸载时清除监听器
            onUnmounted(() => {
                stopWatcher()
            })

            updateStatus()
            updateProgress()
            updateLoadingComplete()
            if (props.autoLoad) {
                loadTexture()
            }
        }
    },
    { immediate: true },
)

// 监听resourceItem变化
watch(
    resourceItem,
    () => {
        updateStatus()
        updateProgress()
        updateLoadingComplete()
    },
    { deep: true },
)

// 监听ID变化
watch(
    () => props.id,
    (newId, oldId) => {
        // 清除旧ID映射
        if (oldId) {
            clearResourceId(oldId)
        }
        // 设置新ID映射
        if (newId && texture.value) {
            setResourceId(newId, texture.value)
        }
    },
)

// 监听状态变化
watch(status, (newStatus) => {
    emit('status-change', newStatus)
})

// 监听进度变化
watch(loadingProgress, (progress) => {
    if (progress > 0) {
        emit('progress', progress)
    }
})

/**
 * 重新加载贴图
 */
const reload = () => {
    // 清除当前资源
    if (props.url) {
        resourceManager.clearResource(ResourceType.TEXTURE, props.url)
    }
    loadTexture()
}

/**
 * 获取贴图实例
 */
const getTexture = (): Texture | null => {
    return texture.value
}

/**
 * 获取资源信息
 */
const getResourceInfo = () => {
    return {
        url: props.url,
        texture: texture.value,
        status: status.value,
        progress: loadingProgress.value,
        error: error.value,
        resourceItem: resourceItem.value,
    }
}

// 生命周期
onMounted(() => {
    if (props.autoLoad && props.url) {
        // 初始化时设置resourceItem，使用getResourceRef
        const resourceRef = resourceManager.getResourceRef(ResourceType.TEXTURE, props.url)
        resourceItem.value = resourceRef.value
        updateStatus()
        updateProgress()
        updateLoadingComplete()
        loadTexture()
    }
})

onUnmounted(() => {
    // 清除ID映射
    if (props.id) {
        clearResourceId(props.id)
    }
    // 组件卸载时不需要清除资源，因为其他组件可能还在使用
    // 资源管理器会自动管理资源的生命周期
})

// 暴露方法给父组件
defineExpose({
    loadTexture,
    reload,
    getTexture,
    getResourceInfo,
    texture,
    status,
    loading,
    error,
    progress: loadingProgress,
})
</script>
