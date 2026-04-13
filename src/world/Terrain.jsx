'use client'

import { useMemo, useRef } from 'react'
import * as THREE from 'three'
import { createNoise2D } from 'simplex-noise'

// Terrain constants shared across modules
export const TERRAIN_SIZE = 800
export const TERRAIN_SEGMENTS = 512
export const TERRAIN_SCALE = 12      // max height in world units
export const WATER_LEVEL = -1        // y position of the water plane
export const FLAT_RADIUS = 22        // radius of flat center building zone
export const MOUNTAIN_THRESHOLD = 0.62  // normalized height above which = mountain

// Build a seeded PRNG so terrain is deterministic
function mulberry32(seed) {
  return function () {
    seed |= 0
    seed = (seed + 0x6d2b79f5) | 0
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/**
 * generateHeightmap returns a Float32Array of normalised heights [0, 1]
 * indexed as [z * (TERRAIN_SEGMENTS + 1) + x].
 * It is exported so Trees.jsx and Rocks.jsx can query terrain height
 * without re-computing it.
 */
export function generateHeightmap(seed = 1337) {
  const rng = mulberry32(seed)
  const noise2D = createNoise2D(rng)

  const verts = TERRAIN_SEGMENTS + 1
  const heightmap = new Float32Array(verts * verts)

  const halfSize = TERRAIN_SIZE / 2

  for (let zi = 0; zi < verts; zi++) {
    for (let xi = 0; xi < verts; xi++) {
      const wx = (xi / TERRAIN_SEGMENTS) * TERRAIN_SIZE - halfSize
      const wz = (zi / TERRAIN_SEGMENTS) * TERRAIN_SIZE - halfSize

      // Multi-octave simplex noise — gentle, rolling landscape
      let h = 0
      h += noise2D(wx * 0.004, wz * 0.004) * 1.0    // broad continent
      h += noise2D(wx * 0.010, wz * 0.010) * 0.3    // gentle hills
      h += noise2D(wx * 0.025, wz * 0.025) * 0.12   // soft detail
      h += noise2D(wx * 0.060, wz * 0.060) * 0.05   // micro-detail
      // Normalise from roughly [-1.47, 1.47] -> [0, 1]
      h = (h / 1.47 + 1) * 0.5

      // Rectangular edge falloff — drops to ocean at terrain borders
      const edgeMargin = 30
      const ex = Math.max(0, (Math.abs(wx) - (halfSize - edgeMargin)) / edgeMargin)
      const ez = Math.max(0, (Math.abs(wz) - (halfSize - edgeMargin)) / edgeMargin)
      const edgeFade = 1 - Math.min(1, Math.max(ex, ez))
      h = 0.15 + (h - 0.15) * edgeFade * edgeFade

      // Flatten centre for the city
      const dist = Math.sqrt(wx * wx + wz * wz)
      if (dist < FLAT_RADIUS) {
        const blend = Math.pow(dist / FLAT_RADIUS, 2.5)
        const flatH = 0.52  // above water level (water = ~0.47 normalised)
        h = flatH + (h - flatH) * blend
      }

      heightmap[zi * verts + xi] = h
    }
  }

  return heightmap
}

/**
 * Sample the terrain normal at (worldX, worldZ) via central differences.
 * Returns { x, y, z } unit vector and a `slope` scalar in [0, 1].
 */
export function sampleNormal(heightmap, worldX, worldZ) {
  const eps = TERRAIN_SIZE / TERRAIN_SEGMENTS
  const hL = sampleHeight(heightmap, worldX - eps, worldZ)
  const hR = sampleHeight(heightmap, worldX + eps, worldZ)
  const hD = sampleHeight(heightmap, worldX, worldZ - eps)
  const hU = sampleHeight(heightmap, worldX, worldZ + eps)

  const nx = hL - hR
  const nz = hD - hU
  const ny = 2 * eps
  const len = Math.sqrt(nx * nx + ny * ny + nz * nz) || 1
  const slope = 1 - (ny / len)  // 0 = flat, 1 = cliff
  return { x: nx / len, y: ny / len, z: nz / len, slope }
}

/**
 * Sample world-space Y for a given (x, z) world position.
 * Performs bilinear interpolation over the heightmap.
 */
export function sampleHeight(heightmap, worldX, worldZ) {
  const verts = TERRAIN_SEGMENTS + 1
  const halfSize = TERRAIN_SIZE / 2

  const tx = ((worldX + halfSize) / TERRAIN_SIZE) * TERRAIN_SEGMENTS
  const tz = ((worldZ + halfSize) / TERRAIN_SIZE) * TERRAIN_SEGMENTS

  const xi = Math.max(0, Math.min(TERRAIN_SEGMENTS - 1, Math.floor(tx)))
  const zi = Math.max(0, Math.min(TERRAIN_SEGMENTS - 1, Math.floor(tz)))
  const fx = tx - xi
  const fz = tz - zi

  const h00 = heightmap[zi * verts + xi]
  const h10 = heightmap[zi * verts + (xi + 1)]
  const h01 = heightmap[(zi + 1) * verts + xi]
  const h11 = heightmap[(zi + 1) * verts + (xi + 1)]

  const h = h00 * (1 - fx) * (1 - fz)
           + h10 * fx * (1 - fz)
           + h01 * (1 - fx) * fz
           + h11 * fx * fz

  return (h * 2 - 1) * TERRAIN_SCALE
}

// Smooth biome color stops — terrain color is interpolated between adjacent stops
const COLOR_STOPS = [
  { h: 0.00, r: 0.10, g: 0.23, b: 0.43 },  // deep ocean
  { h: 0.20, r: 0.13, g: 0.33, b: 0.67 },  // ocean
  { h: 0.28, r: 0.23, g: 0.48, b: 0.84 },  // shallow water
  { h: 0.32, r: 0.83, g: 0.71, b: 0.51 },  // sandy beach
  { h: 0.36, r: 0.76, g: 0.64, b: 0.42 },  // dry coast
  { h: 0.41, r: 0.48, g: 0.71, b: 0.30 },  // lowland grass
  { h: 0.50, r: 0.31, g: 0.62, b: 0.19 },  // plains
  { h: 0.60, r: 0.23, g: 0.48, b: 0.16 },  // hills
  { h: 0.70, r: 0.35, g: 0.43, b: 0.23 },  // high hills
  { h: 0.80, r: 0.54, g: 0.54, b: 0.48 },  // mountain rock
  { h: 0.90, r: 0.69, g: 0.69, b: 0.66 },  // high mountain
  { h: 1.00, r: 0.91, g: 0.91, b: 0.91 },  // snow
]

// Rock color for steep slopes
const ROCK_R = 0.48, ROCK_G = 0.47, ROCK_B = 0.42

/**
 * Write interpolated biome color into the vertex color array.
 * slope ∈ [0,1] — steep areas blend toward rock color.
 */
function writeVertexColor(colors, idx, h, slope) {
  h = Math.max(0, Math.min(1, h))

  let lower = COLOR_STOPS[0]
  let upper = COLOR_STOPS[COLOR_STOPS.length - 1]
  for (let i = 1; i < COLOR_STOPS.length; i++) {
    if (h <= COLOR_STOPS[i].h) {
      lower = COLOR_STOPS[i - 1]
      upper = COLOR_STOPS[i]
      break
    }
  }

  const t = upper.h > lower.h ? (h - lower.h) / (upper.h - lower.h) : 0
  let r = lower.r + (upper.r - lower.r) * t
  let g = lower.g + (upper.g - lower.g) * t
  let b = lower.b + (upper.b - lower.b) * t

  // Steep slopes blend toward rock
  if (slope > 0.25) {
    const rockBlend = Math.min(1, (slope - 0.25) / 0.35) * 0.7
    r += (ROCK_R - r) * rockBlend
    g += (ROCK_G - g) * rockBlend
    b += (ROCK_B - b) * rockBlend
  }

  colors[idx * 3]     = r
  colors[idx * 3 + 1] = g
  colors[idx * 3 + 2] = b
}

export default function Terrain({ heightmap }) {
  const meshRef = useRef(null)

  const geometry = useMemo(() => {
    const verts = TERRAIN_SEGMENTS + 1
    const geo = new THREE.PlaneGeometry(
      TERRAIN_SIZE, TERRAIN_SIZE,
      TERRAIN_SEGMENTS, TERRAIN_SEGMENTS
    )
    // PlaneGeometry is in XY plane; rotate to XZ
    geo.rotateX(-Math.PI / 2)

    const positions = geo.attributes.position
    const colors = new Float32Array(positions.count * 3)
    const colorAttr = new THREE.BufferAttribute(colors, 3)

    // First pass: set Y positions
    for (let zi = 0; zi < verts; zi++) {
      for (let xi = 0; xi < verts; xi++) {
        const idx = zi * verts + xi
        const h = heightmap[idx]
        positions.setY(idx, (h * 2 - 1) * TERRAIN_SCALE)
      }
    }

    // Second pass: compute slope per vertex and write smooth colors
    for (let zi = 0; zi < verts; zi++) {
      for (let xi = 0; xi < verts; xi++) {
        const idx = zi * verts + xi
        const h = heightmap[idx]

        // Slope from finite differences on neighbours
        const hL = xi > 0 ? heightmap[zi * verts + (xi - 1)] : h
        const hR = xi < verts - 1 ? heightmap[zi * verts + (xi + 1)] : h
        const hD = zi > 0 ? heightmap[(zi - 1) * verts + xi] : h
        const hU = zi < verts - 1 ? heightmap[(zi + 1) * verts + xi] : h
        const cellSize = TERRAIN_SIZE / TERRAIN_SEGMENTS
        const dydx = ((hR - hL) * TERRAIN_SCALE) / cellSize
        const dydz = ((hU - hD) * TERRAIN_SCALE) / cellSize
        const slope = Math.min(1, Math.sqrt(dydx * dydx + dydz * dydz) * 0.3)

        writeVertexColor(colors, idx, h, slope)
      }
    }

    positions.needsUpdate = true
    geo.setAttribute('color', colorAttr)
    geo.computeVertexNormals()

    return geo
  }, [heightmap])

  return (
    <mesh
      ref={meshRef}
      geometry={geometry}
      receiveShadow
      castShadow={false}
    >
      <meshPhongMaterial
        vertexColors
        side={THREE.FrontSide}
        shininess={4}
        flatShading={false}
      />
    </mesh>
  )
}
