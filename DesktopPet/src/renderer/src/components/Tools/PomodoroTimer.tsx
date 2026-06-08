/**
 * PomodoroTimer - 番茄钟组件
 *
 * 25 分钟工作 + 5 分钟休息循环。
 * 工作时宠物安静陪伴，休息时宠物提醒活动。
 */

import React, { useState, useEffect, useRef, useCallback } from 'react'
import { usePetStore } from '../../stores/petStore'

type PomodoroPhase = 'idle' | 'working' | 'break'

const PomodoroTimer: React.FC = () => {
  const [phase, setPhase] = useState<PomodoroPhase>('idle')
  const [workMinutes, setWorkMinutes] = useState(25)
  const [breakMinutes, setBreakMinutes] = useState(5)
  const [timeLeft, setTimeLeft] = useState(25 * 60)
  const [completedCount, setCompletedCount] = useState(0)
  const [isExpanded, setIsExpanded] = useState(false)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)

  const workDuration = workMinutes * 60
  const breakDuration = breakMinutes * 60

  // 格式化时间 mm:ss
  const formatTime = (seconds: number): string => {
    const m = Math.floor(seconds / 60)
    const s = seconds % 60
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
  }

  // 开始工作
  const startWork = useCallback(() => {
    setPhase('working')
    setTimeLeft(workMinutes * 60)
    usePetStore.getState().setMood('idle')
  }, [workMinutes])

  // 开始休息
  const startBreak = useCallback(() => {
    setPhase('break')
    setTimeLeft(breakMinutes * 60)
    usePetStore.getState().setMood('playing')
  }, [breakMinutes])

  // 停止
  const stop = useCallback(() => {
    setPhase('idle')
    setTimeLeft(workMinutes * 60)
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
  }, [workMinutes])

  // 计时器
  useEffect(() => {
    if (phase === 'idle') return

    intervalRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          // 时间到
          if (phase === 'working') {
            setCompletedCount((c) => c + 1)
            startBreak()
          } else {
            startWork()
          }
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
    }
  }, [phase, startBreak, startWork])

  const progress = phase === 'working'
    ? 1 - timeLeft / workDuration
    : phase === 'break'
      ? 1 - timeLeft / breakDuration
      : 0

  const phaseLabel = phase === 'working' ? '🍅 工作中' : phase === 'break' ? '☕ 休息中' : '🍅 番茄钟'
  const phaseColor = phase === 'working' ? '#e74c3c' : phase === 'break' ? '#27ae60' : '#666'

  return (
    <div style={styles.container}>
      <div style={styles.header} onClick={() => setIsExpanded(!isExpanded)}>
        <span style={{ color: phaseColor }}>{phaseLabel}</span>
        {phase !== 'idle' && (
          <span style={{ ...styles.timer, color: phaseColor }}>{formatTime(timeLeft)}</span>
        )}
      </div>

      {isExpanded && (
        <div style={styles.detail}>
          {/* 进度条 */}
          <div style={styles.progressBg}>
            <div style={{
              ...styles.progressFill,
              width: `${progress * 100}%`,
              background: phaseColor,
            }} />
          </div>

          {/* 时长设置 — 仅空闲时可改 */}
          {phase === 'idle' && (
            <div style={styles.timeSettings}>
              <label style={styles.timeLabel}>
                工作
                <input
                  type="number"
                  min={1}
                  max={120}
                  value={workMinutes}
                  onChange={(e) => setWorkMinutes(Math.max(1, Math.min(120, Number(e.target.value) || 1)))}
                  style={styles.timeInput}
                />
                分钟
              </label>
              <label style={styles.timeLabel}>
                休息
                <input
                  type="number"
                  min={1}
                  max={60}
                  value={breakMinutes}
                  onChange={(e) => setBreakMinutes(Math.max(1, Math.min(60, Number(e.target.value) || 1)))}
                  style={styles.timeInput}
                />
                分钟
              </label>
            </div>
          )}

          {/* 统计 */}
          <div style={styles.stats}>
            <span>今日完成: {completedCount} 个</span>
          </div>

          {/* 按钮 */}
          <div style={styles.buttons}>
            {phase === 'idle' ? (
              <button style={{ ...styles.btn, background: '#e74c3c' }} onClick={startWork}>
                开始工作
              </button>
            ) : (
              <button style={{ ...styles.btn, background: '#999' }} onClick={stop}>
                停止
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    background: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 12,
    padding: '8px 12px',
    boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
    backdropFilter: 'blur(10px)',
    minWidth: 140,
    fontSize: 13,
    color: '#333',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    cursor: 'pointer',
  },
  timer: {
    fontWeight: 600,
    fontSize: 15,
    fontVariantNumeric: 'tabular-nums',
  },
  detail: {
    marginTop: 8,
    paddingTop: 8,
    borderTop: '1px solid #eee',
  },
  progressBg: {
    height: 4,
    background: '#e8e8e8',
    borderRadius: 2,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
    transition: 'width 1s linear',
  },
  stats: {
    fontSize: 11,
    color: '#666',
    marginBottom: 8,
    textAlign: 'center',
  },
  buttons: {
    display: 'flex',
    justifyContent: 'center',
  },
  btn: {
    border: 'none',
    borderRadius: 8,
    padding: '6px 16px',
    color: '#fff',
    fontSize: 12,
    cursor: 'pointer',
    fontWeight: 500,
  },
  timeSettings: {
    display: 'flex',
    justifyContent: 'center',
    gap: 12,
    marginBottom: 8,
  },
  timeLabel: {
    display: 'flex',
    alignItems: 'center',
    gap: 4,
    fontSize: 12,
    color: '#555',
  },
  timeInput: {
    width: 42,
    border: '1px solid #ddd',
    borderRadius: 6,
    padding: '3px 6px',
    fontSize: 12,
    textAlign: 'center',
    outline: 'none',
  },
}

export default PomodoroTimer
