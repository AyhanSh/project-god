'use client'

import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { TERRAIN_SIZE, WATER_LEVEL } from './Terrain'

export default function Water() {
  const materialRef = useRef(null)

  useFrame(({ clock }) => {
    if (!materialRef.current) return
    const t = clock.getElapsedTime()
    // Gentle opacity pulse simulating light diffraction on water
    materialRef.current.opacity = 0.72 + Math.sin(t * 0.8) * 0.06
    // Subtle color shift between deep and lighter blue
    const lerpT = (Math.sin(t * 0.3) + 1) * 0.5
    materialRef.current.color.setRGB(
      0.10 + lerpT * 0.08,
      0.28 + lerpT * 0.12,
      0.62 + lerpT * 0.08
    )
  })

  return (
    <mesh
      position={[0, WATER_LEVEL, 0]}
      rotation={[-Math.PI / 2, 0, 0]}
      receiveShadow
    >
      <planeGeometry args={[TERRAIN_SIZE * 1.1, TERRAIN_SIZE * 1.1, 1, 1]} />
      <meshLambertMaterial
        ref={materialRef}
        color="#1a4fa0"
        transparent
        opacity={0.72}
        side={THREE.DoubleSide}
        depthWrite={false}
      />
    </mesh>
  )
}
