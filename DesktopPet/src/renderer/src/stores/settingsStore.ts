/**
 * 应用设置状态管理
 */

import { create } from 'zustand'

export type PetPersonality = 'lively' | 'tsundere' | 'gentle' | 'chatty'

interface SettingsState {
  // 宠物个性化
  petName: string
  personality: PetPersonality

  // AI 设置
  apiKey: string

  // 外观设置
  petScale: number        // 0.5 - 2.0
  petOpacity: number      // 0.3 - 1.0

  // 声音设置
  soundEnabled: boolean
  volume: number          // 0 - 100

  // 系统设置
  autoLaunch: boolean

  // UI 状态
  isOpen: boolean

  // Actions
  setPetName: (name: string) => void
  setPersonality: (p: PetPersonality) => void
  setApiKey: (key: string) => void
  setPetScale: (scale: number) => void
  setPetOpacity: (opacity: number) => void
  setSoundEnabled: (value: boolean) => void
  setVolume: (value: number) => void
  setAutoLaunch: (value: boolean) => void
  setOpen: (value: boolean) => void
}

export const useSettingsStore = create<SettingsState>((set) => ({
  petName: '小宠物',
  personality: 'lively',
  apiKey: '',
  petScale: 1.0,
  petOpacity: 1.0,
  soundEnabled: true,
  volume: 80,
  autoLaunch: false,
  isOpen: false,

  setPetName: (name) => set({ petName: name }),
  setPersonality: (p) => set({ personality: p }),
  setApiKey: (key) => set({ apiKey: key }),
  setPetScale: (scale) => set({ petScale: Math.max(0.5, Math.min(2.0, scale)) }),
  setPetOpacity: (opacity) => set({ petOpacity: Math.max(0.3, Math.min(1.0, opacity)) }),
  setSoundEnabled: (value) => set({ soundEnabled: value }),
  setVolume: (value) => set({ volume: Math.max(0, Math.min(100, value)) }),
  setAutoLaunch: (value) => set({ autoLaunch: value }),
  setOpen: (value) => set({ isOpen: value }),
}))
