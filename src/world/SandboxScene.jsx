'use client'

import { useRef, useState, useEffect, useCallback, useMemo } from 'react'
import * as THREE from 'three'
import { useFrame, useThree } from '@react-three/fiber'
import { OrbitControls, Grid } from '@react-three/drei'
import { useGameStore } from '@/store/useGameStore'
import FlyCamera from './FlyCamera'
import BuildingFactory, { BUILDING_SIZES } from '@/models/buildings/BuildingFactory'
import SandboxSoulsRenderer from './SandboxSoulsRenderer'

const PLANE_SIZE = 200

export default function SandboxScene() {
  const currentYear = useGameStore((s) => s.currentYear)
  const weather = useGameStore((s) => s.weather)
  const flyMode = useGameStore((s) => s.flyMode)
  const controlsRef = useRef()

  const fogColor = weather === 'storm' ? '#5a5a6a' : weather === 'snow' ? '#d8d8e4' : '#4a4a6a'

  return (
    <>
      {flyMode ? (
        <FlyCamera />
      ) : (
        <OrbitControls
          ref={controlsRef}
          makeDefault
          enableDamping
          dampingFactor={0.08}
          minDistance={5}
          maxDistance={300}
          maxPolarAngle={Math.PI / 2 - 0.02}
          target={[0, 0, 0]}
        />
      )}

      {/* Lighting */}
      <ambientLight intensity={0.9} color="#e0ddf0" />
      <directionalLight
        position={[40, 60, 30]}
        intensity={1.2}
        color="#fff5e0"
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-camera-left={-80}
        shadow-camera-right={80}
        shadow-camera-top={80}
        shadow-camera-bottom={-80}
      />
      <hemisphereLight args={['#b0b0d0', '#606060', 0.5]} />


      {/* Sky dome */}
      <mesh>
        <sphereGeometry args={[400, 32, 16]} />
        <meshBasicMaterial color="#606080" side={THREE.BackSide} />
      </mesh>

      {/* Ground plane (visible) */}
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, -0.05, 0]}
        receiveShadow
      >
        <planeGeometry args={[PLANE_SIZE, PLANE_SIZE]} />
        <meshPhongMaterial color="#404040" shininess={2} />
      </mesh>

      {/* Invisible ground plane for drag raycasting */}
      <DragGround size={PLANE_SIZE} controlsRef={controlsRef} />

      {/* Grid overlay */}
      <Grid
        args={[PLANE_SIZE, PLANE_SIZE]}
        position={[0, 0.01, 0]}
        cellSize={5}
        cellThickness={0.5}
        cellColor="#4a4a4a"
        sectionSize={20}
        sectionThickness={1}
        sectionColor="#5a5a5a"
        fadeDistance={200}
        fadeStrength={1}
        infiniteGrid={false}
      />

      {/* Axis markers at center */}
      <group position={[0, 0.02, 0]}>
        <mesh position={[5, 0.1, 0]}>
          <boxGeometry args={[10, 0.1, 0.1]} />
          <meshBasicMaterial color="#ff4444" />
        </mesh>
        <mesh position={[0, 0.1, 5]}>
          <boxGeometry args={[0.1, 0.1, 10]} />
          <meshBasicMaterial color="#4444ff" />
        </mesh>
        <mesh position={[0, 2.5, 0]}>
          <boxGeometry args={[0.1, 5, 0.1]} />
          <meshBasicMaterial color="#44ff44" />
        </mesh>
      </group>

      <EdgeWalls size={PLANE_SIZE} />

      {/* Sandbox souls (with forced animation support + drag) */}
      <SandboxSoulsRenderer worldYear={currentYear} controlsRef={controlsRef} />

      {/* Draggable buildings */}
      <SandboxBuildings controlsRef={controlsRef} />

      {/* Sandbox trees & rocks */}
      <SandboxNature />
    </>
  )
}

// ─── Drag ground: invisible plane that handles pointer-move during drag ──────
function DragGround({ size, controlsRef }) {
  const meshRef = useRef()
  const dragBuildingId = useGameStore((s) => s.sandboxDragBuildingId)
  const dragSoulId = useGameStore((s) => s.sandboxDragSoulId)
  const isDragging = dragBuildingId || dragSoulId

  const onPointerMove = useCallback((e) => {
    if (!isDragging) return
    e.stopPropagation()
    const point = e.point
    const half = size / 2 - 2
    const x = Math.max(-half, Math.min(half, point.x))
    const z = Math.max(-half, Math.min(half, point.z))
    if (dragBuildingId) {
      useGameStore.setState((s) => ({
        buildings: s.buildings.map((b) =>
          b.id === dragBuildingId ? { ...b, position: [x, 0, z] } : b
        ),
      }))
    } else if (dragSoulId) {
      useGameStore.setState((s) => ({
        souls: s.souls.map((soul) =>
          soul.id === dragSoulId ? { ...soul, position: { x, z } } : soul
        ),
      }))
    }
  }, [isDragging, dragBuildingId, dragSoulId, size])

  const onPointerDown = useCallback((e) => {
    if (!isDragging) return
    e.stopPropagation()
    useGameStore.setState({ sandboxDragBuildingId: null, sandboxDragSoulId: null })
    if (controlsRef.current) controlsRef.current.enabled = true
  }, [isDragging, controlsRef])

  return (
    <mesh
      ref={meshRef}
      rotation={[-Math.PI / 2, 0, 0]}
      position={[0, 0.02, 0]}
      onPointerMove={isDragging ? onPointerMove : undefined}
      onPointerDown={isDragging ? onPointerDown : undefined}
      visible={false}
    >
      <planeGeometry args={[size, size]} />
      <meshBasicMaterial transparent opacity={0} />
    </mesh>
  )
}

// ─── Sandbox buildings with click-to-drag ────────────────────────────────────
function SandboxBuildings({ controlsRef }) {
  const buildings = useGameStore((s) => s.buildings)
  const dragId = useGameStore((s) => s.sandboxDragBuildingId)

  const startDrag = useCallback((buildingId, e) => {
    e.stopPropagation()
    if (dragId === buildingId) {
      // Already dragging — drop it
      useGameStore.setState({ sandboxDragBuildingId: null })
      if (controlsRef.current) controlsRef.current.enabled = true
    } else {
      // Start dragging
      useGameStore.setState({ sandboxDragBuildingId: buildingId })
      if (controlsRef.current) controlsRef.current.enabled = false
    }
  }, [dragId, controlsRef])

  return (
    <group>
      {buildings.map((building) => {
        const pos = building.position || [0, 0, 0]
        const progress = building.progress ?? 1
        const isDragging = dragId === building.id
        const rawSize = BUILDING_SIZES[building.type] || { width: 2, depth: 2, height: 3 }
        const s = 2 // matches BuildingFactory default scale
        const size = { width: rawSize.width * s, depth: rawSize.depth * s, height: rawSize.height * s }

        return (
          <group key={building.id}>
            <group
              position={pos}
              onClick={(e) => startDrag(building.id, e)}
            >
              {/* Invisible hitbox for easier clicking */}
              <mesh position={[0, size.height * 0.5, 0]} visible={false}>
                <boxGeometry args={[size.width + 1, size.height + 1, size.depth + 1]} />
                <meshBasicMaterial />
              </mesh>
            </group>

            <BuildingFactory
              type={building.type}
              position={pos}
              progress={progress}
            />

            {/* Drag indicator */}
            {isDragging && (
              <mesh position={[pos[0], 0.1, pos[2]]} rotation={[-Math.PI / 2, 0, 0]}>
                <ringGeometry args={[
                  Math.max(size.width, size.depth) * 0.6,
                  Math.max(size.width, size.depth) * 0.7,
                  32,
                ]} />
                <meshBasicMaterial color="#4fc3f7" transparent opacity={0.6} side={THREE.DoubleSide} />
              </mesh>
            )}

            {/* Construction scaffolding for in-progress buildings */}
            {progress < 1 && (
              <mesh position={[pos[0], pos[1] + size.height * 0.5, pos[2]]}>
                <boxGeometry args={[size.width + 0.4, size.height + 0.5, size.depth + 0.4]} />
                <meshBasicMaterial color="#a08040" wireframe transparent opacity={0.25} />
              </mesh>
            )}
          </group>
        )
      })}
    </group>
  )
}

// ─── Sandbox nature (trees & rocks for mechanics testing) ────────────────────
function SandboxNature() {
  const trees = useGameStore((s) => s.sandboxTrees)
  const rocks = useGameStore((s) => s.sandboxRocks)

  return (
    <group>
      {trees.map((tree) => (
        <SandboxTree key={tree.id} tree={tree} />
      ))}
      {rocks.map((rock) => (
        <SandboxRock key={rock.id} rock={rock} />
      ))}
    </group>
  )
}

function SandboxTree({ tree }) {
  const groupRef = useRef()
  const [destroying, setDestroying] = useState(false)
  const destroyT = useRef(0)
  const prevHealth = useRef(tree.health)

  // Detect health reaching 0 — start destruction
  useEffect(() => {
    if (prevHealth.current > 0 && tree.health <= 0 && !destroying) {
      setDestroying(true)
    }
    prevHealth.current = tree.health
  }, [tree.health, destroying])

  // Destruction animation: tilt over + shrink, then remove
  useFrame((_, delta) => {
    if (!destroying || !groupRef.current) return
    destroyT.current += delta
    const t = destroyT.current
    const g = groupRef.current

    // Shake then fall over
    g.rotation.z = Math.sin(t * 25) * 0.2 * Math.max(0, 1 - t * 1.5)
    g.rotation.x = Math.min(Math.PI / 2, t * 2.2)
    // Shrink
    const s = Math.max(0.01, 1 - t * 0.9)
    g.scale.set(s, s, s)

    if (t > 1.1) {
      useGameStore.setState((state) => ({
        sandboxTrees: state.sandboxTrees.filter((tr) => tr.id !== tree.id),
      }))
    }
  })

  const healthPct = tree.health / 100
  const scale = 0.5 + healthPct * 0.5

  return (
    <group ref={groupRef} position={tree.position}>
      {/* Trunk */}
      <mesh position={[0, 1.2 * scale, 0]} castShadow>
        <cylinderGeometry args={[0.15, 0.25, 2.4 * scale, 6]} />
        <meshLambertMaterial color="#5a3a1a" />
      </mesh>
      {/* Canopy */}
      <mesh position={[0, 2.8 * scale, 0]} castShadow>
        <sphereGeometry args={[1.2 * scale, 8, 6]} />
        <meshLambertMaterial color={tree.health > 0 ? '#2a6a1a' : '#4a3a1a'} />
      </mesh>
      {/* Health bar */}
      {tree.health < 100 && tree.health > 0 && (
        <group position={[0, 4.2 * scale, 0]}>
          <mesh>
            <boxGeometry args={[1.2, 0.12, 0.05]} />
            <meshBasicMaterial color="#333" />
          </mesh>
          <mesh position={[(healthPct - 1) * 0.6, 0, 0.01]}>
            <boxGeometry args={[1.2 * healthPct, 0.1, 0.05]} />
            <meshBasicMaterial color={healthPct > 0.5 ? '#4CAF50' : healthPct > 0.25 ? '#FF9800' : '#f44336'} />
          </mesh>
        </group>
      )}
    </group>
  )
}

function SandboxRock({ rock }) {
  const groupRef = useRef()
  const [destroying, setDestroying] = useState(false)
  const destroyT = useRef(0)
  const prevHealth = useRef(rock.health)

  // Detect health reaching 0 — start destruction
  useEffect(() => {
    if (prevHealth.current > 0 && rock.health <= 0 && !destroying) {
      setDestroying(true)
    }
    prevHealth.current = rock.health
  }, [rock.health, destroying])

  // Destruction animation: shake + crumble + vanish
  useFrame((_, delta) => {
    if (!destroying || !groupRef.current) return
    destroyT.current += delta
    const t = destroyT.current
    const g = groupRef.current

    // Violent shake
    g.rotation.z = Math.sin(t * 30) * 0.25 * Math.max(0, 1 - t * 1.5)
    g.rotation.x = Math.sin(t * 22) * 0.2 * Math.max(0, 1 - t * 1.5)
    // Sink into ground + shrink
    g.position.y = rock.position[1] - t * 0.6
    const s = Math.max(0.01, 1 - t * 1.1)
    g.scale.set(s, s, s)

    if (t > 0.9) {
      useGameStore.setState((state) => ({
        sandboxRocks: state.sandboxRocks.filter((r) => r.id !== rock.id),
      }))
    }
  })

  const healthPct = rock.health / 100
  const scale = 0.6 + healthPct * 0.4
  const color = rock.type === 'ore' ? '#7a6a3a' : '#6a6a6a'
  const sparkle = rock.type === 'ore' ? '#b8960a' : '#888'

  return (
    <group ref={groupRef} position={rock.position}>
      {/* Main rock */}
      <mesh position={[0, 0.5 * scale, 0]} castShadow>
        <dodecahedronGeometry args={[0.8 * scale, 0]} />
        <meshLambertMaterial color={rock.health > 0 ? color : '#3a3a3a'} />
      </mesh>
      {/* Ore sparkles */}
      {rock.type === 'ore' && rock.health > 0 && (
        <>
          <mesh position={[0.3, 0.6 * scale, 0.2]}>
            <boxGeometry args={[0.15, 0.15, 0.15]} />
            <meshLambertMaterial color={sparkle} emissive={sparkle} emissiveIntensity={0.3} />
          </mesh>
          <mesh position={[-0.2, 0.4 * scale, -0.1]}>
            <boxGeometry args={[0.1, 0.1, 0.1]} />
            <meshLambertMaterial color={sparkle} emissive={sparkle} emissiveIntensity={0.3} />
          </mesh>
        </>
      )}
      {/* Health bar */}
      {rock.health < 100 && rock.health > 0 && (
        <group position={[0, 1.5 * scale, 0]}>
          <mesh>
            <boxGeometry args={[1.0, 0.12, 0.05]} />
            <meshBasicMaterial color="#333" />
          </mesh>
          <mesh position={[(healthPct - 1) * 0.5, 0, 0.01]}>
            <boxGeometry args={[1.0 * healthPct, 0.1, 0.05]} />
            <meshBasicMaterial color={healthPct > 0.5 ? '#4CAF50' : healthPct > 0.25 ? '#FF9800' : '#f44336'} />
          </mesh>
        </group>
      )}
    </group>
  )
}

function EdgeWalls({ size }) {
  const half = size / 2
  const wallHeight = 0.8
  const wallThickness = 0.15
  const wallColor = '#4a3a6a'

  const walls = [
    { pos: [0, wallHeight / 2, -half], scale: [size, wallHeight, wallThickness] },
    { pos: [0, wallHeight / 2, half], scale: [size, wallHeight, wallThickness] },
    { pos: [-half, wallHeight / 2, 0], scale: [wallThickness, wallHeight, size] },
    { pos: [half, wallHeight / 2, 0], scale: [wallThickness, wallHeight, size] },
  ]

  return (
    <group>
      {walls.map((w, i) => (
        <mesh key={i} position={w.pos}>
          <boxGeometry args={w.scale} />
          <meshPhongMaterial
            color={wallColor}
            transparent
            opacity={0.4}
            emissive={wallColor}
            emissiveIntensity={0.2}
          />
        </mesh>
      ))}
    </group>
  )
}
