import { IResourceManager, ResourceProgress, ResourceRegisterFunctions } from "./resource";
import { resourceManager } from "./resourceManager";

/**
 * 使用资源管理器
 * @returns 资源管理器实例
 */
export function useResourceManager(): IResourceManager {
  return resourceManager;
}

/**
 * 使用资源注册函数
 * @returns 资源注册函数对象
 */
export function useResourceRegister(): ResourceRegisterFunctions {
  const manager = useResourceManager();

  return {
    registerTexture: manager.registerTexture.bind(manager),
    registerModel: manager.registerModel.bind(manager),
    registerFile: manager.registerFile.bind(manager),
  };
}

/**
 * 使用资源进度信息
 * @returns 资源进度信息对象
 */
export function useResourceProgress(): ResourceProgress {
  const manager = useResourceManager();

  return {
    totalProgress: manager.totalProgress,
    loadingCount: manager.loadingCount,
    loadedCount: manager.loadedCount,
    errorCount: manager.errorCount,
    getStats: manager.getStats.bind(manager),
  };
}

/**
 * 使用资源ID管理
 * @returns 资源ID管理函数
 */
export function useResourceId() {
  const resourceManager = useResourceManager();

  return {
    getResourceById: resourceManager.getResourceById.bind(resourceManager),
    setResourceId: resourceManager.setResourceId.bind(resourceManager),
    clearResourceId: resourceManager.clearResourceId.bind(resourceManager),
    resourceIdMap: resourceManager.getResourceIdMap(),
  };
}
