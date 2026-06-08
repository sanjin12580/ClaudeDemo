/**
 * 事件总线 - 模块间松耦合通信
 *
 * 所有模块通过事件总线进行通信，避免直接依赖。
 * 支持事件订阅、取消订阅、一次性订阅。
 */

type EventHandler = (...args: any[]) => void

export class EventBus {
  private listeners = new Map<string, Set<EventHandler>>()

  /**
   * 订阅事件
   * @returns 取消订阅函数
   */
  on(event: string, handler: EventHandler): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set())
    }
    this.listeners.get(event)!.add(handler)
    return () => this.off(event, handler)
  }

  /**
   * 取消订阅
   */
  off(event: string, handler: EventHandler): void {
    this.listeners.get(event)?.delete(handler)
  }

  /**
   * 一次性订阅
   */
  once(event: string, handler: EventHandler): () => void {
    const wrapper: EventHandler = (...args) => {
      this.off(event, wrapper)
      handler(...args)
    }
    return this.on(event, wrapper)
  }

  /**
   * 触发事件
   */
  emit(event: string, ...args: any[]): void {
    this.listeners.get(event)?.forEach((handler) => {
      try {
        handler(...args)
      } catch (e) {
        console.error(`[EventBus] Error in handler for "${event}":`, e)
      }
    })
  }

  /**
   * 清除所有监听器
   */
  clear(): void {
    this.listeners.clear()
  }
}

// 全局单例
export const eventBus = new EventBus()
