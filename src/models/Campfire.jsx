'use client'

import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

const LOG_COLOR = '#5a3518'
const STONE_COLOR = '#6a6a6a'
const EMBER_COLOR = '#ff4400'

const logMat = new THREE.MeshLambertMaterial({ color: LOG_COLOR })
const stoneMat = new THREE.MeshLambertMaterial({ color: STONE_COLOR })
const flameMat = new THREE.MeshBasicMaterial({
  color: '#ff6a00',
  transparent: true,
  opacity: 0.85,
  side: THREE.DoubleSide,
})
const flameInnerMat = new THREE.MeshBasicMaterial({
  color: '#ffcc00',
  transparent: true,
  opacity: 0.9,
  side: THREE.DoubleSide,
})
const emberMat = new THREE.MeshBasicMaterial({
  color: EMBER_COLOR,
  transparent: true,
  opacity: 0.7,
})

/**
 * Procedural campfire.
 * props:
 *   position: [x, y, z]
 *   state: 'building' | 'lit' | 'dying'
 *   progress: 0-1 (build progress, also used for dying fade)
 */
export default function Campfire({ position, state = 'lit', progress = 1 }) {
  const flameRefs = useRef([])
  const lightRef = useRef()
  const embersRef = useRef([])
  const timeRef = useRef(Math.random() * 100)

  const isLit = state === 'lit'
  const isDying = state === 'dying'
  const isBuilding = state === 'building'
  const showFire = isLit || isDying
  const fireOpacity = isDying ? Math.max(0, 1 - progress) : 1

  // Stone ring positions (8 stones in a circle)
  const stones = useMemo(() => {
    const arr = []
    for (let i = 0; i < 8; i++) {
      const angle = (i / 8) * Math.PI * 2
      arr.push({
        x: Math.cos(angle) * 0.55,
        z: Math.sin(angle) * 0.55,
        ry: angle,
      })
    }
    return arr
  }, [])

  // Ember particle starting positions
  const embers = useMemo(() =>
    Array.from({ length: 6 }, () => ({
      x: (Math.random() - 0.5) * 0.3,
      z: (Math.random() - 0.5) * 0.3,
      speed: 0.3 + Math.random() * 0.5,
      phase: Math.random() * Math.PI * 2,
    })),
  [])

  useFrame((_s, delta) => {
    timeRef.current += delta

    const t = timeRef.current

    // Animate flames
    for (let i = 0; i < flameRefs.current.length; i++) {
      const mesh = flameRefs.current[i]
      if (!mesh) continue
      const phase = i * 1.3
      const scaleY = 0.7 + Math.sin(t * 5 + phase) * 0.3 + Math.sin(t * 8 + phase * 2) * 0.15
      const scaleXZ = 0.8 + Math.sin(t * 4 + phase) * 0.2
      mesh.scale.set(scaleXZ, scaleY, scaleXZ)
      mesh.position.y = 0.25 + Math.sin(t * 6 + phase) * 0.05
      mesh.rotation.y = t * 0.5 + phase
      if (mesh.material) {
        mesh.material.opacity = fireOpacity * (0.6 + Math.sin(t * 7 + phase) * 0.25)
      }
    }

    // Flicker light
    if (lightRef.current && showFire) {
      lightRef.current.intensity = fireOpacity * (1.5 + Math.sin(t * 9) * 0.5 + Math.sin(t * 13) * 0.3)
    }

    // Animate embers
    for (let i = 0; i < embersRef.current.length; i++) {
      const mesh = embersRef.current[i]
      if (!mesh) continue
      const e = embers[i]
      const cycle = ((t * e.speed + e.phase) % 2) / 2 // 0→1 loop
      mesh.position.set(
        e.x + Math.sin(t * 2 + e.phase) * 0.15,
        0.3 + cycle * 1.5,
        e.z + Math.cos(t * 2 + e.phase) * 0.15,
      )
      mesh.material.opacity = fireOpacity * Math.max(0, 1 - cycle) * 0.8
    }
  })

  // During building, progressively reveal logs
  const logVisibility = isBuilding ? progress : 1

  return (
    <group position={position}>
      {/* Stone ring — always visible */}
      {stones.map((s, i) => (
        <mesh key={i} position={[s.x, 0.04, s.z]} rotation={[0, s.ry, 0]} material={stoneMat}>
          <boxGeometry args={[0.12, 0.08, 0.15]} />
        </mesh>
      ))}

      {/* Logs in teepee arrangement — appear during build */}
      {logVisibility > 0.2 && (
        <group>
          {/* Base log 1 */}
          <mesh position={[-0.15, 0.08, 0]} rotation={[0, 0, Math.PI / 12]} material={logMat}>
            <cylinderGeometry args={[0.04, 0.05, 0.65, 6]} />
          </mesh>
          {/* Base log 2 */}
          <mesh position={[0.15, 0.08, 0]} rotation={[0, 0, -Math.PI / 12]} material={logMat}>
            <cylinderGeometry args={[0.04, 0.05, 0.65, 6]} />
          </mesh>
        </group>
      )}
      {logVisibility > 0.5 && (
        <group>
          {/* Cross log */}
          <mesh position={[0, 0.08, 0.12]} rotation={[Math.PI / 14, Math.PI / 2, 0]} material={logMat}>
            <cylinderGeometry args={[0.035, 0.045, 0.6, 6]} />
          </mesh>
          {/* Leaning log */}
          <mesh position={[0, 0.15, -0.1]} rotation={[-Math.PI / 10, 0.4, Math.PI / 8]} material={logMat}>
            <cylinderGeometry args={[0.03, 0.04, 0.5, 6]} />
          </mesh>
        </group>
      )}

      {/* Flames — only when lit or dying */}
      {showFire && (
        <group>
          {/* Outer flame cones */}
          {[0, 1, 2].map((i) => (
            <mesh
              key={`f${i}`}
              ref={(el) => { flameRefs.current[i] = el }}
              position={[0, 0.25, 0]}
            >
              <coneGeometry args={[0.18 - i * 0.03, 0.5 + i * 0.1, 6]} />
              <meshBasicMaterial
                color={i === 0 ? '#ff6a00' : i === 1 ? '#ff9900' : '#ffcc00'}
                transparent
                opacity={0.8}
                side={THREE.DoubleSide}
              />
            </mesh>
          ))}
          {/* Inner bright core */}
          <mesh ref={(el) => { flameRefs.current[3] = el }} position={[0, 0.2, 0]}>
            <coneGeometry args={[0.08, 0.3, 5]} />
            <meshBasicMaterial color="#ffe060" transparent opacity={0.95} side={THREE.DoubleSide} />
          </mesh>

          {/* Point light */}
          <pointLight
            ref={lightRef}
            color="#ff8833"
            intensity={1.5}
            distance={18}
            position={[0, 0.5, 0]}
            castShadow={false}
          />

          {/* Embers */}
          {embers.map((_, i) => (
            <mesh key={`e${i}`} ref={(el) => { embersRef.current[i] = el }} position={[0, 0.3, 0]}>
              <sphereGeometry args={[0.015, 4, 4]} />
              <meshBasicMaterial color={EMBER_COLOR} transparent opacity={0.7} />
            </mesh>
          ))}
        </group>
      )}

      {/* Glow on the ground when lit */}
      {showFire && (
        <mesh position={[0, 0.01, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <circleGeometry args={[1.2, 16]} />
          <meshBasicMaterial
            color="#ff6a20"
            transparent
            opacity={fireOpacity * 0.12}
            side={THREE.DoubleSide}
          />
        </mesh>
      )}
    </group>
  )
}
