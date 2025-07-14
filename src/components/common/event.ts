export type PointEvent = MouseEvent & {
  index: number;
};

export type GeoMouseEvent<D extends any> = [PointEvent, D, index: number];

// 通用的地理组件事件类型
export interface GeoEventEmits {
  click: GeoMouseEvent<any>;
  "double-click": GeoMouseEvent<any>;
  "context-menu": GeoMouseEvent<any>;
  "pointer-enter": GeoMouseEvent<any>;
  "pointer-leave": GeoMouseEvent<any>;
  "pointer-over": GeoMouseEvent<any>;
  "pointer-down": GeoMouseEvent<any>;
  "pointer-up": GeoMouseEvent<any>;
  wheel: GeoMouseEvent<any>;
}

// 通用的事件处理函数生成器
export const createEventHandler = (
  emit: any,
  props: any,
  raycastActive: boolean = true,
  object?: any
) => {
  const handleEvent = (eventName: string) => {
    return (event: MouseEvent & { index: number }) => {
      if (!raycastActive) return;

      const index = event.index !== undefined ? event.index : 0;
      emit(eventName as any, event, props, index);
    };
  };

  return {
    handleClick: handleEvent("click"),
    handleDoubleClick: handleEvent("double-click"),
    handleContextMenu: handleEvent("context-menu"),
    handlePointerEnter: handleEvent("pointer-enter"),
    handlePointerLeave: handleEvent("pointer-leave"),
    handlePointerOver: handleEvent("pointer-over"),
    handlePointerDown: handleEvent("pointer-down"),
    handlePointerUp: handleEvent("pointer-up"),
    handleWheel: handleEvent("wheel"),
  };
};

// 通用的raycast劫持函数
export const hijackRaycast = (object: any, raycastMultiplier: number = 1) => {
  if (!object || !object.raycast) return;

  const originalRaycast = object.raycast;
  object.raycast = function (raycaster: any, intersects: any) {
    // 保存原始的阈值
    const originalThreshold = raycaster.params.Points?.threshold || 1;

    // 应用 raycast 乘数（主要用于Points类型）
    if (raycaster.params.Points) {
      raycaster.params.Points.threshold = originalThreshold * raycastMultiplier;
    } else if (object.type === 'Points') {
      raycaster.params.Points = { threshold: originalThreshold * raycastMultiplier };
    }

    // 调用原始 raycast 方法
    const result = originalRaycast.call(this, raycaster, intersects);

    // 恢复原始阈值
    if (raycaster.params.Points) {
      raycaster.params.Points.threshold = originalThreshold;
    }

    return result;
  };
};

// 通用的props接口
export interface GeoInteractiveProps {
  id?: string;
  raycastActive?: boolean;
  raycastMultiplier?: number;
}
