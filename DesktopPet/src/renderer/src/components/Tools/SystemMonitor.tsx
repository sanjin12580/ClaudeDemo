/**
 * SystemMonitor - 系统监控组件
 *
 * 显示 CPU/内存/GPU/磁盘使用率。
 * 系统负载高时宠物表现疲倦。
 */

import React, { useEffect, useState } from 'react'
import { usePetStore } from '../../stores/petStore'

interface SystemInfo {
  cpuUsage: number
  memUsage: number
  memTotalGB: string
  memFreeGB: string
  gpuUsage: number
  gpuName: string
  diskUsage: number
  diskCaption: string
  diskTotalGB: string
  diskFreeGB: string
}

const SystemMonitor: React.FC = () => {
  const [sysInfo, setSysInfo] = useState<SystemInfo | null>(null)

  useEffect(() => {
    const update = async () => {
      try {
        const info = await window.api.getSystemInfo()
        setSysInfo(info)

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

  if (!sysInfo) {
    return <div style={styles.loading}>加载系统信息...</div>
  }

  return (
    <div style={styles.container}>
      {/* CPU */}
      <BarRow
        icon="🖥️"
        label="CPU"
        usage={sysInfo.cpuUsage}
        detail=""
      />

      {/* 内存 */}
      <BarRow
        icon="💾"
        label="内存"
        usage={sysInfo.memUsage}
        detail={`${sysInfo.memFreeGB}GB / ${sysInfo.memTotalGB}GB`}
      />

      {/* GPU */}
      <BarRow
        icon="🎮"
        label="GPU"
        usage={sysInfo.gpuUsage}
        detail={sysInfo.gpuName}
      />

      {/* 磁盘 */}
      <BarRow
        icon="💿"
        label={sysInfo.diskCaption}
        usage={sysInfo.diskUsage}
        detail={`${sysInfo.diskFreeGB}GB / ${sysInfo.diskTotalGB}GB`}
      />
    </div>
  )
}

/** 单行进度条组件 */
interface BarRowProps {
  icon: string
  label: string
  usage: number
  detail: string
}

const BarRow: React.FC<BarRowProps> = ({ icon, label, usage, detail }) => {
  const color = usage > 85 ? '#e74c3c' : usage > 60 ? '#f39c12' : '#27ae60'

  return (
    <div style={styles.row}>
      <div style={styles.rowHeader}>
        <span style={styles.rowLabel}>{icon} {label}</span>
        <span style={{ ...styles.rowValue, color }}>{usage}%</span>
      </div>
      <div style={styles.barBg}>
        <div style={{ ...styles.barFill, width: `${usage}%`, background: color }} />
      </div>
      {detail && <div style={styles.detail}>{detail}</div>}
    </div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    gap: 10,
  },
  loading: {
    textAlign: 'center',
    color: '#999',
    fontSize: 12,
    padding: 16,
  },
  row: {
    display: 'flex',
    flexDirection: 'column',
    gap: 4,
  },
  rowHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  rowLabel: {
    fontSize: 12,
    color: '#555',
    fontWeight: 500,
  },
  rowValue: {
    fontSize: 13,
    fontWeight: 600,
    fontVariantNumeric: 'tabular-nums',
  },
  barBg: {
    height: 6,
    background: '#e8e8e8',
    borderRadius: 3,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    borderRadius: 3,
    transition: 'width 0.8s ease',
  },
  detail: {
    fontSize: 10,
    color: '#999',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
}

export default SystemMonitor
