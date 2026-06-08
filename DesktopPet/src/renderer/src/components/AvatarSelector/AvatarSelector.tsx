/**
 * AvatarSelector - 形象选择面板
 *
 * 打开时设置 overlay 标志，关闭时清除。
 */

import React, { useCallback } from 'react'
import { useAvatarStore } from '../../stores/avatarStore'
import { AvatarDefinition, AvatarId } from '../../types/avatar'
import { setOverlayOpen } from '../../core/overlayState'
import AvatarCard from './AvatarCard'

const AVATARS: AvatarDefinition[] = [
  { id: 'totoro', name: '龙猫', icon: '🐾', description: '圆胖可爱的龙猫', component: null as any },
  { id: 'dog', name: '田园犬', icon: '🐶', description: '憨厚忠诚的中华田园犬', component: null as any },
  { id: 'ghost', name: '小幽灵', icon: '👻', description: '可爱半透明的小幽灵', component: null as any },
]

const AvatarSelector: React.FC = () => {
  const isSelectorOpen = useAvatarStore((s) => s.isSelectorOpen)
  const currentAvatarId = useAvatarStore((s) => s.currentAvatarId)
  const setAvatar = useAvatarStore((s) => s.setAvatar)
  const setSelectorOpen = useAvatarStore((s) => s.setSelectorOpen)

  const closeSelector = useCallback(() => {
    setSelectorOpen(false)
    setOverlayOpen(false)
  }, [setSelectorOpen])

  const handleSelect = useCallback((id: string) => {
    setAvatar(id as AvatarId)
    closeSelector()
  }, [setAvatar, closeSelector])

  if (!isSelectorOpen) return null

  return (
    <>
      <div
        onClick={closeSelector}
        style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0, 0, 0, 0.3)',
          zIndex: 999,
        }}
      />

      <div
        style={{
          position: 'fixed',
          top: '50%', left: '50%',
          transform: 'translate(-50%, -50%)',
          background: 'rgba(255, 255, 255, 0.95)',
          borderRadius: 16,
          padding: '20px 16px',
          boxShadow: '0 8px 40px rgba(0, 0, 0, 0.15)',
          zIndex: 1000,
          width: 320,
        }}
      >
        <div style={{ fontSize: 16, fontWeight: 600, color: '#333', marginBottom: 16, textAlign: 'center' }}>
          选择形象
        </div>

        <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
          {AVATARS.map((avatar) => (
            <AvatarCard
              key={avatar.id}
              avatar={avatar}
              isSelected={currentAvatarId === avatar.id}
              onSelect={handleSelect}
            />
          ))}
        </div>

        <div
          onClick={closeSelector}
          style={{ marginTop: 16, textAlign: 'center', fontSize: 12, color: '#999', cursor: 'pointer' }}
        >
          点击空白处关闭
        </div>
      </div>
    </>
  )
}

export default AvatarSelector
