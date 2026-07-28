/**
 * 对话状态管理 — 使用 localStorage 手动持久化消息
 */

import { create } from 'zustand'

export interface ChatMessage {
  id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  timestamp: number
}

interface ChatState {
  messages: ChatMessage[]
  isWaiting: boolean
  isOpen: boolean
  error: string | null

  addMessage: (msg: Omit<ChatMessage, 'id' | 'timestamp'>) => void
  setWaiting: (value: boolean) => void
  setOpen: (value: boolean) => void
  setError: (error: string | null) => void
  clearMessages: () => void
}

const STORAGE_KEY = 'desktoppet-chat'

function loadSaved(): ChatMessage[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) return JSON.parse(raw)
  } catch {}
  return []
}

function save(messages: ChatMessage[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(messages.slice(-50)))
  } catch {}
}

let msgIdCounter = Date.now()

export const useChatStore = create<ChatState>()((set, get) => ({
  messages: loadSaved(),
  isWaiting: false,
  isOpen: false,
  error: null,

  addMessage: (msg) => {
    set((state) => ({
      messages: [
        ...state.messages,
        { ...msg, id: `msg-${++msgIdCounter}`, timestamp: Date.now() },
      ].slice(-50),
    }))
    save(get().messages)
  },

  setWaiting: (value) => set({ isWaiting: value }),
  setOpen: (value) => set({ isOpen: value }),
  setError: (error) => set({ error }),
  clearMessages: () => { set({ messages: [] }); save([]) },
}))
