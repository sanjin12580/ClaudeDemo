/**
 * ToolsContainer - 工具面板容器
 *
 * 只显示用户点击打开的工具，而不是全部。
 * 打开时通过 overlayState 禁用鼠标穿透。
 */

import React, { useState, useEffect } from 'react'
import { eventBus } from '../../core/EventBus'
import SystemMonitor from './SystemMonitor'
import PomodoroTimer from './PomodoroTimer'

const ToolsContainer: React.FC = () => {
  const [isVisible, setIsVisible] = useState(false)
  const [activeTool, setActiveTool] = useState<string>('system')

  useEffect(() => {
    const unsubOpen = eventBus.on('tool:open', (data: { toolId: string }) => {
      setActiveTool(data.toolId)
      setIsVisible(true)
    })
    return () => unsubOpen()
  }, [])

  const handleClose = () => {
    setIsVisible(false)
  }

  if (!isVisible) return null

  return (
    <>
      {/* 透明遮罩 — 仅拦截右键菜单，不拦截左键 */}
      <div
        onContextMenu={(e) => { e.preventDefault(); e.stopPropagation() }}
        style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          background: 'transparent',
          zIndex: 998,
          pointerEvents: 'none',
        }}
      />

      {/* 工具面板 */}
      <div
        style={styles.panel}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={styles.header}>
          <span style={{ fontWeight: 600 }}>
            {activeTool === 'system' ? '📊 系统监控' : '🍅 番茄钟'}
          </span>
          <span onClick={handleClose} style={styles.closeBtn}>✕</span>
        </div>

        <div style={styles.toolsGrid}>
          {activeTool === 'system' && <SystemMonitor />}
          {activeTool === 'pomodoro' && <PomodoroTimer />}
        </div>
      </div>
    </>
  )
}

const styles: Record<string, React.CSSProperties> = {
  panel: {
    position: 'fixed',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    background: 'rgba(245, 245, 245, 0.95)',
    borderRadius: 16,
    padding: 16,
    boxShadow: '0 8px 40px rgba(0, 0, 0, 0.15)',
    backdropFilter: 'blur(10px)',
    zIndex: 1000,
    minWidth: 220,
    maxWidth: 360,
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    fontSize: 14,
    color: '#333',
  },
  closeBtn: {
    cursor: 'pointer',
    fontSize: 16,
    color: '#999',
    padding: '2px 6px',
    borderRadius: 4,
  },
  toolsGrid: {
    display: 'flex',
    flexDirection: 'column',
    gap: 10,
  },
}

export default ToolsContainer
