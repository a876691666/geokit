import type { Ref } from "vue";
import type { ShallowRef } from "vue";
import type { Texture } from "three";
import type { GLTF } from "three/examples/jsm/loaders/GLTFLoader.js";

/**
 * 资源类型枚举
 */
export enum ResourceType {
  /** 贴图资源 */
  TEXTURE = "texture",
  /** 模型资源 */
  MODEL = "model",
  /** 文件资源 */
  FILE = "file",
}

/**
 * 资源状态枚举
 */
export enum ResourceStatus {
  /** 待加载 */
  PENDING = "pending",
  /** 加载中 */
  LOADING = "loading",
  /** 已加载 */
  LOADED = "loaded",
  /** 加载失败 */
  ERROR = "error",
}

/**
 * 资源项接口
 */
export interface ResourceItem {
  /** 资源唯一标识 */
  id: string;
  /** 资源类型 */
  type: ResourceType;
  /** 资源URL */
  url: string;
  /** 资源状态 */
  status: ResourceStatus;
  /** 资源数据 */
  data?: any;
  /** 错误信息 */
  error?: Error;
  /** 加载Promise */
  promise?: Promise<any>;
  /** 加载进度 (0-100) */
  progress?: number;
}

/**
 * 贴图资源项接口
 */
export interface TextureResourceItem extends Omit<ResourceItem, "type" | "data"> {
  type: ResourceType.TEXTURE;
  data?: Texture;
}

/**
 * 模型资源项接口
 */
export interface ModelResourceItem extends Omit<ResourceItem, "type" | "data"> {
  type: ResourceType.MODEL;
  data?: GLTF;
}

/**
 * 文件资源项接口
 */
export interface FileResourceItem extends Omit<ResourceItem, "type" | "data"> {
  type: ResourceType.FILE;
  data?: string | ArrayBuffer;
}

/**
 * 资源统计信息接口
 */
export interface ResourceStats {
  /** 总资源数 */
  total: number;
  /** 加载中的资源数 */
  loading: number;
  /** 已加载的资源数 */
  loaded: number;
  /** 失败的资源数 */
  error: number;
  /** 总体进度 (0-100) */
  progress: number;
}

/**
 * 资源进度信息接口
 */
export interface ResourceProgress {
  /** 总体进度 */
  totalProgress: Ref<number>;
  /** 加载中的资源数量 */
  loadingCount: Ref<number>;
  /** 已加载的资源数量 */
  loadedCount: Ref<number>;
  /** 失败的资源数量 */
  errorCount: Ref<number>;
  /** 获取统计信息 */
  getStats: () => ResourceStats;
}

/**
 * 资源注册函数接口
 */
export interface ResourceRegisterFunctions {
  /** 注册贴图资源 */
  registerTexture: (url: string) => Promise<Texture>;
  /** 注册模型资源 */
  registerModel: (url: string) => Promise<GLTF>;
  /** 注册文件资源 */
  registerFile: (url: string) => Promise<string | ArrayBuffer>;
}

/**
 * 资源管理器接口
 */
export interface IResourceManager {
  /** 总体进度 */
  totalProgress: Ref<number>;
  /** 加载中的资源数量 */
  loadingCount: Ref<number>;
  /** 已加载的资源数量 */
  loadedCount: Ref<number>;
  /** 失败的资源数量 */
  errorCount: Ref<number>;

  /** 注册贴图资源 */
  registerTexture(url: string): Promise<Texture>;
  /** 注册模型资源 */
  registerModel(url: string): Promise<GLTF>;
  /** 注册文件资源 */
  registerFile(url: string): Promise<string | ArrayBuffer>;

  /** 获取资源的 shallowRef */
  getResourceRef(type: ResourceType, url: string): any;
  /** 获取所有资源 */
  getAllResources(): ResourceItem[];
  /** 清除资源 */
  clearResource(type: ResourceType, url: string): boolean;
  /** 清除所有资源 */
  clearAllResources(): void;
  /** 获取统计信息 */
  getStats(): ResourceStats;

  // 资源ID管理方法
  /** 根据ID获取资源的 shallowRef */
  getResourceById(id: string): ShallowRef<any>;
  /** 设置资源ID映射 */
  setResourceId(id: string, resource: any): void;
  /** 清除资源ID映射 */
  clearResourceId(id: string): void;
  /** 获取资源ID映射表 */
  getResourceIdMap(): Map<string, any>;
}

/**
 * 加载进度事件数据
 */
export interface LoadProgressEvent {
  /** 已加载字节数 */
  loaded: number;
  /** 总字节数 */
  total: number;
  /** 是否可计算进度 */
  lengthComputable: boolean;
}

/**
 * 资源加载选项
 */
export interface ResourceLoadOptions {
  /** 是否启用缓存 */
  cache?: boolean;
  /** 超时时间(毫秒) */
  timeout?: number;
  /** 重试次数 */
  retryCount?: number;
  /** 进度回调 */
  onProgress?: (progress: LoadProgressEvent) => void;
  /** 成功回调 */
  onSuccess?: (data: any) => void;
  /** 错误回调 */
  onError?: (error: Error) => void;
}

/**
 * 批量加载配置
 */
export interface BatchLoadConfig {
  /** 资源列表 */
  resources: Array<{
    type: ResourceType;
    url: string;
    options?: ResourceLoadOptions;
  }>;
  /** 并发限制 */
  concurrency?: number;
  /** 是否在遇到错误时停止 */
  stopOnError?: boolean;
}

/**
 * 批量加载结果
 */
export interface BatchLoadResult {
  /** 成功加载的资源 */
  success: ResourceItem[];
  /** 失败的资源 */
  failed: ResourceItem[];
  /** 总体统计 */
  stats: ResourceStats;
}

/**
 * 资源缓存配置
 */
export interface ResourceCacheConfig {
  /** 最大缓存大小(字节) */
  maxSize?: number;
  /** 最大缓存项数 */
  maxItems?: number;
  /** 缓存过期时间(毫秒) */
  expireTime?: number;
  /** 是否启用LRU策略 */
  enableLRU?: boolean;
}

/**
 * 注入键常量
 */
export const RESOURCE_MANAGER_KEY = "resourceManager" as const;
export const REGISTER_TEXTURE_KEY = "registerTexture" as const;
export const REGISTER_MODEL_KEY = "registerModel" as const;
export const REGISTER_FILE_KEY = "registerFile" as const;
export const RESOURCE_PROGRESS_KEY = "resourceProgress" as const;

/**
 * 资源管理器事件类型
 */
export type ResourceManagerEvent =
  | "resource-start"
  | "resource-progress"
  | "resource-complete"
  | "resource-error"
  | "batch-start"
  | "batch-progress"
  | "batch-complete"
  | "cache-clear";

/**
 * 事件数据类型映射
 */
export interface ResourceManagerEventMap {
  "resource-start": { resource: ResourceItem };
  "resource-progress": { resource: ResourceItem; progress: number };
  "resource-complete": { resource: ResourceItem };
  "resource-error": { resource: ResourceItem; error: Error };
  "batch-start": { count: number };
  "batch-progress": { completed: number; total: number; progress: number };
  "batch-complete": { result: BatchLoadResult };
  "cache-clear": { count: number };
}

/**
 * 事件监听器类型
 */
export type ResourceManagerEventListener<T extends ResourceManagerEvent> = (
  data: ResourceManagerEventMap[T]
) => void;

/**
 * 类型守卫函数
 */
export function isTextureResource(resource: ResourceItem): resource is TextureResourceItem {
  return resource.type === ResourceType.TEXTURE;
}

export function isModelResource(resource: ResourceItem): resource is ModelResourceItem {
  return resource.type === ResourceType.MODEL;
}

export function isFileResource(resource: ResourceItem): resource is FileResourceItem {
  return resource.type === ResourceType.FILE;
}

/**
 * 资源URL类型
 */
export type ResourceURL = string;

/**
 * 资源ID类型
 */
export type ResourceID = string;

/**
 * 进度百分比类型 (0-100)
 */
export type ProgressPercentage = number;

/**
 * 字节大小类型
 */
export type ByteSize = number;

/**
 * 时间戳类型
 */
export type Timestamp = number;

/**
 * 重新导出 Three.js 类型
 */
export type { Texture, Object3D } from "three";
export type { GLTF } from "three/examples/jsm/loaders/GLTFLoader.js";
