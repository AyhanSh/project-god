'use client'

import { useMemo, useRef } from 'react'
import * as THREE from 'three'
import {
  TERRAIN_SIZE,
  TERRAIN_SCALE,
  WATER_LEVEL,
  FLAT_RADIUS,
  MOUNTAIN_THRESHOLD,
  sampleHeight,
} from '@/world/Terrain'

// Deterministic PRNG
function mulberry32(seed) {
  return function () {
    seed |= 0
    seed = (seed + 0x6d2b79f5) | 0
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const ROCK_COUNT   = 200
const EDGE_MARGIN  = 4
const CITY_EXCLUSION = FLAT_RADIUS + 2

export default function Rocks({ heightmap, seed = 99 }) {
  const meshRef = useRef(null)

  const { geo, matrices } = useMemo(() => {
    const rng = mulberry32(seed)
    const geo = new THREE.IcosahedronGeometry(1, 1)

    const half   = TERRAIN_SIZE / 2
    const dummy  = new THREE.Object3D()
    const matrices = []

    let attempts = 0
    const maxAttempts = ROCK_COUNT * 30

    while (matrices.length < ROCK_COUNT && attempts < maxAttempts) {
      attempts++

      const wx = (rng() * 2 - 1) * (half - EDGE_MARGIN)
      const wz = (rng() * 2 - 1) * (half - EDGE_MARGIN)

      if (Math.sqrt(wx * wx + wz * wz) < CITY_EXCLUSION) continue
      if (!heightmap) continue

      const wy = sampleHeight(heightmap, wx, wz)
      if (wy <= WATER_LEVEL + 0.3) continue

      const normH = (wy / TERRAIN_SCALE + 1) * 0.5

      // Rocks are more likely in mountains but can appear anywhere above water
      // Bias: rocks spawn 3x more often in mountain zones
      const inMountain = normH > MOUNTAIN_THRESHOLD
      if (!inMountain && rng() < 0.55) continue

      const scale  = inMountain
        ? 0.4 + rng() * 1.4
        : 0.15 + rng() * 0.55
      const scaleX = scale * (0.7 + rng() * 0.6)
      const scaleY = scale * (0.5 + rng() * 0.8)
      const scaleZ = scale * (0.7 + rng() * 0.6)

      dummy.position.set(wx, wy + scaleY * 0.35, wz)
      dummy.rotation.set(
        rng() * Math.PI * 2,
        rng() * Math.PI * 2,
        rng() * Math.PI * 2
      )
      dummy.scale.set(scaleX, scaleY, scaleZ)
      dummy.updateMatrix()

      matrices.push(dummy.matrix.clone())
    }

    return { geo, matrices }
  }, [heightmap, seed])

  const setRef = (mesh) => {
    if (!mesh) return
    meshRef.current = mesh
    matrices.forEach((mat, i) => mesh.setMatrixAt(i, mat))
    mesh.instanceMatrix.needsUpdate = true
  }

  if (!heightmap) return null

  return (
    <instancedMesh
      ref={setRef}
      args={[geo, null, matrices.length]}
      castShadow
      receiveShadow
    >
      <meshLambertMaterial color="#7a7a72" />
    </instancedMesh>
  )
}
