import { GeoMouseEvent } from "../common/event";

export type GeoPointEvent = GeoMouseEvent<any>;

export type EventNames =
  | "click"
  | "doubleclick"
  | "contextmenu"
  | "pointerenter"
  | "pointerleave"
  | "pointerover"
  | "pointerdown"
  | "pointerup"
  | "wheel";

export interface MouseEventHandlers {
  click: GeoPointEvent;
  "doubleclick": GeoPointEvent;
  "contextmenu": GeoPointEvent;
  "pointerenter": GeoPointEvent;
  "pointerleave": GeoPointEvent;
  "pointerover": GeoPointEvent;
  "pointerdown": GeoPointEvent;
  "pointerup": GeoPointEvent;
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
    "doubleclick": createHandler("doubleclick"),
    "contextmenu": createHandler("contextmenu"),
    "pointerenter": createHandler("pointerenter"),
    "pointerleave": createHandler("pointerleave"),
    "pointerover": createHandler("pointerover"),
    "pointerdown": createHandler("pointerdown"),
    "pointerup": createHandler("pointerup"),
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
  element.addEventListener("dblclick", handlers["doubleclick"]);
  element.addEventListener("contextmenu", handlers["contextmenu"]);
  element.addEventListener("pointerenter", handlers["pointerenter"]);
  element.addEventListener("pointerleave", handlers["pointerleave"]);
  element.addEventListener("pointerover", handlers["pointerover"]);
  element.addEventListener("pointerdown", handlers["pointerdown"]);
  element.addEventListener("pointerup", handlers["pointerup"]);
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
  element.removeEventListener("dblclick", handlers["doubleclick"]);
  element.removeEventListener("contextmenu", handlers["contextmenu"]);
  element.removeEventListener("pointerenter", handlers["pointerenter"]);
  element.removeEventListener("pointerleave", handlers["pointerleave"]);
  element.removeEventListener("pointerover", handlers["pointerover"]);
  element.removeEventListener("pointerdown", handlers["pointerdown"]);
  element.removeEventListener("pointerup", handlers["pointerup"]);
  element.removeEventListener("wheel", handlers.wheel);
}
