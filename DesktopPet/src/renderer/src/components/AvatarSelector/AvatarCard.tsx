/**
 * AvatarCard - 形象卡片
 *
 * 单个形象的缩略图卡片，显示 emoji 图标、名称、选中状态。
 */

import React from 'react'
import { AvatarDefinition } from '../../types/avatar'

interface AvatarCardProps {
  avatar: AvatarDefinition
  isSelected: boolean
  onSelect: (id: string) => void
}

const AvatarCard: React.FC<AvatarCardProps> = ({ avatar, isSelected, onSelect }) => {
  return (
    <div
      onClick={() => onSelect(avatar.id)}
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 8,
        padding: '16px 12px',
        borderRadius: 12,
        cursor: 'pointer',
        background: isSelected
          ? 'rgba(100, 149, 237, 0.2)'
          : 'rgba(255, 255, 255, 0.6)',
        border: isSelected
          ? '2px solid #6495ed'
          : '2px solid transparent',
        transition: 'all 0.2s ease',
        minWidth: 90,
      }}
      onMouseEnter={(e) => {
        if (!isSelected) {
          e.currentTarget.style.background = 'rgba(100, 149, 237, 0.1)'
        }
      }}
      onMouseLeave={(e) => {
        if (!isSelected) {
          e.currentTarget.style.background = 'rgba(255, 255, 255, 0.6)'
        }
      }}
    >
      {/* 形象图标 */}
      <div style={{ fontSize: 40, lineHeight: 1 }}>
        {avatar.icon}
      </div>

      {/* 形象名称 */}
      <div
        style={{
          fontSize: 13,
          fontWeight: isSelected ? 600 : 400,
          color: isSelected ? '#4a7acf' : '#555',
        }}
      >
        {avatar.name}
      </div>

      {/* 选中指示器 */}
      {isSelected && (
        <div
          style={{
            width: 6,
            height: 6,
            borderRadius: '50%',
            background: '#6495ed',
          }}
        />
      )}
    </div>
  )
}

export default AvatarCard
