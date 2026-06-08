/**
 * ChatInput - 对话输入框（支持语音输入）
 */

import React, { useState, useRef, useEffect } from 'react'

interface ChatInputProps {
  onSend: (text: string) => void
  onVoice: () => void
  isRecording: boolean
  disabled: boolean
}

const ChatInput: React.FC<ChatInputProps> = ({ onSend, onVoice, isRecording, disabled }) => {
  const [text, setText] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  const handleSend = () => {
    const trimmed = text.trim()
    if (!trimmed || disabled) return
    onSend(trimmed)
    setText('')
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  return (
    <div style={styles.container}>
      {/* 语音按钮 */}
      <button
        onClick={onVoice}
        disabled={disabled}
        style={{
          ...styles.voiceBtn,
          background: isRecording ? '#e74c3c' : '#f0f0f0',
          color: isRecording ? '#fff' : '#666',
        }}
        title={isRecording ? '点击停止录音' : '点击开始录音'}
      >
        {isRecording ? '⏹' : '🎤'}
      </button>

      <input
        ref={inputRef}
        type="text"
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={disabled ? '等待回复中...' : '输入消息或按🎤说话...'}
        disabled={disabled}
        style={styles.input}
      />
      <button
        onClick={handleSend}
        disabled={disabled || !text.trim()}
        style={{
          ...styles.sendBtn,
          opacity: (disabled || !text.trim()) ? 0.5 : 1,
        }}
      >
        发送
      </button>
    </div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    display: 'flex',
    gap: 6,
    padding: '8px 0 0 0',
    borderTop: '1px solid #eee',
    alignItems: 'center',
  },
  voiceBtn: {
    border: 'none',
    borderRadius: 20,
    width: 36,
    height: 36,
    fontSize: 16,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  input: {
    flex: 1,
    border: '1px solid #ddd',
    borderRadius: 8,
    padding: '8px 12px',
    fontSize: 13,
    outline: 'none',
    background: 'rgba(255,255,255,0.8)',
  },
  sendBtn: {
    border: 'none',
    borderRadius: 8,
    padding: '8px 16px',
    background: '#6495ed',
    color: '#fff',
    fontSize: 13,
    cursor: 'pointer',
    fontWeight: 500,
    flexShrink: 0,
  },
}

export default ChatInput
