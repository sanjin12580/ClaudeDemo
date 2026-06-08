/**
 * PetInteraction - 宠物交互处理
 *
 * 简化策略：窗口始终不穿透，通过鼠标位置判断是否在宠物区域。
 * 避免 setIgnoreMouseEvents 反复切换导致的问题。
 */

import React, { useCallback, useEffect, useRef } from 'react'
import { useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { eventBus } from '../../core/EventBus'
import { isOverlayOpen } from '../../core/overlayState'
import { usePetStore } from '../../stores/petStore'

const PetInteraction: React.FC = () => {
  const { camera, gl } = useThree()
  const isDragging = useRef(false)
  const lastMousePos = useRef({ x: 0, y: 0 })
  const isOverPet = useRef(false)

  // 判断鼠标是否在宠物区域
  const isMouseOverPet = useCallback((event: MouseEvent): boolean => {
    const rect = gl.domElement.getBoundingClientRect()
    const x = ((event.clientX - rect.left) / rect.width) * 2 - 1
    const y = -((event.clientY - rect.top) / rect.height) * 2 + 1
    return Math.sqrt(x * x + y * y) < 0.6
  }, [gl])

  const handleClick = useCallback((event: MouseEvent) => {
    if (isOverlayOpen()) return
    if (!isMouseOverPet(event)) return

    eventBus.emit('pet:click', { position: { x: event.clientX, y: event.clientY } })
    usePetStore.getState().setMood('happy')
    usePetStore.getState().updateStats({
      happiness: usePetStore.getState().stats.happiness + 2,
      intimacy: usePetStore.getState().stats.intimacy + 1,
    })
    setTimeout(() => {
      if (usePetStore.getState().mood === 'happy') {
        usePetStore.getState().setMood('idle')
      }
    }, 3000)
  }, [isMouseOverPet])

  const handleMouseDown = useCallback((event: MouseEvent) => {
    if (isOverlayOpen()) return
    if (!isMouseOverPet(event)) return

    isDragging.current = true
    lastMousePos.current = { x: event.clientX, y: event.clientY }
    usePetStore.getState().setInteracting(true)
  }, [isMouseOverPet])

  const handleMouseMove = useCallback((event: MouseEvent) => {
    if (!isDragging.current) return
    const deltaX = event.clientX - lastMousePos.current.x
    const deltaY = event.clientY - lastMousePos.current.y
    window.api.moveWindow(deltaX, deltaY)
    lastMousePos.current = { x: event.clientX, y: event.clientY }
  }, [])

  const handleMouseUp = useCallback(() => {
    if (isDragging.current) {
      isDragging.current = false
      usePetStore.getState().setInteracting(false)
    }
  }, [])

  // 鼠标移动时检测是否在宠物区域，更新状态栏
  const handleMouseMoveGlobal = useCallback((event: MouseEvent) => {
    const overPet = isMouseOverPet(event)
    if (overPet !== isOverPet.current) {
      isOverPet.current = overPet
      usePetStore.getState().setShowStatusBar(overPet)
    }
  }, [isMouseOverPet])

  useEffect(() => {
    const canvas = gl.domElement
    canvas.addEventListener('click', handleClick)
    canvas.addEventListener('mousedown', handleMouseDown)
    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('mousemove', handleMouseMoveGlobal)
    window.addEventListener('mouseup', handleMouseUp)

    return () => {
      canvas.removeEventListener('click', handleClick)
      canvas.removeEventListener('mousedown', handleMouseDown)
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mousemove', handleMouseMoveGlobal)
      window.removeEventListener('mouseup', handleMouseUp)
    }
  }, [gl, handleClick, handleMouseDown, handleMouseMove, handleMouseMoveGlobal, handleMouseUp])

  return null
}

export default PetInteraction
