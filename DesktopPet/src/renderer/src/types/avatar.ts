/**
 * 形象系统类型定义
 */

import * as THREE from 'three'
import { PetMood } from './pet'

/** 形象 ID */
export type AvatarId = 'totoro' | 'dog' | 'ghost'

/** 形象定义 */
export interface AvatarDefinition {
  /** 唯一标识 */
  id: AvatarId
  /** 显示名称 */
  name: string
  /** 缩略图 emoji */
  icon: string
  /** 形象描述 */
  description: string
  /** 3D 组件（懒加载） */
  component: React.LazyExoticComponent<React.ComponentType<AvatarProps>>
}

/** 所有形象组件共享的 Props */
export interface AvatarProps {
  /** 当前心情状态 */
  mood: PetMood
  /** 点击特效触发 */
  clickEffect: boolean
  /** 显示表情气泡 */
  showEmoji: boolean
  /** 主体 mesh ref（用于呼吸缩放动画） */
  bodyRef: React.RefObject<THREE.Mesh | null>
}
