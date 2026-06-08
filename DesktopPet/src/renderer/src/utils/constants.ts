/**
 * 全局常量定义
 */

/** 应用名称 */
export const APP_NAME = 'DesktopPet'

/** 宠物状态衰减间隔（毫秒） */
export const STATS_DECAY_INTERVAL = 60 * 1000 // 1 分钟

/** 属性衰减速率（每分钟） */
export const DECAY_RATES = {
  hunger: 0.5,      // ~30/h
  happiness: 0.3,   // ~18/h
  energy: 0.2,      // ~12/h
} as const

/** 属性范围 */
export const STATS_RANGE = {
  min: 0,
  max: 100,
} as const

/** 窗口默认尺寸 */
export const WINDOW_SIZE = {
  width: 300,
  height: 350,
} as const
