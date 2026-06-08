import { app, BrowserWindow, ipcMain, screen } from 'electron'
import { exec } from 'child_process'
import { readFileSync, writeFileSync, existsSync } from 'fs'
import { join } from 'path'

export function registerIpcHandlers(mainWindow: BrowserWindow): void {
  /**
   * 窗口鼠标事件穿透控制
   * 当鼠标在宠物区域时可交互，其他区域穿透到桌面
   */
  ipcMain.on('set-ignore-mouse-events', (_event, ignore: boolean, options?: { forward: boolean }) => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.setIgnoreMouseEvents(ignore, { forward: options?.forward ?? true })
    }
  })

  /**
   * 移动窗口位置（拖拽用）
   */
  ipcMain.on('move-window', (_event, deltaX: number, deltaY: number) => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      const [x, y] = mainWindow.getPosition()
      mainWindow.setPosition(x + deltaX, y + deltaY)
    }
  })

  /**
   * 获取窗口位置
   */
  ipcMain.handle('get-window-position', () => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      return mainWindow.getPosition()
    }
    return [0, 0]
  })

  /**
   * 设置窗口位置
   */
  ipcMain.on('set-window-position', (_event, x: number, y: number) => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.setPosition(x, y)
    }
  })

  /**
   * 获取屏幕尺寸
   */
  ipcMain.handle('get-screen-size', () => {
    const { width, height } = screen.getPrimaryDisplay().workAreaSize
    return { width, height }
  })

  /**
   * 切换窗口显示/隐藏
   */
  ipcMain.on('toggle-window', () => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      if (mainWindow.isVisible()) {
        mainWindow.hide()
      } else {
        mainWindow.show()
        mainWindow.setAlwaysOnTop(true)
      }
    }
  })

  /**
   * 显示设置面板（通知渲染进程）
   */
  ipcMain.on('open-settings', () => {
    mainWindow?.webContents.send('open-settings')
  })

  /**
   * 获取系统信息（CPU/内存/GPU/磁盘）
   */
  ipcMain.handle('get-system-info', async () => {
    const runCmd = (cmd: string): Promise<string> => {
      return new Promise((resolve) => {
        exec(cmd, { timeout: 5000 }, (_err, stdout) => {
          resolve(stdout || '')
        })
      })
    }

    if (process.platform === 'win32') {
      // 并行获取所有系统信息
      const [cpuOut, memOut, gpuOut, diskOut] = await Promise.all([
        runCmd('wmic cpu get loadpercentage /value'),
        runCmd('wmic OS get FreePhysicalMemory,TotalVisibleMemorySize /value'),
        runCmd('wmic path win32_videocontroller get name,loadpercentage /value'),
        runCmd('wmic logicaldisk where "DriveType=3" get size,freespace,caption /value'),
      ])

      // CPU
      const cpuMatch = cpuOut.match(/LoadPercentage=(\d+)/)
      const cpuUsage = cpuMatch ? parseInt(cpuMatch[1]) : 0

      // 内存
      const freeMatch = memOut.match(/FreePhysicalMemory=(\d+)/)
      const totalMatch = memOut.match(/TotalVisibleMemorySize=(\d+)/)
      const freeMem = freeMatch ? parseInt(freeMatch[1]) : 0
      const totalMem = totalMatch ? parseInt(totalMatch[1]) : 1
      const memUsage = Math.round(((totalMem - freeMem) / totalMem) * 100)
      const memTotalGB = (totalMem / 1048576).toFixed(1)
      const memFreeGB = (freeMem / 1048576).toFixed(1)

      // GPU
      const gpuLoadMatch = gpuOut.match(/LoadPercentage=(\d+)/)
      const gpuNameMatch = gpuOut.match(/Name=(.+)/)
      const gpuUsage = gpuLoadMatch ? parseInt(gpuLoadMatch[1]) : 0
      const gpuName = gpuNameMatch ? gpuNameMatch[1].trim() : '未知'

      // 磁盘（取第一个磁盘）
      const diskFreeMatch = diskOut.match(/FreeSpace=(\d+)/)
      const diskTotalMatch = diskOut.match(/Size=(\d+)/)
      const diskCaptionMatch = diskOut.match(/Caption=(.+)/)
      const diskFree = diskFreeMatch ? parseInt(diskFreeMatch[1]) : 0
      const diskTotal = diskTotalMatch ? parseInt(diskTotalMatch[1]) : 1
      const diskUsage = Math.round(((diskTotal - diskFree) / diskTotal) * 100)
      const diskCaption = diskCaptionMatch ? diskCaptionMatch[1].trim() : 'C:'
      const diskTotalGB = (diskTotal / 1073741824).toFixed(0)
      const diskFreeGB = (diskFree / 1073741824).toFixed(0)

      return {
        cpuUsage,
        memUsage,
        memTotalGB,
        memFreeGB,
        gpuUsage,
        gpuName,
        diskUsage,
        diskCaption,
        diskTotalGB,
        diskFreeGB,
      }
    } else {
      // macOS/Linux 简化版
      return { cpuUsage: 0, memUsage: 0, memTotalGB: '0', memFreeGB: '0', gpuUsage: 0, gpuName: '未知', diskUsage: 0, diskCaption: '/', diskTotalGB: '0', diskFreeGB: '0' }
    }
  })

  /**
   * AI 对话 - 小米 MIMO
   */
  ipcMain.handle('ai-chat', async (_event, _provider: string, messages: { role: string; content: string }[], options?: { temperature?: number; maxTokens?: number }) => {
    const apiKey = globalApiKey['mimo'] || ''
    if (!apiKey) throw new Error('未配置 MIMO API Key，请在设置中填写')

    const response = await fetch('https://api.xiaomimimo.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'mimo-v2.5-pro',
        messages,
        temperature: options?.temperature ?? 0.8,
        max_tokens: options?.maxTokens ?? 200,
      }),
    })

    if (!response.ok) {
      const err = await response.text()
      throw new Error(`MIMO API error: ${response.status} ${err}`)
    }

    const data = await response.json()
    return data.choices[0].message.content
  })

  /**
   * 语音识别 (ASR) - 音频转文字
   */
  ipcMain.handle('ai-asr', async (_event, audioBase64: string) => {
    const apiKey = globalApiKey['mimo'] || ''
    if (!apiKey) throw new Error('未配置 MIMO API Key')

    const response = await fetch('https://api.xiaomimimo.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'mimo-v2.5-asr',
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'input_audio',
                input_audio: {
                  data: `data:audio/wav;base64,${audioBase64}`,
                },
              },
            ],
          },
        ],
        extra_body: {
          asr_options: { language: 'auto' },
        },
      }),
    })

    if (!response.ok) {
      const err = await response.text()
      throw new Error(`ASR API error: ${response.status} ${err}`)
    }

    const data = await response.json()
    return data.choices[0].message.content
  })

  /**
   * 语音合成 (TTS) - 文字转语音
   * 返回 base64 编码的 PCM16 音频数据
   */
  ipcMain.handle('ai-tts', async (_event, text: string) => {
    const apiKey = globalApiKey['mimo'] || ''
    if (!apiKey) throw new Error('未配置 MIMO API Key')

    const response = await fetch('https://api.xiaomimimo.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'mimo-v2.5-tts',
        messages: [
          {
            role: 'user',
            content: '用活泼可爱的语气说',
          },
          {
            role: 'assistant',
            content: text,
          },
        ],
        audio: {
          format: 'pcm16',
          voice: 'Chloe',
        },
        stream: false,
      }),
    })

    if (!response.ok) {
      const err = await response.text()
      throw new Error(`TTS API error: ${response.status} ${err}`)
    }

    const data = await response.json()
    // 非流式返回时，音频数据在 message.audio.data 中
    const audioData = data.choices[0].message.audio
    if (audioData && audioData.data) {
      return audioData.data // base64 编码的 PCM16 数据
    }
    throw new Error('TTS 返回无音频数据')
  })

  /**
   * 保存/读取 API Key
   */
  ipcMain.on('set-api-key', (_event, provider: string, key: string) => {
    globalApiKey[provider] = key
    saveConfig(globalApiKey)
  })

  ipcMain.handle('get-api-key', (_event, provider: string) => {
    return globalApiKey[provider] || ''
  })

  /**
   * 开机自启
   */
  ipcMain.handle('get-auto-launch', () => {
    return app.getLoginItemSettings().openAtLogin
  })

  ipcMain.on('set-auto-launch', (_event, enabled: boolean) => {
    app.setLoginItemSettings({
      openAtLogin: enabled,
      path: app.getPath('exe'),
    })
  })

  /**
   * 窗口透明度
   */
  ipcMain.on('set-window-opacity', (_event, opacity: number) => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.setOpacity(opacity)
    }
  })
}

// 配置文件路径
const configPath = join(app.getAppPath(), '..', '..', 'config.json')

// 读取配置
function loadConfig(): Record<string, string> {
  try {
    if (existsSync(configPath)) {
      return JSON.parse(readFileSync(configPath, 'utf-8'))
    }
  } catch (e) {
    console.error('Failed to load config:', e)
  }
  return {}
}

// 保存配置
function saveConfig(config: Record<string, string>): void {
  try {
    writeFileSync(configPath, JSON.stringify(config, null, 2), 'utf-8')
  } catch (e) {
    console.error('Failed to save config:', e)
  }
}

// 全局 API Key（从配置文件加载）
const globalApiKey: Record<string, string> = loadConfig()
