/**
 * 全局 overlay 状态标志
 *
 * 简化策略：窗口始终不穿透，通过 overlay 遮罩层处理交互。
 * 不再使用 setIgnoreMouseEvents 反复切换。
 */

let _overlayOpen = false

export function isOverlayOpen(): boolean {
  return _overlayOpen
}

export function setOverlayOpen(value: boolean): void {
  _overlayOpen = value
  // 不再切换 setIgnoreMouseEvents，窗口始终可交互
}
