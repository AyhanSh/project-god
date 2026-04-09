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

// ─── Factory ───────────────────────────────────────────────────────────────────
// Long box + 3 cylinder chimney stacks

export function Factory({ position = [0, 0, 0], scale = 1, progress = 1 }) {
  return (
    <ProgressGroup progress={progress} height={6.0} position={position} scale={scale}>
      {/* Main factory shed */}
      <mesh position={[0, 1.5, 0]} castShadow receiveShadow>
        <boxGeometry args={[9.0, 3.0, 4.0]} />
        <meshStandardMaterial color="#7a7870" roughness={0.9} />
      </mesh>
      {/* Sawtooth roof bays */}
      {[-2.8, 0, 2.8].map((x, i) => (
        <group key={i}>
          <mesh position={[x - 0.7, 3.2, 0]} rotation={[0, 0, 0.55]} castShadow>
            <boxGeometry args={[1.9, 0.18, 4.4]} />
            <meshStandardMaterial color="#666058" roughness={0.9} />
          </mesh>
          <mesh position={[x + 0.7, 3.2, 0]} rotation={[0, 0, -0.55]} castShadow>
            <boxGeometry args={[1.9, 0.18, 4.4]} />
            <meshStandardMaterial color="#666058" roughness={0.9} />
          </mesh>
        </group>
      ))}
      {/* Three chimney stacks */}
      {[-2.5, 0, 2.5].map((x, i) => (
        <group key={`ch${i}`}>
          <mesh position={[x, 5.0, -1.2]} castShadow>
            <cylinderGeometry args={[0.32, 0.38, 6.0, 10]} />
            <meshStandardMaterial color="#5a5250" roughness={0.9} />
          </mesh>
          {/* Chimney cap ring */}
          <mesh position={[x, 8.1, -1.2]} castShadow>
            <cylinderGeometry args={[0.42, 0.32, 0.2, 10]} />
            <meshStandardMaterial color="#444038" roughness={0.9} />
          </mesh>
          {/* Smoke glow */}
          <mesh position={[x, 8.3, -1.2]}>
            <sphereGeometry args={[0.22, 8, 6]} />
            <meshStandardMaterial color="#888" emissive="#555" emissiveIntensity={0.4} roughness={1} transparent opacity={0.5} />
          </mesh>
        </group>
      ))}
      {/* Loading bay roll door */}
      <mesh position={[0, 1.0, 2.01]} castShadow>
        <boxGeometry args={[2.4, 2.0, 0.12]} />
        <meshStandardMaterial color="#5a5048" roughness={0.88} />
      </mesh>
      {/* Small office annex */}
      <mesh position={[3.9, 1.0, 1.4]} castShadow receiveShadow>
        <boxGeometry args={[1.2, 2.0, 1.4]} />
        <meshStandardMaterial color="#888070" roughness={0.88} />
      </mesh>
    </ProgressGroup>
  )
}

// ─── RailStation ───────────────────────────────────────────────────────────────
// Long train hall + cylinder clock tower

export function RailStation({ position = [0, 0, 0], scale = 1, progress = 1 }) {
  return (
    <ProgressGroup progress={progress} height={6.0} position={position} scale={scale}>
      {/* Main hall shed */}
      <mesh position={[0, 1.6, 0]} castShadow receiveShadow>
        <boxGeometry args={[10.0, 3.2, 3.8]} />
        <meshStandardMaterial color="#c8c0a8" roughness={0.85} />
      </mesh>
      {/* Arched canopy overhang */}
      <mesh position={[0, 1.8, 2.1]} castShadow>
        <boxGeometry args={[10.0, 0.18, 1.5]} />
        <meshStandardMaterial color="#b0a890" roughness={0.88} />
      </mesh>
      {/* Support columns for canopy */}
      {[-4.0, -2.0, 0, 2.0, 4.0].map((x, i) => (
        <mesh key={i} position={[x, 1.0, 2.7]} castShadow>
          <cylinderGeometry args={[0.1, 0.12, 2.0, 8]} />
          <meshStandardMaterial color="#888070" roughness={0.88} />
        </mesh>
      ))}
      {/* Arched roof – barrel vault hint */}
      <mesh position={[0, 3.1, 0]} castShadow>
        <cylinderGeometry args={[1.95, 1.95, 10.0, 14, 1, true, 0, Math.PI]} rotation={[0, Math.PI / 2, 0]} />
        <meshStandardMaterial color="#a09880" roughness={0.88} side={2} />
      </mesh>
      {/* Clock tower */}
      <mesh position={[4.5, 3.5, 0]} castShadow>
        <cylinderGeometry args={[0.9, 1.0, 7.0, 10]} />
        <meshStandardMaterial color="#c8c0a0" roughness={0.82} />
      </mesh>
      {/* Clock face */}
      <mesh position={[4.5, 5.2, 1.01]} castShadow>
        <cylinderGeometry args={[0.55, 0.55, 0.1, 12]} rotation={[Math.PI / 2, 0, 0]} />
        <meshStandardMaterial color="#f0e8d0" roughness={0.4} />
      </mesh>
      {/* Tower cap */}
      <mesh position={[4.5, 7.2, 0]} castShadow>
        <coneGeometry args={[1.0, 1.8, 10]} />
        <meshStandardMaterial color="#7a6848" roughness={0.88} />
      </mesh>
      {/* Platform / track hint */}
      <mesh position={[0, 0.04, -2.5]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[10.0, 1.8]} />
        <meshStandardMaterial color="#888880" roughness={0.95} />
      </mesh>
      {/* Entrance archway */}
      <mesh position={[-3.5, 1.5, 1.91]} castShadow>
        <boxGeometry args={[2.2, 3.0, 0.22]} />
        <meshStandardMaterial color="#d0c8a8" roughness={0.82} />
      </mesh>
    </ProgressGroup>
  )
}

// ─── Hospital ──────────────────────────────────────────────────────────────────
// Large white box + red cross on roof

export function Hospital({ position = [0, 0, 0], scale = 1, progress = 1 }) {
  return (
    <ProgressGroup progress={progress} height={6.0} position={position} scale={scale}>
      {/* Main building */}
      <mesh position={[0, 2.5, 0]} castShadow receiveShadow>
        <boxGeometry args={[6.5, 5.0, 4.5]} />
        <meshStandardMaterial color="#f0ece4" roughness={0.78} />
      </mesh>
      {/* Side wing */}
      <mesh position={[-4.2, 1.5, 0]} castShadow receiveShadow>
        <boxGeometry args={[2.0, 3.0, 3.8]} />
        <meshStandardMaterial color="#eee8e0" roughness={0.8} />
      </mesh>
      {/* Entrance portico */}
      <mesh position={[0, 0.9, 2.36]} castShadow>
        <boxGeometry args={[2.4, 1.8, 0.5]} />
        <meshStandardMaterial color="#e8e4dc" roughness={0.8} />
      </mesh>
      {/* Portico roof */}
      <mesh position={[0, 1.85, 2.6]} castShadow>
        <boxGeometry args={[2.8, 0.18, 0.6]} />
        <meshStandardMaterial color="#d8d4cc" roughness={0.82} />
      </mesh>
      {/* Grid of windows – 3 floors, 4 bays */}
      {[0.6, 2.0, 3.4].map((y, ri) =>
        [-2.0, -0.65, 0.65, 2.0].map((x, ci) => (
          <mesh key={`w-${ri}-${ci}`} position={[x, y, 2.26]} castShadow>
            <boxGeometry args={[0.7, 0.9, 0.1]} />
            <meshStandardMaterial color="#c8dce8" roughness={0.2} metalness={0.1} />
          </mesh>
        ))
      )}
      {/* Red cross – vertical bar */}
      <mesh position={[0, 5.25, 0]} castShadow>
        <boxGeometry args={[0.55, 1.6, 0.22]} />
        <meshStandardMaterial color="#cc0000" roughness={0.6} />
      </mesh>
      {/* Red cross – horizontal bar */}
      <mesh position={[0, 5.25, 0]} castShadow>
        <boxGeometry args={[1.6, 0.55, 0.22]} />
        <meshStandardMaterial color="#cc0000" roughness={0.6} />
      </mesh>
      {/* Flagpole */}
      <mesh position={[2.8, 6.4, 0]} castShadow>
        <cylinderGeometry args={[0.05, 0.05, 3.0, 6]} />
        <meshStandardMaterial color="#aaa" roughness={0.5} metalness={0.5} />
      </mesh>
    </ProgressGroup>
  )
}

// ─── CoalMine ──────────────────────────────────────────────────────────────────
// Box shaft entrance + thin box frame structure (headframe)

export function CoalMine({ position = [0, 0, 0], scale = 1, progress = 1 }) {
  return (
    <ProgressGroup progress={progress} height={6.0} position={position} scale={scale}>
      {/* Shaft entrance structure */}
      <mesh position={[0, 1.1, 0]} castShadow receiveShadow>
        <boxGeometry args={[2.8, 2.2, 2.2]} />
        <meshStandardMaterial color="#6a6258" roughness={0.95} />
      </mesh>
      {/* Shaft opening (dark) */}
      <mesh position={[0, 0.55, 1.12]}>
        <boxGeometry args={[1.4, 1.1, 0.12]} />
        <meshStandardMaterial color="#111" roughness={1} />
      </mesh>
      {/* Headframe – 4 legs */}
      {[[-0.7, 0, -0.5], [0.7, 0, -0.5], [-0.7, 0, 0.5], [0.7, 0, 0.5]].map(([lx, , lz], i) => (
        <mesh key={i} position={[lx, 3.5, lz]} castShadow>
          <boxGeometry args={[0.12, 7.0, 0.12]} />
          <meshStandardMaterial color="#555" roughness={0.8} metalness={0.3} />
        </mesh>
      ))}
      {/* Cross bracing */}
      {[2.5, 4.5, 6.5].map((y, i) => (
        <mesh key={`brace${i}`} position={[0, y, 0]} castShadow>
          <boxGeometry args={[1.6, 0.1, 0.1]} />
          <meshStandardMaterial color="#555" roughness={0.8} metalness={0.3} />
        </mesh>
      ))}
      {/* Pulley wheel at top */}
      <mesh position={[0, 7.1, 0]} castShadow>
        <torusGeometry args={[0.5, 0.1, 6, 14]} />
        <meshStandardMaterial color="#555" roughness={0.6} metalness={0.5} />
      </mesh>
      {/* Spoil heap */}
      <mesh position={[2.5, 0.3, 0]} castShadow receiveShadow>
        <coneGeometry args={[1.8, 0.9, 8]} />
        <meshStandardMaterial color="#3a3028" roughness={0.99} />
      </mesh>
      {/* Rail cart track */}
      <mesh position={[0, 0.05, 2.0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[0.5, 3.0]} />
        <meshStandardMaterial color="#555" roughness={0.9} />
      </mesh>
    </ProgressGroup>
  )
}

// ─── ApartmentBlock ────────────────────────────────────────────────────────────
// 5-story box with grid of small emissive window boxes

export function ApartmentBlock({ position = [0, 0, 0], scale = 1, progress = 1 }) {
  const floors = 5
  const windowCols = 5

  return (
    <ProgressGroup progress={progress} height={7.5} position={position} scale={scale}>
      {/* Main block */}
      <mesh position={[0, 3.5, 0]} castShadow receiveShadow>
        <boxGeometry args={[5.5, 7.0, 2.8]} />
        <meshStandardMaterial color="#9a9a90" roughness={0.85} />
      </mesh>
      {/* Window grid */}
      {Array.from({ length: floors }).map((_, fi) =>
        Array.from({ length: windowCols }).map((_, ci) => {
          const y = 0.7 + fi * 1.32
          const x = (ci - (windowCols - 1) / 2) * 1.0
          return (
            <mesh key={`w-${fi}-${ci}`} position={[x, y, 1.41]} castShadow>
              <boxGeometry args={[0.52, 0.68, 0.08]} />
              <meshStandardMaterial
                color="#a8c8e0"
                emissive="#304050"
                emissiveIntensity={0.7}
                roughness={0.2}
                metalness={0.1}
              />
            </mesh>
          )
        })
      )}
      {/* Balcony railings per floor */}
      {Array.from({ length: floors - 1 }).map((_, fi) => (
        <mesh key={`bal${fi}`} position={[0, 0.7 + fi * 1.32 + 0.5, 1.5]} castShadow>
          <boxGeometry args={[5.6, 0.08, 0.18]} />
          <meshStandardMaterial color="#808080" roughness={0.7} metalness={0.3} />
        </mesh>
      ))}
      {/* Flat roof parapet */}
      <mesh position={[0, 7.08, 0]} castShadow>
        <boxGeometry args={[5.7, 0.22, 3.0]} />
        <meshStandardMaterial color="#888880" roughness={0.88} />
      </mesh>
      {/* Entrance staircase */}
      <mesh position={[0, 0.15, 1.42]} castShadow receiveShadow>
        <boxGeometry args={[1.5, 0.3, 0.5]} />
        <meshStandardMaterial color="#888" roughness={0.9} />
      </mesh>
      {/* Door */}
      <mesh position={[0, 0.6, 1.41]} castShadow>
        <boxGeometry args={[0.7, 1.2, 0.08]} />
        <meshStandardMaterial color="#4a4040" roughness={0.85} />
      </mesh>
    </ProgressGroup>
  )
}

// ─── Park ──────────────────────────────────────────────────────────────────────
// Flat green plane + curved thin box paths + trees

export function Park({ position = [0, 0, 0], scale = 1, progress = 1 }) {
  const p = clampProgress(progress)
  const s = scale ?? 1

  return (
    <group
      position={[position?.[0] ?? 0, position?.[1] ?? 0, position?.[2] ?? 0]}
      scale={[s, s, s]}
    >
      {/* Green ground */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[8.0, 7.0]} />
        <meshStandardMaterial color="#4a8030" roughness={0.95} />
      </mesh>
      {/* Paths */}
      {p > 0.2 && (
        <>
          <mesh position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <planeGeometry args={[0.7, 7.0]} />
            <meshStandardMaterial color="#c8b890" roughness={0.95} />
          </mesh>
          <mesh position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <planeGeometry args={[8.0, 0.7]} />
            <meshStandardMaterial color="#c8b890" roughness={0.95} />
          </mesh>
          {/* Diagonal path */}
          <mesh position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, Math.PI / 4]}>
            <planeGeometry args={[0.5, 10.0]} />
            <meshStandardMaterial color="#c0b088" roughness={0.95} />
          </mesh>
        </>
      )}
      {/* Trees (cylinder trunk + cone canopy) */}
      {p > 0.4 && [[-2.5, 0, -2.0], [2.5, 0, -2.0], [-2.5, 0, 2.0], [2.5, 0, 2.0], [0, 0, -2.8]].map(([tx, , tz], i) => (
        <group key={i} position={[tx, 0, tz]}>
          <mesh position={[0, 0.7, 0]} castShadow>
            <cylinderGeometry args={[0.12, 0.16, 1.4, 6]} />
            <meshStandardMaterial color="#6a4a1a" roughness={1} />
          </mesh>
          <mesh position={[0, 1.9, 0]} castShadow>
            <coneGeometry args={[0.7, 1.5, 7]} />
            <meshStandardMaterial color="#2a6820" roughness={0.95} />
          </mesh>
          <mesh position={[0, 2.8, 0]} castShadow>
            <coneGeometry args={[0.45, 1.1, 7]} />
            <meshStandardMaterial color="#347828" roughness={0.95} />
          </mesh>
        </group>
      ))}
      {/* Bench */}
      {p > 0.6 && (
        <mesh position={[1.5, 0.35, 0.5]} castShadow>
          <boxGeometry args={[0.8, 0.1, 0.3]} />
          <meshStandardMaterial color="#8B5820" roughness={0.9} />
        </mesh>
      )}
      {/* Fountain base */}
      {p > 0.7 && (
        <group position={[0, 0, 0]}>
          <mesh position={[0, 0.18, 0]} castShadow>
            <cylinderGeometry args={[0.6, 0.65, 0.36, 12]} />
            <meshStandardMaterial color="#aaa" roughness={0.8} />
          </mesh>
          <mesh position={[0, 0.38, 0]}>
            <cylinderGeometry args={[0.55, 0.55, 0.06, 12]} />
            <meshStandardMaterial color="#4a90c0" roughness={0.1} metalness={0.3} />
          </mesh>
        </group>
      )}
    </group>
  )
}

// ─── PowerPlant ────────────────────────────────────────────────────────────────
// Large box + cylinder cooling towers

export function PowerPlant({ position = [0, 0, 0], scale = 1, progress = 1 }) {
  return (
    <ProgressGroup progress={progress} height={8.0} position={position} scale={scale}>
      {/* Main turbine hall */}
      <mesh position={[0, 2.5, 0]} castShadow receiveShadow>
        <boxGeometry args={[7.0, 5.0, 4.5]} />
        <meshStandardMaterial color="#8a8880" roughness={0.88} />
      </mesh>
      {/* Boiler house extension */}
      <mesh position={[-4.5, 3.2, 0]} castShadow receiveShadow>
        <boxGeometry args={[2.5, 6.4, 3.8]} />
        <meshStandardMaterial color="#888078" roughness={0.9} />
      </mesh>
      {/* Two cooling towers */}
      {[2.8, 5.2].map((x, i) => (
        <group key={i}>
          <mesh position={[x, 3.5, -1.0]} castShadow>
            <cylinderGeometry args={[1.1, 1.5, 7.0, 14]} />
            <meshStandardMaterial color="#999890" roughness={0.88} />
          </mesh>
          {/* Steam glow at top */}
          <mesh position={[x, 7.2, -1.0]}>
            <sphereGeometry args={[0.6, 8, 6]} />
            <meshStandardMaterial color="#ddd" emissive="#aaa" emissiveIntensity={0.3} roughness={1} transparent opacity={0.5} />
          </mesh>
        </group>
      ))}
      {/* Chimney stack */}
      <mesh position={[-4.5, 7.5, 0]} castShadow>
        <cylinderGeometry args={[0.4, 0.5, 8.6, 10]} />
        <meshStandardMaterial color="#5a5250" roughness={0.9} />
      </mesh>
      {/* Transmission pylons hint */}
      <mesh position={[4.5, 1.5, 2.5]} castShadow>
        <boxGeometry args={[0.1, 3.0, 0.1]} />
        <meshStandardMaterial color="#888" roughness={0.8} metalness={0.4} />
      </mesh>
      <mesh position={[4.5, 3.0, 2.5]} castShadow>
        <boxGeometry args={[2.0, 0.1, 0.1]} />
        <meshStandardMaterial color="#888" roughness={0.8} metalness={0.4} />
      </mesh>
    </ProgressGroup>
  )
}
