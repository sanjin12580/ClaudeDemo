/**
 * 对话状态管理
 */

import { create } from 'zustand'

export interface ChatMessage {
  id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  timestamp: number
}

interface ChatState {
  /** 对话历史 */
  messages: ChatMessage[]
  /** 是否正在等待 AI 回复 */
  isWaiting: boolean
  /** 对话面板是否打开 */
  isOpen: boolean
  /** 错误信息 */
  error: string | null

  addMessage: (msg: Omit<ChatMessage, 'id' | 'timestamp'>) => void
  setWaiting: (value: boolean) => void
  setOpen: (value: boolean) => void
  setError: (error: string | null) => void
  clearMessages: () => void
}

let msgIdCounter = 0

export const useChatStore = create<ChatState>((set) => ({
  messages: [],
  isWaiting: false,
  isOpen: false,
  error: null,

  addMessage: (msg) =>
    set((state) => ({
      messages: [
        ...state.messages,
        {
          ...msg,
          id: `msg-${++msgIdCounter}`,
          timestamp: Date.now(),
        },
      ].slice(-50), // 保留最近 50 条
    })),

  setWaiting: (value) => set({ isWaiting: value }),
  setOpen: (value) => set({ isOpen: value }),
  setError: (error) => set({ error }),
  clearMessages: () => set({ messages: [] }),
}))
