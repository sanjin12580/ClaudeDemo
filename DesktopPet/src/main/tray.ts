import { Tray, Menu, BrowserWindow, app, nativeImage } from 'electron'
import { join } from 'path'

export function createTray(mainWindow: BrowserWindow): Tray {
  // 创建托盘图标（使用简单图标，后续替换为自定义图标）
  const iconPath = join(__dirname, '../../resources/icon.png')
  let trayIcon: Electron.NativeImage

  try {
    trayIcon = nativeImage.createFromPath(iconPath)
  } catch {
    // 如果图标文件不存在，创建一个 16x16 的空图标
    trayIcon = nativeImage.createEmpty()
  }

  const tray = new Tray(trayIcon.resize({ width: 16, height: 16 }))

  const contextMenu = Menu.buildFromTemplate([
    {
      label: '显示宠物',
      click: () => {
        mainWindow.show()
        mainWindow.setAlwaysOnTop(true)
      }
    },
    {
      label: '隐藏宠物',
      click: () => mainWindow.hide()
    },
    { type: 'separator' },
    {
      label: '设置',
      click: () => {
        mainWindow.webContents.send('open-settings')
      }
    },
    { type: 'separator' },
    {
      label: '退出 DesktopPet',
      click: () => {
        app.quit()
      }
    }
  ])

  tray.setToolTip('DesktopPet - 桌面宠物')
  tray.setContextMenu(contextMenu)

  // 双击托盘图标显示/隐藏窗口
  tray.on('double-click', () => {
    if (mainWindow.isVisible()) {
      mainWindow.hide()
    } else {
      mainWindow.show()
      mainWindow.setAlwaysOnTop(true)
    }
  })

  return tray
}
