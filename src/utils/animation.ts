import * as THREE from "three";
import { gsap } from "gsap";

// 动画控制器接口
export interface AnimationController {
  start(): Promise<void>;
  stop(): void;
  isRunning(): boolean;
  pause(): void;
  resume(): void;
  progress(value?: number): number;
}

// GSAP缓动函数映射
export const Easing = {
  linear: "none",
  easeInQuad: "power2.in",
  easeOutQuad: "power2.out",
  easeInOutQuad: "power2.inOut",
  easeInCubic: "power3.in",
  easeOutCubic: "power3.out",
  easeInOutCubic: "power3.inOut",
  easeInQuart: "power4.in",
  easeOutQuart: "power4.out",
  easeInOutQuart: "power4.inOut",
  easeInBack: "back.in",
  easeOutBack: "back.out",
  easeInOutBack: "back.inOut",
  easeInElastic: "elastic.in",
  easeOutElastic: "elastic.out",
  easeInOutElastic: "elastic.inOut",
  easeInBounce: "bounce.in",
  easeOutBounce: "bounce.out",
  easeInOutBounce: "bounce.inOut",
} as const;

// 动画配置接口
export interface AnimationConfig {
  duration?: number;
  easing?: string;
  delay?: number;
  repeat?: number;
  yoyo?: boolean;
  onStart?: () => void;
  onUpdate?: (progress: number, target: THREE.Object3D) => void;
  onComplete?: () => void;
  onPause?: () => void;
  onResume?: () => void;
}

// 基于GSAP的动画控制器
class GSAPAnimationController implements AnimationController {
  private tween: gsap.core.Tween | null = null;

  constructor(
    private target: THREE.Object3D,
    private toVars: gsap.TweenVars,
    private config: AnimationConfig = {}
  ) {}

  start(): Promise<void> {
    return new Promise<void>((resolve) => {
      if (this.tween) {
        this.tween.kill();
      }

      const {
        duration = 0.5,
        easing = Easing.linear,
        delay = 0,
        repeat = 0,
        yoyo = false,
        onStart,
        onUpdate,
        onComplete,
        onPause,
        onResume,
      } = this.config;

      this.tween = gsap.to(this.target.scale, {
        ...this.toVars,
        duration,
        ease: easing,
        delay,
        repeat,
        yoyo,
        onStart: () => {
          onStart?.();
        },
        onUpdate: () => {
          this.target.updateMatrixWorld(true);
          const progress = this.tween?.progress() || 0;
          onUpdate?.(progress, this.target);
        },
        onComplete: () => {
          onComplete?.();
          resolve();
        },
        onPause: () => {
          onPause?.();
        },
        onResume: () => {
          onResume?.();
        },
      });
    });
  }

  stop(): void {
    if (this.tween) {
      this.tween.kill();
      this.tween = null;
    }
  }

  isRunning(): boolean {
    return this.tween ? this.tween.isActive() : false;
  }

  pause(): void {
    if (this.tween) {
      this.tween.pause();
    }
  }

  resume(): void {
    if (this.tween) {
      this.tween.resume();
    }
  }

  progress(value?: number): number {
    if (this.tween) {
      if (value !== undefined) {
        this.tween.progress(value);
        return value;
      }
      return this.tween.progress();
    }
    return 0;
  }
}

// 创建缩放动画控制器
export function createScaleAnimation(
  target: THREE.Object3D,
  fromScale: THREE.Vector3,
  toScale: THREE.Vector3,
  config: AnimationConfig = {}
): AnimationController {
  // 设置初始缩放
  target.scale.copy(fromScale);

  return new GSAPAnimationController(
    target,
    {
      x: toScale.x,
      y: toScale.y,
      z: toScale.z,
    },
    config
  );
}

// Y轴缩放动画的便捷函数
export function createYScaleAnimation(
  target: THREE.Object3D,
  fromY: number,
  toY: number,
  config: AnimationConfig = {}
): AnimationController {
  const fromScale = new THREE.Vector3(1, fromY, 1);
  const toScale = new THREE.Vector3(1, toY, 1);
  return createScaleAnimation(target, fromScale, toScale, config);
}

// 创建位置动画控制器
export function createPositionAnimation(
  target: THREE.Object3D,
  fromPosition: THREE.Vector3,
  toPosition: THREE.Vector3,
  config: AnimationConfig = {}
): AnimationController {
  // 设置初始位置
  target.position.copy(fromPosition);

  return new GSAPAnimationController(
    target,
    {
      x: toPosition.x,
      y: toPosition.y,
      z: toPosition.z,
    },
    {
      ...config,
      onUpdate: (progress, target) => {
        target.updateMatrixWorld(true);
        config.onUpdate?.(progress, target);
      },
    }
  );
}

// 创建旋转动画控制器
export function createRotationAnimation(
  target: THREE.Object3D,
  fromRotation: THREE.Euler,
  toRotation: THREE.Euler,
  config: AnimationConfig = {}
): AnimationController {
  // 设置初始旋转
  target.rotation.copy(fromRotation);

  return new GSAPAnimationController(
    target,
    {
      x: toRotation.x,
      y: toRotation.y,
      z: toRotation.z,
    },
    {
      ...config,
      onUpdate: (progress, target) => {
        target.updateMatrixWorld(true);
        config.onUpdate?.(progress, target);
      },
    }
  );
}

// GSAP时间线动画管理器
export class AnimationManager {
  private animations = new Map<string, AnimationController>();
  private timeline: gsap.core.Timeline | null = null;

  constructor() {
    this.timeline = gsap.timeline();
  }

  // 启动动画并存储到管理器中
  async startAnimation(
    key: string,
    animationController: AnimationController,
    replace: boolean = true
  ): Promise<void> {
    if (replace && this.animations.has(key)) {
      this.stopAnimation(key);
    }

    this.animations.set(key, animationController);

    try {
      await animationController.start();
    } finally {
      // 动画完成后自动清理
      this.animations.delete(key);
    }
  }

  // 停止指定动画
  stopAnimation(key: string): void {
    const animation = this.animations.get(key);
    if (animation) {
      animation.stop();
      this.animations.delete(key);
    }
  }

  // 暂停指定动画
  pauseAnimation(key: string): void {
    const animation = this.animations.get(key);
    if (animation) {
      animation.pause();
    }
  }

  // 恢复指定动画
  resumeAnimation(key: string): void {
    const animation = this.animations.get(key);
    if (animation) {
      animation.resume();
    }
  }

  // 设置动画进度
  setAnimationProgress(key: string, progress: number): void {
    const animation = this.animations.get(key);
    if (animation) {
      animation.progress(progress);
    }
  }

  // 停止所有动画
  stopAllAnimations(): void {
    this.animations.forEach((animation) => animation.stop());
    this.animations.clear();
  }

  // 暂停所有动画
  pauseAllAnimations(): void {
    this.animations.forEach((animation) => animation.pause());
  }

  // 恢复所有动画
  resumeAllAnimations(): void {
    this.animations.forEach((animation) => animation.resume());
  }

  // 检查动画是否正在运行
  isAnimationRunning(key: string): boolean {
    const animation = this.animations.get(key);
    return animation ? animation.isRunning() : false;
  }

  // 获取正在运行的动画数量
  getRunningAnimationsCount(): number {
    return Array.from(this.animations.values()).filter((anim) => anim.isRunning()).length;
  }

  // 获取所有动画键
  getAnimationKeys(): string[] {
    return Array.from(this.animations.keys());
  }

  // 清理时间线
  cleanup(): void {
    this.stopAllAnimations();
    if (this.timeline) {
      this.timeline.kill();
      this.timeline = null;
    }
  }
}

// 创建全局动画管理器实例
export const globalAnimationManager = new AnimationManager();

// 提供一些常用的动画预设
export const AnimationPresets = {
  // 弹性出现
  bounceIn: {
    easing: Easing.easeOutBounce,
    duration: 0.8,
  },
  // 平滑出现
  smoothIn: {
    easing: Easing.easeOutCubic,
    duration: 0.5,
  },
  // 快速出现
  quickIn: {
    easing: Easing.easeOutQuad,
    duration: 0.3,
  },
  // 弹性消失
  bounceOut: {
    easing: Easing.easeInBounce,
    duration: 0.6,
  },
  // 平滑消失
  smoothOut: {
    easing: Easing.easeInCubic,
    duration: 0.4,
  },
  // 快速消失
  quickOut: {
    easing: Easing.easeInQuad,
    duration: 0.2,
  },
};
