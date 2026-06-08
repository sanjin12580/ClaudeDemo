/**
 * DogAvatar - 中华田园犬形象
 *
 * 黄白配色身体，立耳朵，卷尾巴，舌头伸出，腮红。
 * 憨厚可爱的田园犬造型。
 */

import React, { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { AvatarProps } from '../../../types/avatar'

/** 田园犬各部位颜色 */
const COLORS = {
  body: '#d4a055',        // 黄棕色主体
  bodyLight: '#e8c888',   // 浅黄色
  belly: '#f5ead0',       // 米白色肚皮/胸口
  ear: '#b8863a',         // 耳朵深色
  eye: '#222222',          // 眼睛
  eyeHighlight: '#ffffff', // 眼睛高光
  nose: '#333333',         // 鼻子
  tongue: '#e8607a',       // 舌头
  mouth: '#5a3a2a',        // 嘴巴线条
  blush: '#e8a0a0',        // 腮红
  paw: '#c89040',          // 爪子
}

const DogAvatar: React.FC<AvatarProps> = ({ mood, clickEffect, showEmoji, bodyRef }) => {
  const tailRef = useRef<THREE.Group>(null)
  const tongueRef = useRef<THREE.Mesh>(null)

  // 尾巴摇摆 + 舌头缩放动画
  useFrame((state) => {
    const time = state.clock.getElapsedTime()

    if (tailRef.current) {
      // 开心时尾巴摇得更快
      const speed = mood === 'happy' || mood === 'excited' ? 6 : 3
      const amplitude = mood === 'happy' || mood === 'excited' ? 0.4 : 0.2
      tailRef.current.rotation.z = Math.sin(time * speed) * amplitude
    }

    if (tongueRef.current) {
      // 舌头微微伸缩
      const tongueScale = 1 + Math.sin(time * 2) * 0.1
      tongueRef.current.scale.y = tongueScale
    }
  })

  return (
    <group>
      {/* ===== 主体 - 椭球身体 ===== */}
      <mesh ref={bodyRef} position={[0, 0, 0]} scale={[1, 1.05, 0.9]}>
        <sphereGeometry args={[0.45, 32, 32]} />
        <meshStandardMaterial color={COLORS.body} roughness={0.8} metalness={0.0} />
      </mesh>

      {/* ===== 白色胸口/肚皮 ===== */}
      <mesh position={[0, -0.08, 0.32]}>
        <sphereGeometry args={[0.28, 32, 32]} />
        <meshStandardMaterial color={COLORS.belly} roughness={0.6} />
      </mesh>

      {/* ===== 头部 ===== */}
      <mesh position={[0, 0.35, 0.15]} scale={[1.1, 1, 1]}>
        <sphereGeometry args={[0.28, 32, 32]} />
        <meshStandardMaterial color={COLORS.body} roughness={0.8} />
      </mesh>

      {/* 面部白色区域 */}
      <mesh position={[0, 0.3, 0.35]}>
        <sphereGeometry args={[0.18, 16, 16]} />
        <meshStandardMaterial color={COLORS.belly} roughness={0.6} />
      </mesh>

      {/* ===== 立耳朵 ===== */}
      {/* 左耳 */}
      <group position={[-0.2, 0.55, 0.1]} rotation={[0.2, 0, -0.15]}>
        <mesh>
          <coneGeometry args={[0.1, 0.22, 4]} />
          <meshStandardMaterial color={COLORS.ear} roughness={0.7} />
        </mesh>
        {/* 耳朵内侧 */}
        <mesh position={[0, 0, 0.02]}>
          <coneGeometry args={[0.06, 0.15, 4]} />
          <meshStandardMaterial color={COLORS.bodyLight} roughness={0.5} />
        </mesh>
      </group>

      {/* 右耳 */}
      <group position={[0.2, 0.55, 0.1]} rotation={[0.2, 0, 0.15]}>
        <mesh>
          <coneGeometry args={[0.1, 0.22, 4]} />
          <meshStandardMaterial color={COLORS.ear} roughness={0.7} />
        </mesh>
        <mesh position={[0, 0, 0.02]}>
          <coneGeometry args={[0.06, 0.15, 4]} />
          <meshStandardMaterial color={COLORS.bodyLight} roughness={0.5} />
        </mesh>
      </group>

      {/* ===== 眼睛 ===== */}
      {/* 左眼 */}
      <mesh position={[-0.1, 0.38, 0.38]}>
        <sphereGeometry args={[0.05, 16, 16]} />
        <meshStandardMaterial color={COLORS.eye} />
      </mesh>
      <mesh position={[-0.09, 0.39, 0.42]}>
        <sphereGeometry args={[0.018, 8, 8]} />
        <meshStandardMaterial color={COLORS.eyeHighlight} emissive="#ffffff" emissiveIntensity={0.5} />
      </mesh>

      {/* 右眼 */}
      <mesh position={[0.1, 0.38, 0.38]}>
        <sphereGeometry args={[0.05, 16, 16]} />
        <meshStandardMaterial color={COLORS.eye} />
      </mesh>
      <mesh position={[0.11, 0.39, 0.42]}>
        <sphereGeometry args={[0.018, 8, 8]} />
        <meshStandardMaterial color={COLORS.eyeHighlight} emissive="#ffffff" emissiveIntensity={0.5} />
      </mesh>

      {/* ===== 鼻子 ===== */}
      <mesh position={[0, 0.32, 0.48]}>
        <sphereGeometry args={[0.04, 12, 12]} />
        <meshStandardMaterial color={COLORS.nose} roughness={0.2} metalness={0.3} />
      </mesh>

      {/* ===== 嘴巴 + 舌头 ===== */}
      {/* 嘴巴线条 */}
      <mesh position={[0, 0.26, 0.45]} rotation={[Math.PI, 0, 0]}>
        <torusGeometry args={[0.04, 0.008, 8, 16, Math.PI]} />
        <meshStandardMaterial color={COLORS.mouth} />
      </mesh>

      {/* 舌头 */}
      <mesh ref={tongueRef} position={[0, 0.22, 0.46]}>
        <sphereGeometry args={[0.03, 12, 12]} />
        <meshStandardMaterial color={COLORS.tongue} roughness={0.3} />
      </mesh>
      <mesh position={[0, 0.19, 0.46]} scale={[0.8, 1.3, 0.6]}>
        <sphereGeometry args={[0.025, 8, 8]} />
        <meshStandardMaterial color={COLORS.tongue} roughness={0.3} />
      </mesh>

      {/* ===== 腮红 ===== */}
      <mesh position={[-0.18, 0.32, 0.35]}>
        <circleGeometry args={[0.04, 16]} />
        <meshStandardMaterial color={COLORS.blush} transparent opacity={0.4} side={THREE.DoubleSide} />
      </mesh>
      <mesh position={[0.18, 0.32, 0.35]}>
        <circleGeometry args={[0.04, 16]} />
        <meshStandardMaterial color={COLORS.blush} transparent opacity={0.4} side={THREE.DoubleSide} />
      </mesh>

      {/* ===== 前腿 ===== */}
      <mesh position={[-0.18, -0.35, 0.15]} scale={[0.7, 1.2, 0.7]}>
        <sphereGeometry args={[0.1, 12, 12]} />
        <meshStandardMaterial color={COLORS.body} roughness={0.8} />
      </mesh>
      <mesh position={[0.18, -0.35, 0.15]} scale={[0.7, 1.2, 0.7]}>
        <sphereGeometry args={[0.1, 12, 12]} />
        <meshStandardMaterial color={COLORS.body} roughness={0.8} />
      </mesh>

      {/* 爪子 */}
      <mesh position={[-0.18, -0.48, 0.18]}>
        <sphereGeometry args={[0.06, 12, 12]} />
        <meshStandardMaterial color={COLORS.paw} roughness={0.7} />
      </mesh>
      <mesh position={[0.18, -0.48, 0.18]}>
        <sphereGeometry args={[0.06, 12, 12]} />
        <meshStandardMaterial color={COLORS.paw} roughness={0.7} />
      </mesh>

      {/* ===== 后腿 ===== */}
      <mesh position={[-0.2, -0.3, -0.15]} scale={[0.8, 1, 0.8]}>
        <sphereGeometry args={[0.1, 12, 12]} />
        <meshStandardMaterial color={COLORS.body} roughness={0.8} />
      </mesh>
      <mesh position={[0.2, -0.3, -0.15]} scale={[0.8, 1, 0.8]}>
        <sphereGeometry args={[0.1, 12, 12]} />
        <meshStandardMaterial color={COLORS.body} roughness={0.8} />
      </mesh>

      {/* ===== 卷尾巴 ===== */}
      <group ref={tailRef} position={[0, 0.05, -0.42]}>
        {/* 尾巴根部 */}
        <mesh rotation={[0.5, 0, 0]}>
          <cylinderGeometry args={[0.04, 0.05, 0.2, 8]} />
          <meshStandardMaterial color={COLORS.body} roughness={0.8} />
        </mesh>
        {/* 尾巴卷曲部分 */}
        <mesh position={[0, 0.15, -0.05]} rotation={[1.2, 0, 0]}>
          <torusGeometry args={[0.06, 0.035, 8, 16, Math.PI]} />
          <meshStandardMaterial color={COLORS.body} roughness={0.8} />
        </mesh>
        {/* 尾巴尖白色 */}
        <mesh position={[0, 0.22, 0.0]}>
          <sphereGeometry args={[0.04, 8, 8]} />
          <meshStandardMaterial color={COLORS.belly} roughness={0.6} />
        </mesh>
      </group>
    </group>
  )
}

export default DogAvatar
