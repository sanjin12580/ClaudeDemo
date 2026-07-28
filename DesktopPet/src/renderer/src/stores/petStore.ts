/**
 * 宠物状态管理 - 管理宠物属性、心情、配置
 * 使用 localStorage 手动持久化
 */

import { create } from 'zustand'
import { PetStats, PetMood, PetConfig, DEFAULT_PET_STATS, DEFAULT_PET_CONFIG } from '../types/pet'

interface PetState {
  stats: PetStats
  mood: PetMood
  config: PetConfig
  isInteracting: boolean
  showStatusBar: boolean

  updateStats: (partial: Partial<PetStats>) => void
  setMood: (mood: PetMood) => void
  setConfig: (partial: Partial<PetConfig>) => void
  setInteracting: (value: boolean) => void
  setShowStatusBar: (value: boolean) => void
  resetStats: () => void
}

const STORAGE_KEY = 'desktoppet-pet'

function loadSaved(): { stats?: PetStats; config?: PetConfig } {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) return JSON.parse(raw)
  } catch {}
  return {}
}

function save(state: PetState): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ stats: state.stats, config: state.config }))
  } catch {}
}

const saved = loadSaved()

export const usePetStore = create<PetState>()((set, get) => ({
  stats: saved.stats ?? { ...DEFAULT_PET_STATS },
  mood: 'idle',
  config: saved.config ?? { ...DEFAULT_PET_CONFIG },
  isInteracting: false,
  showStatusBar: false,

  updateStats: (partial) => {
    set((state) => ({
      stats: {
        ...state.stats,
        ...partial,
        hunger: Math.max(0, Math.min(100, partial.hunger ?? state.stats.hunger)),
        happiness: Math.max(0, Math.min(100, partial.happiness ?? state.stats.happiness)),
        health: Math.max(0, Math.min(100, partial.health ?? state.stats.health)),
        energy: Math.max(0, Math.min(100, partial.energy ?? state.stats.energy)),
        intimacy: Math.max(0, Math.min(100, partial.intimacy ?? state.stats.intimacy)),
      },
    }))
    save(get())
  },

  setMood: (mood) => set({ mood }),

  setConfig: (partial) => {
    set((state) => ({ config: { ...state.config, ...partial } }))
    save(get())
  },

  setInteracting: (value) => set({ isInteracting: value }),
  setShowStatusBar: (value) => set({ showStatusBar: value }),
  resetStats: () => { set({ stats: { ...DEFAULT_PET_STATS } }); save(get()) },
}))
