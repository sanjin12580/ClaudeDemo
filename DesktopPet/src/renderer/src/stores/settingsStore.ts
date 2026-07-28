/**
 * 应用设置状态管理 — 使用 localStorage 手动持久化
 */

import { create } from 'zustand'

export type PetPersonality = 'lively' | 'tsundere' | 'gentle' | 'chatty'

interface SettingsState {
  petName: string
  personality: PetPersonality
  apiKey: string
  petScale: number
  petOpacity: number
  soundEnabled: boolean
  volume: number
  autoLaunch: boolean
  isOpen: boolean

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

const STORAGE_KEY = 'desktoppet-settings'

function loadSaved(): Partial<SettingsState> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) return JSON.parse(raw)
  } catch {}
  return {}
}

function save(state: SettingsState): void {
  try {
    const { isOpen, ...rest } = state
    localStorage.setItem(STORAGE_KEY, JSON.stringify(rest))
  } catch {}
}

const saved = loadSaved()

export const useSettingsStore = create<SettingsState>()((set, get) => {
  const defaultState: SettingsState = {
    petName: saved.petName ?? '小宠物',
    personality: saved.personality ?? 'lively',
    apiKey: saved.apiKey ?? '',
    petScale: saved.petScale ?? 1.0,
    petOpacity: saved.petOpacity ?? 1.0,
    soundEnabled: saved.soundEnabled ?? true,
    volume: saved.volume ?? 80,
    autoLaunch: saved.autoLaunch ?? false,
    isOpen: false,
    setPetName: (name) => { set({ petName: name }); save(get()) },
    setPersonality: (p) => { set({ personality: p }); save(get()) },
    setApiKey: (key) => { set({ apiKey: key }); save(get()) },
    setPetScale: (scale) => { const v = Math.max(0.5, Math.min(2.0, scale)); set({ petScale: v }); save(get()) },
    setPetOpacity: (opacity) => { const v = Math.max(0.3, Math.min(1.0, opacity)); set({ petOpacity: v }); save(get()) },
    setSoundEnabled: (value) => { set({ soundEnabled: value }); save(get()) },
    setVolume: (value) => { const v = Math.max(0, Math.min(100, value)); set({ volume: v }); save(get()) },
    setAutoLaunch: (value) => { set({ autoLaunch: value }); save(get()) },
    setOpen: (value) => { set({ isOpen: value }) },
  }
  return defaultState
})
