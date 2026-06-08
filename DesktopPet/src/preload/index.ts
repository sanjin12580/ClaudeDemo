import { contextBridge, ipcRenderer } from 'electron'

// 定义暴露给渲染进程的 API
export const api = {
  // 窗口鼠标穿透控制
  setIgnoreMouseEvents: (ignore: boolean, forward = true): void => {
    ipcRenderer.send('set-ignore-mouse-events', ignore, { forward })
  },

  // 窗口移动
  moveWindow: (deltaX: number, deltaY: number): void => {
    ipcRenderer.send('move-window', deltaX, deltaY)
  },

  // 获取窗口位置
  getWindowPosition: (): Promise<number[]> => {
    return ipcRenderer.invoke('get-window-position')
  },

  // 设置窗口位置
  setWindowPosition: (x: number, y: number): void => {
    ipcRenderer.send('set-window-position', x, y)
  },

  // 获取屏幕尺寸
  getScreenSize: (): Promise<{ width: number; height: number }> => {
    return ipcRenderer.invoke('get-screen-size')
  },

  // 切换窗口显示
  toggleWindow: (): void => {
    ipcRenderer.send('toggle-window')
  },

  // 打开设置面板
  openSettings: (): void => {
    ipcRenderer.send('open-settings')
  },

  // 监听主进程事件
  onOpenSettings: (callback: () => void): (() => void) => {
    const handler = (): void => callback()
    ipcRenderer.on('open-settings', handler)
    return () => ipcRenderer.removeListener('open-settings', handler)
  },

  // 获取系统信息 (CPU/内存/GPU/磁盘)
  getSystemInfo: (): Promise<any> => {
    return ipcRenderer.invoke('get-system-info')
  },

  // AI 对话
  aiChat: (provider: string, messages: { role: string; content: string }[], options?: { temperature?: number; maxTokens?: number }): Promise<string> => {
    return ipcRenderer.invoke('ai-chat', provider, messages, options)
  },

  // API Key 管理
  setApiKey: (provider: string, key: string): void => {
    ipcRenderer.send('set-api-key', provider, key)
  },
  getApiKey: (provider: string): Promise<string> => {
    return ipcRenderer.invoke('get-api-key', provider)
  },

  // 语音识别 (ASR)
  aiAsr: (audioBase64: string): Promise<string> => {
    return ipcRenderer.invoke('ai-asr', audioBase64)
  },

  // 语音合成 (TTS)
  aiTts: (text: string): Promise<string> => {
    return ipcRenderer.invoke('ai-tts', text)
  },

  // 开机自启
  getAutoLaunch: (): Promise<boolean> => {
    return ipcRenderer.invoke('get-auto-launch')
  },
  setAutoLaunch: (enabled: boolean): void => {
    ipcRenderer.send('set-auto-launch', enabled)
  },

  // 窗口透明度
  setWindowOpacity: (opacity: number): void => {
    ipcRenderer.send('set-window-opacity', opacity)
  },
}

// 通过 contextBridge 暴露 API 到渲染进程
if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('api', api)
  } catch (error) {
    console.error('Failed to expose API:', error)
  }
} else {
  // @ts-expect-error fallback for non-isolated context
  window.api = api
}
