import { GeoMouseEvent } from "../common/event";

export type GeoPointEvent = GeoMouseEvent<any>;

export type EventNames =
  | "click"
  | "double-click"
  | "context-menu"
  | "pointer-enter"
  | "pointer-leave"
  | "pointer-over"
  | "pointer-down"
  | "pointer-up"
  | "wheel";

export interface MouseEventHandlers {
  click: GeoPointEvent;
  "double-click": GeoPointEvent;
  "context-menu": GeoPointEvent;
  "pointer-enter": GeoPointEvent;
  "pointer-leave": GeoPointEvent;
  "pointer-over": GeoPointEvent;
  "pointer-down": GeoPointEvent;
  "pointer-up": GeoPointEvent;
  wheel: GeoPointEvent;
}

/**
 * 创建DOM事件处理器
 * @param emit - Vue组件的emit函数
 * @param point - 点位数据
 * @param domElement - DOM元素
 * @returns 事件处理器对象
 */
export function createDOMEventHandlers(emit: any, point: any, domElement?: HTMLElement) {
  const createHandler = (eventName: EventNames) => {
    return (event: MouseEvent) => {
      // 创建符合GeoPointEvent格式的事件对象
      const geoEvent: GeoPointEvent = [
        { ...event, index: 0 } as MouseEvent & { index: number },
        point,
        0,
      ];
      emit(eventName, ...geoEvent);
    };
  };

  const handlers = {
    click: createHandler("click"),
    "double-click": createHandler("double-click"),
    "context-menu": createHandler("context-menu"),
    "pointer-enter": createHandler("pointer-enter"),
    "pointer-leave": createHandler("pointer-leave"),
    "pointer-over": createHandler("pointer-over"),
    "pointer-down": createHandler("pointer-down"),
    "pointer-up": createHandler("pointer-up"),
    wheel: createHandler("wheel"),
  };

  // 如果提供了DOM元素，自动绑定事件
  if (domElement) {
    bindDOMEvents(domElement, handlers);
  }

  return handlers;
}

/**
 * 绑定DOM事件到元素
 * @param element - DOM元素
 * @param handlers - 事件处理器对象
 */
export function bindDOMEvents(
  element: HTMLElement,
  handlers: ReturnType<typeof createDOMEventHandlers>
) {
  element.addEventListener("click", handlers.click);
  element.addEventListener("dblclick", handlers["double-click"]);
  element.addEventListener("contextmenu", handlers["context-menu"]);
  element.addEventListener("pointerenter", handlers["pointer-enter"]);
  element.addEventListener("pointerleave", handlers["pointer-leave"]);
  element.addEventListener("pointerover", handlers["pointer-over"]);
  element.addEventListener("pointerdown", handlers["pointer-down"]);
  element.addEventListener("pointerup", handlers["pointer-up"]);
  element.addEventListener("wheel", handlers.wheel);
}

/**
 * 解绑DOM事件
 * @param element - DOM元素
 * @param handlers - 事件处理器对象
 */
export function unbindDOMEvents(
  element: HTMLElement,
  handlers: ReturnType<typeof createDOMEventHandlers>
) {
  element.removeEventListener("click", handlers.click);
  element.removeEventListener("dblclick", handlers["double-click"]);
  element.removeEventListener("contextmenu", handlers["context-menu"]);
  element.removeEventListener("pointerenter", handlers["pointer-enter"]);
  element.removeEventListener("pointerleave", handlers["pointer-leave"]);
  element.removeEventListener("pointerover", handlers["pointer-over"]);
  element.removeEventListener("pointerdown", handlers["pointer-down"]);
  element.removeEventListener("pointerup", handlers["pointer-up"]);
  element.removeEventListener("wheel", handlers.wheel);
}
