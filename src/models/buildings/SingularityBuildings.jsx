'use client'

import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'

// ─── Shared helpers ────────────────────────────────────────────────────────────

function clampProgress(p) {
  return Math.max(0, Math.min(1, p ?? 1))
}

function ProgressGroup({ progress, height, position, scale, children }) {
  const p = clampProgress(progress)
  const s = scale ?? 1
  const halfH = (height * s) / 2
  const yOffset = halfH * (p - 1)
  return (
    <group position={[position?.[0] ?? 0, (position?.[1] ?? 0) + yOffset, position?.[2] ?? 0]}>
      <group scale={[s, s * p, s]}>
        {children}
      </group>
    </group>
  )
}

// ─── Arcology ──────────────────────────────────────────────────────────────────
// Mega-pyramid with emissive edge lines

export function Arcology({ position = [0, 0, 0], scale = 1, progress = 1 }) {
  return (
    <ProgressGroup progress={progress} height={10.0} position={position} scale={scale}>
      {/* Core pyramid */}
      <mesh position={[0, 5.0, 0]} castShadow receiveShadow>
        <coneGeometry args={[5.5, 10.0, 4]} />
        <meshStandardMaterial color="#1a1030" roughness={0.3} metalness={0.6} emissive="#180d40" emissiveIntensity={0.5} />
      </mesh>
      {/* Edge glow strips – 4 vertical edges */}
      {[0, 1, 2, 3].map((i) => {
        const angle = (i / 4) * Math.PI * 2 + Math.PI / 4
        const r = 3.9
        return (
          <mesh
            key={i}
            position={[Math.sin(angle) * r * 0.5, 5.0, Math.cos(angle) * r * 0.5]}
            rotation={[0, angle + Math.PI / 2, 0.42]}
            castShadow
          >
            <boxGeometry args={[0.12, 11.2, 0.08]} />
            <meshStandardMaterial color="#6B5CE7" emissive="#6B5CE7" emissiveIntensity={2.5} roughness={0.2} />
          </mesh>
        )
      })}
      {/* Horizontal tier rings */}
      {[2.0, 4.5, 7.0].map((y, i) => {
        const r = 5.5 * (1.0 - y / 10.5)
        return (
          <mesh key={`ring${i}`} position={[0, y, 0]} castShadow>
            <torusGeometry args={[r, 0.12, 6, 32]} />
            <meshStandardMaterial color="#5a4cd0" emissive="#5a4cd0" emissiveIntensity={1.5} roughness={0.2} />
          </mesh>
        )
      })}
      {/* Window grid dots */}
      {Array.from({ length: 6 }).map((_, ri) =>
        Array.from({ length: 5 }).map((_, ci) => {
          const y = 0.8 + ri * 1.5
          const x = (ci - 2) * 0.7
          const insetZ = 5.5 * (1.0 - y / 11.0) * 0.88
          return (
            <mesh key={`w-${ri}-${ci}`} position={[x, y, insetZ]}>
              <boxGeometry args={[0.22, 0.32, 0.06]} />
              <meshStandardMaterial color="#a090ff" emissive="#8070ee" emissiveIntensity={1.0} roughness={0.1} />
            </mesh>
          )
        })
      )}
      {/* Apex beacon */}
      <mesh position={[0, 10.2, 0]}>
        <sphereGeometry args={[0.3, 8, 6]} />
        <meshStandardMaterial color="#ffffff" emissive="#6B5CE7" emissiveIntensity={3.0} roughness={0.1} />
      </mesh>
    </ProgressGroup>
  )
}

// ─── QuantumServer ─────────────────────────────────────────────────────────────
// Hovering IcosahedronGeo with purple glow

export function QuantumServer({ position = [0, 0, 0], scale = 1, progress = 1 }) {
  const groupRef = useRef(null)
  const innerRef = useRef(null)

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime()
    if (groupRef.current) {
      groupRef.current.position.y = 2.2 + Math.sin(t * 1.4) * 0.35
      groupRef.current.rotation.y = t * 0.5
    }
    if (innerRef.current) {
      innerRef.current.rotation.x = t * 0.8
      innerRef.current.rotation.z = t * 0.4
    }
  })

  const p = clampProgress(progress)
  const s = scale ?? 1

  return (
    <group
      position={[position?.[0] ?? 0, position?.[1] ?? 0, position?.[2] ?? 0]}
      scale={[s, s * p, s]}
    >
      {/* Pedestal */}
      <mesh position={[0, 0.35, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[0.8, 1.1, 0.7, 8]} />
        <meshStandardMaterial color="#1a1030" roughness={0.3} metalness={0.8} />
      </mesh>
      {/* Energy beam column */}
      <mesh position={[0, 1.5, 0]} castShadow>
        <cylinderGeometry args={[0.06, 0.06, 2.0, 6]} />
        <meshStandardMaterial color="#9070ff" emissive="#9070ff" emissiveIntensity={2.0} roughness={0.1} transparent opacity={0.6} />
      </mesh>
      {/* Hovering outer ring */}
      <group ref={groupRef} position={[0, 2.2, 0]}>
        {/* Outer torus */}
        <mesh castShadow>
          <torusGeometry args={[1.0, 0.08, 8, 32]} />
          <meshStandardMaterial color="#7060e0" emissive="#6050d0" emissiveIntensity={1.5} roughness={0.1} metalness={0.5} />
        </mesh>
        {/* Second tilted ring */}
        <mesh rotation={[Math.PI / 3, 0, 0]} castShadow>
          <torusGeometry args={[0.85, 0.06, 6, 28]} />
          <meshStandardMaterial color="#9080f0" emissive="#8070e0" emissiveIntensity={1.5} roughness={0.1} metalness={0.5} />
        </mesh>
        {/* Third tilted ring */}
        <mesh rotation={[Math.PI / 3, Math.PI / 3, 0]} castShadow>
          <torusGeometry args={[0.72, 0.05, 6, 24]} />
          <meshStandardMaterial color="#b0a0ff" emissive="#a090f0" emissiveIntensity={1.5} roughness={0.1} />
        </mesh>
        {/* Inner icosahedron */}
        <group ref={innerRef}>
          <mesh castShadow>
            <icosahedronGeometry args={[0.55, 0]} />
            <meshStandardMaterial
              color="#c0b0ff"
              emissive="#8060ff"
              emissiveIntensity={2.0}
              roughness={0.05}
              metalness={0.7}
              wireframe={false}
            />
          </mesh>
          {/* Wireframe overlay */}
          <mesh>
            <icosahedronGeometry args={[0.57, 0]} />
            <meshStandardMaterial color="#ffffff" emissive="#a090ff" emissiveIntensity={1.0} wireframe transparent opacity={0.4} />
          </mesh>
        </group>
        {/* Point glow */}
        <pointLight color="#8060ff" intensity={12} distance={6} decay={2} />
      </group>
    </group>
  )
}

// ─── BioDome ───────────────────────────────────────────────────────────────────
// Transparent sphere + internal ecosystem

export function BioDome({ position = [0, 0, 0], scale = 1, progress = 1 }) {
  return (
    <ProgressGroup progress={progress} height={7.0} position={position} scale={scale}>
      {/* Base ring */}
      <mesh position={[0, 0.25, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[3.3, 3.5, 0.5, 16]} />
        <meshStandardMaterial color="#2a3a2a" roughness={0.8} metalness={0.3} />
      </mesh>
      {/* Internal garden plane */}
      <mesh position={[0, 0.52, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <circleGeometry args={[3.1, 20]} />
        <meshStandardMaterial color="#2a7030" roughness={0.95} />
      </mesh>
      {/* Interior trees */}
      {[[-1.2, 0, -1.0], [1.2, 0, -0.8], [0, 0, 1.2], [-1.6, 0, 0.8]].map(([tx, , tz], i) => (
        <group key={i} position={[tx, 0.5, tz]}>
          <mesh position={[0, 0.6, 0]} castShadow>
            <cylinderGeometry args={[0.1, 0.13, 1.2, 6]} />
            <meshStandardMaterial color="#5a3a10" roughness={1} />
          </mesh>
          <mesh position={[0, 1.5, 0]} castShadow>
            <sphereGeometry args={[0.55, 8, 6]} />
            <meshStandardMaterial color="#28681a" roughness={0.9} />
          </mesh>
        </group>
      ))}
      {/* Transparent dome shell */}
      <mesh position={[0, 3.5, 0]} castShadow>
        <sphereGeometry args={[3.4, 24, 16]} />
        <meshStandardMaterial
          color="#88ddcc"
          roughness={0.05}
          metalness={0.1}
          transparent
          opacity={0.18}
          side={2}
        />
      </mesh>
      {/* Dome structure ribs */}
      {Array.from({ length: 8 }).map((_, i) => {
        const angle = (i / 8) * Math.PI * 2
        return (
          <mesh
            key={i}
            position={[0, 3.5, 0]}
            rotation={[0, angle, 0]}
            castShadow
          >
            <torusGeometry args={[3.42, 0.045, 6, 32, Math.PI]} />
            <meshStandardMaterial color="#60c0a0" emissive="#40a080" emissiveIntensity={0.4} roughness={0.3} metalness={0.5} transparent opacity={0.7} />
          </mesh>
        )
      })}
      {/* Interior ambient glow */}
      <pointLight position={[0, 2.0, 0]} color="#a0ffcc" intensity={6} distance={5} decay={2} />
    </ProgressGroup>
  )
}

// ─── SpaceElevator ─────────────────────────────────────────────────────────────
// Very tall thin cylinder reaching to sky

export function SpaceElevator({ position = [0, 0, 0], scale = 1, progress = 1 }) {
  return (
    <ProgressGroup progress={progress} height={50.0} position={position} scale={scale}>
      {/* Ground anchor base */}
      <mesh position={[0, 0.6, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[2.0, 2.5, 1.2, 12]} />
        <meshStandardMaterial color="#1a2030" roughness={0.4} metalness={0.7} />
      </mesh>
      {/* Base ring structure */}
      <mesh position={[0, 1.4, 0]} castShadow>
        <torusGeometry args={[2.2, 0.3, 8, 20]} />
        <meshStandardMaterial color="#2a3848" roughness={0.3} metalness={0.8} />
      </mesh>
      {/* Main cable / tether column */}
      <mesh position={[0, 25.0, 0]} castShadow>
        <cylinderGeometry args={[0.25, 0.4, 50.0, 10]} />
        <meshStandardMaterial color="#c0d0e0" roughness={0.15} metalness={0.9} emissive="#203040" emissiveIntensity={0.3} />
      </mesh>
      {/* Climber car at mid-height */}
      <mesh position={[0, 18.0, 0]} castShadow>
        <boxGeometry args={[1.0, 1.2, 1.0]} />
        <meshStandardMaterial color="#3a4a5a" roughness={0.3} metalness={0.6} emissive="#102030" emissiveIntensity={0.5} />
      </mesh>
      {/* Climber engine glow */}
      <pointLight position={[0, 18.0, 0]} color="#60a0ff" intensity={8} distance={3} decay={2} />
      {/* Orbital station platform at top */}
      <mesh position={[0, 48.5, 0]} castShadow>
        <cylinderGeometry args={[1.5, 1.5, 0.5, 12]} />
        <meshStandardMaterial color="#2a3848" roughness={0.2} metalness={0.8} emissive="#102040" emissiveIntensity={0.6} />
      </mesh>
      {/* Station ring */}
      <mesh position={[0, 48.5, 0]} castShadow>
        <torusGeometry args={[2.5, 0.18, 6, 20]} />
        <meshStandardMaterial color="#4060a0" emissive="#2040a0" emissiveIntensity={0.8} roughness={0.2} metalness={0.6} />
      </mesh>
      {/* Height marker lights */}
      {[5, 10, 20, 30, 40].map((y, i) => (
        <mesh key={i} position={[0.28, y, 0]}>
          <sphereGeometry args={[0.12, 6, 4]} />
          <meshStandardMaterial color="#ff4400" emissive="#ff2200" emissiveIntensity={2.0} roughness={1} />
        </mesh>
      ))}
    </ProgressGroup>
  )
}

// ─── MindPalace ────────────────────────────────────────────────────────────────
// Crystal geometry – multiple rotated boxes, prismatic colors

export function MindPalace({ position = [0, 0, 0], scale = 1, progress = 1 }) {
  const crystalRef = useRef(null)

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime()
    if (crystalRef.current) {
      crystalRef.current.rotation.y = t * 0.25
    }
  })

  return (
    <ProgressGroup progress={progress} height={7.0} position={position} scale={scale}>
      {/* Crystalline base plateau */}
      <mesh position={[0, 0.3, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[2.5, 2.8, 0.6, 6]} />
        <meshStandardMaterial color="#1a0a3a" roughness={0.2} metalness={0.7} emissive="#100828" emissiveIntensity={0.4} />
      </mesh>
      {/* Central crystal spire */}
      <mesh position={[0, 4.2, 0]} castShadow>
        <coneGeometry args={[0.8, 8.0, 6]} />
        <meshStandardMaterial color="#c0a0ff" roughness={0.05} metalness={0.4} emissive="#8050e0" emissiveIntensity={1.2} transparent opacity={0.85} />
      </mesh>
      {/* Rotating crystal cluster */}
      <group ref={crystalRef} position={[0, 2.0, 0]}>
        {/* Large crystal shards at various angles */}
        {[
          { pos: [1.4, 0.8, 0], rot: [0.3, 0, 0.4], size: [0.4, 2.8, 0.4], color: '#d080ff', emissive: '#a040e0' },
          { pos: [-1.4, 0.6, 0], rot: [-0.3, 0, -0.4], size: [0.4, 2.5, 0.4], color: '#80d0ff', emissive: '#40a0d0' },
          { pos: [0, 0.5, 1.4], rot: [0.4, 0, 0.2], size: [0.4, 2.4, 0.4], color: '#ff80d0', emissive: '#d040a0' },
          { pos: [0, 0.4, -1.4], rot: [-0.4, 0, -0.2], size: [0.4, 2.2, 0.4], color: '#80ffd0', emissive: '#40c090' },
          { pos: [1.0, 0.3, 1.0], rot: [0.25, 0.4, 0.3], size: [0.3, 1.8, 0.3], color: '#ffe080', emissive: '#d0a020' },
          { pos: [-1.0, 0.2, -1.0], rot: [-0.25, -0.4, -0.3], size: [0.3, 1.7, 0.3], color: '#ff9060', emissive: '#d06030' },
          { pos: [-1.0, 0.1, 1.0], rot: [0.3, -0.3, 0.25], size: [0.3, 1.5, 0.3], color: '#90ff80', emissive: '#50c040' },
          { pos: [1.0, 0.5, -1.0], rot: [-0.3, 0.3, -0.25], size: [0.28, 1.6, 0.28], color: '#8090ff', emissive: '#4050d0' },
        ].map(({ pos, rot, size, color, emissive }, i) => (
          <mesh
            key={i}
            position={pos}
            rotation={rot}
            castShadow
          >
            <boxGeometry args={size} />
            <meshStandardMaterial color={color} emissive={emissive} emissiveIntensity={1.2} roughness={0.05} metalness={0.2} transparent opacity={0.8} />
          </mesh>
        ))}
        {/* Inner light core */}
        <pointLight color="#c0a0ff" intensity={15} distance={5} decay={2} />
      </group>
      {/* Floating runes (small tilted boxes orbiting) */}
      {Array.from({ length: 6 }).map((_, i) => {
        const angle = (i / 6) * Math.PI * 2
        const r = 2.0
        return (
          <mesh
            key={`rune${i}`}
            position={[Math.sin(angle) * r, 1.5, Math.cos(angle) * r]}
            rotation={[Math.PI / 4, angle, Math.PI / 3]}
            castShadow
          >
            <boxGeometry args={[0.2, 0.35, 0.06]} />
            <meshStandardMaterial color="#e0d0ff" emissive="#a080ff" emissiveIntensity={1.5} roughness={0.1} transparent opacity={0.7} />
          </mesh>
        )
      })}
    </ProgressGroup>
  )
}

// ─── HoloMarket ────────────────────────────────────────────────────────────────
// Empty ground plane + floating emissive holographic plane instances

export function HoloMarket({ position = [0, 0, 0], scale = 1, progress = 1 }) {
  const floatingRef = useRef(null)

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime()
    if (floatingRef.current) {
      floatingRef.current.children.forEach((child, i) => {
        child.position.y = 1.5 + Math.sin(t * 0.8 + i * 1.1) * 0.3
        child.rotation.y = t * 0.3 + i * 0.7
      })
    }
  })

  const p = clampProgress(progress)
  const s = scale ?? 1

  const holoColors = ['#00ffcc', '#ff40ff', '#40aaff', '#ffaa00', '#40ff80', '#ff6060']
  const positions = [
    [-2.0, 1.5, -1.5],
    [2.0, 1.8, -1.5],
    [0, 2.2, 0],
    [-1.5, 1.6, 1.0],
    [1.5, 1.4, 1.0],
    [-2.5, 2.0, 0.2],
  ]

  return (
    <group
      position={[position?.[0] ?? 0, position?.[1] ?? 0, position?.[2] ?? 0]}
      scale={[s, s * p, s]}
    >
      {/* Market ground surface with grid pattern */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[8.0, 7.0]} />
        <meshStandardMaterial color="#0a0820" roughness={0.5} metalness={0.3} emissive="#050410" emissiveIntensity={0.5} />
      </mesh>
      {/* Grid lines */}
      {Array.from({ length: 9 }).map((_, i) => (
        <mesh key={`gx${i}`} position={[(i - 4) * 0.9, 0.01, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[0.04, 7.0]} />
          <meshStandardMaterial color="#6060ff" emissive="#4040ee" emissiveIntensity={0.8} roughness={0.1} transparent opacity={0.4} />
        </mesh>
      ))}
      {Array.from({ length: 8 }).map((_, i) => (
        <mesh key={`gz${i}`} position={[0, 0.01, (i - 3.5) * 0.9]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[8.0, 0.04]} />
          <meshStandardMaterial color="#6060ff" emissive="#4040ee" emissiveIntensity={0.8} roughness={0.1} transparent opacity={0.4} />
        </mesh>
      ))}
      {/* Vendor stall outlines */}
      {[[-2.5, 0, -2.0], [0, 0, -2.0], [2.5, 0, -2.0]].map(([sx, , sz], i) => (
        <mesh key={`stall${i}`} position={[sx, 0.02, sz]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.65, 0.72, 4]} />
          <meshStandardMaterial color={holoColors[i]} emissive={holoColors[i]} emissiveIntensity={1.0} roughness={0.1} transparent opacity={0.6} />
        </mesh>
      ))}
      {/* Floating holographic product displays */}
      <group ref={floatingRef}>
        {positions.map(([px, py, pz], i) => (
          <mesh key={i} position={[px, py, pz]} castShadow>
            <planeGeometry args={[0.7, 0.9]} />
            <meshStandardMaterial
              color={holoColors[i % holoColors.length]}
              emissive={holoColors[i % holoColors.length]}
              emissiveIntensity={1.8}
              roughness={0.0}
              transparent
              opacity={0.55}
              side={2}
            />
          </mesh>
        ))}
      </group>
      {/* Floating particle dots */}
      {Array.from({ length: 12 }).map((_, i) => {
        const angle = (i / 12) * Math.PI * 2
        const r = 3.2
        return (
          <mesh key={`dot${i}`} position={[Math.sin(angle) * r, 0.8 + (i % 3) * 0.6, Math.cos(angle) * r]}>
            <sphereGeometry args={[0.07, 6, 4]} />
            <meshStandardMaterial color="#ffffff" emissive="#8080ff" emissiveIntensity={2.0} roughness={1} />
          </mesh>
        )
      })}
      {/* Area glow */}
      <pointLight position={[0, 2.5, 0]} color="#6050ff" intensity={10} distance={8} decay={2} />
    </group>
  )
}
