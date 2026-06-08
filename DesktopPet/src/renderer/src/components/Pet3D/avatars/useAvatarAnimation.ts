/**
 * useAvatarAnimation - 形象共享动画 Hook
 *
 * 提取所有形象共用的动画逻辑：呼吸、浮动、点击缩放、心情变色。
 * 各形象组件只需调用此 Hook 即可获得基础动画能力。
 */

import { useRef, useState, useEffect, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { PetMood } from '../../../types/pet'
import { eventBus } from '../../../core/EventBus'
import { usePetStore } from '../../../stores/petStore'

/** 情绪对应的颜色 */
const MOOD_COLORS: Record<PetMood, string> = {
  idle: '#6ec6ff',
  happy: '#ffd54f',
  sad: '#90a4ae',
  hungry: '#ff8a65',
  sleeping: '#b39ddb',
  eating: '#81c784',
  playing: '#f48fb1',
  walking: '#80deea',
  talking: '#a5d6a7',
  excited: '#ff80ab',
}

/** 情绪对应的表情符号 */
export const MOOD_EMOJI: Record<PetMood, string> = {
  idle: '😊',
  happy: '😄',
  sad: '😢',
  hungry: '😋',
  sleeping: '😴',
  eating: '🍽️',
  playing: '🎮',
  walking: '🚶',
  talking: '💬',
  excited: '🤩',
}

export interface AvatarAnimationState {
  /** 3D 模型组引用 */
  groupRef: React.RefObject<THREE.Group | null>
  /** 主体 mesh 引用（用于呼吸缩放） */
  bodyRef: React.RefObject<THREE.Mesh | null>
  /** 当前心情颜色 */
  targetColor: THREE.Color
  /** 点击特效中 */
  clickEffect: boolean
  /** 显示表情气泡 */
  showEmoji: boolean
  /** 当前心情 */
  mood: PetMood
}

export function useAvatarAnimation(): AvatarAnimationState {
  const groupRef = useRef<THREE.Group>(null)
  const bodyRef = useRef<THREE.Mesh>(null)
  const mood = usePetStore((s) => s.mood)
  const stats = usePetStore((s) => s.stats)
  const [clickEffect, setClickEffect] = useState(false)
  const [showEmoji, setShowEmoji] = useState(false)

  const targetColor = useMemo(() => new THREE.Color(MOOD_COLORS[mood]), [mood])

  // 点击宠物时的反应
  useEffect(() => {
    const unsub = eventBus.on('pet:click', () => {
      setClickEffect(true)
      setShowEmoji(true)
      setTimeout(() => setClickEffect(false), 300)
      setTimeout(() => setShowEmoji(false), 1500)
    })
    return unsub
  }, [])

  // 根据属性自动切换心情
  useEffect(() => {
    if (stats.hunger < 20) {
      usePetStore.getState().setMood('hungry')
    } else if (stats.happiness < 30) {
      usePetStore.getState().setMood('sad')
    } else if (stats.energy < 20) {
      usePetStore.getState().setMood('sleeping')
    } else if (mood === 'hungry' && stats.hunger > 50) {
      usePetStore.getState().setMood('idle')
    } else if (mood === 'sad' && stats.happiness > 50) {
      usePetStore.getState().setMood('idle')
    }
  }, [stats.hunger, stats.happiness, stats.energy])

  // 每帧动画更新
  useFrame((state, delta) => {
    if (!groupRef.current || !bodyRef.current) return

    const time = state.clock.getElapsedTime()

    // 呼吸动画（缩放）
    const breathScale = 1 + Math.sin(time * 2) * 0.02
    bodyRef.current.scale.set(breathScale, breathScale, breathScale)

    // 上下浮动
    groupRef.current.position.y = Math.sin(time * 1.5) * 0.05

    // 点击缩放效果
    if (clickEffect) {
      const s = 1.2 - (Date.now() % 300) / 300 * 0.2
      groupRef.current.scale.set(s, s, s)
    } else {
      groupRef.current.scale.lerp(new THREE.Vector3(1, 1, 1), 0.1)
    }

    // 颜色过渡
    if (bodyRef.current.material instanceof THREE.MeshStandardMaterial) {
      bodyRef.current.material.color.lerp(targetColor, delta * 2)
    }

    // 睡觉时左右摇晃
    if (mood === 'sleeping') {
      groupRef.current.rotation.z = Math.sin(time * 0.8) * 0.1
    } else {
      groupRef.current.rotation.z *= 0.95
    }
  })

  return {
    groupRef,
    bodyRef,
    targetColor,
    clickEffect,
    showEmoji,
    mood,
  }
}
