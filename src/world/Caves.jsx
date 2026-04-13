'use client'

import { useMemo } from 'react'
import * as THREE from 'three'
import { sampleHeight } from './Terrain'

export const CAVE_POSITIONS = [
  { x: -120, z: -90 }, { x: 140, z: -110 }, { x: -160, z: 80 },
  { x: 180, z: 70 },   { x: -80, z: 170 },  { x: 90, z: -170 },
  { x: -200, z: -50 }, { x: 200, z: 50 },   { x: 30, z: -200 },
  { x: -30, z: 200 },
]

// Iron (orange), Diamond (blue), Gold (yellow) — Minecraft-like ores
const ORE_COLORS = ['#c87941', '#4a8ac8', '#c8c041', '#c87941', '#8880d0']

const CHAMBER_DEPTH = 18   // how far below the surface the cave center sits
const CHAMBER_R     = 10   // radius of the hollow cave sphere
const SHAFT_R       = 2.5  // radius of the entrance shaft

function mulberry32(seed) {
  return function () {
    seed |= 0
    seed = (seed + 0x6d2b79f5) | 0
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export default function Caves({ heightmap }) {
  const caves = useMemo(() => {
    if (!heightmap) return []
    return CAVE_POSITIONS.map((pos, idx) => ({
      ...pos,
      y: sampleHeight(heightmap, pos.x, pos.z),
      idx,
    }))
  }, [heightmap])

  if (!heightmap) return null

  return (
    <group>
      {caves.map((cave) => (
        <CaveSite
          key={cave.idx}
          x={cave.x}
          y={cave.y}
          z={cave.z}
          seed={cave.idx * 137 + 42}
        />
      ))}
    </group>
  )
}

function CaveSite({ x, y, z, seed }) {
  const { shaftCurve, rimRocks, stalactites, stalagmites, oreVeins } = useMemo(() => {
    const rng = mulberry32(seed)

    // Winding shaft from surface to chamber — 4 control points
    const shaftCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3((rng() - 0.5) * 4, -CHAMBER_DEPTH * 0.3, (rng() - 0.5) * 4),
      new THREE.Vector3((rng() - 0.5) * 3, -CHAMBER_DEPTH * 0.7, (rng() - 0.5) * 3),
      new THREE.Vector3(0, -CHAMBER_DEPTH, 0),
    ])

    // Rocks around the surface rim
    const rimRocks = Array.from({ length: 10 }, (_, i) => {
      const angle = (i / 10) * Math.PI * 2 + rng() * 0.5
      const dist  = SHAFT_R + 0.4 + rng() * 0.9
      return {
        x: Math.cos(angle) * dist,
        z: Math.sin(angle) * dist,
        y: rng() * 0.3,
        s: 0.3 + rng() * 0.45,
        rx: rng() * Math.PI,
        ry: rng() * Math.PI * 2,
        color: rng() > 0.5 ? '#3e3e38' : '#4a4a42',
      }
    })

    // Stalactites hang from chamber ceiling
    const stalactites = Array.from({ length: 16 }, () => {
      const angle = rng() * Math.PI * 2
      const dist  = rng() * CHAMBER_R * 0.78
      return {
        x: Math.cos(angle) * dist,
        z: Math.sin(angle) * dist,
        y: CHAMBER_R * 0.86,
        h: 1.5 + rng() * 5.5,
        r: 0.15 + rng() * 0.6,
      }
    })

    // Stalagmites rise from chamber floor
    const stalagmites = Array.from({ length: 12 }, () => {
      const angle = rng() * Math.PI * 2
      const dist  = rng() * CHAMBER_R * 0.72
      return {
        x: Math.cos(angle) * dist,
        z: Math.sin(angle) * dist,
        y: -CHAMBER_R * 0.86,
        h: 0.8 + rng() * 3.5,
        r: 0.12 + rng() * 0.48,
      }
    })

    // Ore veins embedded in chamber walls (spherical distribution)
    const oreVeins = Array.from({ length: 14 }, (_, i) => {
      const phi   = rng() * Math.PI
      const theta = rng() * Math.PI * 2
      const r     = CHAMBER_R * 0.91
      return {
        x:        r * Math.sin(phi) * Math.cos(theta),
        y:        r * Math.cos(phi),
        z:        r * Math.sin(phi) * Math.sin(theta),
        s:        0.22 + rng() * 0.5,
        colorIdx: Math.floor(rng() * ORE_COLORS.length),
      }
    })

    return { shaftCurve, rimRocks, stalactites, stalagmites, oreVeins }
  }, [seed])

  return (
    <group position={[x, y, z]}>

      {/* ── SURFACE ─────────────────────────────────── */}

      {/* Dark sinkhole circle — looks like a hole in the ground */}
      <mesh position={[0, 0.08, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[SHAFT_R, 20]} />
        <meshBasicMaterial color="#030303" />
      </mesh>

      {/* Rocky rim around the opening */}
      {rimRocks.map((r, i) => (
        <mesh key={i} position={[r.x, r.y, r.z]} rotation={[r.rx, r.ry, 0]}>
          <icosahedronGeometry args={[r.s, 1]} />
          <meshLambertMaterial color={r.color} />
        </mesh>
      ))}

      {/* ── ENTRANCE SHAFT ──────────────────────────── */}

      {/* Winding stone shaft — BackSide renders the interior stone wall */}
      <mesh>
        <tubeGeometry args={[shaftCurve, 28, SHAFT_R, 10, false]} />
        <meshLambertMaterial color="#1a1a15" side={THREE.BackSide} />
      </mesh>

      {/* ── UNDERGROUND CHAMBER ─────────────────────── */}

      <group position={[0, -CHAMBER_DEPTH, 0]}>

        {/* Hollow cave sphere — BackSide = you see the inside */}
        <mesh>
          <sphereGeometry args={[CHAMBER_R, 24, 18]} />
          <meshLambertMaterial color="#222220" side={THREE.BackSide} />
        </mesh>

        {/* Stalactites hanging from ceiling */}
        {stalactites.map((s, i) => (
          <mesh key={i} position={[s.x, s.y, s.z]} rotation={[Math.PI, 0, 0]}>
            <coneGeometry args={[s.r, s.h, 6]} />
            <meshLambertMaterial color="#1d1d18" />
          </mesh>
        ))}

        {/* Stalagmites rising from floor */}
        {stalagmites.map((s, i) => (
          <mesh key={i} position={[s.x, s.y, s.z]}>
            <coneGeometry args={[s.r, s.h, 6]} />
            <meshLambertMaterial color="#21211c" />
          </mesh>
        ))}

        {/* Glowing ore veins in the cave walls */}
        {oreVeins.map((o, i) => (
          <mesh key={i} position={[o.x, o.y, o.z]}>
            <sphereGeometry args={[o.s, 6, 6]} />
            <meshLambertMaterial
              color={ORE_COLORS[o.colorIdx]}
              emissive={ORE_COLORS[o.colorIdx]}
              emissiveIntensity={0.75}
            />
          </mesh>
        ))}

        {/* Warm underground glow — lights the stalactites and walls */}
        <pointLight color="#7a4828" intensity={14} distance={30} decay={2} />
      </group>

    </group>
  )
}
