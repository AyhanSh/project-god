'use client'

import { useRef, useState, useEffect, useCallback, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import { useGameStore } from '@/store/useGameStore'
import HumanModel from '@/models/humans/HumanModel'
import { getEraForYear } from '@/data/eras'

export default function SandboxSoulsRenderer({ worldYear, controlsRef }) {
  const souls = useGameStore((s) => s.souls)
  const forceAnim = useGameStore((s) => s.sandboxForceAnimation)

  return (
    <group>
      {souls
        .filter((soul) => soul.isAlive)
        .map((soul) => (
          <SandboxSoulEntity
            key={soul.id}
            soul={soul}
            worldYear={worldYear}
            forceAnimation={forceAnim}
            controlsRef={controlsRef}
          />
        ))}
    </group>
  )
}

function SandboxSoulEntity({ soul, worldYear, forceAnimation, controlsRef }) {
  const groupRef = useRef()
  const [currentPos, setCurrentPos] = useState({
    x: soul.position?.x || 0,
    z: soul.position?.z || 0,
  })
  const [targetPos, setTargetPos] = useState(currentPos)
  const [naturalAnim, setNaturalAnim] = useState(soul.currentAction || 'idle')
  const [isHarvesting, setIsHarvesting] = useState(false)
  const harvestTickRef = useRef(null)
  const selectedSoulId = useGameStore((s) => s.selectedSoulId)
  const selectSoul = useGameStore((s) => s.selectSoul)
  const dragSoulId = useGameStore((s) => s.sandboxDragSoulId)
  const harvestTasks = useGameStore((s) => s.sandboxHarvestTasks)
  const trees = useGameStore((s) => s.sandboxTrees)
  const rocks = useGameStore((s) => s.sandboxRocks)

  const era = getEraForYear(worldYear)
  const isSelected = selectedSoulId === soul.id
  const isDragging = dragSoulId === soul.id

  // Find this soul's harvest task
  const myTask = useMemo(
    () => harvestTasks.find((t) => t.soulId === soul.id) || null,
    [harvestTasks, soul.id],
  )

  // Get harvest target position
  const harvestTarget = useMemo(() => {
    if (!myTask) return null
    if (myTask.targetType === 'tree') {
      const tree = trees.find((t) => t.id === myTask.targetId)
      if (!tree || tree.health <= 0) return null
      return { x: tree.position[0], z: tree.position[2] }
    }
    const rock = rocks.find((r) => r.id === myTask.targetId)
    if (!rock || rock.health <= 0) return null
    return { x: rock.position[0], z: rock.position[2] }
  }, [myTask, trees, rocks])

  // Determine animation: harvest overrides natural, forceAnimation overrides all
  const harvestAnim = isHarvesting
    ? (myTask?.targetType === 'tree' ? 'chop_tree' : 'mine')
    : null
  const animation = forceAnimation || harvestAnim || naturalAnim

  // Clear harvest state when task is removed or target is depleted
  useEffect(() => {
    if (!myTask || !harvestTarget) {
      if (isHarvesting) setIsHarvesting(false)
      // Auto-clean stale task
      if (myTask && !harvestTarget) {
        useGameStore.setState((s) => ({
          sandboxHarvestTasks: s.sandboxHarvestTasks.filter((t) => t.soulId !== soul.id),
        }))
      }
    }
  }, [myTask, harvestTarget, isHarvesting, soul.id])

  // Auto-damage while harvesting
  useEffect(() => {
    if (!isHarvesting || !myTask) {
      if (harvestTickRef.current) { clearInterval(harvestTickRef.current); harvestTickRef.current = null }
      return
    }
    harvestTickRef.current = setInterval(() => {
      const state = useGameStore.getState()
      if (myTask.targetType === 'tree') {
        const tree = state.sandboxTrees.find((t) => t.id === myTask.targetId)
        if (!tree || tree.health <= 0) {
          useGameStore.setState((s) => ({
            sandboxHarvestTasks: s.sandboxHarvestTasks.filter((t) => t.targetId !== myTask.targetId),
          }))
          setIsHarvesting(false)
          return
        }
        const newHealth = Math.max(0, tree.health - 10)
        useGameStore.setState((s) => ({
          sandboxTrees: s.sandboxTrees.map((t) =>
            t.id === myTask.targetId ? { ...t, health: newHealth } : t
          ),
          wood: s.wood + 3,
        }))
        if (newHealth <= 0) {
          state.addEventLog({
            year: Math.round(state.currentYear),
            text: `[SANDBOX] Tree felled! (+20 wood)`,
            type: 'economy',
          })
          useGameStore.setState((s) => ({ wood: s.wood + 17 }))
        }
      } else {
        const rock = state.sandboxRocks.find((r) => r.id === myTask.targetId)
        if (!rock || rock.health <= 0) {
          useGameStore.setState((s) => ({
            sandboxHarvestTasks: s.sandboxHarvestTasks.filter((t) => t.targetId !== myTask.targetId),
          }))
          setIsHarvesting(false)
          return
        }
        const key = rock.type === 'ore' ? 'ore' : 'stone'
        const newHealth = Math.max(0, rock.health - 10)
        useGameStore.setState((s) => ({
          sandboxRocks: s.sandboxRocks.map((r) =>
            r.id === myTask.targetId ? { ...r, health: newHealth } : r
          ),
          [key]: s[key] + 3,
        }))
        if (newHealth <= 0) {
          state.addEventLog({
            year: Math.round(state.currentYear),
            text: `[SANDBOX] Rock destroyed! (+15 ${key})`,
            type: 'economy',
          })
          useGameStore.setState((s) => ({ [key]: s[key] + 12 }))
        }
      }
    }, 600)
    return () => { if (harvestTickRef.current) clearInterval(harvestTickRef.current) }
  }, [isHarvesting, myTask?.targetId, myTask?.targetType])

  // Sync position from store when being dragged
  useEffect(() => {
    if (isDragging) {
      const x = soul.position?.x || 0
      const z = soul.position?.z || 0
      setCurrentPos({ x, z })
      setTargetPos({ x, z })
    }
  }, [isDragging, soul.position?.x, soul.position?.z])

  const handleClick = useCallback((e) => {
    e.stopPropagation()
    if (dragSoulId === soul.id) {
      // Already dragging — drop
      useGameStore.setState({ sandboxDragSoulId: null })
      if (controlsRef?.current) controlsRef.current.enabled = true
    } else if (!dragSoulId) {
      // Start dragging
      useGameStore.setState({ sandboxDragSoulId: soul.id })
      if (controlsRef?.current) controlsRef.current.enabled = false
      selectSoul(soul.id)
    }
  }, [dragSoulId, soul.id, controlsRef, selectSoul])

  // Wander around the sandbox plane (suppressed during harvest)
  useEffect(() => {
    if (!soul.isAlive) return
    if (forceAnimation) return
    if (isDragging) return
    if (myTask) return

    const interval = setInterval(() => {
      const angle = Math.random() * Math.PI * 2
      const dist = 5 + Math.random() * 25
      setTargetPos({
        x: Math.max(-90, Math.min(90, currentPos.x + Math.cos(angle) * dist)),
        z: Math.max(-90, Math.min(90, currentPos.z + Math.sin(angle) * dist)),
      })
    }, 3000 + Math.random() * 4000)

    return () => clearInterval(interval)
  }, [soul.isAlive, forceAnimation, isDragging, myTask, currentPos.x, currentPos.z])

  useFrame((_, delta) => {
    if (!groupRef.current || !soul.isAlive) return

    const g = groupRef.current

    if (isDragging) {
      g.position.x = currentPos.x
      g.position.y = 0
      g.position.z = currentPos.z
      return
    }

    // Harvest task: walk to target, then chop/mine
    if (myTask && harvestTarget && !forceAnimation) {
      const hdx = harvestTarget.x - currentPos.x
      const hdz = harvestTarget.z - currentPos.z
      const hdist = Math.sqrt(hdx * hdx + hdz * hdz)

      // Always face the target
      g.rotation.y = Math.atan2(hdx, hdz)

      if (hdist > 2.0) {
        // Walk toward target
        const speed = 10 * delta
        const step = Math.min(speed, hdist - 1.5)
        if (step > 0.05) {
          const newX = currentPos.x + (hdx / hdist) * step
          const newZ = currentPos.z + (hdz / hdist) * step
          setCurrentPos({ x: newX, z: newZ })
          g.position.x = newX
          g.position.z = newZ
        }
        if (naturalAnim !== 'walk') setNaturalAnim('walk')
        if (isHarvesting) setIsHarvesting(false)
      } else {
        // Close enough — start harvesting
        if (!isHarvesting) setIsHarvesting(true)
      }
      g.position.y = 0
      return
    }

    if (forceAnimation) {
      g.position.x = currentPos.x
      g.position.y = 0
      g.position.z = currentPos.z
      return
    }

    const dx = targetPos.x - currentPos.x
    const dz = targetPos.z - currentPos.z
    const dist = Math.sqrt(dx * dx + dz * dz)

    if (dist > 0.5) {
      const speed = 10 * delta
      const step = Math.min(speed, dist)
      const newX = currentPos.x + (dx / dist) * step
      const newZ = currentPos.z + (dz / dist) * step
      setCurrentPos({ x: newX, z: newZ })
      g.position.x = newX
      g.position.z = newZ
      g.rotation.y = Math.atan2(dx, dz)
      if (naturalAnim !== 'walk') setNaturalAnim('walk')
    } else {
      if (naturalAnim !== 'idle') setNaturalAnim('idle')
    }

    g.position.y = 0
  })

  if (!soul.isAlive) return null

  return (
    <group ref={groupRef} position={[currentPos.x, 0, currentPos.z]}>
      {/* Invisible hitbox for easier clicking */}
      <mesh position={[0, 1, 0]} visible={false} onClick={handleClick}>
        <boxGeometry args={[1.5, 2.5, 1.5]} />
        <meshBasicMaterial />
      </mesh>

      <HumanModel
        position={[0, 0, 0]}
        era={era.id}
        aura={soul.aura}
        animation={animation}
        selected={isSelected}
        age={soul.age}
        soulId={soul.id}
        skinTone={soul.skinTone}
        onClick={handleClick}
      />

      {/* Drag indicator ring */}
      {isDragging && (
        <mesh position={[0, 0.1, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[1.0, 1.2, 32]} />
          <meshBasicMaterial color={soul.aura} transparent opacity={0.6} />
        </mesh>
      )}

      {isSelected && !isDragging && (
        <sprite position={[0, 2.2, 0]} scale={[2, 0.3, 1]}>
          <spriteMaterial transparent opacity={0.8} color={soul.aura} />
        </sprite>
      )}
    </group>
  )
}
