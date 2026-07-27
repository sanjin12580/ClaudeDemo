/**
 * ContextMenu - 右键菜单
 *
 * 打开时设置 overlay 标志，关闭时清除。
 */

import React, { useState, useEffect, useCallback } from 'react'
import { eventBus } from '../../core/EventBus'
import { setOverlayOpen } from '../../core/overlayState'
import { usePetStore } from '../../stores/petStore'
import { useSettingsStore } from '../../stores/settingsStore'
import { useChatStore } from '../../stores/chatStore'

interface MenuItemData {
  label: string
  icon?: string
  action?: string
  separator?: boolean
}

const MENU_ITEMS: MenuItemData[] = [
  { label: '喂食', icon: '🍖', action: 'feed' },
  { label: '聊天', icon: '💬', action: 'chat' },
  { separator: true, label: '' },
  { label: '番茄钟', icon: '🍅', action: 'tool:pomodoro' },
  { separator: true, label: '' },
  { label: '更换形象', icon: '🎨', action: 'change-avatar' },
  { label: '设置', icon: '⚙️', action: 'open-settings' },
  { label: '隐藏宠物', icon: '👋', action: 'hide-pet' },
]

const ContextMenu: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false)
  const [position, setPosition] = useState({ x: 0, y: 0 })

  // 右键打开菜单
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      e.preventDefault()
      setPosition({ x: e.clientX, y: e.clientY })
      setIsOpen(true)
      setOverlayOpen(true)
    }
    document.addEventListener('contextmenu', handler)
    return () => document.removeEventListener('contextmenu', handler)
  }, [])

  // 关闭菜单
  const closeMenu = useCallback(() => {
    setIsOpen(false)
    setOverlayOpen(false)
  }, [])

  // 点击菜单项
  const handleItemClick = useCallback((item: MenuItemData, e: React.MouseEvent) => {
    e.stopPropagation()
    if (item.separator || !item.action) return

    switch (item.action) {
      case 'feed':
        usePetStore.getState().updateStats({ hunger: 100 })
        usePetStore.getState().setMood('eating')
        eventBus.emit('pet:action', { action: 'eating' })
        setTimeout(() => usePetStore.getState().setMood('happy'), 2000)
        setTimeout(() => usePetStore.getState().setMood('idle'), 4000)
        break
      case 'open-settings':
        useSettingsStore.getState().setOpen(true)
        break
      case 'chat':
        setIsOpen(false)
        requestAnimationFrame(() => {
          useChatStore.getState().setOpen(true)
          setOverlayOpen(true)
        })
        return
      case 'change-avatar':
        setIsOpen(false)
        requestAnimationFrame(() => {
          eventBus.emit('avatar:open-selector')
        })
        return
      case 'hide-pet':
        window.api.toggleWindow()
        break
      default:
        if (item.action.startsWith('tool:')) {
          // 工具类：只关闭菜单，不恢复穿透（工具面板自己管理）
          setIsOpen(false)
          eventBus.emit('tool:open', { toolId: item.action.replace('tool:', '') })
          return
        }
        break
    }

    closeMenu()
  }, [closeMenu])

  if (!isOpen) return null

  return (
    <>
      {/* 透明全屏遮罩 — 无背景，仅拦截点击 */}
      <div
        onClick={closeMenu}
        onContextMenu={(e) => { e.preventDefault(); e.stopPropagation() }}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 999,
          background: 'transparent',
        }}
      />

      {/* 菜单本体 */}
      <div
        className="context-menu"
        style={{
          left: Math.min(position.x, window.innerWidth - 180),
          top: Math.min(position.y, window.innerHeight - 300),
          zIndex: 1000
        }}
      >
        {MENU_ITEMS.map((item, index) => {
          if (item.separator) {
            return <div key={index} className="context-menu-separator" />
          }
          return (
            <div
              key={index}
              className="context-menu-item"
              onClick={(e) => handleItemClick(item, e)}
            >
              <span style={{ marginRight: 8 }}>{item.icon}</span>
              {item.label}
            </div>
          )
        })}
      </div>
    </>
  )
}

export default ContextMenu
