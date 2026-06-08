/**
 * StatusBars - 宠物状态栏
 *
 * 鼠标悬停宠物时显示，展示饥饿/心情/健康/精力等属性。
 */

import React from 'react'
import { usePetStore } from '../../stores/petStore'

interface StatusItemProps {
  icon: string
  label: string
  value: number
  color: string
  warningThreshold?: number
}

const StatusItem: React.FC<StatusItemProps> = ({ icon, label, value, color, warningThreshold = 20 }) => {
  const isWarning = value < warningThreshold

  return (
    <div className="status-bar-item">
      <span className="status-bar-icon">{icon}</span>
      <div className="status-bar-progress" style={{ position: 'relative' }}>
        <div
          className="status-bar-fill"
          style={{
            width: `${value}%`,
            backgroundColor: isWarning ? '#ff5252' : color,
            animation: isWarning ? 'pulse 1s infinite' : 'none',
          }}
        />
      </div>
    </div>
  )
}

const StatusBars: React.FC = () => {
  const showStatusBar = usePetStore((s) => s.showStatusBar)
  const stats = usePetStore((s) => s.stats)

  if (!showStatusBar) return null

  return (
    <div className="status-bar-container" style={{ opacity: showStatusBar ? 1 : 0 }}>
      <StatusItem icon="🍖" label="饥饿" value={stats.hunger} color="#ff9800" />
      <StatusItem icon="😊" label="心情" value={stats.happiness} color="#ffd54f" />
      <StatusItem icon="❤️" label="健康" value={stats.health} color="#f44336" />
      <StatusItem icon="⚡" label="精力" value={stats.energy} color="#4caf50" />
      <StatusItem icon="💕" label="亲密" value={stats.intimacy} color="#e91e63" warningThreshold={0} />
    </div>
  )
}

export default StatusBars
