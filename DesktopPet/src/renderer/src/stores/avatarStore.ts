/**
 * 形象状态管理 - 当前选中的形象
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

export const useAvatarStore = create<AvatarState>((set) => ({
  currentAvatarId: 'totoro',
  isSelectorOpen: false,

  setAvatar: (id) => set({ currentAvatarId: id }),
  setSelectorOpen: (open) => set({ isSelectorOpen: open }),
}))
