/**
 * PetModel - 宠物模型入口
 *
 * 作为形象系统的入口，渲染 AvatarRouter。
 * 保留心情颜色映射供各形象组件使用。
 */

import React from 'react'
import AvatarRouter from './avatars/AvatarRouter'

const PetModel: React.FC = () => {
  return <AvatarRouter />
}

export default PetModel
