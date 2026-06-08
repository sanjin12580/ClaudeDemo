/**
 * ChatBubble - 对话气泡
 */

import React from 'react'
import { ChatMessage } from '../../stores/chatStore'

interface ChatBubbleProps {
  message: ChatMessage
}

const ChatBubble: React.FC<ChatBubbleProps> = ({ message }) => {
  const isUser = message.role === 'user'

  return (
    <div style={{
      display: 'flex',
      justifyContent: isUser ? 'flex-end' : 'flex-start',
      marginBottom: 8,
    }}>
      <div style={{
        maxWidth: '80%',
        padding: '8px 12px',
        borderRadius: isUser ? '12px 12px 4px 12px' : '12px 12px 12px 4px',
        background: isUser ? '#6495ed' : 'rgba(255,255,255,0.9)',
        color: isUser ? '#fff' : '#333',
        fontSize: 13,
        lineHeight: 1.5,
        wordBreak: 'break-word',
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
      }}>
        {message.content}
      </div>
    </div>
  )
}

export default ChatBubble
