/**
 * PetScene - Three.js 场景容器
 *
 * 包含 3D 场景、光照、摄像机配置。
 * 背景透明，宠物渲染在透明窗口上。
 * 应用外观设置（缩放、透明度）。
 */

import React from 'react'
import { Canvas } from '@react-three/fiber'
import PetModel from './PetModel'
import PetInteraction from './PetInteraction'
import { useSettingsStore } from '../../stores/settingsStore'

const PetScene: React.FC = () => {
  const petScale = useSettingsStore((s) => s.petScale)
  const petOpacity = useSettingsStore((s) => s.petOpacity)

  return (
    <Canvas
      camera={{
        position: [0, 0, 5],
        fov: 50,
        near: 0.1,
        far: 100,
      }}
      style={{
        width: '100%',
        height: '100%',
        background: 'transparent',
        opacity: petOpacity,
      }}
      gl={{
        alpha: true,
        antialias: true,
        powerPreference: 'high-performance',
      }}
      onCreated={({ gl }) => {
        gl.setClearColor(0x000000, 0)
      }}
    >
      {/* 环境光 */}
      <ambientLight intensity={0.6} />

      {/* 主方向光 */}
      <directionalLight position={[5, 5, 5]} intensity={0.8} />

      {/* 补光 */}
      <directionalLight position={[-3, 2, -2]} intensity={0.3} color="#b0c4ff" />

      {/* 交互层 */}
      <PetInteraction />

      {/* 宠物模型（应用缩放） */}
      <group scale={[petScale, petScale, petScale]}>
        <PetModel />
      </group>
    </Canvas>
  )
}

export default PetScene
