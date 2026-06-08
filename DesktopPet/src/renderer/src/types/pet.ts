/**
 * 宠物相关类型定义
 */

/** 宠物属性状态 */
export interface PetStats {
  /** 饥饿度 0-100（越低越饿） */
  hunger: number
  /** 心情值 0-100 */
  happiness: number
  /** 健康值 0-100 */
  health: number
  /** 精力值 0-100 */
  energy: number
  /** 亲密度 0-100 */
  intimacy: number
  /** 宠物年龄（天） */
  age: number
}

/** 宠物行为/动画状态 */
export type PetMood =
  | 'idle'       // 空闲
  | 'happy'      // 开心
  | 'sad'        // 难过
  | 'hungry'     // 饥饿
  | 'sleeping'   // 睡觉
  | 'eating'     // 吃东西
  | 'playing'    // 玩耍
  | 'walking'    // 走路
  | 'talking'    // 说话
  | 'excited'    // 兴奋

/** 宠物配置 */
export interface PetConfig {
  /** 宠物名字 */
  name: string
  /** 性格类型 */
  personality: 'lively' | 'tsundere' | 'gentle' | 'chatty'
  /** 模型路径 */
  modelPath: string
  /** 缩放比例 */
  scale: number
}

/** 默认宠物属性 */
export const DEFAULT_PET_STATS: PetStats = {
  hunger: 80,
  happiness: 80,
  health: 100,
  energy: 100,
  intimacy: 0,
  age: 0,
}

/** 默认宠物配置 */
export const DEFAULT_PET_CONFIG: PetConfig = {
  name: '小宠物',
  personality: 'lively',
  modelPath: '',
  scale: 1.0,
}
