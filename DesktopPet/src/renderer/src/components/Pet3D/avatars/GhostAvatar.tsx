/**
 * GhostAvatar - 幽灵形象
 *
 * 半透明圆润身体，底部锯齿飘带，大眼睛。
 * 漂浮感强，可爱不恐怖。
 */

import React, { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { AvatarProps } from '../../../types/avatar'

/** 幽灵各部位颜色 */
const COLORS = {
  body: '#e8e0f0',         // 淡紫色主体
  bodyGlow: '#d0c0e8',     // 发光色
  eye: '#2a1a3a',          // 深紫色眼睛
  eyeHighlight: '#ffffff',  // 眼睛高光
  mouth: '#4a3a5a',         // 嘴巴
  blush: '#d8a0c0',        // 腮红
  ribbon: '#c890d0',       // 飘带装饰
}

/** 生成底部锯齿飘带的形状 */
function createRibbonGeometry(): THREE.BufferGeometry {
  const points: THREE.Vector3[] = []
  const segments = 24
  const radius = 0.4

  for (let i = 0; i <= segments; i++) {
    const angle = (i / segments) * Math.PI * 2
    const waveOffset = Math.sin(angle * 5) * 0.08 // 锯齿波浪
    const r = radius + waveOffset
    const x = Math.cos(angle) * r
    const z = Math.sin(angle) * r
    points.push(new THREE.Vector3(x, -0.45, z))
  }

  // 连接到中心点形成锥形
  const centerPoints = points.map((p) => {
    return new THREE.Vector3(p.x * 0.3, -0.65, p.z * 0.3)
  })

  const geometry = new THREE.BufferGeometry()
  const vertices: number[] = []
  const indices: number[] = []

  // 添加顶点
  for (const p of points) {
    vertices.push(p.x, p.y, p.z)
  }
  for (const p of centerPoints) {
    vertices.push(p.x, p.y, p.z)
  }

  // 创建三角面
  for (let i = 0; i < segments; i++) {
    const a = i
    const b = (i + 1) % (segments + 1)
    const c = segments + 1 + i
    const d = segments + 1 + (i + 1) % (segments + 1)
    indices.push(a, b, c)
    indices.push(b, d, c)
  }

  geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3))
  geometry.setIndex(indices)
  geometry.computeVertexNormals()

  return geometry
}

const GhostAvatar: React.FC<AvatarProps> = ({ mood, clickEffect, showEmoji, bodyRef }) => {
  const ribbonRef = useRef<THREE.Group>(null)
  const glowRef = useRef<THREE.Mesh>(null)

  const ribbonGeometry = useMemo(() => createRibbonGeometry(), [])

  // 飘带波动 + 发光呼吸动画
  useFrame((state) => {
    const time = state.clock.getElapsedTime()

    if (ribbonRef.current) {
      // 飘带上下浮动
      ribbonRef.current.position.y = Math.sin(time * 1.5) * 0.03
      ribbonRef.current.rotation.y = time * 0.3
    }

    if (glowRef.current) {
      // 发光呼吸效果
      const glowIntensity = 0.3 + Math.sin(time * 2) * 0.15
      if (glowRef.current.material instanceof THREE.MeshStandardMaterial) {
        glowRef.current.material.emissiveIntensity = glowIntensity
      }
    }
  })

  return (
    <group>
      {/* ===== 主体 - 半透明圆润身体 ===== */}
      <mesh ref={bodyRef} position={[0, 0.05, 0]} scale={[1, 1.1, 0.95]}>
        <sphereGeometry args={[0.42, 32, 32]} />
        <meshStandardMaterial
          color={COLORS.body}
          roughness={0.2}
          metalness={0.1}
          transparent
          opacity={0.85}
        />
      </mesh>

      {/* 外层发光 */}
      <mesh ref={glowRef} position={[0, 0.05, 0]} scale={[1.05, 1.15, 1.0]}>
        <sphereGeometry args={[0.42, 32, 32]} />
        <meshStandardMaterial
          color={COLORS.bodyGlow}
          transparent
          opacity={0.15}
          emissive={COLORS.bodyGlow}
          emissiveIntensity={0.3}
        />
      </mesh>

      {/* ===== 大眼睛 ===== */}
      {/* 左眼 */}
      <mesh position={[-0.12, 0.12, 0.38]}>
        <sphereGeometry args={[0.08, 16, 16]} />
        <meshStandardMaterial color="#ffffff" />
      </mesh>
      <mesh position={[-0.12, 0.12, 0.44]}>
        <sphereGeometry args={[0.06, 16, 16]} />
        <meshStandardMaterial color={COLORS.eye} />
      </mesh>
      <mesh position={[-0.1, 0.14, 0.48]}>
        <sphereGeometry args={[0.025, 8, 8]} />
        <meshStandardMaterial color={COLORS.eyeHighlight} emissive="#ffffff" emissiveIntensity={0.6} />
      </mesh>
      {/* 左眼第二高光 */}
      <mesh position={[-0.14, 0.1, 0.47]}>
        <sphereGeometry args={[0.012, 6, 6]} />
        <meshStandardMaterial color={COLORS.eyeHighlight} emissive="#ffffff" emissiveIntensity={0.4} />
      </mesh>

      {/* 右眼 */}
      <mesh position={[0.12, 0.12, 0.38]}>
        <sphereGeometry args={[0.08, 16, 16]} />
        <meshStandardMaterial color="#ffffff" />
      </mesh>
      <mesh position={[0.12, 0.12, 0.44]}>
        <sphereGeometry args={[0.06, 16, 16]} />
        <meshStandardMaterial color={COLORS.eye} />
      </mesh>
      <mesh position={[0.14, 0.14, 0.48]}>
        <sphereGeometry args={[0.025, 8, 8]} />
        <meshStandardMaterial color={COLORS.eyeHighlight} emissive="#ffffff" emissiveIntensity={0.6} />
      </mesh>
      <mesh position={[0.1, 0.1, 0.47]}>
        <sphereGeometry args={[0.012, 6, 6]} />
        <meshStandardMaterial color={COLORS.eyeHighlight} emissive="#ffffff" emissiveIntensity={0.4} />
      </mesh>

      {/* ===== 嘴巴 - 小小的 o 形 ===== */}
      <mesh position={[0, 0.0, 0.42]}>
        <sphereGeometry args={[0.025, 12, 12]} />
        <meshStandardMaterial color={COLORS.mouth} />
      </mesh>

      {/* ===== 腮红 ===== */}
      <mesh position={[-0.2, 0.04, 0.34]}>
        <circleGeometry args={[0.04, 16]} />
        <meshStandardMaterial color={COLORS.blush} transparent opacity={0.4} side={THREE.DoubleSide} />
      </mesh>
      <mesh position={[0.2, 0.04, 0.34]}>
        <circleGeometry args={[0.04, 16]} />
        <meshStandardMaterial color={COLORS.blush} transparent opacity={0.4} side={THREE.DoubleSide} />
      </mesh>

      {/* ===== 头顶蝴蝶结 ===== */}
      <group position={[0.2, 0.4, 0.05]}>
        {/* 左翅膀 */}
        <mesh position={[-0.06, 0, 0]} rotation={[0, 0, -0.3]} scale={[1, 0.6, 0.5]}>
          <sphereGeometry args={[0.06, 8, 8]} />
          <meshStandardMaterial color={COLORS.ribbon} />
        </mesh>
        {/* 右翅膀 */}
        <mesh position={[0.06, 0, 0]} rotation={[0, 0, 0.3]} scale={[1, 0.6, 0.5]}>
          <sphereGeometry args={[0.06, 8, 8]} />
          <meshStandardMaterial color={COLORS.ribbon} />
        </mesh>
        {/* 中心结 */}
        <mesh>
          <sphereGeometry args={[0.025, 8, 8]} />
          <meshStandardMaterial color={COLORS.ribbon} />
        </mesh>
      </group>

      {/* ===== 小手 ===== */}
      <mesh position={[-0.35, -0.02, 0.1]} rotation={[0, 0, -0.3]} scale={[0.6, 0.8, 0.6]}>
        <sphereGeometry args={[0.07, 12, 12]} />
        <meshStandardMaterial color={COLORS.body} transparent opacity={0.8} />
      </mesh>
      <mesh position={[0.35, -0.02, 0.1]} rotation={[0, 0, 0.3]} scale={[0.6, 0.8, 0.6]}>
        <sphereGeometry args={[0.07, 12, 12]} />
        <meshStandardMaterial color={COLORS.body} transparent opacity={0.8} />
      </mesh>

      {/* ===== 底部飘带 ===== */}
      <group ref={ribbonRef}>
        <mesh geometry={ribbonGeometry}>
          <meshStandardMaterial
            color={COLORS.body}
            roughness={0.2}
            transparent
            opacity={0.6}
            side={THREE.DoubleSide}
          />
        </mesh>
      </group>
    </group>
  )
}

export default GhostAvatar
