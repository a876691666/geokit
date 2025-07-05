import { ref, reactive, shallowRef, triggerRef, type ShallowRef } from 'vue'
import { LoadingManager, TextureLoader, FileLoader } from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js'
import type { ResourceType, ResourceItem, IResourceManager, ResourceStats } from './resource'
import { ResourceType as RT, ResourceStatus as RS } from './resource'

/**
 * 资源管理器类实现
 */
class ResourceManager implements IResourceManager {
    private resources = reactive<Map<string, ShallowRef<ResourceItem>>>(new Map())
    private loadingManager: LoadingManager
    private textureLoader: TextureLoader
    private gltfLoader: GLTFLoader
    private fileLoader: FileLoader

    // 资源ID映射表 - 存储实际资源对象
    private resourceIdMap = reactive<Map<string, any>>(new Map())
    // 资源ID到shallowRef的映射
    private resourceIdRefMap = reactive<Map<string, ShallowRef<any>>>(new Map())

    // 进度状态
    public totalProgress = ref(0)
    public loadingCount = ref(0)
    public loadedCount = ref(0)
    public errorCount = ref(0)

    constructor() {
        this.loadingManager = new LoadingManager()
        this.textureLoader = new TextureLoader(this.loadingManager)
        this.gltfLoader = new GLTFLoader(this.loadingManager)
        this.fileLoader = new FileLoader(this.loadingManager)

        // 配置 DRACO 解码器
        const dracoLoader = new DRACOLoader()
        dracoLoader.setDecoderPath('/draco/')
        this.gltfLoader.setDRACOLoader(dracoLoader)

        // 监听加载进度
        this.loadingManager.onProgress = (url, itemsLoaded, itemsTotal) => {
            this.totalProgress.value = itemsTotal > 0 ? (itemsLoaded / itemsTotal) * 100 : 0
            this.updateResourceProgress(url, (itemsLoaded / itemsTotal) * 100)
        }

        this.loadingManager.onLoad = () => {
            this.totalProgress.value = 100
        }

        this.loadingManager.onError = (url) => {
            console.error('资源加载失败:', url)
        }
    }

    // 生成资源唯一ID
    private generateResourceId(type: ResourceType, url: string): string {
        return `${type}:${url}`
    }

    // 更新资源进度
    private updateResourceProgress(url: string, progress: number) {
        for (const [_id, resourceRef] of this.resources) {
            if (resourceRef.value.url === url) {
                resourceRef.value = {
                    ...resourceRef.value,
                    progress,
                }
                triggerRef(resourceRef)
                break
            }
        }
    }

    // 更新资源状态的辅助函数
    private updateResourceItem(id: string, updates: Partial<ResourceItem>) {
        const resourceRef = this.resources.get(id)
        if (resourceRef) {
            resourceRef.value = {
                ...resourceRef.value,
                ...updates,
            }
            triggerRef(resourceRef)
        }
    }

    // 统一的资源创建和缓存管理方法
    private getOrCreateResourceRef(type: ResourceType, url: string): ShallowRef<ResourceItem> {
        const id = this.generateResourceId(type, url)
        const existingRef = this.resources.get(id)
        
        if (existingRef) {
            return existingRef
        }
        
        // 创建新的资源项
        const resourceItem: ResourceItem = {
            id,
            type,
            url,
            status: RS.PENDING,
            progress: 0,
        }
        
        const resourceRef = shallowRef(resourceItem)
        this.resources.set(id, resourceRef)
        return resourceRef
    }

    // 注册贴图资源
    public async registerTexture(url: string): Promise<any> {
        const id = this.generateResourceId(RT.TEXTURE, url)
        const resourceRef = this.getOrCreateResourceRef(RT.TEXTURE, url)

        // 检查是否已存在且已加载
        if (resourceRef.value.status === RS.LOADED) {
            return resourceRef.value.data
        }
        if (resourceRef.value.promise) {
            return resourceRef.value.promise
        }

        this.loadingCount.value++

        // 创建加载Promise
        const promise = new Promise((resolve, reject) => {
            this.updateResourceItem(id, { status: RS.LOADING })

            this.textureLoader.load(
                url,
                (texture) => {
                    this.updateResourceItem(id, {
                        status: RS.LOADED,
                        data: texture,
                        progress: 100,
                    })
                    this.loadedCount.value++
                    this.loadingCount.value--
                    resolve(texture)
                },
                (progress) => {
                    if (progress.lengthComputable) {
                        this.updateResourceItem(id, {
                            progress: (progress.loaded / progress.total) * 100,
                        })
                    }
                },
                (error) => {
                    this.updateResourceItem(id, {
                        status: RS.ERROR,
                        error: error instanceof Error ? error : new Error(String(error)),
                    })
                    this.errorCount.value++
                    this.loadingCount.value--
                    reject(error)
                },
            )
        })

        this.updateResourceItem(id, { promise })
        return promise
    }

    // 注册模型资源
    public async registerModel(url: string): Promise<any> {
        const id = this.generateResourceId(RT.MODEL, url)
        const resourceRef = this.getOrCreateResourceRef(RT.MODEL, url)

        // 检查是否已存在且已加载
        if (resourceRef.value.status === RS.LOADED) {
            return resourceRef.value.data
        }
        if (resourceRef.value.promise) {
            return resourceRef.value.promise
        }

        this.loadingCount.value++

        // 创建加载Promise
        const promise = new Promise((resolve, reject) => {
            this.updateResourceItem(id, { status: RS.LOADING })

            this.gltfLoader.load(
                url,
                (gltf) => {
                    this.updateResourceItem(id, {
                        status: RS.LOADED,
                        data: gltf,
                        progress: 100,
                    })
                    this.loadedCount.value++
                    this.loadingCount.value--
                    resolve(gltf)
                },
                (progress) => {
                    if (progress.lengthComputable) {
                        this.updateResourceItem(id, {
                            progress: (progress.loaded / progress.total) * 100,
                        })
                    }
                },
                (error) => {
                    this.updateResourceItem(id, {
                        status: RS.ERROR,
                        error: error instanceof Error ? error : new Error(String(error)),
                    })
                    this.errorCount.value++
                    this.loadingCount.value--
                    reject(error)
                },
            )
        })

        this.updateResourceItem(id, { promise })
        return promise
    }

    // 注册文件资源
    public async registerFile(url: string): Promise<any> {
        const id = this.generateResourceId(RT.FILE, url)
        const resourceRef = this.getOrCreateResourceRef(RT.FILE, url)

        // 检查是否已存在且已加载
        if (resourceRef.value.status === RS.LOADED) {
            return resourceRef.value.data
        }
        if (resourceRef.value.promise) {
            return resourceRef.value.promise
        }

        this.loadingCount.value++

        // 创建加载Promise
        const promise = new Promise((resolve, reject) => {
            this.updateResourceItem(id, { status: RS.LOADING })

            this.fileLoader.load(
                url,
                (data) => {
                    this.updateResourceItem(id, {
                        status: RS.LOADED,
                        data: data,
                        progress: 100,
                    })
                    this.loadedCount.value++
                    this.loadingCount.value--
                    resolve(data)
                },
                (progress) => {
                    if (progress.lengthComputable) {
                        this.updateResourceItem(id, {
                            progress: (progress.loaded / progress.total) * 100,
                        })
                    }
                },
                (error) => {
                    this.updateResourceItem(id, {
                        status: RS.ERROR,
                        error: error instanceof Error ? error : new Error(String(error)),
                    })
                    this.errorCount.value++
                    this.loadingCount.value--
                    reject(error)
                },
            )
        })

        this.updateResourceItem(id, { promise })
        return promise
    }

    // 获取资源的 shallowRef
    public getResourceRef(type: ResourceType, url: string): ShallowRef<ResourceItem> {
        return this.getOrCreateResourceRef(type, url)
    }

    // 获取所有资源
    public getAllResources(): ResourceItem[] {
        return Array.from(this.resources.values()).map((ref) => ref.value)
    }

    // 清除资源
    public clearResource(type: ResourceType, url: string): boolean {
        const id = this.generateResourceId(type, url)
        return this.resources.delete(id)
    }

    // 清除所有资源
    public clearAllResources(): void {
        this.resources.clear()
        this.totalProgress.value = 0
        this.loadingCount.value = 0
        this.loadedCount.value = 0
        this.errorCount.value = 0
    }

    // 获取统计信息
    public getStats(): ResourceStats {
        return {
            total: this.resources.size,
            loading: this.loadingCount.value,
            loaded: this.loadedCount.value,
            error: this.errorCount.value,
            progress: this.totalProgress.value,
        }
    }

    // ===== 资源ID管理方法 =====

    /**
     * 根据ID获取资源的 shallowRef
     * @param id 资源ID
     * @returns 资源的 shallowRef
     */
    public getResourceById(id: string): ShallowRef<any> {
        // 如果已经存在 shallowRef，直接返回
        if (this.resourceIdRefMap.has(id)) {
            return this.resourceIdRefMap.get(id)!
        }
        
        // 创建新的 shallowRef
        const resourceRef = shallowRef(null)
        this.resourceIdRefMap.set(id, resourceRef)
        
        // 检查是否已经有资源值
        if (this.resourceIdMap.has(id)) {
            resourceRef.value = this.resourceIdMap.get(id)
        }
        
        return resourceRef
    }

    /**
     * 设置资源ID映射
     * @param id 资源ID
     * @param resource 资源对象
     */
    public setResourceId(id: string, resource: any): void {
        this.resourceIdMap.set(id, resource)
        
        // 如果存在对应的 shallowRef，更新其值
        if (this.resourceIdRefMap.has(id)) {
            const resourceRef = this.resourceIdRefMap.get(id)!
            resourceRef.value = resource
        }
    }

    /**
     * 清除资源ID映射
     * @param id 资源ID
     */
    public clearResourceId(id: string): void {
        this.resourceIdMap.delete(id)
        
        // 清除对应的 shallowRef
        if (this.resourceIdRefMap.has(id)) {
            const resourceRef = this.resourceIdRefMap.get(id)!
            resourceRef.value = null
            this.resourceIdRefMap.delete(id)
        }
    }

    /**
     * 获取资源ID映射表
     * @returns 资源ID映射表
     */
    public getResourceIdMap(): Map<string, any> {
        return this.resourceIdMap
    }
}

// 创建资源管理器实例
export const resourceManager = new ResourceManager()

// 导出类供外部使用
export { ResourceManager }
