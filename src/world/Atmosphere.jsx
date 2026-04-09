'use client'

import { useRef, useEffect } from 'react'
import { useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { useGameStore } from '@/store/useGameStore'
import { ERAS } from '@/data/eras'

const DEFAULT_ERA = ERAS[0]

export default function Atmosphere() {
  const dirLightRef = useRef(null)
  const { scene } = useThree()

  const currentEra    = useGameStore((s) => s.currentEra)
  const currentEraData = useGameStore((s) => s.currentEraData)

  const era = currentEraData ?? ERAS.find((e) => e.id === currentEra) ?? DEFAULT_ERA

  // Apply scene fog whenever era changes
  useEffect(() => {
    scene.fog = new THREE.FogExp2(era.fogColor, era.fogDensity)
    return () => {
      scene.fog = null
    }
  }, [scene, era.fogColor, era.fogDensity])

  // Keep shadow camera tight around the visible world
  useEffect(() => {
    if (!dirLightRef.current) return
    const cam = dirLightRef.current.shadow.camera
    cam.near = 0.5
    cam.far = 400
    cam.left   = -120
    cam.right  =  120
    cam.top    =  120
    cam.bottom = -120
    dirLightRef.current.shadow.mapSize.set(2048, 2048)
    dirLightRef.current.shadow.bias = -0.001
    dirLightRef.current.shadow.camera.updateProjectionMatrix()
  }, [])

  return (
    <>
      {/* Hemisphere light — sky / ground fill */}
      <hemisphereLight
        skyColor={era.skyColor}
        groundColor={era.groundTint}
        intensity={era.ambientIntensity * 0.7}
      />

      {/* Ambient light */}
      <ambientLight intensity={era.ambientIntensity * 0.35} color={era.skyColor} />

      {/* Primary sun / directional light */}
      <directionalLight
        ref={dirLightRef}
        color={era.sunColor}
        intensity={era.ambientIntensity * 1.4}
        position={[60, 80, 40]}
        castShadow
      />
    </>
  )
}
