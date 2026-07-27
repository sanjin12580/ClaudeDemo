/**
 * 形象状态管理 - 当前选中的形象
 * 使用 localStorage 手动持久化
 */

import { create } from 'zustand'
import { AvatarId } from '../types/avatar'

interface AvatarState {
  /** 当前选中的形象 ID */
  currentAvatarId: AvatarId
  /** 形象选择面板是否打开 */
  isSelectorOpen: boolean

  // Actions
  setAvatar: (id: AvatarId) => void
  setSelectorOpen: (open: boolean) => void
}

const STORAGE_KEY = 'desktoppet-avatar'

function loadSaved(): AvatarId | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) return JSON.parse(raw) as AvatarId
  } catch {}
  return null
}

function saveAvatar(id: AvatarId): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(id))
  } catch {}
}

const savedAvatar = loadSaved()

export const useAvatarStore = create<AvatarState>((set) => ({
  currentAvatarId: savedAvatar ?? 'totoro',
  isSelectorOpen: false,

  setAvatar: (id) => {
    set({ currentAvatarId: id })
    saveAvatar(id)
  },
  setSelectorOpen: (open) => set({ isSelectorOpen: open }),
}))
