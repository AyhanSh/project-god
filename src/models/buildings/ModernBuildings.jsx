'use client'

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

// ─── Skyscraper ────────────────────────────────────────────────────────────────
// Tall thin box + emissive window grid + antenna

export function Skyscraper({ position = [0, 0, 0], scale = 1, progress = 1 }) {
  const floors = 12
  const cols = 4

  return (
    <ProgressGroup progress={progress} height={16.0} position={position} scale={scale}>
      {/* Core tower */}
      <mesh position={[0, 7.0, 0]} castShadow receiveShadow>
        <boxGeometry args={[2.4, 14.0, 2.4]} />
        <meshStandardMaterial color="#3a4a5a" roughness={0.3} metalness={0.6} />
      </mesh>
      {/* Window grid – front face */}
      {Array.from({ length: floors }).map((_, fi) =>
        Array.from({ length: cols }).map((_, ci) => {
          const y = 0.8 + fi * 1.12
          const x = (ci - (cols - 1) / 2) * 0.52
          return (
            <mesh key={`wf-${fi}-${ci}`} position={[x, y, 1.21]} castShadow>
              <boxGeometry args={[0.32, 0.62, 0.06]} />
              <meshStandardMaterial color="#88bbdd" emissive="#2266aa" emissiveIntensity={0.8} roughness={0.1} metalness={0.2} />
            </mesh>
          )
        })
      )}
      {/* Window grid – back face */}
      {Array.from({ length: floors }).map((_, fi) =>
        Array.from({ length: cols }).map((_, ci) => {
          const y = 0.8 + fi * 1.12
          const x = (ci - (cols - 1) / 2) * 0.52
          return (
            <mesh key={`wb-${fi}-${ci}`} position={[x, y, -1.21]} castShadow>
              <boxGeometry args={[0.32, 0.62, 0.06]} />
              <meshStandardMaterial color="#88bbdd" emissive="#2266aa" emissiveIntensity={0.8} roughness={0.1} metalness={0.2} />
            </mesh>
          )
        })
      )}
      {/* Roof mechanical penthouse */}
      <mesh position={[0, 14.4, 0]} castShadow>
        <boxGeometry args={[1.8, 0.8, 1.8]} />
        <meshStandardMaterial color="#2a3848" roughness={0.4} metalness={0.5} />
      </mesh>
      {/* Antenna */}
      <mesh position={[0, 15.6, 0]} castShadow>
        <cylinderGeometry args={[0.04, 0.06, 2.4, 6]} />
        <meshStandardMaterial color="#aaa" roughness={0.3} metalness={0.7} />
      </mesh>
      {/* Antenna blinker */}
      <mesh position={[0, 16.82, 0]}>
        <sphereGeometry args={[0.1, 6, 4]} />
        <meshStandardMaterial color="#ff2200" emissive="#ff2200" emissiveIntensity={2.0} roughness={1} />
      </mesh>
    </ProgressGroup>
  )
}

// ─── Airport ───────────────────────────────────────────────────────────────────
// Wide horizontal box complex + control tower + long flat runway

export function Airport({ position = [0, 0, 0], scale = 1, progress = 1 }) {
  return (
    <ProgressGroup progress={progress} height={6.0} position={position} scale={scale}>
      {/* Main terminal building */}
      <mesh position={[0, 1.2, 0]} castShadow receiveShadow>
        <boxGeometry args={[12.0, 2.4, 4.0]} />
        <meshStandardMaterial color="#d8d8d0" roughness={0.72} />
      </mesh>
      {/* Connector jetway arms */}
      {[-4.0, 0, 4.0].map((x, i) => (
        <mesh key={i} position={[x, 1.2, -2.5]} castShadow>
          <boxGeometry args={[0.8, 0.6, 1.0]} />
          <meshStandardMaterial color="#c0c0b8" roughness={0.75} />
        </mesh>
      ))}
      {/* Glass curtain wall facade */}
      <mesh position={[0, 1.5, 2.01]} castShadow>
        <boxGeometry args={[11.6, 2.2, 0.12]} />
        <meshStandardMaterial color="#a8d0e8" roughness={0.1} metalness={0.3} transparent opacity={0.6} />
      </mesh>
      {/* Control tower */}
      <mesh position={[5.5, 3.5, 0.5]} castShadow>
        <cylinderGeometry args={[0.5, 0.65, 7.0, 10]} />
        <meshStandardMaterial color="#d0d0c8" roughness={0.72} />
      </mesh>
      {/* Control room cab */}
      <mesh position={[5.5, 7.4, 0.5]} castShadow>
        <cylinderGeometry args={[0.85, 0.52, 1.0, 10]} />
        <meshStandardMaterial color="#a8d0e8" roughness={0.1} metalness={0.3} transparent opacity={0.7} />
      </mesh>
      {/* Tower antenna */}
      <mesh position={[5.5, 8.1, 0.5]} castShadow>
        <cylinderGeometry args={[0.04, 0.06, 1.4, 6]} />
        <meshStandardMaterial color="#aaa" roughness={0.3} metalness={0.7} />
      </mesh>
      {/* Runway */}
      <mesh position={[0, 0.02, -7.0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[3.5, 12.0]} />
        <meshStandardMaterial color="#555" roughness={0.95} />
      </mesh>
      {/* Runway center line dashes */}
      {[-4.5, -2.5, -0.5, 1.5, 3.5].map((z, i) => (
        <mesh key={i} position={[0, 0.03, -z - 7.0]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[0.18, 1.0]} />
          <meshStandardMaterial color="#fff" roughness={0.9} />
        </mesh>
      ))}
    </ProgressGroup>
  )
}

// ─── ShoppingMall ──────────────────────────────────────────────────────────────
// Wide low box + transparent skylight top

export function ShoppingMall({ position = [0, 0, 0], scale = 1, progress = 1 }) {
  return (
    <ProgressGroup progress={progress} height={5.0} position={position} scale={scale}>
      {/* Main mall body */}
      <mesh position={[0, 1.6, 0]} castShadow receiveShadow>
        <boxGeometry args={[10.0, 3.2, 6.5]} />
        <meshStandardMaterial color="#e0dcd0" roughness={0.78} />
      </mesh>
      {/* Atrium glass skylight strip */}
      <mesh position={[0, 3.22, 0]} castShadow>
        <boxGeometry args={[8.5, 0.2, 2.5]} />
        <meshStandardMaterial color="#c8e8f8" roughness={0.05} metalness={0.2} transparent opacity={0.5} />
      </mesh>
      {/* Entrance canopies */}
      {[-4.2, 4.2].map((x, i) => (
        <mesh key={i} position={[x, 1.6, 0]} castShadow>
          <boxGeometry args={[1.6, 0.2, 7.0]} />
          <meshStandardMaterial color="#d0ccbf" roughness={0.8} />
        </mesh>
      ))}
      {/* Parking lot (subtle) */}
      <mesh position={[0, 0.01, -5.5]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[10.5, 3.0]} />
        <meshStandardMaterial color="#888880" roughness={0.95} />
      </mesh>
      {/* Signs strip */}
      <mesh position={[0, 2.0, 3.26]} castShadow>
        <boxGeometry args={[9.5, 0.7, 0.18]} />
        <meshStandardMaterial color="#d0281a" roughness={0.6} emissive="#801010" emissiveIntensity={0.3} />
      </mesh>
      {/* Parking stall lines */}
      {[-4.0, -2.0, 0, 2.0, 4.0].map((x, i) => (
        <mesh key={i} position={[x, 0.02, -5.5]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[0.08, 2.8]} />
          <meshStandardMaterial color="#fff" roughness={0.9} />
        </mesh>
      ))}
    </ProgressGroup>
  )
}

// ─── Stadium ───────────────────────────────────────────────────────────────────
// Torus ring + inner green field + roof canopy

export function Stadium({ position = [0, 0, 0], scale = 1, progress = 1 }) {
  return (
    <ProgressGroup progress={progress} height={5.0} position={position} scale={scale}>
      {/* Stands bowl – torus segment */}
      <mesh position={[0, 1.2, 0]} castShadow receiveShadow>
        <torusGeometry args={[4.0, 1.8, 8, 32]} />
        <meshStandardMaterial color="#c0c8d0" roughness={0.82} />
      </mesh>
      {/* Playing field */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <circleGeometry args={[3.5, 24]} />
        <meshStandardMaterial color="#2a8020" roughness={0.95} />
      </mesh>
      {/* Field markings – center circle */}
      <mesh position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.9, 1.0, 20]} />
        <meshStandardMaterial color="#fff" roughness={0.9} />
      </mesh>
      {/* Center spot */}
      <mesh position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.12, 8]} />
        <meshStandardMaterial color="#fff" roughness={0.9} />
      </mesh>
      {/* Roof canopy ring */}
      <mesh position={[0, 3.6, 0]} castShadow>
        <torusGeometry args={[4.5, 0.55, 5, 32]} />
        <meshStandardMaterial color="#88aacc" roughness={0.2} metalness={0.5} transparent opacity={0.75} />
      </mesh>
      {/* Roof support struts */}
      {Array.from({ length: 8 }).map((_, i) => {
        const angle = (i / 8) * Math.PI * 2
        return (
          <mesh key={i} position={[Math.sin(angle) * 3.9, 1.8, Math.cos(angle) * 3.9]} castShadow>
            <boxGeometry args={[0.12, 3.6, 0.12]} />
            <meshStandardMaterial color="#a0a8b0" roughness={0.5} metalness={0.4} />
          </mesh>
        )
      })}
      {/* Goal posts */}
      {[-3.2, 3.2].map((x, i) => (
        <group key={i} position={[x, 0, 0]}>
          <mesh position={[0, 1.0, 0]} castShadow>
            <cylinderGeometry args={[0.05, 0.05, 2.0, 6]} />
            <meshStandardMaterial color="#fff" roughness={0.6} />
          </mesh>
          <mesh position={[0, 2.1, 0]} castShadow>
            <boxGeometry args={[1.2, 0.07, 0.07]} />
            <meshStandardMaterial color="#fff" roughness={0.6} />
          </mesh>
        </group>
      ))}
    </ProgressGroup>
  )
}

// ─── SuburbHouse ───────────────────────────────────────────────────────────────
// Small box + garage + garden

export function SuburbHouse({ position = [0, 0, 0], scale = 1, progress = 1 }) {
  return (
    <ProgressGroup progress={progress} height={3.5} position={position} scale={scale}>
      {/* Main house */}
      <mesh position={[0, 1.0, 0]} castShadow receiveShadow>
        <boxGeometry args={[3.2, 2.0, 2.8]} />
        <meshStandardMaterial color="#e8d8c0" roughness={0.82} />
      </mesh>
      {/* Pitched roof */}
      <mesh position={[-0.82, 2.22, 0]} rotation={[0, 0, 0.52]} castShadow>
        <boxGeometry args={[2.2, 0.18, 3.0]} />
        <meshStandardMaterial color="#b06040" roughness={0.9} />
      </mesh>
      <mesh position={[0.82, 2.22, 0]} rotation={[0, 0, -0.52]} castShadow>
        <boxGeometry args={[2.2, 0.18, 3.0]} />
        <meshStandardMaterial color="#b06040" roughness={0.9} />
      </mesh>
      {/* Chimney */}
      <mesh position={[0.9, 2.6, -0.6]} castShadow>
        <boxGeometry args={[0.35, 0.9, 0.35]} />
        <meshStandardMaterial color="#888" roughness={0.9} />
      </mesh>
      {/* Front door */}
      <mesh position={[0, 0.65, 1.41]} castShadow>
        <boxGeometry args={[0.6, 1.3, 0.08]} />
        <meshStandardMaterial color="#604020" roughness={0.85} />
      </mesh>
      {/* Front window */}
      <mesh position={[-0.95, 1.0, 1.41]} castShadow>
        <boxGeometry args={[0.7, 0.7, 0.08]} />
        <meshStandardMaterial color="#b8d8e8" roughness={0.2} metalness={0.1} />
      </mesh>
      {/* Attached garage */}
      <mesh position={[2.6, 0.85, 0.1]} castShadow receiveShadow>
        <boxGeometry args={[1.8, 1.7, 2.6]} />
        <meshStandardMaterial color="#d8c8b0" roughness={0.85} />
      </mesh>
      {/* Garage door */}
      <mesh position={[2.6, 0.82, 1.31]} castShadow>
        <boxGeometry args={[1.5, 1.5, 0.08]} />
        <meshStandardMaterial color="#a8a090" roughness={0.85} />
      </mesh>
      {/* Garage roof */}
      <mesh position={[2.2, 1.78, 0.1]} rotation={[0, 0, 0.5]} castShadow>
        <boxGeometry args={[1.3, 0.15, 2.8]} />
        <meshStandardMaterial color="#b06040" roughness={0.9} />
      </mesh>
      <mesh position={[3.0, 1.78, 0.1]} rotation={[0, 0, -0.5]} castShadow>
        <boxGeometry args={[1.3, 0.15, 2.8]} />
        <meshStandardMaterial color="#b06040" roughness={0.9} />
      </mesh>
      {/* Garden / lawn */}
      <mesh position={[-0.5, 0.01, 2.5]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[3.0, 1.5]} />
        <meshStandardMaterial color="#4a8030" roughness={0.95} />
      </mesh>
      {/* Mailbox */}
      <mesh position={[-1.2, 0.45, 2.6]} castShadow>
        <boxGeometry args={[0.2, 0.28, 0.28]} />
        <meshStandardMaterial color="#8a8888" roughness={0.7} metalness={0.3} />
      </mesh>
    </ProgressGroup>
  )
}

// ─── OfficeTower ───────────────────────────────────────────────────────────────
// Box with blue-tint emissive material + setbacks

export function OfficeTower({ position = [0, 0, 0], scale = 1, progress = 1 }) {
  return (
    <ProgressGroup progress={progress} height={12.0} position={position} scale={scale}>
      {/* Base podium */}
      <mesh position={[0, 0.8, 0]} castShadow receiveShadow>
        <boxGeometry args={[5.0, 1.6, 4.5]} />
        <meshStandardMaterial color="#4a5a68" roughness={0.3} metalness={0.5} />
      </mesh>
      {/* Mid tower */}
      <mesh position={[0, 5.0, 0]} castShadow receiveShadow>
        <boxGeometry args={[3.8, 6.8, 3.2]} />
        <meshStandardMaterial color="#3a4a58" roughness={0.25} metalness={0.6} emissive="#102030" emissiveIntensity={0.3} />
      </mesh>
      {/* Upper setback */}
      <mesh position={[0, 9.8, 0]} castShadow receiveShadow>
        <boxGeometry args={[2.8, 2.4, 2.2]} />
        <meshStandardMaterial color="#2a3a48" roughness={0.2} metalness={0.7} emissive="#0a1828" emissiveIntensity={0.4} />
      </mesh>
      {/* Window strip bands (horizontal) */}
      {Array.from({ length: 9 }).map((_, i) => (
        <mesh key={i} position={[0, 1.8 + i * 0.76, 1.61]} castShadow>
          <boxGeometry args={[3.6, 0.38, 0.06]} />
          <meshStandardMaterial color="#88ccee" emissive="#2266aa" emissiveIntensity={0.6} roughness={0.1} metalness={0.3} transparent opacity={0.85} />
        </mesh>
      ))}
      {/* Roof helipad hint */}
      <mesh position={[0, 11.05, 0]} castShadow>
        <cylinderGeometry args={[0.8, 0.8, 0.06, 8]} />
        <meshStandardMaterial color="#ffcc00" roughness={0.5} />
      </mesh>
    </ProgressGroup>
  )
}

// ─── DataCenter ────────────────────────────────────────────────────────────────
// Long low box + AC unit array on roof

export function DataCenter({ position = [0, 0, 0], scale = 1, progress = 1 }) {
  const acRows = 3
  const acCols = 5

  return (
    <ProgressGroup progress={progress} height={4.5} position={position} scale={scale}>
      {/* Main building */}
      <mesh position={[0, 1.5, 0]} castShadow receiveShadow>
        <boxGeometry args={[8.5, 3.0, 4.5]} />
        <meshStandardMaterial color="#6a7080" roughness={0.78} />
      </mesh>
      {/* Security fence (thin box frame) */}
      <mesh position={[0, 0.5, 3.2]} castShadow>
        <boxGeometry args={[9.5, 1.0, 0.08]} />
        <meshStandardMaterial color="#888" roughness={0.8} metalness={0.4} />
      </mesh>
      {/* AC / HVAC units on roof */}
      {Array.from({ length: acRows }).map((_, ri) =>
        Array.from({ length: acCols }).map((_, ci) => {
          const x = (ci - (acCols - 1) / 2) * 1.55
          const z = (ri - (acRows - 1) / 2) * 1.3
          return (
            <mesh key={`ac-${ri}-${ci}`} position={[x, 3.28, z]} castShadow>
              <boxGeometry args={[0.9, 0.55, 0.9]} />
              <meshStandardMaterial color="#888a90" roughness={0.7} metalness={0.3} />
            </mesh>
          )
        })
      )}
      {/* AC exhaust fan tops */}
      {Array.from({ length: acRows }).map((_, ri) =>
        Array.from({ length: acCols }).map((_, ci) => {
          const x = (ci - (acCols - 1) / 2) * 1.55
          const z = (ri - (acRows - 1) / 2) * 1.3
          return (
            <mesh key={`fan-${ri}-${ci}`} position={[x, 3.62, z]} castShadow>
              <cylinderGeometry args={[0.32, 0.32, 0.12, 8]} />
              <meshStandardMaterial color="#777" roughness={0.6} metalness={0.5} />
            </mesh>
          )
        })
      )}
      {/* Loading dock */}
      <mesh position={[-3.5, 0.7, 2.3]} castShadow>
        <boxGeometry args={[1.8, 1.4, 0.12]} />
        <meshStandardMaterial color="#555" roughness={0.85} />
      </mesh>
      {/* Signage light strip */}
      <mesh position={[0, 2.2, 2.26]} castShadow>
        <boxGeometry args={[7.0, 0.3, 0.1]} />
        <meshStandardMaterial color="#a8d8f0" emissive="#4088cc" emissiveIntensity={0.8} roughness={0.2} />
      </mesh>
    </ProgressGroup>
  )
}
