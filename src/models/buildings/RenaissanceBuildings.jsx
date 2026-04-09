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

// ─── ManorHouse ────────────────────────────────────────────────────────────────
// Wide 3-story box + window inset boxes on all 3 floors

export function ManorHouse({ position = [0, 0, 0], scale = 1, progress = 1 }) {
  const windowRows = [
    { y: 0.6, count: 5 },
    { y: 1.95, count: 5 },
    { y: 3.3, count: 5 },
  ]

  return (
    <ProgressGroup progress={progress} height={5.5} position={position} scale={scale}>
      {/* Main facade */}
      <mesh position={[0, 2.2, 0]} castShadow receiveShadow>
        <boxGeometry args={[7.5, 4.4, 3.8]} />
        <meshStandardMaterial color="#d4c8a8" roughness={0.82} />
      </mesh>
      {/* Central entrance portico */}
      <mesh position={[0, 0.95, 1.95]} castShadow>
        <boxGeometry args={[1.8, 1.9, 0.5]} />
        <meshStandardMaterial color="#c8bc9a" roughness={0.8} />
      </mesh>
      {/* Portico roof */}
      <mesh position={[0, 1.98, 2.12]} castShadow>
        <boxGeometry args={[2.2, 0.18, 0.6]} />
        <meshStandardMaterial color="#a09070" roughness={0.85} />
      </mesh>
      {/* Front door */}
      <mesh position={[0, 0.7, 2.21]} castShadow>
        <boxGeometry args={[0.75, 1.4, 0.08]} />
        <meshStandardMaterial color="#5a3818" roughness={1} />
      </mesh>
      {/* Windows per floor */}
      {windowRows.map(({ y, count }, ri) =>
        Array.from({ length: count }).map((_, ci) => {
          const xPos = (ci - (count - 1) / 2) * 1.35
          if (Math.abs(xPos) < 0.6 && y < 1.0) return null // skip door area
          return (
            <mesh key={`w-${ri}-${ci}`} position={[xPos, y, 1.91]} castShadow>
              <boxGeometry args={[0.52, 0.72, 0.1]} />
              <meshStandardMaterial color="#c8dce8" roughness={0.2} metalness={0.1} emissive="#607080" emissiveIntensity={0.1} />
            </mesh>
          )
        })
      )}
      {/* Roof line cornice */}
      <mesh position={[0, 4.48, 0]} castShadow>
        <boxGeometry args={[7.8, 0.2, 4.1]} />
        <meshStandardMaterial color="#b8ac8c" roughness={0.8} />
      </mesh>
      {/* Hipped roof */}
      <mesh position={[0, 5.0, 0]} castShadow>
        <boxGeometry args={[6.8, 1.0, 3.2]} />
        <meshStandardMaterial color="#888060" roughness={0.9} />
      </mesh>
      {/* Dormers */}
      {[-2.2, 0, 2.2].map((x, i) => (
        <mesh key={`d${i}`} position={[x, 5.1, 1.3]} castShadow>
          <boxGeometry args={[0.8, 0.7, 0.8]} />
          <meshStandardMaterial color="#c8bc9a" roughness={0.82} />
        </mesh>
      ))}
      {/* Chimney stacks */}
      {[-2.8, 2.8].map((x, i) => (
        <mesh key={`ch${i}`} position={[x, 5.6, -0.5]} castShadow>
          <boxGeometry args={[0.45, 1.3, 0.45]} />
          <meshStandardMaterial color="#888" roughness={0.92} />
        </mesh>
      ))}
    </ProgressGroup>
  )
}

// ─── University ────────────────────────────────────────────────────────────────
// U-shaped arrangement of boxes + library tower

export function University({ position = [0, 0, 0], scale = 1, progress = 1 }) {
  return (
    <ProgressGroup progress={progress} height={7.0} position={position} scale={scale}>
      {/* Left wing */}
      <mesh position={[-3.8, 1.5, 0.8]} castShadow receiveShadow>
        <boxGeometry args={[2.6, 3.0, 4.5]} />
        <meshStandardMaterial color="#d0c8a0" roughness={0.82} />
      </mesh>
      {/* Right wing */}
      <mesh position={[3.8, 1.5, 0.8]} castShadow receiveShadow>
        <boxGeometry args={[2.6, 3.0, 4.5]} />
        <meshStandardMaterial color="#d0c8a0" roughness={0.82} />
      </mesh>
      {/* Back connecting building */}
      <mesh position={[0, 1.5, -1.5]} castShadow receiveShadow>
        <boxGeometry args={[9.8, 3.0, 2.0]} />
        <meshStandardMaterial color="#c8c098" roughness={0.82} />
      </mesh>
      {/* Central courtyard path */}
      <mesh position={[0, 0.01, 1.8]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[3.0, 2.0]} />
        <meshStandardMaterial color="#c8b890" roughness={0.95} />
      </mesh>
      {/* Library tower center-back */}
      <mesh position={[0, 4.0, -1.5]} castShadow>
        <boxGeometry args={[2.4, 8.0, 2.4]} />
        <meshStandardMaterial color="#d8d0a8" roughness={0.8} />
      </mesh>
      {/* Tower clock face */}
      <mesh position={[0, 5.5, -2.61]} castShadow>
        <cylinderGeometry args={[0.55, 0.55, 0.1, 12]} rotation={[Math.PI / 2, 0, 0]} />
        <meshStandardMaterial color="#f0e8c0" roughness={0.4} />
      </mesh>
      {/* Tower spire */}
      <mesh position={[0, 8.2, -1.5]} castShadow>
        <coneGeometry args={[1.0, 2.5, 4]} />
        <meshStandardMaterial color="#8a7858" roughness={0.88} />
      </mesh>
      {/* Wing roofs */}
      {[-3.8, 3.8].map((x, i) => (
        <group key={i}>
          <mesh position={[x - 0.7 * Math.sign(x), 3.2, 0.8]} rotation={[0, 0, 0.42 * Math.sign(x)]} castShadow>
            <boxGeometry args={[1.9, 0.18, 4.8]} />
            <meshStandardMaterial color="#8a7858" roughness={0.9} />
          </mesh>
          <mesh position={[x + 0.7 * Math.sign(x), 3.2, 0.8]} rotation={[0, 0, -0.42 * Math.sign(x)]} castShadow>
            <boxGeometry args={[1.9, 0.18, 4.8]} />
            <meshStandardMaterial color="#8a7858" roughness={0.9} />
          </mesh>
        </group>
      ))}
      {/* Entrance arch */}
      <mesh position={[0, 1.1, 2.61]} castShadow>
        <boxGeometry args={[1.2, 2.2, 0.3]} />
        <meshStandardMaterial color="#c0b888" roughness={0.8} />
      </mesh>
    </ProgressGroup>
  )
}

// ─── Bank ──────────────────────────────────────────────────────────────────────
// Box body + column cylinders + triangular pediment

export function Bank({ position = [0, 0, 0], scale = 1, progress = 1 }) {
  const colPositions = [-2.0, -1.0, 0.0, 1.0, 2.0]

  return (
    <ProgressGroup progress={progress} height={5.5} position={position} scale={scale}>
      {/* Main body */}
      <mesh position={[0, 1.8, 0]} castShadow receiveShadow>
        <boxGeometry args={[6.0, 3.6, 3.5]} />
        <meshStandardMaterial color="#e8e0c8" roughness={0.78} />
      </mesh>
      {/* Raised base plinth */}
      <mesh position={[0, 0.22, 0.5]} castShadow receiveShadow>
        <boxGeometry args={[6.4, 0.44, 4.2]} />
        <meshStandardMaterial color="#d8d0b8" roughness={0.82} />
      </mesh>
      <mesh position={[0, 0.55, 0.5]} castShadow receiveShadow>
        <boxGeometry args={[5.8, 0.22, 3.8]} />
        <meshStandardMaterial color="#e0d8c0" roughness={0.8} />
      </mesh>
      {/* Front columns */}
      {colPositions.map((x, i) => (
        <mesh key={i} position={[x, 1.8, 1.85]} castShadow>
          <cylinderGeometry args={[0.22, 0.26, 3.6, 10]} />
          <meshStandardMaterial color="#f0e8d0" roughness={0.75} />
        </mesh>
      ))}
      {/* Entablature beam */}
      <mesh position={[0, 3.68, 1.85]} castShadow>
        <boxGeometry args={[5.4, 0.36, 0.55]} />
        <meshStandardMaterial color="#e0d8c0" roughness={0.8} />
      </mesh>
      {/* Triangular pediment */}
      <mesh position={[0, 4.28, 1.85]} castShadow>
        <boxGeometry args={[5.2, 0.9, 0.4]} />
        <meshStandardMaterial color="#e8e0c8" roughness={0.78} />
      </mesh>
      {/* Pediment apex */}
      <mesh position={[0, 4.85, 1.85]} castShadow>
        <coneGeometry args={[0.5, 0.7, 3]} />
        <meshStandardMaterial color="#d8d0b8" roughness={0.8} />
      </mesh>
      {/* Main door */}
      <mesh position={[0, 0.95, 1.76]} castShadow>
        <boxGeometry args={[1.1, 1.9, 0.1]} />
        <meshStandardMaterial color="#7a5c30" roughness={0.85} metalness={0.2} />
      </mesh>
      {/* Windows */}
      {[-1.9, 1.9].map((x, i) => (
        <mesh key={i} position={[x, 2.0, 1.76]} castShadow>
          <boxGeometry args={[0.9, 1.4, 0.1]} />
          <meshStandardMaterial color="#c8dce8" roughness={0.2} metalness={0.1} />
        </mesh>
      ))}
    </ProgressGroup>
  )
}

// ─── Theatre ───────────────────────────────────────────────────────────────────
// Half-cylinder auditorium + box stage tower

export function Theatre({ position = [0, 0, 0], scale = 1, progress = 1 }) {
  return (
    <ProgressGroup progress={progress} height={5.5} position={position} scale={scale}>
      {/* Semicircular auditorium hull */}
      <mesh position={[0, 1.4, 1.0]} castShadow receiveShadow>
        <cylinderGeometry args={[3.2, 3.5, 2.8, 16, 1, false, 0, Math.PI]} />
        <meshStandardMaterial color="#c8b880" roughness={0.85} />
      </mesh>
      {/* Auditorium floor cap */}
      <mesh position={[0, 0.04, 1.0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[3.5, 16, 0, Math.PI]} />
        <meshStandardMaterial color="#b0a870" roughness={0.95} />
      </mesh>
      {/* Stage tower */}
      <mesh position={[0, 2.5, -1.6]} castShadow receiveShadow>
        <boxGeometry args={[4.5, 5.0, 3.0]} />
        <meshStandardMaterial color="#d0c890" roughness={0.82} />
      </mesh>
      {/* Fly tower (taller box above stage) */}
      <mesh position={[0, 5.5, -1.6]} castShadow>
        <boxGeometry args={[4.0, 3.0, 2.5]} />
        <meshStandardMaterial color="#c8c080" roughness={0.82} />
      </mesh>
      {/* Proscenium arch */}
      <mesh position={[0, 1.5, -0.12]} castShadow>
        <boxGeometry args={[3.6, 3.0, 0.28]} />
        <meshStandardMaterial color="#b8b070" roughness={0.82} />
      </mesh>
      {/* Stage opening (dark inset) */}
      <mesh position={[0, 1.35, -0.08]}>
        <boxGeometry args={[2.8, 2.2, 0.3]} />
        <meshStandardMaterial color="#1a1008" roughness={1} />
      </mesh>
      {/* Entrance columns */}
      {[-1.4, 0, 1.4].map((x, i) => (
        <mesh key={i} position={[x, 1.1, 3.55]} castShadow>
          <cylinderGeometry args={[0.18, 0.22, 2.2, 8]} />
          <meshStandardMaterial color="#e0d8a8" roughness={0.78} />
        </mesh>
      ))}
      {/* Entrance entablature */}
      <mesh position={[0, 2.28, 3.55]} castShadow>
        <boxGeometry args={[3.6, 0.28, 0.44]} />
        <meshStandardMaterial color="#d8d0a0" roughness={0.8} />
      </mesh>
    </ProgressGroup>
  )
}

// ─── HarborDock ────────────────────────────────────────────────────────────────
// Long pier + warehouse

export function HarborDock({ position = [0, 0, 0], scale = 1, progress = 1 }) {
  const pilings = 8

  return (
    <ProgressGroup progress={progress} height={3.5} position={position} scale={scale}>
      {/* Main pier deck */}
      <mesh position={[0, 0.36, 0]} castShadow receiveShadow>
        <boxGeometry args={[9.0, 0.22, 2.2]} />
        <meshStandardMaterial color="#8B6914" roughness={0.95} />
      </mesh>
      {/* Pier pilings */}
      {Array.from({ length: pilings }).map((_, i) => {
        const x = (i - (pilings - 1) / 2) * 1.15
        return (
          <group key={i}>
            <mesh position={[x, -0.5, -0.9]} castShadow>
              <cylinderGeometry args={[0.1, 0.12, 1.7, 6]} />
              <meshStandardMaterial color="#6a5010" roughness={0.98} />
            </mesh>
            <mesh position={[x, -0.5, 0.9]} castShadow>
              <cylinderGeometry args={[0.1, 0.12, 1.7, 6]} />
              <meshStandardMaterial color="#6a5010" roughness={0.98} />
            </mesh>
          </group>
        )
      })}
      {/* Warehouse building on dock */}
      <mesh position={[2.8, 1.55, 0]} castShadow receiveShadow>
        <boxGeometry args={[3.0, 2.4, 2.2]} />
        <meshStandardMaterial color="#b09060" roughness={0.9} />
      </mesh>
      {/* Warehouse roof */}
      <mesh position={[2.1, 2.9, 0]} rotation={[0, 0, 0.45]} castShadow>
        <boxGeometry args={[2.0, 0.18, 2.5]} />
        <meshStandardMaterial color="#7a5828" roughness={0.9} />
      </mesh>
      <mesh position={[3.5, 2.9, 0]} rotation={[0, 0, -0.45]} castShadow>
        <boxGeometry args={[2.0, 0.18, 2.5]} />
        <meshStandardMaterial color="#7a5828" roughness={0.9} />
      </mesh>
      {/* Crane arm */}
      <mesh position={[-2.8, 1.6, 0]} castShadow>
        <boxGeometry args={[0.18, 3.2, 0.18]} />
        <meshStandardMaterial color="#7a5828" roughness={0.9} />
      </mesh>
      <mesh position={[-1.8, 3.1, 0]} castShadow>
        <boxGeometry args={[2.2, 0.18, 0.18]} />
        <meshStandardMaterial color="#7a5828" roughness={0.9} />
      </mesh>
      {/* Bollards */}
      {[-3.8, -1.8, 0.2].map((x, i) => (
        <mesh key={i} position={[x, 0.58, 1.1]} castShadow>
          <cylinderGeometry args={[0.1, 0.1, 0.45, 6]} />
          <meshStandardMaterial color="#555" roughness={0.9} />
        </mesh>
      ))}
      {/* Water hint plane */}
      <mesh position={[0, -0.12, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[10.0, 4.0]} />
        <meshStandardMaterial color="#2a5a8a" roughness={0.05} metalness={0.5} transparent opacity={0.7} />
      </mesh>
    </ProgressGroup>
  )
}

// ─── Observatory ───────────────────────────────────────────────────────────────
// Cylinder tower + half-sphere dome on top

export function Observatory({ position = [0, 0, 0], scale = 1, progress = 1 }) {
  return (
    <ProgressGroup progress={progress} height={6.5} position={position} scale={scale}>
      {/* Base octagonal plinth */}
      <mesh position={[0, 0.25, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[2.4, 2.6, 0.5, 8]} />
        <meshStandardMaterial color="#d0c8a8" roughness={0.82} />
      </mesh>
      {/* Cylinder tower body */}
      <mesh position={[0, 2.3, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[1.6, 1.8, 4.1, 12]} />
        <meshStandardMaterial color="#d8d0b0" roughness={0.8} />
      </mesh>
      {/* Observation ring / gallery */}
      <mesh position={[0, 4.45, 0]} castShadow>
        <cylinderGeometry args={[1.95, 1.65, 0.28, 12]} />
        <meshStandardMaterial color="#c8c0a0" roughness={0.82} />
      </mesh>
      {/* Dome */}
      <mesh position={[0, 4.9, 0]} castShadow>
        <sphereGeometry args={[1.65, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshStandardMaterial color="#9ab8d0" roughness={0.25} metalness={0.5} />
      </mesh>
      {/* Dome slit (telescope opening) */}
      <mesh position={[0, 5.4, 1.62]} castShadow>
        <boxGeometry args={[0.45, 1.1, 0.1]} />
        <meshStandardMaterial color="#1a1a2a" roughness={1} />
      </mesh>
      {/* Annex building with small windows */}
      <mesh position={[2.6, 1.0, 0]} castShadow receiveShadow>
        <boxGeometry args={[2.4, 2.0, 2.0]} />
        <meshStandardMaterial color="#ccc4a4" roughness={0.82} />
      </mesh>
      {/* Annex roof */}
      <mesh position={[2.0, 2.18, 0]} rotation={[0, 0, 0.48]} castShadow>
        <boxGeometry args={[1.6, 0.18, 2.2]} />
        <meshStandardMaterial color="#8a7858" roughness={0.9} />
      </mesh>
      <mesh position={[3.2, 2.18, 0]} rotation={[0, 0, -0.48]} castShadow>
        <boxGeometry args={[1.6, 0.18, 2.2]} />
        <meshStandardMaterial color="#8a7858" roughness={0.9} />
      </mesh>
      {/* Door */}
      <mesh position={[0, 0.7, 1.81]} castShadow>
        <boxGeometry args={[0.6, 1.4, 0.1]} />
        <meshStandardMaterial color="#6a5030" roughness={0.9} />
      </mesh>
    </ProgressGroup>
  )
}
