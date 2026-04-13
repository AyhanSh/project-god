'use client'

import { useRef, useState, useEffect, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import HumanModel from '@/models/humans/HumanModel'
import { useGameStore } from '@/store/useGameStore'
import { getGameHour, LOCATION_POSITIONS } from '@/engine/DailyRoutine'
import { findNearestNode, markNodeActive, markNodeInactive } from '@/engine/ResourceNodeRegistry'
import { getEraForYear } from '@/data/eras'
import { sampleHeight, sampleNormal, WATER_LEVEL, FLAT_RADIUS, TERRAIN_SIZE } from '@/world/Terrain'
import { generateHeightmap } from '@/world/Terrain'
import { relationshipManager } from '@/engine/SoulRelations'
import { setSoulPosition, getSoulPosition } from '@/engine/SoulPositionRegistry'
import { GOD_POWERS } from '@/data/godPowers'
import SoulDialogueBubble from './SoulDialogueBubble'
import HeartParticles from './HeartParticles'

const heightmap = generateHeightmap(1337)
const HALF_TERRAIN = TERRAIN_SIZE / 2 - 4  // stay inside terrain bounds

/**
 * Find a walkable position near (x, z).
 * Searches outward in a growing spiral if the target is underwater or too steep.
 */
function findSafePosition(x, z) {
  // Clamp to terrain bounds
  x = Math.max(-HALF_TERRAIN, Math.min(HALF_TERRAIN, x))
  z = Math.max(-HALF_TERRAIN, Math.min(HALF_TERRAIN, z))

  const y = sampleHeight(heightmap, x, z)
  const normal = sampleNormal(heightmap, x, z)

  // Already on walkable land
  if (y > WATER_LEVEL + 0.4 && normal.slope < 0.6) {
    return { x, z }
  }

  // Spiral search — covers up to 80 units out with 12 directions per ring
  for (let radius = 3; radius <= 80; radius += 3) {
    for (let i = 0; i < 12; i++) {
      const angle = (i / 12) * Math.PI * 2
      const tx = x + Math.cos(angle) * radius
      const tz = z + Math.sin(angle) * radius
      if (Math.abs(tx) > HALF_TERRAIN || Math.abs(tz) > HALF_TERRAIN) continue
      const ty = sampleHeight(heightmap, tx, tz)
      if (ty <= WATER_LEVEL + 0.4) continue
      const tn = sampleNormal(heightmap, tx, tz)
      if (tn.slope < 0.6) {
        return { x: tx, z: tz }
      }
    }
  }

  // Fallback: flat zone is always safe
  return { x: 0, z: 0 }
}

// Activities during which lovers walk together
const SOCIAL_ACTIVITIES = ['social', 'family_time', 'leisure', 'eat', 'dine', 'evening_salon', 'commune']

// Activities that anchor souls to their work location (suppress roaming)
const WORK_ACTIVITIES = new Set([
  'work', 'chop_trees', 'mine_ore', 'build_structure', 'craft_tools',
  'gather_herbs', 'heal', 'training', 'patrol', 'open_stall', 'trade',
  'study', 'copy_texts', 'govern', 'process', 'interface', 'teach',
  'pray', 'meditate', 'morning_prayer', 'dawn_prayer', 'evening_prayer',
  'matins', 'vespers', 'counsel', 'court', 'plan', 'count_goods',
  'council', 'digital_existence', 'ritual',
])

export default function SoulEntity({ soul, worldYear }) {
  const groupRef = useRef()
  const isSandbox = useGameStore((s) => s.gameMode) === 'sandbox'
  const initPos = isSandbox
    ? { x: soul.position?.x || 0, z: soul.position?.z || 0 }
    : findSafePosition(soul.position?.x || 0, soul.position?.z || 0)
  const [targetPos, setTargetPos] = useState(initPos)
  const [currentPos, setCurrentPos] = useState(initPos)
  const [currentAnim, setCurrentAnim] = useState('idle')
  const isTalkingRef = useRef(false)
  const [isTalking, setIsTalking] = useState(false)
  const scheduleAnimRef = useRef('idle')
  const currentActivityRef = useRef(null)
  const currentYRef = useRef(isSandbox ? 0 : sampleHeight(heightmap, initPos.x, initPos.z))
  const roamTimerRef = useRef(0)
  const scheduleTargetRef = useRef(initPos)  // where the schedule wants the soul
  const resourceTargetRef = useRef(null)     // {nodeType, nodeIndex, nodeX, nodeZ} when harvesting
  const prevBehaviorKeyRef = useRef(null)    // track activity:location to avoid jitter
  const selectedSoulId = useGameStore((s) => s.selectedSoulId)
  const selectSoul = useGameStore((s) => s.selectSoul)
  const godTargeting = useGameStore((s) => s.godTargeting)
  const godTargetingFirst = useGameStore((s) => s.godTargetingFirst)
  const constructionSites = useGameStore((s) => s.constructionSites)
  const activeConversations = useGameStore((s) => s.activeConversations)
  const activeCombats = useGameStore((s) => s.activeCombats)
  const allSouls = useGameStore((s) => s.souls)

  const era = getEraForYear(worldYear)
  const isSelected = selectedSoulId === soul.id

  // Check if this soul is in an active conversation
  const activeConvo = useMemo(() =>
    activeConversations.find((c) => c.soulA.id === soul.id || c.soulB.id === soul.id),
    [activeConversations, soul.id]
  )

  // Check if this soul is in active combat
  const activeCombat = useMemo(() =>
    activeCombats.find((c) => c.soulA.id === soul.id || c.soulB.id === soul.id),
    [activeCombats, soul.id]
  )

  // Check if soul has a lover/spouse nearby for heart particles
  const hasLoveNearby = useMemo(() => {
    const rels = relationshipManager.getAllForSoul(soul.id)
    for (const rel of rels) {
      if (rel.type !== 'lover' && rel.type !== 'spouse') continue
      if (rel.affection <= 50) continue
      const partnerId = rel.souls.find((id) => id !== soul.id)
      const partner = allSouls.find((s) => s.id === partnerId && s.isAlive)
      if (!partner) continue
      // Check rough proximity (same area)
      const px = partner.position?.x || 0
      const pz = partner.position?.z || 0
      const dx = px - currentPos.x
      const dz = pz - currentPos.z
      if (Math.sqrt(dx * dx + dz * dz) < 8) return true
    }
    return false
  }, [soul.id, allSouls, currentPos.x, currentPos.z])

  // Reset talking state when conversation ends
  useEffect(() => {
    if (!activeConvo && isTalkingRef.current) {
      isTalkingRef.current = false
      setIsTalking(false)
    }
  }, [activeConvo])

  // Clean up resource target on unmount
  useEffect(() => {
    return () => {
      const rt = resourceTargetRef.current
      if (rt) markNodeInactive(rt.nodeType, rt.nodeIndex)
    }
  }, [])

  useFrame((state, delta) => {
    if (!groupRef.current || !soul.isAlive) return

    const g = groupRef.current

    // Publish live position for other souls to read
    setSoulPosition(soul.id, currentPos.x, currentPos.z)

    // --- Smooth Y tracking (always runs) ---
    const groundY = isSandbox ? 0 : sampleHeight(heightmap, currentPos.x, currentPos.z)
    const inWater = !isSandbox && groundY < WATER_LEVEL + 0.3
    // In water: float at surface. On land: follow ground.
    const targetY = isSandbox ? 0 : (inWater ? WATER_LEVEL : Math.max(groundY, WATER_LEVEL + 0.1))
    currentYRef.current += (targetY - currentYRef.current) * Math.min(1, 8 * delta)
    g.position.y = currentYRef.current

    // --- Terrain-normal tilt (lean into slopes) ---
    const normal = isSandbox ? { x: 0, z: 0, slope: 0 } : sampleNormal(heightmap, currentPos.x, currentPos.z)
    const tiltStrength = inWater ? 0.05 : 0.35
    g.rotation.x += (-normal.z * tiltStrength * normal.slope - g.rotation.x) * Math.min(1, 6 * delta)
    g.rotation.z += (normal.x * tiltStrength * normal.slope - g.rotation.z) * Math.min(1, 6 * delta)

    // Combat override: face opponent and fight
    if (activeCombat) {
      const opponentId = activeCombat.soulA.id === soul.id
        ? activeCombat.soulB.id : activeCombat.soulA.id
      const opponentPos = getSoulPosition(opponentId)
      if (opponentPos) {
        g.rotation.y = Math.atan2(opponentPos.x - currentPos.x, opponentPos.z - currentPos.z)
      }
      if (currentAnim !== 'fight') setCurrentAnim('fight')
      return
    }

    // Conversation: approach partner, face each other, then talk
    if (activeConvo) {
      const otherId = activeConvo.soulA.id === soul.id
        ? activeConvo.soulB.id : activeConvo.soulA.id
      const otherPos = getSoulPosition(otherId)

      if (otherPos) {
        const cdx = otherPos.x - currentPos.x
        const cdz = otherPos.z - currentPos.z
        const cdist = Math.sqrt(cdx * cdx + cdz * cdz)

        // Always face the other soul
        g.rotation.y = Math.atan2(cdx, cdz)

        // If too far apart, walk toward each other
        if (cdist > 2.5) {
          const speed = 12 * delta
          const step = Math.min(speed, cdist - 2.0)
          if (step > 0.05) {
            const newX = currentPos.x + (cdx / cdist) * step
            const newZ = currentPos.z + (cdz / cdist) * step
            setCurrentPos({ x: newX, z: newZ })
            g.position.x = newX
            g.position.z = newZ
          }
          if (currentAnim !== 'walk') setCurrentAnim('walk')
          if (isTalkingRef.current) {
            isTalkingRef.current = false
            setIsTalking(false)
          }
          return
        }

        // Close enough — stand and talk face-to-face
        if (!isTalkingRef.current) {
          isTalkingRef.current = true
          setIsTalking(true)
        }
        if (currentAnim !== 'talk') setCurrentAnim('talk')
      } else {
        // No live position data — just talk in place
        if (!isTalkingRef.current) {
          isTalkingRef.current = true
          setIsTalking(true)
        }
        if (currentAnim !== 'talk') setCurrentAnim('talk')
      }
      return
    }

    const dx = targetPos.x - currentPos.x
    const dz = targetPos.z - currentPos.z
    const dist = Math.sqrt(dx * dx + dz * dz)

    if (dist > 0.3) {
      // Speed: slope-modulated, slower in water
      const slopeSpeed = Math.max(0.25, 1 - normal.slope * 1.5)
      const waterSpeed = inWater ? 0.4 : 1.0
      const speed = 14.4 * slopeSpeed * waterSpeed * delta
      const step = Math.min(speed, dist)

      let newX = currentPos.x + (dx / dist) * step
      let newZ = currentPos.z + (dz / dist) * step

      // Steep slope avoidance
      if (!isSandbox) {
        const nextNormal = sampleNormal(heightmap, newX, newZ)
        if (nextNormal.slope > 0.7) {
          if (currentAnim !== 'idle') setCurrentAnim('idle')
          return
        }
      }

      setCurrentPos({ x: newX, z: newZ })
      g.position.x = newX
      g.position.z = newZ
      g.rotation.y = Math.atan2(dx, dz)

      // Pick animation based on terrain
      if (!isSandbox) {
        const nextGroundY = sampleHeight(heightmap, newX, newZ)
        if (nextGroundY < WATER_LEVEL + 0.3) {
          if (currentAnim !== 'swim') setCurrentAnim('swim')
        } else {
          if (currentAnim !== 'walk') setCurrentAnim('walk')
        }
      } else {
        if (currentAnim !== 'walk') setCurrentAnim('walk')
      }
    } else {
      // Reached destination — use schedule animation (or swim if standing in water)
      const desiredAnim = inWater ? 'swim' : (scheduleAnimRef.current || 'idle')
      if (currentAnim !== desiredAnim) {
        setCurrentAnim(desiredAnim)
      }

      // Face the resource node while harvesting
      const rt = resourceTargetRef.current
      if (rt) {
        const rdx = rt.nodeX - currentPos.x
        const rdz = rt.nodeZ - currentPos.z
        if (rdx * rdx + rdz * rdz > 0.01) {
          g.rotation.y = Math.atan2(rdx, rdz)
        }
      }
    }
  })

  // Update behavior-driven target position (reads from soul.currentActivity set by WorldEngine)
  useEffect(() => {
    if (!soul.isAlive) return

    const activity = soul.currentActivity || 'rest'
    const location = soul.currentLocation || 'home'
    const anim = soul.currentAnimation || 'idle'

    currentActivityRef.current = activity

    // Store scheduled animation — useFrame will apply it when soul arrives at destination
    if (activity === 'celebrating') {
      scheduleAnimRef.current = 'celebrate'
      setCurrentAnim('celebrate')  // celebrations are immediate
    } else {
      scheduleAnimRef.current = anim
      // Don't call setCurrentAnim here — let useFrame transition when soul arrives
    }

    // Only recompute movement target when activity or location actually changes
    const behaviorKey = `${activity}:${location}`
    if (prevBehaviorKeyRef.current === behaviorKey) return
    prevBehaviorKeyRef.current = behaviorKey

    // Clean up previous resource target
    const prevRT = resourceTargetRef.current
    if (prevRT) {
      markNodeInactive(prevRT.nodeType, prevRT.nodeIndex)
      resourceTargetRef.current = null
    }

    // Resolve target position from location
    let loc = LOCATION_POSITIONS[location] || LOCATION_POSITIONS.home

    // Construction: go to the actual building site
    const mySite = activity === 'build_structure'
      ? constructionSites.find((s) => s.builder === soul.id) || constructionSites[0]
      : null
    if (mySite) {
      loc = { x: mySite.position.x, z: mySite.position.z, range: 1.5 }
    }

    const soulHash = soul.id.charCodeAt(soul.id.length - 1) || 0
    const offsetX = ((soulHash * 7) % 6) - 3
    const offsetZ = ((soulHash * 13) % 6) - 3

    let raw = {
      x: loc.x + offsetX + (Math.random() - 0.5) * loc.range * 2,
      z: loc.z + offsetZ + (Math.random() - 0.5) * loc.range * 2,
    }

    // Resource interaction: target an actual tree or rock
    if (activity === 'chop_trees') {
      const node = findNearestNode('tree', raw.x, raw.z)
      if (node) {
        const angle = Math.atan2(raw.z - node.z, raw.x - node.x)
        raw = { x: node.x + Math.cos(angle) * 1.8, z: node.z + Math.sin(angle) * 1.8 }
        resourceTargetRef.current = { nodeType: 'tree', nodeIndex: node.index, nodeX: node.x, nodeZ: node.z }
        markNodeActive('tree', node.index)
      }
    } else if (activity === 'mine_ore') {
      const node = findNearestNode('rock', raw.x, raw.z)
      if (node) {
        const angle = Math.atan2(raw.z - node.z, raw.x - node.x)
        raw = { x: node.x + Math.cos(angle) * 1.5, z: node.z + Math.sin(angle) * 1.5 }
        resourceTargetRef.current = { nodeType: 'rock', nodeIndex: node.index, nodeX: node.x, nodeZ: node.z }
        markNodeActive('rock', node.index)
      }
    }

    // Lovers walk together during social activities
    if (SOCIAL_ACTIVITIES.includes(activity)) {
      const rels = relationshipManager.getAllForSoul(soul.id)
      for (const rel of rels) {
        if (rel.type !== 'lover' && rel.type !== 'spouse') continue
        const partnerId = rel.souls.find((id) => id !== soul.id)
        const partner = allSouls.find((s) => s.id === partnerId && s.isAlive)
        if (partner?.position) {
          raw = {
            x: (partner.position.x || 0) + ((soulHash % 2 === 0) ? 0.8 : -0.8),
            z: (partner.position.z || 0) + ((soulHash % 3 === 0) ? 0.6 : -0.6),
          }
          break
        }
      }
    }

    const safe = isSandbox ? raw : findSafePosition(raw.x, raw.z)
    scheduleTargetRef.current = safe
    setTargetPos(safe)
    roamTimerRef.current = 0
  }, [Math.floor(worldYear * 10)])

  // Free roaming — characters wander and explore the world between schedule updates
  useEffect(() => {
    if (!soul.isAlive) return
    if (activeCombat || activeConvo) return

    const interval = setInterval(() => {
      roamTimerRef.current++

      const activity = currentActivityRef.current

      // During work activities: stay anchored
      if (activity && WORK_ACTIVITIES.has(activity)) {
        // If targeting a resource node, don't move at all — stay and work
        if (resourceTargetRef.current) return

        // Otherwise tiny shuffle (0.5 units) to look alive
        const base = scheduleTargetRef.current
        const microAngle = Math.random() * Math.PI * 2
        const microDist = Math.random() * 0.5
        const raw = {
          x: base.x + Math.cos(microAngle) * microDist,
          z: base.z + Math.sin(microAngle) * microDist,
        }
        const safe = isSandbox ? raw : findSafePosition(raw.x, raw.z)
        setTargetPos(safe)
        return
      }

      // Non-work activities: explore and wander (tighter radius)
      const roll = Math.random()

      if (roll < 0.2) {
        // 20% chance: medium exploration — wander within 40 units of center
        const angle = Math.random() * Math.PI * 2
        const dist = isSandbox ? 10 + Math.random() * 30 : 20 + Math.random() * 40
        const raw = {
          x: Math.cos(angle) * dist,
          z: Math.sin(angle) * dist,
        }
        const safe = isSandbox ? raw : findSafePosition(raw.x, raw.z)
        setTargetPos(safe)
      } else if (roll < 0.6) {
        // 40% chance: wander near schedule location (8-20 units)
        const base = scheduleTargetRef.current
        const wanderRadius = isSandbox ? 5 + Math.random() * 15 : 8 + Math.random() * 12
        const angle = Math.random() * Math.PI * 2
        const raw = {
          x: base.x + Math.cos(angle) * wanderRadius,
          z: base.z + Math.sin(angle) * wanderRadius,
        }
        const safe = isSandbox ? raw : findSafePosition(raw.x, raw.z)
        setTargetPos(safe)
      }
      // 40% chance: stay put (do nothing)
    }, 5000 + Math.random() * 5000)

    return () => clearInterval(interval)
  }, [soul.isAlive, activeCombat, activeConvo])

  if (!soul.isAlive) return null

  const finalGroundY = isSandbox ? 0 : sampleHeight(heightmap, currentPos.x, currentPos.z)
  const startY = isSandbox ? 0 : Math.max(finalGroundY, WATER_LEVEL + 0.1)

  return (
    <group ref={groupRef} position={[currentPos.x, startY, currentPos.z]}>
      <HumanModel
        position={[0, 0, 0]}
        era={era.id}
        aura={soul.aura}
        animation={currentAnim}
        selected={isSelected}
        age={soul.age}
        soulId={soul.id}
        skinTone={soul.skinTone}
        onClick={() => {
          if (godTargeting) {
            // God power targeting mode
            import('@/engine/GodPowerEngine').then(({ godPowerEngine }) => {
              import('@/engine/WorldEngine').then(({ getWorldEngine }) => {
                const store = useGameStore
                const state = store.getState()
                const worldEngine = getWorldEngine(store)
                const power = godTargeting

                if (power.type === 'two_souls') {
                  if (!godTargetingFirst) {
                    // First soul selected
                    state.setGodTargetingFirst(soul.id)
                    return
                  }
                  // Second soul selected
                  const result = godPowerEngine.invoke(power.powerId, {
                    targetSoulId: godTargetingFirst,
                    secondTargetSoulId: soul.id,
                  }, worldEngine, store)
                  if (result.success) {
                    const powerData = GOD_POWERS.find((p) => p.id === power.powerId)
                    state.spendGodFavor(powerData?.cost || 0)
                  }
                  state.clearGodTargeting()
                  return
                }

                // Single soul target
                const result = godPowerEngine.invoke(power.powerId, {
                  targetSoulId: soul.id,
                  text: power.text || '',
                }, worldEngine, store)
                if (result.success) {
                  const powerData = GOD_POWERS.find((p) => p.id === power.powerId)
                  state.spendGodFavor(powerData?.cost || 0)
                }
                state.clearGodTargeting()
              })
            })
          } else {
            selectSoul(soul.id)
          }
        }}
      />

      {/* 3D dialogue bubble */}
      <SoulDialogueBubble soulId={soul.id} soulName={soul.llmName} aura={soul.aura} visible={isTalking} />

      {/* Heart particles for lovers nearby */}
      {hasLoveNearby && <HeartParticles />}

      {isSelected && (
        <sprite position={[0, 2.2, 0]} scale={[2, 0.3, 1]}>
          <spriteMaterial transparent opacity={0.8} color={soul.aura} />
        </sprite>
      )}
    </group>
  )
}
