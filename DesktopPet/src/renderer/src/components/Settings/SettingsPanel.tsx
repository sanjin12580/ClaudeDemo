/**
 * SettingsPanel - 完整设置面板
 *
 * 包含：宠物个性化、AI 配置、外观设置、声音设置、系统设置
 */

import React, { useState, useEffect } from 'react'
import { useSettingsStore, PetPersonality } from '../../stores/settingsStore'
import { usePetStore } from '../../stores/petStore'
import { setOverlayOpen } from '../../core/overlayState'

const PERSONALITY_OPTIONS: { value: PetPersonality; label: string; desc: string }[] = [
  { value: 'lively', label: '活泼', desc: '充满活力，喜欢用颜文字！' },
  { value: 'tsundere', label: '傲娇', desc: '表面不在乎，其实很关心你' },
  { value: 'gentle', label: '温柔', desc: '轻声细语，体贴入微' },
  { value: 'chatty', label: '话痨', desc: '特别爱聊天，说不完的话' },
]

const SettingsPanel: React.FC = () => {
  const isOpen = useSettingsStore((s) => s.isOpen)
  const setOpen = useSettingsStore((s) => s.setOpen)

  // 本地编辑状态
  const [petName, setPetName] = useState('')
  const [personality, setPersonality] = useState<PetPersonality>('lively')
  const [apiKey, setApiKey] = useState('')
  const [apiKeyMasked, setApiKeyMasked] = useState('')
  const [apiKeyChanged, setApiKeyChanged] = useState(false)
  const [petScale, setPetScale] = useState(1.0)
  const [petOpacity, setPetOpacity] = useState(1.0)
  const [soundEnabled, setSoundEnabled] = useState(true)
  const [volume, setVolume] = useState(80)
  const [autoLaunch, setAutoLaunch] = useState(false)
  const [saveStatus, setSaveStatus] = useState('')

  // 打开时加载当前设置
  useEffect(() => {
    if (isOpen) {
      const settings = useSettingsStore.getState()
      const petConfig = usePetStore.getState().config
      setPetName(petConfig.name)
      setPersonality(petConfig.personality)
      setPetScale(settings.petScale)
      setPetOpacity(settings.petOpacity)
      setSoundEnabled(settings.soundEnabled)
      setVolume(settings.volume)
      setApiKeyChanged(false)

      // 从配置文件读取 API Key，显示脱敏版本
      window.api.getApiKey('mimo').then((key) => {
        if (key) {
          setApiKeyMasked(key.substring(0, 6) + '***' + key.substring(key.length - 4))
          setApiKey('')
        } else {
          setApiKeyMasked('')
          setApiKey('')
        }
      })

      window.api.getAutoLaunch().then(setAutoLaunch)
      setOverlayOpen(true)
    }
  }, [isOpen])

  const handleSave = () => {
    const settings = useSettingsStore.getState()
    const petStore = usePetStore.getState()

    // 保存宠物配置
    petStore.setConfig({ name: petName || '小宠物', personality })

    // 保存设置
    settings.setPetName(petName)
    settings.setPersonality(personality)
    settings.setPetScale(petScale)
    settings.setPetOpacity(petOpacity)
    settings.setSoundEnabled(soundEnabled)
    settings.setVolume(volume)
    settings.setAutoLaunch(autoLaunch)

    // API Key：只有用户修改了才更新
    if (apiKeyChanged && apiKey.trim()) {
      window.api.setApiKey('mimo', apiKey.trim())
      settings.setApiKey(apiKey.trim())
    }

    // 应用到系统
    window.api.setAutoLaunch(autoLaunch)
    window.api.setWindowOpacity(petOpacity)

    setSaveStatus('已保存 ✓')
    setTimeout(() => setSaveStatus(''), 2000)
  }

  const handleClose = () => {
    setOpen(false)
    setOverlayOpen(false)
  }

  if (!isOpen) return null

  return (
    <>
      <div
        onClick={handleClose}
        onContextMenu={(e) => { e.preventDefault(); e.stopPropagation() }}
        style={styles.overlay}
      />

      <div style={styles.panel} onClick={(e) => e.stopPropagation()}>
        {/* 标题 */}
        <div style={styles.header}>
          <span>⚙️ 设置</span>
          <span onClick={handleClose} style={styles.closeBtn}>✕</span>
        </div>

        <div style={styles.content}>
          {/* ===== 宠物个性化 ===== */}
          <div style={styles.section}>
            <div style={styles.sectionTitle}>🐾 宠物个性化</div>

            <label style={styles.label}>名字</label>
            <input
              type="text"
              value={petName}
              onChange={(e) => setPetName(e.target.value)}
              style={styles.input}
              placeholder="给宠物起个名字"
            />

            <label style={styles.label}>性格</label>
            <div style={styles.personalityGrid}>
              {PERSONALITY_OPTIONS.map((opt) => (
                <div
                  key={opt.value}
                  onClick={() => setPersonality(opt.value)}
                  style={{
                    ...styles.personalityCard,
                    border: personality === opt.value ? '2px solid #6495ed' : '2px solid transparent',
                    background: personality === opt.value ? 'rgba(100,149,237,0.1)' : 'rgba(255,255,255,0.6)',
                  }}
                >
                  <div style={styles.personalityLabel}>{opt.label}</div>
                  <div style={styles.personalityDesc}>{opt.desc}</div>
                </div>
              ))}
            </div>
          </div>

          {/* ===== AI 配置 ===== */}
          <div style={styles.section}>
            <div style={styles.sectionTitle}>🤖 AI 配置</div>
            <label style={styles.label}>小米 MIMO API Key</label>
            <input
              type="text"
              value={apiKeyChanged ? apiKey : apiKeyMasked}
              onChange={(e) => {
                setApiKey(e.target.value)
                setApiKeyChanged(true)
              }}
              onFocus={() => {
                if (!apiKeyChanged) {
                  setApiKey('')
                  setApiKeyChanged(true)
                }
              }}
              style={styles.input}
              placeholder={apiKeyMasked ? '点击修改 API Key' : '输入 API Key'}
            />
            {!apiKeyChanged && apiKeyMasked && (
              <div style={styles.hint}>当前已配置，点击输入框修改</div>
            )}
          </div>

          {/* ===== 外观设置 ===== */}
          <div style={styles.section}>
            <div style={styles.sectionTitle}>🎨 外观设置</div>

            <label style={styles.label}>宠物大小: {petScale.toFixed(1)}x</label>
            <input
              type="range"
              min="0.5"
              max="2.0"
              step="0.1"
              value={petScale}
              onChange={(e) => setPetScale(parseFloat(e.target.value))}
              style={styles.slider}
            />

            <label style={styles.label}>透明度: {Math.round(petOpacity * 100)}%</label>
            <input
              type="range"
              min="0.3"
              max="1.0"
              step="0.05"
              value={petOpacity}
              onChange={(e) => setPetOpacity(parseFloat(e.target.value))}
              style={styles.slider}
            />
          </div>

          {/* ===== 声音设置 ===== */}
          <div style={styles.section}>
            <div style={styles.sectionTitle}>🔊 声音设置</div>

            <div style={styles.toggleRow}>
              <span>启用声音</span>
              <div
                onClick={() => setSoundEnabled(!soundEnabled)}
                style={{
                  ...styles.toggle,
                  background: soundEnabled ? '#6495ed' : '#ccc',
                }}
              >
                <div style={{
                  ...styles.toggleKnob,
                  transform: soundEnabled ? 'translateX(20px)' : 'translateX(0)',
                }} />
              </div>
            </div>

            {soundEnabled && (
              <>
                <label style={styles.label}>音量: {volume}%</label>
                <input
                  type="range"
                  min="0"
                  max="100"
                  step="5"
                  value={volume}
                  onChange={(e) => setVolume(parseInt(e.target.value))}
                  style={styles.slider}
                />
              </>
            )}
          </div>

          {/* ===== 系统设置 ===== */}
          <div style={styles.section}>
            <div style={styles.sectionTitle}>💻 系统设置</div>

            <div style={styles.toggleRow}>
              <span>开机自动启动</span>
              <div
                onClick={() => setAutoLaunch(!autoLaunch)}
                style={{
                  ...styles.toggle,
                  background: autoLaunch ? '#6495ed' : '#ccc',
                }}
              >
                <div style={{
                  ...styles.toggleKnob,
                  transform: autoLaunch ? 'translateX(20px)' : 'translateX(0)',
                }} />
              </div>
            </div>
          </div>
        </div>

        {/* 底部按钮 */}
        <div style={styles.footer}>
          <button onClick={handleSave} style={styles.saveBtn}>保存设置</button>
          {saveStatus && <span style={styles.status}>{saveStatus}</span>}
        </div>
      </div>
    </>
  )
}

const styles: Record<string, React.CSSProperties> = {
  overlay: {
    position: 'fixed',
    top: 0, left: 0, right: 0, bottom: 0,
    background: 'rgba(0, 0, 0, 0.3)',
    zIndex: 998,
  },
  panel: {
    position: 'fixed',
    top: '50%', left: '50%',
    transform: 'translate(-50%, -50%)',
    background: 'rgba(245, 245, 245, 0.97)',
    borderRadius: 16,
    padding: 0,
    boxShadow: '0 8px 40px rgba(0, 0, 0, 0.2)',
    zIndex: 1000,
    width: 360,
    maxHeight: '80vh',
    display: 'flex',
    flexDirection: 'column',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '16px 20px',
    borderBottom: '1px solid #eee',
    fontSize: 15,
    fontWeight: 600,
    color: '#333',
  },
  closeBtn: {
    cursor: 'pointer',
    fontSize: 18,
    color: '#999',
    padding: '2px 6px',
  },
  content: {
    flex: 1,
    overflowY: 'auto',
    padding: '12px 20px',
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: 600,
    color: '#555',
    marginBottom: 10,
  },
  label: {
    display: 'block',
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
    marginTop: 8,
  },
  input: {
    width: '100%',
    border: '1px solid #ddd',
    borderRadius: 8,
    padding: '8px 12px',
    fontSize: 13,
    outline: 'none',
    background: 'rgba(255,255,255,0.8)',
    boxSizing: 'border-box',
  },
  hint: {
    fontSize: 10,
    color: '#999',
    marginTop: 4,
  },
  slider: {
    width: '100%',
    accentColor: '#6495ed',
    marginTop: 4,
  },
  personalityGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: 8,
    marginTop: 6,
  },
  personalityCard: {
    padding: '8px 10px',
    borderRadius: 10,
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
  personalityLabel: {
    fontSize: 13,
    fontWeight: 600,
    color: '#333',
  },
  personalityDesc: {
    fontSize: 10,
    color: '#888',
    marginTop: 2,
  },
  toggleRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '6px 0',
    fontSize: 13,
    color: '#444',
  },
  toggle: {
    width: 44,
    height: 24,
    borderRadius: 12,
    padding: 2,
    cursor: 'pointer',
    transition: 'background 0.2s',
    position: 'relative',
  },
  toggleKnob: {
    width: 20,
    height: 20,
    borderRadius: '50%',
    background: '#fff',
    boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
    transition: 'transform 0.2s',
  },
  footer: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    padding: '12px 20px',
    borderTop: '1px solid #eee',
  },
  saveBtn: {
    border: 'none',
    borderRadius: 8,
    padding: '10px 32px',
    background: '#6495ed',
    color: '#fff',
    fontSize: 14,
    cursor: 'pointer',
    fontWeight: 500,
  },
  status: {
    fontSize: 13,
    color: '#27ae60',
  },
}

export default SettingsPanel
