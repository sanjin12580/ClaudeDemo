/**
 * 宠物状态管理 - 管理宠物属性、心情、配置
 */

import { create } from 'zustand'
import { PetStats, PetMood, PetConfig, DEFAULT_PET_STATS, DEFAULT_PET_CONFIG } from '../types/pet'

interface PetState {
  /** 宠物属性 */
  stats: PetStats
  /** 当前心情/行为状态 */
  mood: PetMood
  /** 宠物配置 */
  config: PetConfig
  /** 是否正在交互 */
  isInteracting: boolean
  /** 显示状态栏 */
  showStatusBar: boolean

  // Actions
  updateStats: (partial: Partial<PetStats>) => void
  setMood: (mood: PetMood) => void
  setConfig: (partial: Partial<PetConfig>) => void
  setInteracting: (value: boolean) => void
  setShowStatusBar: (value: boolean) => void
  resetStats: () => void
}

export const usePetStore = create<PetState>((set) => ({
  stats: { ...DEFAULT_PET_STATS },
  mood: 'idle',
  config: { ...DEFAULT_PET_CONFIG },
  isInteracting: false,
  showStatusBar: false,

  updateStats: (partial) =>
    set((state) => ({
      stats: {
        ...state.stats,
        ...partial,
        // 确保值在 0-100 之间
        hunger: Math.max(0, Math.min(100, partial.hunger ?? state.stats.hunger)),
        happiness: Math.max(0, Math.min(100, partial.happiness ?? state.stats.happiness)),
        health: Math.max(0, Math.min(100, partial.health ?? state.stats.health)),
        energy: Math.max(0, Math.min(100, partial.energy ?? state.stats.energy)),
        intimacy: Math.max(0, Math.min(100, partial.intimacy ?? state.stats.intimacy)),
      },
    })),

  setMood: (mood) => set({ mood }),

  setConfig: (partial) =>
    set((state) => ({
      config: { ...state.config, ...partial },
    })),

  setInteracting: (value) => set({ isInteracting: value }),

  setShowStatusBar: (value) => set({ showStatusBar: value }),

  resetStats: () => set({ stats: { ...DEFAULT_PET_STATS } }),
}))
