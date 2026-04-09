'use client'

import { useRef } from 'react'

// ─── Shared helpers ────────────────────────────────────────────────────────────

function clampProgress(p) {
  return Math.max(0, Math.min(1, p ?? 1))
}

/**
 * Wraps children in a group that scales on Y and offsets downward so the
 * building "rises from the ground" as progress goes 0 → 1.
 */
function ProgressGroup({ progress, height, position, scale, children }) {
  const p = clampProgress(progress)
  const s = scale ?? 1
  const halfH = (height * s) / 2
  // Shift down by the unbuilt portion so the base stays at ground level
  const yOffset = halfH * (p - 1)
  return (
    <group position={[position?.[0] ?? 0, (position?.[1] ?? 0) + yOffset, position?.[2] ?? 0]}>
      <group scale={[s, s * p, s]}>
        {children}
      </group>
    </group>
  )
}

// ─── MudHut ────────────────────────────────────────────────────────────────────
// Cylinder base (tan) + Cone roof (brown)

export function MudHut({ position = [0, 0, 0], scale = 1, progress = 1 }) {
  return (
    <ProgressGroup progress={progress} height={2.4} position={position} scale={scale}>
      {/* Base */}
      <mesh position={[0, 0.75, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[1.1, 1.3, 1.5, 10]} />
        <meshStandardMaterial color="#c4a46a" roughness={0.9} />
      </mesh>
      {/* Doorway – dark inset box */}
      <mesh position={[0, 0.4, 1.25]} castShadow>
        <boxGeometry args={[0.45, 0.75, 0.1]} />
        <meshStandardMaterial color="#5a3a1a" roughness={1} />
      </mesh>
      {/* Thatched cone roof */}
      <mesh position={[0, 1.9, 0]} castShadow>
        <coneGeometry args={[1.45, 1.2, 10]} />
        <meshStandardMaterial color="#8B4513" roughness={0.95} />
      </mesh>
      {/* Roof fringe ring */}
      <mesh position={[0, 1.32, 0]} castShadow>
        <torusGeometry args={[1.3, 0.08, 6, 20]} />
        <meshStandardMaterial color="#6B3410" roughness={1} />
      </mesh>
    </ProgressGroup>
  )
}

// ─── StoneTemple ───────────────────────────────────────────────────────────────
// 4 columns + slab roof + stepped base

export function StoneTemple({ position = [0, 0, 0], scale = 1, progress = 1 }) {
  const cols = [
    [-1.4, 0, -1.2],
    [ 1.4, 0, -1.2],
    [-1.4, 0,  1.2],
    [ 1.4, 0,  1.2],
  ]

  return (
    <ProgressGroup progress={progress} height={5.0} position={position} scale={scale}>
      {/* Base step 1 (widest) */}
      <mesh position={[0, 0.15, 0]} receiveShadow castShadow>
        <boxGeometry args={[5.2, 0.3, 3.8]} />
        <meshStandardMaterial color="#777" roughness={0.85} />
      </mesh>
      {/* Base step 2 */}
      <mesh position={[0, 0.45, 0]} receiveShadow castShadow>
        <boxGeometry args={[4.6, 0.3, 3.2]} />
        <meshStandardMaterial color="#888" roughness={0.85} />
      </mesh>
      {/* Platform */}
      <mesh position={[0, 0.75, 0]} receiveShadow castShadow>
        <boxGeometry args={[4.2, 0.3, 2.8]} />
        <meshStandardMaterial color="#999" roughness={0.8} />
      </mesh>
      {/* Columns */}
      {cols.map(([cx, , cz], i) => (
        <mesh key={i} position={[cx, 2.2, cz]} castShadow>
          <cylinderGeometry args={[0.25, 0.28, 3.0, 8]} />
          <meshStandardMaterial color="#aaa" roughness={0.75} />
        </mesh>
      ))}
      {/* Entablature / slab roof */}
      <mesh position={[0, 3.9, 0]} castShadow receiveShadow>
        <boxGeometry args={[4.4, 0.35, 3.0]} />
        <meshStandardMaterial color="#888" roughness={0.8} />
      </mesh>
      {/* Triangular pediment (approximated with a flattened box) */}
      <mesh position={[0, 4.45, 0]} castShadow>
        <boxGeometry args={[4.0, 0.7, 0.3]} />
        <meshStandardMaterial color="#999" roughness={0.8} />
      </mesh>
    </ProgressGroup>
  )
}

// ─── MarketStall ───────────────────────────────────────────────────────────────
// Thin box posts + angled box canopy roof, open sides

export function MarketStall({ position = [0, 0, 0], scale = 1, progress = 1 }) {
  return (
    <ProgressGroup progress={progress} height={2.6} position={position} scale={scale}>
      {/* Four corner posts */}
      {[[-1.2, 0.9, -0.8], [1.2, 0.9, -0.8], [-1.2, 0.9, 0.8], [1.2, 0.9, 0.8]].map(([px, py, pz], i) => (
        <mesh key={i} position={[px, py, pz]} castShadow>
          <boxGeometry args={[0.12, 1.8, 0.12]} />
          <meshStandardMaterial color="#8B6914" roughness={0.9} />
        </mesh>
      ))}
      {/* Counter / table slab */}
      <mesh position={[0, 0.85, 0]} castShadow receiveShadow>
        <boxGeometry args={[2.2, 0.12, 1.4]} />
        <meshStandardMaterial color="#a07820" roughness={0.85} />
      </mesh>
      {/* Angled canopy – front raised, back lower */}
      <mesh position={[0, 1.98, 0]} rotation={[0.18, 0, 0]} castShadow>
        <boxGeometry args={[2.8, 0.1, 2.1]} />
        <meshStandardMaterial color="#8B6914" roughness={0.9} side={2} />
      </mesh>
      {/* Canopy front overhang lip */}
      <mesh position={[0, 1.78, 1.1]} castShadow>
        <boxGeometry args={[2.8, 0.08, 0.35]} />
        <meshStandardMaterial color="#6B4A10" roughness={0.9} />
      </mesh>
      {/* Hanging goods (simple box bundles) */}
      <mesh position={[-0.6, 1.4, 0.85]} castShadow>
        <boxGeometry args={[0.2, 0.3, 0.15]} />
        <meshStandardMaterial color="#c8a050" roughness={1} />
      </mesh>
      <mesh position={[0.6, 1.45, 0.85]} castShadow>
        <boxGeometry args={[0.18, 0.28, 0.15]} />
        <meshStandardMaterial color="#b06020" roughness={1} />
      </mesh>
    </ProgressGroup>
  )
}

// ─── Well ──────────────────────────────────────────────────────────────────────
// Short cylinder + stone rim + thin box crossbar

export function Well({ position = [0, 0, 0], scale = 1, progress = 1 }) {
  return (
    <ProgressGroup progress={progress} height={2.1} position={position} scale={scale}>
      {/* Well shaft */}
      <mesh position={[0, 0.5, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[0.6, 0.65, 1.0, 12]} />
        <meshStandardMaterial color="#888" roughness={0.95} />
      </mesh>
      {/* Stone rim cap */}
      <mesh position={[0, 1.05, 0]} castShadow>
        <cylinderGeometry args={[0.72, 0.68, 0.12, 12]} />
        <meshStandardMaterial color="#999" roughness={0.9} />
      </mesh>
      {/* Water surface inside */}
      <mesh position={[0, 0.62, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.52, 12]} />
        <meshStandardMaterial color="#4a90c0" roughness={0.1} metalness={0.3} />
      </mesh>
      {/* Two vertical support posts */}
      <mesh position={[-0.55, 1.7, 0]} castShadow>
        <boxGeometry args={[0.1, 1.4, 0.1]} />
        <meshStandardMaterial color="#8B6914" roughness={0.9} />
      </mesh>
      <mesh position={[0.55, 1.7, 0]} castShadow>
        <boxGeometry args={[0.1, 1.4, 0.1]} />
        <meshStandardMaterial color="#8B6914" roughness={0.9} />
      </mesh>
      {/* Horizontal crossbar */}
      <mesh position={[0, 2.35, 0]} castShadow>
        <boxGeometry args={[1.3, 0.1, 0.1]} />
        <meshStandardMaterial color="#8B6914" roughness={0.9} />
      </mesh>
      {/* Hanging rope / bucket hint */}
      <mesh position={[0, 1.8, 0]} castShadow>
        <boxGeometry args={[0.06, 0.55, 0.06]} />
        <meshStandardMaterial color="#888" roughness={1} />
      </mesh>
      <mesh position={[0, 1.45, 0]} castShadow>
        <boxGeometry args={[0.2, 0.22, 0.2]} />
        <meshStandardMaterial color="#666" roughness={1} />
      </mesh>
    </ProgressGroup>
  )
}

// ─── FarmField ─────────────────────────────────────────────────────────────────
// Flat plane with raised row lines

export function FarmField({ position = [0, 0, 0], scale = 1, progress = 1 }) {
  const p = clampProgress(progress)
  const s = scale ?? 1
  const rows = 6

  return (
    <group
      position={[position?.[0] ?? 0, position?.[1] ?? 0, position?.[2] ?? 0]}
      scale={[s, s, s]}
    >
      {/* Ground plane */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[6.0, 5.0]} />
        <meshStandardMaterial color="#5a3e1a" roughness={1} />
      </mesh>
      {/* Soil rows */}
      {Array.from({ length: rows }).map((_, i) => {
        const zPos = -2.2 + i * 0.82
        // fade rows in based on progress
        if (i / rows > p) return null
        return (
          <mesh key={i} position={[0, 0.06, zPos]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
            <planeGeometry args={[5.6, 0.36]} />
            <meshStandardMaterial color="#3a2a08" roughness={1} />
          </mesh>
        )
      })}
      {/* Crop sprouts (tiny boxes) */}
      {Array.from({ length: rows }).map((_, ri) => {
        const zPos = -2.2 + ri * 0.82
        if (ri / rows > p) return null
        return Array.from({ length: 8 }).map((_, ci) => {
          const xPos = -2.5 + ci * 0.72
          return (
            <mesh key={`${ri}-${ci}`} position={[xPos, 0.12, zPos]} castShadow>
              <boxGeometry args={[0.1, 0.22, 0.1]} />
              <meshStandardMaterial color="#5a7a2a" roughness={1} />
            </mesh>
          )
        })
      })}
    </group>
  )
}

// ─── StorageSilo ───────────────────────────────────────────────────────────────
// Tall thin cylinder + half-sphere dome top

export function StorageSilo({ position = [0, 0, 0], scale = 1, progress = 1 }) {
  return (
    <ProgressGroup progress={progress} height={5.0} position={position} scale={scale}>
      {/* Cylinder body */}
      <mesh position={[0, 2.0, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[0.9, 1.0, 4.0, 14]} />
        <meshStandardMaterial color="#c07848" roughness={0.88} />
      </mesh>
      {/* Dome top */}
      <mesh position={[0, 4.2, 0]} castShadow>
        <sphereGeometry args={[0.92, 14, 8, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshStandardMaterial color="#b06030" roughness={0.85} />
      </mesh>
      {/* Base ring */}
      <mesh position={[0, 0.08, 0]} castShadow>
        <cylinderGeometry args={[1.05, 1.05, 0.16, 14]} />
        <meshStandardMaterial color="#8a5028" roughness={0.9} />
      </mesh>
      {/* Vertical seam bands */}
      {[0, 1, 2, 3, 4, 5].map((i) => (
        <mesh key={i} position={[
          Math.sin((i / 6) * Math.PI * 2) * 0.92,
          2.0,
          Math.cos((i / 6) * Math.PI * 2) * 0.92,
        ]} castShadow>
          <boxGeometry args={[0.07, 4.2, 0.07]} />
          <meshStandardMaterial color="#8a5028" roughness={0.9} />
        </mesh>
      ))}
    </ProgressGroup>
  )
}

// ─── Pyramid ───────────────────────────────────────────────────────────────────
// ConeGeo with 4 sides, large scale, sand color

export function Pyramid({ position = [0, 0, 0], scale = 1, progress = 1 }) {
  return (
    <ProgressGroup progress={progress} height={6.0} position={position} scale={scale}>
      {/* Main pyramid body */}
      <mesh position={[0, 3.0, 0]} castShadow receiveShadow>
        <coneGeometry args={[4.5, 6.0, 4]} />
        <meshStandardMaterial color="#d4a847" roughness={0.92} />
      </mesh>
      {/* Step tiers (3 concentric boxes at the base) */}
      <mesh position={[0, 0.18, 0]} castShadow receiveShadow>
        <boxGeometry args={[9.4, 0.36, 9.4]} />
        <meshStandardMaterial color="#c49a3a" roughness={0.95} />
      </mesh>
      <mesh position={[0, 0.54, 0]} castShadow receiveShadow>
        <boxGeometry args={[8.4, 0.36, 8.4]} />
        <meshStandardMaterial color="#c8a040" roughness={0.95} />
      </mesh>
      <mesh position={[0, 0.9, 0]} castShadow receiveShadow>
        <boxGeometry args={[7.4, 0.36, 7.4]} />
        <meshStandardMaterial color="#cc9e3e" roughness={0.95} />
      </mesh>
      {/* Capstone gold tint */}
      <mesh position={[0, 6.0, 0]} castShadow>
        <coneGeometry args={[0.3, 0.5, 4]} />
        <meshStandardMaterial color="#f0c040" roughness={0.5} metalness={0.4} />
      </mesh>
    </ProgressGroup>
  )
}
