'use client'

import { useMemo, useRef } from 'react'
import * as THREE from 'three'
import { useGameStore } from '@/store/useGameStore'
import { ERAS } from '@/data/eras'

const DEFAULT_ERA = ERAS[0]

// Night color tint for the sky dome
const NIGHT_COLOR = new THREE.Color('#060610')
const _tempColor = new THREE.Color()

/**
 * Custom gradient sky dome.
 *
 * We avoid drei's <Sky /> here because that component is a physically-based
 * atmospheric shader (Rayleigh scattering) and its sky colour is controlled by
 * sun angles, not by a hex tint — so it cannot follow our era palette directly.
 *
 * Instead we render a large sphere (BackSide) whose vertex shader blends two
 * colours from zenith to horizon using the vertex Y position.
 */

const SKY_VERT = /* glsl */`
varying float vY;
void main() {
  vY = normalize(position).y;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`

const SKY_FRAG = /* glsl */`
uniform vec3 uTopColor;
uniform vec3 uHorizonColor;
uniform float uExponent;
varying float vY;
void main() {
  float t = pow(clamp(vY, 0.0, 1.0), uExponent);
  gl_FragColor = vec4(mix(uHorizonColor, uTopColor, t), 1.0);
}
`

export default function Sky() {
  const materialRef = useRef(null)

  const currentEra     = useGameStore((s) => s.currentEra)
  const currentEraData = useGameStore((s) => s.currentEraData)
  const timeOfDay      = useGameStore((s) => s.timeOfDay)
  const devTimeOfDay   = useGameStore((s) => s.devTimeOfDay)

  const era = currentEraData ?? ERAS.find((e) => e.id === currentEra) ?? DEFAULT_ERA

  // Day/night factor: 1 = full day, 0 = full night
  const gameHour = devTimeOfDay !== null ? devTimeOfDay : timeOfDay
  const dayRad = ((gameHour - 12) / 24) * Math.PI * 2
  const dayFactor = 0.15 + 0.85 * Math.max(0, Math.cos(dayRad))

  const uniforms = useMemo(() => ({
    uTopColor:     { value: new THREE.Color(era.skyColor) },
    uHorizonColor: { value: new THREE.Color(era.fogColor) },
    uExponent:     { value: 0.5 },
  }), []) // initialised once; updated below via ref

  // Reactively update colours on era change + day/night cycle
  if (materialRef.current) {
    _tempColor.set(era.skyColor).lerp(NIGHT_COLOR, 1 - dayFactor)
    materialRef.current.uniforms.uTopColor.value.copy(_tempColor)
    _tempColor.set(era.fogColor).lerp(NIGHT_COLOR, 1 - dayFactor)
    materialRef.current.uniforms.uHorizonColor.value.copy(_tempColor)
  }

  return (
    <mesh>
      <sphereGeometry args={[450, 32, 16]} />
      <shaderMaterial
        ref={materialRef}
        vertexShader={SKY_VERT}
        fragmentShader={SKY_FRAG}
        uniforms={uniforms}
        side={THREE.BackSide}
        depthWrite={false}
      />
    </mesh>
  )
}
