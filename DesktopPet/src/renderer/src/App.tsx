/**
 * App - 应用入口
 *
 * 组装所有核心组件：3D 宠物场景、状态栏、右键菜单。
 * 初始化养成引擎和插件系统。
 */

import React, { useEffect, useRef } from 'react'
import PetScene from './components/Pet3D/PetScene'
import StatusBars from './components/StatusBar/StatusBars'
import ContextMenu from './components/ContextMenu/ContextMenu'
import AvatarSelector from './components/AvatarSelector/AvatarSelector'
import ToolsContainer from './components/Tools/ToolsContainer'
import SystemInfoBar from './components/StatusBar/SystemInfoBar'
import ChatWindow from './components/ChatPanel/ChatWindow'
import SettingsPanel from './components/Settings/SettingsPanel'
import { usePetStore } from './stores/petStore'
import { useChatStore } from './stores/chatStore'
import { useAvatarStore } from './stores/avatarStore'
import { setOverlayOpen } from './core/overlayState'
import { eventBus } from './core/EventBus'

/**
 * 养成系统引擎 - 属性衰减 + 主动说话
 */
function useNurturingEngine() {
  const updateStats = usePetStore((s) => s.updateStats)
  const lastSpeechRef = useRef(0)

  useEffect(() => {
    const decayInterval = setInterval(() => {
      const currentStats = usePetStore.getState().stats
      updateStats({
        hunger: currentStats.hunger - 0.5,
        happiness: currentStats.happiness - 0.3,
        energy: currentStats.energy - 0.2,
      })
      if (currentStats.hunger < 10) {
        updateStats({ health: currentStats.health - 0.5 })
      }
      if (currentStats.energy < 30) {
        updateStats({ energy: currentStats.energy + 0.1 })
      }
      updateStats({ age: currentStats.age + 1 / 1440 })

      // 主动说话：状态低时提醒（每 5 分钟最多一次）
      const now = Date.now()
      if (now - lastSpeechRef.current > 5 * 60 * 1000) {
        const stats = usePetStore.getState().stats
        const chatOpen = useChatStore.getState().isOpen

        if (!chatOpen) {
          if (stats.hunger < 20) {
            eventBus.emit('pet:speech', { text: '我好饿呀...能喂我点吃的吗？🍖' })
            lastSpeechRef.current = now
          } else if (stats.happiness < 25) {
            eventBus.emit('pet:speech', { text: '有点无聊...能陪我玩一会吗？😢' })
            lastSpeechRef.current = now
          } else if (stats.energy < 15) {
            eventBus.emit('pet:speech', { text: '好困...我要休息一下 😴' })
            lastSpeechRef.current = now
          }
        }
      }
    }, 60000)

    return () => clearInterval(decayInterval)
  }, [updateStats])
}

/**
 * 定时问候
 */
function useGreeting() {
  const lastGreetingRef = useRef(0)

  useEffect(() => {
    const check = setInterval(() => {
      const now = new Date()
      const hour = now.getHours()
      const last = lastGreetingRef.current

      // 早上 8-9 点问候
      if (hour === 8 && last !== 8) {
        eventBus.emit('pet:speech', { text: '早上好！新的一天开始了！☀️' })
        lastGreetingRef.current = 8
      }
      // 下午 12-13 点问候
      if (hour === 12 && last !== 12) {
        eventBus.emit('pet:speech', { text: '中午好！记得吃午饭哦 🍱' })
        lastGreetingRef.current = 12
      }
      // 晚上 21-22 点问候
      if (hour === 21 && last !== 21) {
        eventBus.emit('pet:speech', { text: '晚上好！今天辛苦了，早点休息吧 🌙' })
        lastGreetingRef.current = 21
      }
    }, 60 * 1000) // 每分钟检查

    return () => clearInterval(check)
  }, [])
}

/**
 * 初始化事件监听
 */
function useEventListeners() {
  useEffect(() => {
    const unsubAvatar = eventBus.on('avatar:open-selector', () => {
      useAvatarStore.getState().setSelectorOpen(true)
      setOverlayOpen(true)
    })

    // 宠物主动说话（通过聊天窗口显示）
    const unsubSpeech = eventBus.on('pet:speech', (data: { text: string }) => {
      useChatStore.getState().addMessage({ role: 'assistant', content: data.text })
      useChatStore.getState().setOpen(true)
      setOverlayOpen(true)
      usePetStore.getState().setMood('talking')
      setTimeout(() => usePetStore.getState().setMood('idle'), 3000)
    })

    const unsubSettings = window.api.onOpenSettings(() => {
      console.log('Open settings requested')
    })

    return () => {
      unsubAvatar()
      unsubSpeech()
      unsubSettings()
    }
  }, [])
}

const App: React.FC = () => {
  useNurturingEngine()
  useGreeting()
  useEventListeners()

  return (
    <div style={{ width: '100vw', height: '100vh', position: 'relative', overflow: 'visible' }}>
      <StatusBars />
      <div style={{ width: '100%', height: '100%', position: 'absolute', top: 0, left: 0 }}>
        <PetScene />
        <SystemInfoBar />
      </div>
      <ContextMenu />
      <AvatarSelector />
      <ToolsContainer />
      <ChatWindow />
      <SettingsPanel />
    </div>
  )
}

export default App
