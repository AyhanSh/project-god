'use client'

import { useMemo, useRef, useEffect } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import {
  TERRAIN_SIZE,
  TERRAIN_SEGMENTS,
  TERRAIN_SCALE,
  WATER_LEVEL,
  FLAT_RADIUS,
  MOUNTAIN_THRESHOLD,
  sampleHeight,
} from '@/world/Terrain'
import { registerNodes, getActiveNodes } from '@/engine/ResourceNodeRegistry'

// ---------------------------------------------------------------------------
// Deterministic PRNG (same implementation as Terrain.jsx to keep it isolated)
// ---------------------------------------------------------------------------
function mulberry32(seed) {
  return function () {
    seed |= 0
    seed = (seed + 0x6d2b79f5) | 0
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

// ---------------------------------------------------------------------------
// Tree count
// ---------------------------------------------------------------------------
const TOTAL_TREES = 1000
// Split roughly 60/40 between oak and pine
const OAK_COUNT  = 600
const PINE_COUNT = 400

// Margin from edge of terrain
const EDGE_MARGIN = 8
// Extra exclusion around the flat city zone
const CITY_EXCLUSION = FLAT_RADIUS + 4
// Height above water where trees begin
const TREE_MIN_WORLD_Y = WATER_LEVEL + 0.8

// ---------------------------------------------------------------------------
// Geometry helpers
// ---------------------------------------------------------------------------

/**
 * Build a merged geometry for one Oak tree:
 *   - cylinder trunk
 *   - sphere crown offset upward
 * Returned geometry has all vertices in trunk-root space (y=0 = ground level).
 */
function buildOakGeometry() {
  const trunkH = 1.4 + Math.random() * 0.6
  const trunkR = 0.12 + Math.random() * 0.06
  const crownR = 1.0 + Math.random() * 0.6
  const crownY = trunkH + crownR * 0.65

  const trunk = new THREE.CylinderGeometry(trunkR * 0.6, trunkR, trunkH, 6, 1)
  trunk.translate(0, trunkH / 2, 0)

  const crown = new THREE.SphereGeometry(crownR, 7, 5)
  crown.translate(0, crownY, 0)

  const merged = mergeGeometries([trunk, crown])
  return merged
}

/**
 * Build a merged geometry for one Pine tree:
 *   - cylinder trunk
 *   - 3 stacked cones of decreasing radius / height
 */
function buildPineGeometry() {
  const trunkH = 0.8 + Math.random() * 0.4
  const trunkR = 0.09 + Math.random() * 0.04

  const trunk = new THREE.CylinderGeometry(trunkR * 0.5, trunkR, trunkH, 5, 1)
  trunk.translate(0, trunkH / 2, 0)

  const layer1H = 2.2 + Math.random() * 0.6
  const layer1R = 1.1 + Math.random() * 0.4
  const layer2H = 1.6
  const layer2R = 0.75
  const layer3H = 1.1
  const layer3R = 0.45

  const base = trunkH * 0.5

  const cone1 = new THREE.ConeGeometry(layer1R, layer1H, 6, 1)
  cone1.translate(0, base + layer1H / 2, 0)

  const cone2 = new THREE.ConeGeometry(layer2R, layer2H, 6, 1)
  cone2.translate(0, base + layer1H * 0.55 + layer2H / 2, 0)

  const cone3 = new THREE.ConeGeometry(layer3R, layer3H, 6, 1)
  cone3.translate(0, base + layer1H * 0.55 + layer2H * 0.6 + layer3H / 2, 0)

  const merged = mergeGeometries([trunk, cone1, cone2, cone3])
  return merged
}

/**
 * Minimal geometry merge (THREE.BufferGeometryUtils is optional; inline here
 * to avoid an extra import that might not be set up in the project).
 */
function mergeGeometries(geos) {
  let totalVerts = 0
  let totalIndices = 0
  for (const g of geos) {
    g.computeVertexNormals()
    totalVerts   += g.attributes.position.count
    totalIndices += (g.index ? g.index.count : 0)
  }

  const positions = new Float32Array(totalVerts * 3)
  const normals   = new Float32Array(totalVerts * 3)
  const indices   = new Uint32Array(totalIndices)

  let vOffset = 0
  let iOffset = 0

  for (const g of geos) {
    const pos = g.attributes.position.array
    const nor = g.attributes.normal.array
    positions.set(pos, vOffset * 3)
    normals.set(nor, vOffset * 3)

    if (g.index) {
      const idx = g.index.array
      for (let i = 0; i < idx.length; i++) {
        indices[iOffset + i] = idx[i] + vOffset
      }
      iOffset += idx.length
    }
    vOffset += g.attributes.position.count
  }

  const merged = new THREE.BufferGeometry()
  merged.setAttribute('position', new THREE.BufferAttribute(positions, 3))
  merged.setAttribute('normal',   new THREE.BufferAttribute(normals,   3))
  merged.setIndex(new THREE.BufferAttribute(indices, 1))
  return merged
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function Trees({ heightmap, seed = 42 }) {
  const oakMeshRef  = useRef(null)
  const pineMeshRef = useRef(null)

  const { oakGeo, pineGeo, oakMatrices, pineMatrices, treePositions } = useMemo(() => {
    const rng = mulberry32(seed)

    // --- Shared base geometries (single prototype each, scaled per instance) ---
    const oakGeo  = buildOakGeometry()
    const pineGeo = buildPineGeometry()

    const half = TERRAIN_SIZE / 2
    const dummy = new THREE.Object3D()

    const oakMatrices  = []
    const pineMatrices = []

    let attempts = 0
    const maxAttempts = TOTAL_TREES * 20

    while (
      (oakMatrices.length < OAK_COUNT || pineMatrices.length < PINE_COUNT) &&
      attempts < maxAttempts
    ) {
      attempts++

      const wx = (rng() * 2 - 1) * (half - EDGE_MARGIN)
      const wz = (rng() * 2 - 1) * (half - EDGE_MARGIN)

      // Exclude city centre
      if (Math.sqrt(wx * wx + wz * wz) < CITY_EXCLUSION) continue

      if (!heightmap) continue

      const wy = sampleHeight(heightmap, wx, wz)

      // Must be above water
      if (wy <= TREE_MIN_WORLD_Y) continue

      // Normalised height to decide biome
      const normH = (wy / TERRAIN_SCALE + 1) * 0.5

      // No trees on mountain peaks
      if (normH > MOUNTAIN_THRESHOLD) continue

      // Scale and rotation variation
      const scaleXZ = 0.7 + rng() * 0.6
      const scaleY  = 0.8 + rng() * 0.5
      const rotY    = rng() * Math.PI * 2

      dummy.position.set(wx, wy, wz)
      dummy.rotation.set(0, rotY, 0)
      dummy.scale.set(scaleXZ, scaleY, scaleXZ)
      dummy.updateMatrix()

      // Pines prefer higher elevations; oaks prefer lower
      const isPine = normH > 0.50 && rng() < 0.7

      if (isPine && pineMatrices.length < PINE_COUNT) {
        pineMatrices.push(dummy.matrix.clone())
      } else if (!isPine && oakMatrices.length < OAK_COUNT) {
        oakMatrices.push(dummy.matrix.clone())
      }
    }

    // Extract world positions for the resource registry
    const treePositions = []
    for (let i = 0; i < oakMatrices.length; i++) {
      const m = oakMatrices[i]
      treePositions.push({ x: m.elements[12], z: m.elements[14], index: i })
    }
    for (let i = 0; i < pineMatrices.length; i++) {
      const m = pineMatrices[i]
      treePositions.push({ x: m.elements[12], z: m.elements[14], index: oakMatrices.length + i })
    }

    return { oakGeo, pineGeo, oakMatrices, pineMatrices, treePositions }
  }, [heightmap, seed])

  // Register tree positions for soul interactions
  useEffect(() => {
    registerNodes('tree', treePositions)
    return () => registerNodes('tree', [])
  }, [treePositions])

  // Temp matrix for shake (zero-allocation per frame)
  const _tempMat = useMemo(() => new THREE.Matrix4(), [])

  // Shake trees that are being harvested
  useFrame(() => {
    const oakMesh = oakMeshRef.current
    const pineMesh = pineMeshRef.current
    if (!oakMesh && !pineMesh) return

    const active = getActiveNodes()
    if (active.size === 0) return

    const t = performance.now() / 1000
    let oakDirty = false
    let pineDirty = false

    for (const key of active) {
      if (!key.startsWith('tree_')) continue
      const idx = parseInt(key.slice(5))

      if (idx < oakMatrices.length && oakMesh) {
        const orig = oakMatrices[idx]
        _tempMat.copy(orig)
        _tempMat.elements[12] += Math.sin(t * 18) * 0.12
        _tempMat.elements[13] += Math.abs(Math.sin(t * 12)) * 0.05
        oakMesh.setMatrixAt(idx, _tempMat)
        oakDirty = true
      } else if (pineMesh) {
        const pineIdx = idx - oakMatrices.length
        if (pineIdx >= 0 && pineIdx < pineMatrices.length) {
          const orig = pineMatrices[pineIdx]
          _tempMat.copy(orig)
          _tempMat.elements[12] += Math.sin(t * 18) * 0.12
          _tempMat.elements[13] += Math.abs(Math.sin(t * 12)) * 0.05
          pineMesh.setMatrixAt(pineIdx, _tempMat)
          pineDirty = true
        }
      }
    }

    if (oakDirty) oakMesh.instanceMatrix.needsUpdate = true
    if (pineDirty) pineMesh.instanceMatrix.needsUpdate = true
  })

  // Write instance matrices after geometry is ready
  const setOakRef = (mesh) => {
    if (!mesh) return
    oakMeshRef.current = mesh
    oakMatrices.forEach((mat, i) => mesh.setMatrixAt(i, mat))
    mesh.instanceMatrix.needsUpdate = true
  }

  const setPineRef = (mesh) => {
    if (!mesh) return
    pineMeshRef.current = mesh
    pineMatrices.forEach((mat, i) => mesh.setMatrixAt(i, mat))
    mesh.instanceMatrix.needsUpdate = true
  }

  if (!heightmap) return null

  return (
    <group>
      {/* Oak trees */}
      <instancedMesh
        ref={setOakRef}
        args={[oakGeo, null, oakMatrices.length]}
        castShadow
        receiveShadow
      >
        <meshLambertMaterial color="#2d6a1e" />
      </instancedMesh>

      {/* Pine trees */}
      <instancedMesh
        ref={setPineRef}
        args={[pineGeo, null, pineMatrices.length]}
        castShadow
        receiveShadow
      >
        <meshLambertMaterial color="#1a4a20" />
      </instancedMesh>
    </group>
  )
}
