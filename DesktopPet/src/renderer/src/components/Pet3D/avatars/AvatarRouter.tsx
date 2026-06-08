/**
 * AvatarRouter - 形象路由器
 *
 * 根据 avatarStore 中的当前形象 ID，渲染对应的 3D 形象组件。
 * 替代原来的 PetModel.tsx 成为 PetScene 中的模型入口。
 */

import React, { Suspense, useEffect } from 'react'
import { Float, Html } from '@react-three/drei'
import { useAvatarStore } from '../../../stores/avatarStore'
import { useAvatarAnimation, MOOD_EMOJI } from './useAvatarAnimation'
import { AvatarId } from '../../../types/avatar'

// 懒加载各形象组件
const TotoroAvatar = React.lazy(() => import('./TotoroAvatar'))
const DogAvatar = React.lazy(() => import('./DogAvatar'))
const GhostAvatar = React.lazy(() => import('./GhostAvatar'))

/** 形象 ID 到组件的映射 */
const AVATAR_COMPONENTS: Record<AvatarId, React.LazyExoticComponent<React.ComponentType<any>>> = {
  totoro: TotoroAvatar,
  dog: DogAvatar,
  ghost: GhostAvatar,
}

/** 加载占位符 */
function LoadingPlaceholder() {
  return (
    <mesh>
      <sphereGeometry args={[0.3, 16, 16]} />
      <meshStandardMaterial color="#cccccc" transparent opacity={0.5} />
    </mesh>
  )
}

const AvatarRouter: React.FC = () => {
  const currentAvatarId = useAvatarStore((s) => s.currentAvatarId)
  const animState = useAvatarAnimation()

  const AvatarComponent = AVATAR_COMPONENTS[currentAvatarId]

  useEffect(() => {
    console.log('[AvatarRouter] Avatar changed to:', currentAvatarId)
  }, [currentAvatarId])

  return (
    <Float speed={2} rotationIntensity={0.1} floatIntensity={0.3}>
      <group ref={animState.groupRef}>
        <Suspense fallback={<LoadingPlaceholder />}>
          {AvatarComponent && (
            <AvatarComponent
              key={currentAvatarId}
              mood={animState.mood}
              clickEffect={animState.clickEffect}
              showEmoji={animState.showEmoji}
              bodyRef={animState.bodyRef}
            />
          )}
        </Suspense>

        {/* 情绪表情气泡 (头顶) */}
        {animState.showEmoji && (
          <Html position={[0, 0.9, 0]} center>
            <div className="bubble-particle" style={{ fontSize: '24px' }}>
              {MOOD_EMOJI[animState.mood]}
            </div>
          </Html>
        )}
      </group>
    </Float>
  )
}

export default AvatarRouter
