/**
 * ChatWindow - 对话窗口（支持语音对话）
 *
 * 文字对话 + 语音输入（ASR）+ 语音回复（TTS）
 */

import React, { useEffect, useRef, useCallback, useState } from 'react'
import { useChatStore } from '../../stores/chatStore'
import { usePetStore } from '../../stores/petStore'
import { useSettingsStore } from '../../stores/settingsStore'
import { setOverlayOpen } from '../../core/overlayState'
import { createAIService } from '../../services/ai/AIServiceFactory'
import { recordAudio, stopRecording, playPcm16Audio } from '../../utils/voice'
import { eventBus } from '../../core/EventBus'
import ChatBubble from './ChatBubble'
import ChatInput from './ChatInput'

/** 宠物人设 System Prompt */
function getSystemPrompt(petName: string, personality: string): string {
  const personalityMap: Record<string, string> = {
    lively: '你是一只活泼可爱的桌面宠物，说话充满活力，喜欢用颜文字和感叹号！',
    tsundere: '你是一只傲娇的桌面宠物，表面上不在乎主人，其实很关心。说话偶尔带点小脾气。',
    gentle: '你是一只温柔的桌面宠物，说话轻声细语，总是很体贴地关心主人。',
    chatty: '你是一只话痨的桌面宠物，特别爱聊天，总是有说不完的话。',
  }

  return `你是${petName}，${personalityMap[personality] || personalityMap.lively}
你生活在主人的电脑桌面上，是一只可爱的桌面宠物。
回复要简短（不超过100字），口语化，像朋友聊天一样。
可以用表情符号，但不要太多。`
}

const ChatWindow: React.FC = () => {
  const isOpen = useChatStore((s) => s.isOpen)
  const messages = useChatStore((s) => s.messages)
  const isWaiting = useChatStore((s) => s.isWaiting)
  const addMessage = useChatStore((s) => s.addMessage)
  const setWaiting = useChatStore((s) => s.setWaiting)
  const setOpen = useChatStore((s) => s.setOpen)
  const setError = useChatStore((s) => s.setError)

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const [isRecording, setIsRecording] = useState(false)
  const [isSpeaking, setIsSpeaking] = useState(false)

  // 自动滚动到底部
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // 打开时禁用穿透
  useEffect(() => {
    if (isOpen) {
      setOverlayOpen(true)
    }
  }, [isOpen])

  // 发送消息并获取语音回复
  const handleSend = useCallback(async (text: string, fromVoice = false) => {
    addMessage({ role: 'user', content: text })
    setWaiting(true)
    setError(null)
    usePetStore.getState().setMood('talking')

    try {
      const service = createAIService()
      const settings = useSettingsStore.getState()
      const petName = settings.petName || usePetStore.getState().config.name
      const personality = settings.personality || usePetStore.getState().config.personality

      const chatMessages = [
        { role: 'system', content: getSystemPrompt(petName, personality) },
        ...messages.slice(-10).map((m) => ({ role: m.role, content: m.content })),
        { role: 'user', content: text },
      ]

      const reply = await service.chat(chatMessages)
      addMessage({ role: 'assistant', content: reply })

      // TTS：语音播放回复（检查声音设置）
      const soundEnabled = useSettingsStore.getState().soundEnabled
      if (soundEnabled) {
        try {
          setIsSpeaking(true)
          const audioBase64 = await window.api.aiTts(reply)
          await playPcm16Audio(audioBase64)
        } catch (ttsErr) {
          console.warn('TTS 失败，仅显示文字:', ttsErr)
        } finally {
          setIsSpeaking(false)
        }
      }

      usePetStore.getState().setMood('happy')
      setTimeout(() => usePetStore.getState().setMood('idle'), 3000)
    } catch (err: any) {
      setError(err.message)
      addMessage({ role: 'assistant', content: `抱歉，暂时无法回复 😢 ${err.message}` })
      usePetStore.getState().setMood('sad')
    } finally {
      setWaiting(false)
    }
  }, [messages, addMessage, setWaiting, setError])

  // 语音输入
  const handleVoice = useCallback(async () => {
    if (isRecording) {
      // 停止录音
      stopRecording()
      setIsRecording(false)
      return
    }

    // 开始录音
    setIsRecording(true)
    try {
      const audioBase64 = await recordAudio(5000) // 最长 5 秒
      setIsRecording(false)

      // 语音识别
      setWaiting(true)
      const text = await window.api.aiAsr(audioBase64)
      setWaiting(false)

      if (text && text.trim()) {
        // 识别成功，发送消息
        await handleSend(text.trim(), true)
      }
    } catch (err: any) {
      setIsRecording(false)
      setWaiting(false)
      console.error('语音识别失败:', err)
      setError(`语音识别失败: ${err.message}`)
    }
  }, [isRecording, handleSend, setWaiting, setError])

  const handleClose = () => {
    if (isRecording) stopRecording()
    setOpen(false)
    setOverlayOpen(false)
  }

  if (!isOpen) return null

  return (
    <>
      <div
        onClick={handleClose}
        onContextMenu={(e) => { e.preventDefault(); e.stopPropagation() }}
        style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0, 0, 0, 0.15)',
          zIndex: 998,
        }}
      />

      <div style={styles.window} onClick={(e) => e.stopPropagation()}>
        {/* 标题栏 */}
        <div style={styles.titleBar}>
          <span>
            💬 聊天
            {isSpeaking && <span style={{ fontSize: 11, color: '#e74c3c', marginLeft: 8 }}>🔊 播放中...</span>}
          </span>
          <span onClick={handleClose} style={styles.closeBtn}>✕</span>
        </div>

        {/* 消息列表 */}
        <div style={styles.messageList}>
          {messages.length === 0 && (
            <div style={styles.emptyHint}>
              和宠物打个招呼吧！👋<br/>
              <span style={{ fontSize: 11, color: '#bbb' }}>支持文字和语音对话 🎤</span>
            </div>
          )}
          {messages.map((msg) => (
            <ChatBubble key={msg.id} message={msg} />
          ))}
          {isWaiting && (
            <div style={styles.waiting}>宠物正在思考...</div>
          )}
          {isRecording && (
            <div style={styles.recording}>🎤 正在录音... 再点🎤停止</div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* 输入框 */}
        <ChatInput
          onSend={(text) => handleSend(text)}
          onVoice={handleVoice}
          isRecording={isRecording}
          disabled={isWaiting}
        />
      </div>
    </>
  )
}

const styles: Record<string, React.CSSProperties> = {
  window: {
    position: 'fixed',
    bottom: 10,
    right: 10,
    width: 340,
    maxHeight: 480,
    background: 'rgba(245, 245, 245, 0.95)',
    borderRadius: 16,
    padding: 16,
    boxShadow: '0 8px 40px rgba(0, 0, 0, 0.2)',
    backdropFilter: 'blur(10px)',
    zIndex: 1000,
    display: 'flex',
    flexDirection: 'column',
  },
  titleBar: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    fontSize: 14,
    fontWeight: 600,
    color: '#333',
  },
  closeBtn: {
    cursor: 'pointer',
    fontSize: 16,
    color: '#999',
    padding: '2px 6px',
    borderRadius: 4,
  },
  messageList: {
    flex: 1,
    overflowY: 'auto',
    maxHeight: 340,
    marginBottom: 8,
  },
  emptyHint: {
    textAlign: 'center',
    color: '#999',
    fontSize: 13,
    padding: 40,
  },
  waiting: {
    textAlign: 'left',
    color: '#999',
    fontSize: 12,
    fontStyle: 'italic',
    paddingLeft: 4,
  },
  recording: {
    textAlign: 'center',
    color: '#e74c3c',
    fontSize: 12,
    fontWeight: 500,
    padding: 8,
    background: 'rgba(231, 76, 60, 0.1)',
    borderRadius: 8,
    margin: '4px 0',
  },
}

export default ChatWindow
