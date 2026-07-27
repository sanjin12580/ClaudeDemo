import { app, shell, BrowserWindow, Tray, screen } from 'electron'
import { join } from 'path'
import { is } from '@electron-toolkit/utils'
import { createTray } from './tray'
import { registerIpcHandlers } from './ipc-handlers'

// 全局引用，防止 GC 回收
let mainWindow: BrowserWindow | null = null
let tray: Tray | null = null

// 宠物窗口默认尺寸（需要足够大以容纳形象选择面板等 UI）
const PET_WINDOW_WIDTH = 400
const PET_WINDOW_HEIGHT = 500

function createPetWindow(): BrowserWindow {
  const { width: screenWidth, height: screenHeight } = screen.getPrimaryDisplay().workAreaSize

  mainWindow = new BrowserWindow({
    width: PET_WINDOW_WIDTH,
    height: PET_WINDOW_HEIGHT,
    x: screenWidth - PET_WINDOW_WIDTH - 50,
    y: screenHeight - PET_WINDOW_HEIGHT - 20,
    transparent: true,           // 透明背景
    frame: false,                // 无边框
    thickFrame: false,           // 去除 Windows 窗口白条/边框
    alwaysOnTop: true,           // 始终置顶
    resizable: false,
    skipTaskbar: true,           // 不在任务栏显示
    hasShadow: false,
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false,
      contextIsolation: true,
      nodeIntegration: false
    }
  })

  // 清空标题，防止 Windows 在透明窗口上渲染标题文字
  mainWindow.setTitle('')

  // 设置窗口忽略鼠标事件（非宠物区域穿透）
  // 渲染进程会通过 IPC 控制此行为
  mainWindow.on('ready-to-show', () => {
    mainWindow?.show()
  })

  // 防止 Windows DWM 在截图/失焦时重绘白条
  if (process.platform === 'win32') {
    mainWindow.on('blur', () => {
      mainWindow?.setBackgroundColor('#00000000')
    })
    mainWindow.on('focus', () => {
      mainWindow?.setBackgroundColor('#00000000')
    })
  }

  // 在 macOS 上设置窗口级别更高
  if (process.platform === 'darwin') {
    mainWindow.setAlwaysOnTop(true, 'floating')
    mainWindow.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true })
  }

  // 打开外部链接时用默认浏览器
  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  // 加载应用
  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }

  return mainWindow
}

// 应用初始化
app.whenReady().then(() => {
  // Windows: 设置 app user model id
  if (process.platform === 'win32') {
    app.setAppUserModelId(is.dev ? process.execPath : 'com.desktoppet.app')
  }

  // 创建宠物窗口
  createPetWindow()

  // 创建系统托盘
  tray = createTray(mainWindow!)

  // 注册 IPC 处理器
  registerIpcHandlers(mainWindow!)

  // macOS: 点击 dock 图标时重新显示窗口
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createPetWindow()
    } else {
      mainWindow?.show()
    }
  })
})

// 所有窗口关闭时的行为
app.on('window-all-closed', () => {
  // macOS 上通常不退出应用
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

// 导出供外部使用
export { mainWindow }
