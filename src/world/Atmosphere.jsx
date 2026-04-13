'use client'

import { useRef, useEffect } from 'react'
import { useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { useGameStore } from '@/store/useGameStore'
import { ERAS } from '@/data/eras'

const DEFAULT_ERA = ERAS[0]

// Sun position based on hour (0-23). Returns [x, y, z].
function sunPosition(hour) {
  // Map hour to angle: 6am = horizon east, 12 = overhead, 18 = horizon west
  const angle = ((hour - 6) / 24) * Math.PI * 2
  const x = Math.cos(angle) * 80
  const y = Math.sin(angle) * 80
  const z = 40
  return [x, Math.max(y, -20), z]
}

// Intensity multiplier based on hour (dim at night, bright midday)
function dayIntensity(hour) {
  // Smooth curve: peaks at noon, bottoms at midnight
  const rad = ((hour - 12) / 24) * Math.PI * 2
  return 0.15 + 0.85 * Math.max(0, Math.cos(rad))
}

export default function Atmosphere() {
  const dirLightRef = useRef(null)
  const { scene } = useThree()

  const currentEra     = useGameStore((s) => s.currentEra)
  const currentEraData = useGameStore((s) => s.currentEraData)
  const devFogDensity  = useGameStore((s) => s.devFogDensity)
  const devTimeOfDay   = useGameStore((s) => s.devTimeOfDay)

  const era = currentEraData ?? ERAS.find((e) => e.id === currentEra) ?? DEFAULT_ERA

  const fogDensity = devFogDensity ?? era.fogDensity
  const timeFactor = devTimeOfDay !== null ? dayIntensity(devTimeOfDay) : 1
  const sunPos = devTimeOfDay !== null ? sunPosition(devTimeOfDay) : [60, 80, 40]

  // Apply scene fog whenever era or dev override changes
  useEffect(() => {
    scene.fog = new THREE.FogExp2(era.fogColor, fogDensity)
    return () => {
      scene.fog = null
    }
  }, [scene, era.fogColor, fogDensity])

  // Keep shadow camera tight around the visible world
  useEffect(() => {
    if (!dirLightRef.current) return
    const cam = dirLightRef.current.shadow.camera
    cam.near = 0.5
    cam.far = 600
    cam.left   = -220
    cam.right  =  220
    cam.top    =  220
    cam.bottom = -220
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
        intensity={era.ambientIntensity * 0.7 * timeFactor}
      />

      {/* Ambient light */}
      <ambientLight
        intensity={era.ambientIntensity * 0.35 * Math.max(timeFactor, 0.3)}
        color={era.skyColor}
      />

      {/* Primary sun / directional light */}
      <directionalLight
        ref={dirLightRef}
        color={era.sunColor}
        intensity={era.ambientIntensity * 1.4 * timeFactor}
        position={sunPos}
        castShadow
      />
    </>
  )
}
