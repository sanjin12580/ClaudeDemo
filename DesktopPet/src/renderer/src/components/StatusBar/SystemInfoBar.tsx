/**
 * SystemInfoBar - 宠物下方常驻系统监控
 *
 * 紧凑样式，跟随宠物显示/隐藏。
 */

import React, { useEffect, useState } from 'react'
import { usePetStore } from '../../stores/petStore'

interface SystemInfo {
  cpuUsage: number
  memUsage: number
  gpuUsage: number
  diskUsage: number
}

const SystemInfoBar: React.FC = () => {
  const [sysInfo, setSysInfo] = useState<SystemInfo | null>(null)
  const showStatusBar = usePetStore((s) => s.showStatusBar)

  useEffect(() => {
    const update = async () => {
      try {
        const info = await window.api.getSystemInfo()
        setSysInfo({
          cpuUsage: info.cpuUsage,
          memUsage: info.memUsage,
          gpuUsage: info.gpuUsage,
          diskUsage: info.diskUsage,
        })

        // 系统负载高时影响宠物状态
        if (info.cpuUsage > 80 || info.memUsage > 85) {
          const currentMood = usePetStore.getState().mood
          if (currentMood === 'idle' || currentMood === 'happy') {
            usePetStore.getState().setMood('sad')
          }
        }
      } catch {
        // 忽略错误
      }
    }

    update()
    const interval = setInterval(update, 5000)
    return () => clearInterval(interval)
  }, [])

  if (!sysInfo) return null

  return (
    <div style={styles.container}>
      <MiniBar icon="🖥️" value={sysInfo.cpuUsage} />
      <MiniBar icon="💾" value={sysInfo.memUsage} />
      <MiniBar icon="🎮" value={sysInfo.gpuUsage} />
      <MiniBar icon="💿" value={sysInfo.diskUsage} />
    </div>
  )
}

const MiniBar: React.FC<{ icon: string; value: number }> = ({ icon, value }) => {
  const color = value > 85 ? '#e74c3c' : value > 60 ? '#f39c12' : '#27ae60'
  return (
    <div style={styles.miniItem}>
      <span style={styles.icon}>{icon}</span>
      <div style={styles.barBg}>
        <div style={{ ...styles.barFill, width: `${value}%`, background: color }} />
      </div>
      <span style={{ ...styles.value, color }}>{value}%</span>
    </div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    position: 'absolute',
    bottom: 188,
    left: '50%',
    transform: 'translateX(-50%)',
    display: 'flex',
    gap: 8,
    background: 'rgba(255, 255, 255, 0.85)',
    borderRadius: 10,
    padding: '4px 10px',
    backdropFilter: 'blur(8px)',
    boxShadow: '0 1px 6px rgba(0,0,0,0.08)',
    zIndex: 50,
    pointerEvents: 'none',
  },
  miniItem: {
    display: 'flex',
    alignItems: 'center',
    gap: 3,
  },
  icon: {
    fontSize: 10,
  },
  barBg: {
    width: 32,
    height: 4,
    background: '#e0e0e0',
    borderRadius: 2,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    borderRadius: 2,
    transition: 'width 0.8s ease',
  },
  value: {
    fontSize: 9,
    fontWeight: 600,
    fontVariantNumeric: 'tabular-nums',
    minWidth: 24,
    textAlign: 'right',
  },
}

export default SystemInfoBar
