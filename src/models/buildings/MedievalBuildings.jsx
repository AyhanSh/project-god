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

// ─── StoneCottage ──────────────────────────────────────────────────────────────

export function StoneCottage({ position = [0, 0, 0], scale = 1, progress = 1 }) {
  return (
    <ProgressGroup progress={progress} height={3.5} position={position} scale={scale}>
      {/* Walls */}
      <mesh position={[0, 1.0, 0]} castShadow receiveShadow>
        <boxGeometry args={[3.2, 2.0, 2.4]} />
        <meshStandardMaterial color="#9a9080" roughness={0.9} />
      </mesh>
      {/* Door */}
      <mesh position={[0, 0.6, 1.21]} castShadow>
        <boxGeometry args={[0.6, 1.2, 0.06]} />
        <meshStandardMaterial color="#5a3010" roughness={1} />
      </mesh>
      {/* Window left */}
      <mesh position={[-0.9, 1.1, 1.21]} castShadow>
        <boxGeometry args={[0.5, 0.5, 0.06]} />
        <meshStandardMaterial color="#b0c8d8" roughness={0.2} metalness={0.1} />
      </mesh>
      {/* Window right */}
      <mesh position={[0.9, 1.1, 1.21]} castShadow>
        <boxGeometry args={[0.5, 0.5, 0.06]} />
        <meshStandardMaterial color="#b0c8d8" roughness={0.2} metalness={0.1} />
      </mesh>
      {/* Roof ridge beam – left slope */}
      <mesh position={[-0.82, 2.35, 0]} rotation={[0, 0, 0.55]} castShadow>
        <boxGeometry args={[2.2, 0.18, 2.7]} />
        <meshStandardMaterial color="#5a3010" roughness={0.95} />
      </mesh>
      {/* Roof – right slope */}
      <mesh position={[0.82, 2.35, 0]} rotation={[0, 0, -0.55]} castShadow>
        <boxGeometry args={[2.2, 0.18, 2.7]} />
        <meshStandardMaterial color="#5a3010" roughness={0.95} />
      </mesh>
      {/* Chimney */}
      <mesh position={[1.0, 2.8, -0.5]} castShadow>
        <cylinderGeometry args={[0.18, 0.2, 1.3, 8]} />
        <meshStandardMaterial color="#777" roughness={0.95} />
      </mesh>
      {/* Chimney cap */}
      <mesh position={[1.0, 3.45, -0.5]} castShadow>
        <cylinderGeometry args={[0.24, 0.18, 0.12, 8]} />
        <meshStandardMaterial color="#555" roughness={0.9} />
      </mesh>
    </ProgressGroup>
  )
}

// ─── CastleKeep ────────────────────────────────────────────────────────────────

export function CastleKeep({ position = [0, 0, 0], scale = 1, progress = 1 }) {
  const corners = [[-1.9, 0, -1.9], [1.9, 0, -1.9], [-1.9, 0, 1.9], [1.9, 0, 1.9]]
  const crenels = []
  for (let i = -2; i <= 2; i++) {
    crenels.push([i * 0.65, 0, -2.05])
    crenels.push([i * 0.65, 0,  2.05])
    crenels.push([-2.05, 0, i * 0.65])
    crenels.push([ 2.05, 0, i * 0.65])
  }

  return (
    <ProgressGroup progress={progress} height={7.0} position={position} scale={scale}>
      {/* Main keep body */}
      <mesh position={[0, 2.5, 0]} castShadow receiveShadow>
        <boxGeometry args={[4.0, 5.0, 4.0]} />
        <meshStandardMaterial color="#808080" roughness={0.88} />
      </mesh>
      {/* Gate arch hint */}
      <mesh position={[0, 0.8, 2.01]} castShadow>
        <boxGeometry args={[0.9, 1.6, 0.12]} />
        <meshStandardMaterial color="#404040" roughness={1} />
      </mesh>
      {/* Corner towers */}
      {corners.map(([cx, , cz], i) => (
        <mesh key={i} position={[cx, 3.2, cz]} castShadow>
          <cylinderGeometry args={[0.6, 0.65, 6.4, 8]} />
          <meshStandardMaterial color="#757575" roughness={0.9} />
        </mesh>
      ))}
      {/* Tower cone caps */}
      {corners.map(([cx, , cz], i) => (
        <mesh key={`cap-${i}`} position={[cx, 6.6, cz]} castShadow>
          <coneGeometry args={[0.65, 1.2, 8]} />
          <meshStandardMaterial color="#5a4030" roughness={0.9} />
        </mesh>
      ))}
      {/* Crenellations on keep roof */}
      {crenels.map(([cx, , cz], i) => (
        <mesh key={`cren-${i}`} position={[cx, 5.35, cz]} castShadow>
          <boxGeometry args={[0.28, 0.5, 0.28]} />
          <meshStandardMaterial color="#888" roughness={0.88} />
        </mesh>
      ))}
      {/* Roof slab */}
      <mesh position={[0, 5.08, 0]} castShadow>
        <boxGeometry args={[4.2, 0.16, 4.2]} />
        <meshStandardMaterial color="#707070" roughness={0.85} />
      </mesh>
    </ProgressGroup>
  )
}

// ─── Cathedral ─────────────────────────────────────────────────────────────────

export function Cathedral({ position = [0, 0, 0], scale = 1, progress = 1 }) {
  return (
    <ProgressGroup progress={progress} height={8.0} position={position} scale={scale}>
      {/* Nave body */}
      <mesh position={[0, 1.5, 0]} castShadow receiveShadow>
        <boxGeometry args={[3.0, 3.0, 7.0]} />
        <meshStandardMaterial color="#b0a090" roughness={0.88} />
      </mesh>
      {/* Side aisles */}
      <mesh position={[-2.2, 1.0, 0.5]} castShadow receiveShadow>
        <boxGeometry args={[1.3, 2.0, 5.5]} />
        <meshStandardMaterial color="#a09080" roughness={0.88} />
      </mesh>
      <mesh position={[2.2, 1.0, 0.5]} castShadow receiveShadow>
        <boxGeometry args={[1.3, 2.0, 5.5]} />
        <meshStandardMaterial color="#a09080" roughness={0.88} />
      </mesh>
      {/* Main tower */}
      <mesh position={[0, 5.0, -2.8]} castShadow>
        <boxGeometry args={[2.0, 10.0, 2.0]} />
        <meshStandardMaterial color="#a09585" roughness={0.85} />
      </mesh>
      {/* Tower spire */}
      <mesh position={[0, 10.3, -2.8]} castShadow>
        <coneGeometry args={[0.9, 2.4, 4]} />
        <meshStandardMaterial color="#7a6858" roughness={0.85} />
      </mesh>
      {/* Secondary flanking towers */}
      <mesh position={[-1.3, 3.5, -2.8]} castShadow>
        <cylinderGeometry args={[0.38, 0.42, 5.0, 8]} />
        <meshStandardMaterial color="#a09080" roughness={0.88} />
      </mesh>
      <mesh position={[1.3, 3.5, -2.8]} castShadow>
        <cylinderGeometry args={[0.38, 0.42, 5.0, 8]} />
        <meshStandardMaterial color="#a09080" roughness={0.88} />
      </mesh>
      {/* Flanking spires */}
      <mesh position={[-1.3, 6.2, -2.8]} castShadow>
        <coneGeometry args={[0.42, 1.0, 8]} />
        <meshStandardMaterial color="#7a6858" roughness={0.85} />
      </mesh>
      <mesh position={[1.3, 6.2, -2.8]} castShadow>
        <coneGeometry args={[0.42, 1.0, 8]} />
        <meshStandardMaterial color="#7a6858" roughness={0.85} />
      </mesh>
      {/* Rose window inset */}
      <mesh position={[0, 2.5, -3.51]} castShadow>
        <cylinderGeometry args={[0.55, 0.55, 0.1, 12]} rotation={[Math.PI / 2, 0, 0]} />
        <meshStandardMaterial color="#c8a060" roughness={0.4} metalness={0.2} emissive="#604020" emissiveIntensity={0.3} />
      </mesh>
      {/* Nave roof */}
      <mesh position={[0, 3.1, 0.5]} rotation={[0, 0, 0.45]} castShadow>
        <boxGeometry args={[2.2, 0.18, 6.8]} />
        <meshStandardMaterial color="#7a6858" roughness={0.92} />
      </mesh>
      <mesh position={[0, 3.1, 0.5]} rotation={[0, 0, -0.45]} castShadow>
        <boxGeometry args={[2.2, 0.18, 6.8]} />
        <meshStandardMaterial color="#7a6858" roughness={0.92} />
      </mesh>
    </ProgressGroup>
  )
}

// ─── Tavern ────────────────────────────────────────────────────────────────────

export function Tavern({ position = [0, 0, 0], scale = 1, progress = 1 }) {
  return (
    <ProgressGroup progress={progress} height={4.5} position={position} scale={scale}>
      {/* Ground floor */}
      <mesh position={[0, 0.75, 0]} castShadow receiveShadow>
        <boxGeometry args={[4.5, 1.5, 3.2]} />
        <meshStandardMaterial color="#8B6040" roughness={0.92} />
      </mesh>
      {/* Upper floor */}
      <mesh position={[0, 2.1, 0.2]} castShadow receiveShadow>
        <boxGeometry args={[4.5, 1.2, 3.0]} />
        <meshStandardMaterial color="#9a7050" roughness={0.9} />
      </mesh>
      {/* Floor divider beam */}
      <mesh position={[0, 1.5, 0]} castShadow>
        <boxGeometry args={[4.7, 0.18, 3.4]} />
        <meshStandardMaterial color="#5a3a18" roughness={0.95} />
      </mesh>
      {/* Roof – pitched */}
      <mesh position={[-1.05, 3.12, 0]} rotation={[0, 0, 0.5]} castShadow>
        <boxGeometry args={[2.6, 0.2, 3.5]} />
        <meshStandardMaterial color="#5a3010" roughness={0.95} />
      </mesh>
      <mesh position={[1.05, 3.12, 0]} rotation={[0, 0, -0.5]} castShadow>
        <boxGeometry args={[2.6, 0.2, 3.5]} />
        <meshStandardMaterial color="#5a3010" roughness={0.95} />
      </mesh>
      {/* Door */}
      <mesh position={[0, 0.72, 1.61]} castShadow>
        <boxGeometry args={[0.75, 1.45, 0.08]} />
        <meshStandardMaterial color="#4a2808" roughness={1} />
      </mesh>
      {/* Windows lower */}
      {[-1.4, 1.4].map((x, i) => (
        <mesh key={i} position={[x, 0.9, 1.61]} castShadow>
          <boxGeometry args={[0.65, 0.65, 0.08]} />
          <meshStandardMaterial color="#d4a860" roughness={0.3} emissive="#a06010" emissiveIntensity={0.5} />
        </mesh>
      ))}
      {/* Windows upper */}
      {[-1.4, 0, 1.4].map((x, i) => (
        <mesh key={`u${i}`} position={[x, 2.1, 1.51]} castShadow>
          <boxGeometry args={[0.55, 0.55, 0.08]} />
          <meshStandardMaterial color="#d4a860" roughness={0.3} emissive="#a06010" emissiveIntensity={0.4} />
        </mesh>
      ))}
      {/* Hanging sign post */}
      <mesh position={[2.0, 2.3, 1.61]} castShadow>
        <boxGeometry args={[0.1, 1.0, 0.1]} />
        <meshStandardMaterial color="#5a3010" roughness={0.9} />
      </mesh>
      {/* Sign board */}
      <mesh position={[2.0, 1.92, 1.9]} castShadow>
        <boxGeometry args={[0.7, 0.38, 0.06]} />
        <meshStandardMaterial color="#c08040" roughness={0.85} />
      </mesh>
    </ProgressGroup>
  )
}

// ─── Blacksmith ────────────────────────────────────────────────────────────────

export function Blacksmith({ position = [0, 0, 0], scale = 1, progress = 1 }) {
  return (
    <ProgressGroup progress={progress} height={3.2} position={position} scale={scale}>
      {/* Main building – open front (U-shape via 3 walls) */}
      {/* Back wall */}
      <mesh position={[0, 1.1, -1.3]} castShadow receiveShadow>
        <boxGeometry args={[3.6, 2.2, 0.22]} />
        <meshStandardMaterial color="#706050" roughness={0.95} />
      </mesh>
      {/* Left wall */}
      <mesh position={[-1.7, 1.1, 0.1]} castShadow receiveShadow>
        <boxGeometry args={[0.22, 2.2, 2.65]} />
        <meshStandardMaterial color="#706050" roughness={0.95} />
      </mesh>
      {/* Right wall */}
      <mesh position={[1.7, 1.1, 0.1]} castShadow receiveShadow>
        <boxGeometry args={[0.22, 2.2, 2.65]} />
        <meshStandardMaterial color="#706050" roughness={0.95} />
      </mesh>
      {/* Roof */}
      <mesh position={[-0.88, 2.45, -0.4]} rotation={[0, 0, 0.48]} castShadow>
        <boxGeometry args={[2.4, 0.2, 3.0]} />
        <meshStandardMaterial color="#4a3020" roughness={0.95} />
      </mesh>
      <mesh position={[0.88, 2.45, -0.4]} rotation={[0, 0, -0.48]} castShadow>
        <boxGeometry args={[2.4, 0.2, 3.0]} />
        <meshStandardMaterial color="#4a3020" roughness={0.95} />
      </mesh>
      {/* Chimney stack */}
      <mesh position={[0, 3.05, -1.0]} castShadow>
        <cylinderGeometry args={[0.22, 0.25, 1.5, 8]} />
        <meshStandardMaterial color="#555" roughness={0.95} />
      </mesh>
      {/* Forge anvil block */}
      <mesh position={[0, 0.42, -0.5]} castShadow>
        <boxGeometry args={[0.5, 0.85, 0.5]} />
        <meshStandardMaterial color="#333" roughness={0.7} metalness={0.5} />
      </mesh>
      {/* Forge glow point light */}
      <pointLight position={[0, 0.7, -0.5]} color="#ff6a00" intensity={8} distance={4} decay={2} />
      {/* Ember plane glow */}
      <mesh position={[0, 0.22, -0.8]} rotation={[-Math.PI / 2, 0, 0]} castShadow>
        <planeGeometry args={[0.7, 0.5]} />
        <meshStandardMaterial color="#ff6a00" emissive="#ff4400" emissiveIntensity={2} roughness={1} />
      </mesh>
    </ProgressGroup>
  )
}

// ─── CityWall ──────────────────────────────────────────────────────────────────

export function CityWall({ position = [0, 0, 0], scale = 1, progress = 1 }) {
  const segments = 4
  const segLen = 3.5

  return (
    <ProgressGroup progress={progress} height={3.5} position={position} scale={scale}>
      {/* Wall segments */}
      {Array.from({ length: segments }).map((_, i) => (
        <mesh key={i} position={[i * segLen - (segments - 1) * segLen / 2, 1.25, 0]} castShadow receiveShadow>
          <boxGeometry args={[segLen - 0.1, 2.5, 0.8]} />
          <meshStandardMaterial color="#808878" roughness={0.9} />
        </mesh>
      ))}
      {/* Tower posts at joints */}
      {Array.from({ length: segments + 1 }).map((_, i) => (
        <mesh key={`t${i}`} position={[i * segLen - segments * segLen / 2, 1.75, 0]} castShadow>
          <cylinderGeometry args={[0.55, 0.6, 3.5, 8]} />
          <meshStandardMaterial color="#707868" roughness={0.9} />
        </mesh>
      ))}
      {/* Crenellations */}
      {Array.from({ length: segments }).map((_, si) =>
        Array.from({ length: 6 }).map((_, ci) => {
          const xBase = si * segLen - (segments - 1) * segLen / 2
          const xOff = (ci - 2.5) * 0.55
          return (
            <mesh key={`cr-${si}-${ci}`} position={[xBase + xOff, 2.68, 0]} castShadow>
              <boxGeometry args={[0.3, 0.46, 0.92]} />
              <meshStandardMaterial color="#888f7e" roughness={0.9} />
            </mesh>
          )
        })
      )}
    </ProgressGroup>
  )
}

// ─── MarketHall ────────────────────────────────────────────────────────────────

export function MarketHall({ position = [0, 0, 0], scale = 1, progress = 1 }) {
  const colCount = 5
  const colSpacing = 1.4

  return (
    <ProgressGroup progress={progress} height={4.2} position={position} scale={scale}>
      {/* Columns – two rows */}
      {Array.from({ length: colCount }).map((_, i) => {
        const xPos = (i - (colCount - 1) / 2) * colSpacing
        return (
          <group key={i}>
            <mesh position={[xPos, 1.5, -1.6]} castShadow>
              <cylinderGeometry args={[0.18, 0.22, 3.0, 8]} />
              <meshStandardMaterial color="#b0a888" roughness={0.85} />
            </mesh>
            <mesh position={[xPos, 1.5, 1.6]} castShadow>
              <cylinderGeometry args={[0.18, 0.22, 3.0, 8]} />
              <meshStandardMaterial color="#b0a888" roughness={0.85} />
            </mesh>
          </group>
        )
      })}
      {/* Entablature beams */}
      <mesh position={[0, 3.08, -1.6]} castShadow>
        <boxGeometry args={[(colCount - 1) * colSpacing + 0.7, 0.22, 0.38]} />
        <meshStandardMaterial color="#a09878" roughness={0.88} />
      </mesh>
      <mesh position={[0, 3.08, 1.6]} castShadow>
        <boxGeometry args={[(colCount - 1) * colSpacing + 0.7, 0.22, 0.38]} />
        <meshStandardMaterial color="#a09878" roughness={0.88} />
      </mesh>
      {/* Roof – two slopes */}
      <mesh position={[-0.9, 3.65, 0]} rotation={[0, 0, 0.46]} castShadow>
        <boxGeometry args={[2.0, 0.18, (colCount - 1) * colSpacing + 1.0]} />
        <meshStandardMaterial color="#7a6040" roughness={0.9} />
      </mesh>
      <mesh position={[0.9, 3.65, 0]} rotation={[0, 0, -0.46]} castShadow>
        <boxGeometry args={[2.0, 0.18, (colCount - 1) * colSpacing + 1.0]} />
        <meshStandardMaterial color="#7a6040" roughness={0.9} />
      </mesh>
      {/* Floor platform */}
      <mesh position={[0, 0.08, 0]} receiveShadow>
        <boxGeometry args={[(colCount - 1) * colSpacing + 1.2, 0.16, 3.8]} />
        <meshStandardMaterial color="#c0b090" roughness={0.95} />
      </mesh>
    </ProgressGroup>
  )
}

// ─── Mill ──────────────────────────────────────────────────────────────────────
// Cylinder building + 4 animated blade planes

export function Mill({ position = [0, 0, 0], scale = 1, progress = 1 }) {
  const bladesRef = useRef(null)

  useFrame((_, delta) => {
    if (bladesRef.current) {
      bladesRef.current.rotation.z += delta * 0.6
    }
  })

  return (
    <ProgressGroup progress={progress} height={5.5} position={position} scale={scale}>
      {/* Main cylinder body */}
      <mesh position={[0, 1.8, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[1.1, 1.4, 3.6, 10]} />
        <meshStandardMaterial color="#c8b890" roughness={0.9} />
      </mesh>
      {/* Conical roof */}
      <mesh position={[0, 3.9, 0]} castShadow>
        <coneGeometry args={[1.35, 1.8, 10]} />
        <meshStandardMaterial color="#5a3a10" roughness={0.9} />
      </mesh>
      {/* Door */}
      <mesh position={[0, 0.7, 1.41]} castShadow>
        <boxGeometry args={[0.55, 1.4, 0.08]} />
        <meshStandardMaterial color="#4a2808" roughness={1} />
      </mesh>
      {/* Axle hub for blades */}
      <mesh position={[0, 2.8, 1.5]} castShadow>
        <cylinderGeometry args={[0.18, 0.18, 0.28, 8]} rotation={[Math.PI / 2, 0, 0]} />
        <meshStandardMaterial color="#555" roughness={0.8} metalness={0.3} />
      </mesh>
      {/* Rotating blades group */}
      <group ref={bladesRef} position={[0, 2.8, 1.55]}>
        {[0, 1, 2, 3].map((i) => {
          const angle = (i / 4) * Math.PI * 2
          return (
            <mesh
              key={i}
              position={[Math.sin(angle) * 1.1, Math.cos(angle) * 1.1, 0]}
              rotation={[0, 0, angle]}
              castShadow
            >
              <boxGeometry args={[0.28, 1.8, 0.08]} />
              <meshStandardMaterial color="#a07840" roughness={0.9} />
            </mesh>
          )
        })}
        {/* Cross beams connecting blades */}
        <mesh castShadow>
          <boxGeometry args={[0.12, 2.6, 0.06]} />
          <meshStandardMaterial color="#7a5828" roughness={0.9} />
        </mesh>
        <mesh rotation={[0, 0, Math.PI / 2]} castShadow>
          <boxGeometry args={[0.12, 2.6, 0.06]} />
          <meshStandardMaterial color="#7a5828" roughness={0.9} />
        </mesh>
      </group>
    </ProgressGroup>
  )
}
