'use client'

import { useMemo, useRef } from 'react'
import * as THREE from 'three'
import { useGameStore } from '@/store/useGameStore'
import { ERAS } from '@/data/eras'

const DEFAULT_ERA = ERAS[0]

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

  const era = currentEraData ?? ERAS.find((e) => e.id === currentEra) ?? DEFAULT_ERA

  const uniforms = useMemo(() => ({
    uTopColor:     { value: new THREE.Color(era.skyColor) },
    uHorizonColor: { value: new THREE.Color(era.fogColor) },
    uExponent:     { value: 0.5 },
  }), []) // initialised once; updated below via ref

  // Reactively update colours on era change without recreating the mesh
  if (materialRef.current) {
    materialRef.current.uniforms.uTopColor.value.set(era.skyColor)
    materialRef.current.uniforms.uHorizonColor.value.set(era.fogColor)
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
