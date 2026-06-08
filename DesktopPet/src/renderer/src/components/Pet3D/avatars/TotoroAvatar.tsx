/**
 * TotoroAvatar - 龙猫形象
 *
 * 圆胖灰色身体，大圆耳朵，白色肚皮+月牙纹，圆球尾巴。
 * 经典龙猫造型，可爱治愈。
 */

import React, { useRef, useEffect } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { AvatarProps } from '../../../types/avatar'
import { usePetStore } from '../../../stores/petStore'
import { eventBus } from '../../../core/EventBus'

/** 龙猫各部位颜色 */
const COLORS = {
  body: '#8a8a8a',        // 灰色主体
  belly: '#f5f0e8',       // 米白色肚皮
  earInner: '#d4a574',    // 耳朵内部
  eye: '#222222',          // 眼睛
  eyeHighlight: '#ffffff', // 眼睛高光
  nose: '#5a5a5a',         // 鼻子
  whisker: '#666666',      // 胡须
  crescent: '#6b5b4a',     // 月牙纹
  blush: '#e8a0a0',        // 腮红
}

const TotoroAvatar: React.FC<AvatarProps> = ({ mood, clickEffect, showEmoji, bodyRef }) => {
  const tailRef = useRef<THREE.Group>(null)

  // 尾巴摇摆动画
  useFrame((state) => {
    if (!tailRef.current) return
    const time = state.clock.getElapsedTime()
    tailRef.current.rotation.z = Math.sin(time * 3) * 0.15
    tailRef.current.rotation.x = Math.sin(time * 2) * 0.1
  })

  return (
    <group>
      {/* ===== 主体 - 圆胖椭球 ===== */}
      <mesh ref={bodyRef} position={[0, 0, 0]} castShadow>
        <sphereGeometry args={[0.48, 32, 32]} />
        <meshStandardMaterial color={COLORS.body} roughness={0.7} metalness={0.0} />
      </mesh>

      {/* 身体稍微拉长 */}
      <mesh position={[0, 0, 0]} scale={[1, 1.15, 0.95]}>
        <sphereGeometry args={[0.48, 32, 32]} />
        <meshStandardMaterial color={COLORS.body} roughness={0.7} />
      </mesh>

      {/* ===== 白色肚皮 ===== */}
      <mesh position={[0, -0.05, 0.35]}>
        <sphereGeometry args={[0.32, 32, 32]} />
        <meshStandardMaterial color={COLORS.belly} roughness={0.5} />
      </mesh>

      {/* 月牙纹 - 用多个小圆排列成 V 形 */}
      {[
        [-0.06, 0.12, 0.55],
        [0.06, 0.12, 0.55],
        [-0.12, 0.05, 0.56],
        [0.12, 0.05, 0.56],
        [-0.15, -0.02, 0.55],
        [0.15, -0.02, 0.55],
      ].map((pos, i) => (
        <mesh key={i} position={pos as [number, number, number]}>
          <circleGeometry args={[0.025, 8]} />
          <meshStandardMaterial color={COLORS.crescent} side={THREE.DoubleSide} />
        </mesh>
      ))}

      {/* ===== 大圆耳朵 ===== */}
      {/* 左耳 */}
      <mesh position={[-0.22, 0.5, 0.05]}>
        <sphereGeometry args={[0.16, 16, 16]} />
        <meshStandardMaterial color={COLORS.body} roughness={0.7} />
      </mesh>
      <mesh position={[-0.22, 0.5, 0.12]}>
        <sphereGeometry args={[0.1, 16, 16]} />
        <meshStandardMaterial color={COLORS.earInner} roughness={0.5} />
      </mesh>

      {/* 右耳 */}
      <mesh position={[0.22, 0.5, 0.05]}>
        <sphereGeometry args={[0.16, 16, 16]} />
        <meshStandardMaterial color={COLORS.body} roughness={0.7} />
      </mesh>
      <mesh position={[0.22, 0.5, 0.12]}>
        <sphereGeometry args={[0.1, 16, 16]} />
        <meshStandardMaterial color={COLORS.earInner} roughness={0.5} />
      </mesh>

      {/* ===== 眼睛 ===== */}
      {/* 左眼白 */}
      <mesh position={[-0.13, 0.15, 0.43]}>
        <sphereGeometry args={[0.07, 16, 16]} />
        <meshStandardMaterial color="#ffffff" />
      </mesh>
      {/* 左眼珠 */}
      <mesh position={[-0.13, 0.15, 0.48]}>
        <sphereGeometry args={[0.05, 16, 16]} />
        <meshStandardMaterial color={COLORS.eye} />
      </mesh>
      {/* 左眼高光 */}
      <mesh position={[-0.11, 0.17, 0.52]}>
        <sphereGeometry args={[0.02, 8, 8]} />
        <meshStandardMaterial color={COLORS.eyeHighlight} emissive="#ffffff" emissiveIntensity={0.5} />
      </mesh>

      {/* 右眼白 */}
      <mesh position={[0.13, 0.15, 0.43]}>
        <sphereGeometry args={[0.07, 16, 16]} />
        <meshStandardMaterial color="#ffffff" />
      </mesh>
      {/* 右眼珠 */}
      <mesh position={[0.13, 0.15, 0.48]}>
        <sphereGeometry args={[0.05, 16, 16]} />
        <meshStandardMaterial color={COLORS.eye} />
      </mesh>
      {/* 右眼高光 */}
      <mesh position={[0.15, 0.17, 0.52]}>
        <sphereGeometry args={[0.02, 8, 8]} />
        <meshStandardMaterial color={COLORS.eyeHighlight} emissive="#ffffff" emissiveIntensity={0.5} />
      </mesh>

      {/* ===== 鼻子 ===== */}
      <mesh position={[0, 0.04, 0.48]}>
        <sphereGeometry args={[0.035, 12, 12]} />
        <meshStandardMaterial color={COLORS.nose} roughness={0.3} />
      </mesh>

      {/* ===== 嘴巴 ===== */}
      <mesh position={[0, -0.04, 0.46]} rotation={[Math.PI, 0, 0]}>
        <torusGeometry args={[0.05, 0.012, 8, 16, Math.PI]} />
        <meshStandardMaterial color={COLORS.nose} />
      </mesh>

      {/* ===== 胡须 ===== */}
      {/* 左侧胡须 */}
      {[-0.04, 0, 0.04].map((y, i) => (
        <mesh key={`whisker-l-${i}`} position={[-0.2, 0.03 + y, 0.42]} rotation={[0, 0, (i - 1) * 0.15]}>
          <cylinderGeometry args={[0.003, 0.002, 0.15, 4]} />
          <meshStandardMaterial color={COLORS.whisker} />
        </mesh>
      ))}
      {/* 右侧胡须 */}
      {[-0.04, 0, 0.04].map((y, i) => (
        <mesh key={`whisker-r-${i}`} position={[0.2, 0.03 + y, 0.42]} rotation={[0, 0, (1 - i) * 0.15]}>
          <cylinderGeometry args={[0.003, 0.002, 0.15, 4]} />
          <meshStandardMaterial color={COLORS.whisker} />
        </mesh>
      ))}

      {/* ===== 腮红 ===== */}
      <mesh position={[-0.22, 0.0, 0.38]}>
        <circleGeometry args={[0.05, 16]} />
        <meshStandardMaterial color={COLORS.blush} transparent opacity={0.5} side={THREE.DoubleSide} />
      </mesh>
      <mesh position={[0.22, 0.0, 0.38]}>
        <circleGeometry args={[0.05, 16]} />
        <meshStandardMaterial color={COLORS.blush} transparent opacity={0.5} side={THREE.DoubleSide} />
      </mesh>

      {/* ===== 小短手 ===== */}
      <mesh position={[-0.42, -0.05, 0.1]} rotation={[0, 0, -0.4]}>
        <sphereGeometry args={[0.08, 12, 12]} />
        <meshStandardMaterial color={COLORS.body} roughness={0.7} />
      </mesh>
      <mesh position={[0.42, -0.05, 0.1]} rotation={[0, 0, 0.4]}>
        <sphereGeometry args={[0.08, 12, 12]} />
        <meshStandardMaterial color={COLORS.body} roughness={0.7} />
      </mesh>

      {/* ===== 小短脚 ===== */}
      <mesh position={[-0.15, -0.48, 0.1]}>
        <sphereGeometry args={[0.1, 12, 12]} />
        <meshStandardMaterial color={COLORS.body} roughness={0.7} />
      </mesh>
      <mesh position={[0.15, -0.48, 0.1]}>
        <sphereGeometry args={[0.1, 12, 12]} />
        <meshStandardMaterial color={COLORS.body} roughness={0.7} />
      </mesh>

      {/* ===== 圆球尾巴 ===== */}
      <group ref={tailRef} position={[0, -0.1, -0.45]}>
        <mesh>
          <sphereGeometry args={[0.1, 16, 16]} />
          <meshStandardMaterial color={COLORS.body} roughness={0.7} />
        </mesh>
      </group>
    </group>
  )
}

export default TotoroAvatar
