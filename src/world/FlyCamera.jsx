'use client'

import { useRef, useEffect, useCallback } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { useGameStore } from '@/store/useGameStore'

const LOOK_SPEED = 0.002

/**
 * WASD fly camera — FPS-style free movement.
 * W/S = forward/back, A/D = strafe, Space = up, Shift = down.
 * Right-click + drag to look around.
 */
export default function FlyCamera() {
  const { camera, gl } = useThree()
  const flySpeed = useGameStore((s) => s.flySpeed)
  const flySmoothness = useGameStore((s) => s.flySmoothness)
  const keys = useRef({})
  const isLooking = useRef(false)
  const euler = useRef(new THREE.Euler(0, 0, 0, 'YXZ'))
  const velocity = useRef(new THREE.Vector3())
  const initialized = useRef(false)

  // Capture initial camera orientation once
  useEffect(() => {
    if (!initialized.current) {
      euler.current.setFromQuaternion(camera.quaternion, 'YXZ')
      initialized.current = true
    }
  }, [camera])

  // Key listeners
  useEffect(() => {
    const onKeyDown = (e) => {
      // Ignore when typing in inputs
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return
      keys.current[e.code] = true
    }
    const onKeyUp = (e) => {
      keys.current[e.code] = false
    }

    window.addEventListener('keydown', onKeyDown)
    window.addEventListener('keyup', onKeyUp)
    return () => {
      window.removeEventListener('keydown', onKeyDown)
      window.removeEventListener('keyup', onKeyUp)
    }
  }, [])

  // Mouse look (right-click drag)
  useEffect(() => {
    const canvas = gl.domElement

    const onMouseDown = (e) => {
      if (e.button === 2) {
        isLooking.current = true
        canvas.requestPointerLock?.().catch(() => {})
      }
    }
    const onMouseUp = (e) => {
      if (e.button === 2) {
        isLooking.current = false
        document.exitPointerLock?.()
      }
    }
    const onMouseMove = (e) => {
      if (!isLooking.current) return
      euler.current.y -= e.movementX * LOOK_SPEED
      euler.current.x -= e.movementY * LOOK_SPEED
      euler.current.x = Math.max(-Math.PI / 2 + 0.05, Math.min(Math.PI / 2 - 0.05, euler.current.x))
    }
    const onContextMenu = (e) => e.preventDefault()

    canvas.addEventListener('mousedown', onMouseDown)
    canvas.addEventListener('mouseup', onMouseUp)
    canvas.addEventListener('mousemove', onMouseMove)
    canvas.addEventListener('contextmenu', onContextMenu)
    return () => {
      canvas.removeEventListener('mousedown', onMouseDown)
      canvas.removeEventListener('mouseup', onMouseUp)
      canvas.removeEventListener('mousemove', onMouseMove)
      canvas.removeEventListener('contextmenu', onContextMenu)
    }
  }, [gl])

  // Movement each frame
  useFrame((_, delta) => {
    const k = keys.current
    const speed = k['ShiftLeft'] || k['ShiftRight'] ? flySpeed * 2 : flySpeed

    // Apply look rotation
    camera.quaternion.setFromEuler(euler.current)

    // Movement direction
    const forward = new THREE.Vector3()
    camera.getWorldDirection(forward)
    forward.normalize()

    const right = new THREE.Vector3()
    right.crossVectors(forward, camera.up).normalize()

    const target = new THREE.Vector3()

    if (k['KeyW']) target.add(forward)
    if (k['KeyS']) target.sub(forward)
    if (k['KeyA']) target.sub(right)
    if (k['KeyD']) target.add(right)
    if (k['Space']) target.y += 1
    if (k['ControlLeft'] || k['ControlRight']) target.y -= 1

    if (target.lengthSq() > 0) {
      target.normalize().multiplyScalar(speed)
    }

    // Lerp velocity for smoothness (0 = instant, 1 = very smooth)
    const dampingFactor = 1 - Math.pow(flySmoothness, 0.5)
    const lerpAlpha = 1 - Math.pow(1 - dampingFactor, delta * 60)
    velocity.current.lerp(target, lerpAlpha)

    // Kill tiny residual drift
    if (velocity.current.lengthSq() < 0.001) {
      velocity.current.set(0, 0, 0)
    }

    if (velocity.current.lengthSq() > 0) {
      camera.position.addScaledVector(velocity.current, delta)
    }
  })

  return null
}
