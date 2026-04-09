'use client'

import { useRef, useState, useEffect, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import HumanModel from '@/models/humans/HumanModel'
import { useGameStore } from '@/store/useGameStore'
import { getSoulSchedule, getCurrentScheduleEntry, getGameHour, LOCATION_POSITIONS } from '@/engine/DailyRoutine'
import { getEraForYear } from '@/data/eras'
import { sampleHeight, sampleNormal, WATER_LEVEL, FLAT_RADIUS, TERRAIN_SIZE } from '@/world/Terrain'
import { generateHeightmap } from '@/world/Terrain'
import { relationshipManager } from '@/engine/SoulRelations'
import SoulDialogueBubble from './SoulDialogueBubble'
import HeartParticles from './HeartParticles'

const heightmap = generateHeightmap(1337)
const HALF_TERRAIN = TERRAIN_SIZE / 2 - 4  // stay inside terrain bounds

/**
 * Find a walkable position near (x, z).
 * Searches outward in a spiral if the target is underwater or too steep.
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

  // Spiral search for nearest safe ground
  for (let radius = 2; radius <= 20; radius += 2) {
    for (let angle = 0; angle < Math.PI * 2; angle += Math.PI / 4) {
      const tx = x + Math.cos(angle) * radius
      const tz = z + Math.sin(angle) * radius
      if (Math.abs(tx) > HALF_TERRAIN || Math.abs(tz) > HALF_TERRAIN) continue
      const ty = sampleHeight(heightmap, tx, tz)
      const tn = sampleNormal(heightmap, tx, tz)
      if (ty > WATER_LEVEL + 0.4 && tn.slope < 0.6) {
        return { x: tx, z: tz }
      }
    }
  }

  // Fallback: stay near origin (flat zone is always safe)
  return { x: x * 0.2, z: z * 0.2 }
}

// Activities during which lovers walk together
const SOCIAL_ACTIVITIES = ['social', 'family_time', 'leisure', 'eat', 'dine', 'evening_salon', 'commune']

export default function SoulEntity({ soul, worldYear }) {
  const groupRef = useRef()
  const initPos = findSafePosition(soul.position?.x || 0, soul.position?.z || 0)
  const [targetPos, setTargetPos] = useState(initPos)
  const [currentPos, setCurrentPos] = useState(initPos)
  const [currentAnim, setCurrentAnim] = useState('idle')
  const scheduleAnimRef = useRef('idle')
  const currentYRef = useRef(sampleHeight(heightmap, initPos.x, initPos.z))
  const selectedSoulId = useGameStore((s) => s.selectedSoulId)
  const selectSoul = useGameStore((s) => s.selectSoul)
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

  useFrame((state, delta) => {
    if (!groupRef.current || !soul.isAlive) return

    const g = groupRef.current

    // --- Smooth Y tracking (always runs) ---
    const groundY = sampleHeight(heightmap, currentPos.x, currentPos.z)
    const targetY = Math.max(groundY, WATER_LEVEL + 0.1)
    currentYRef.current += (targetY - currentYRef.current) * Math.min(1, 8 * delta)
    g.position.y = currentYRef.current

    // --- Terrain-normal tilt (lean into slopes) ---
    const normal = sampleNormal(heightmap, currentPos.x, currentPos.z)
    // Tilt forward/back (rotation.x) and sideways (rotation.z) based on terrain slope
    const tiltStrength = 0.35
    g.rotation.x += (-normal.z * tiltStrength * normal.slope - g.rotation.x) * Math.min(1, 6 * delta)
    g.rotation.z += (normal.x * tiltStrength * normal.slope - g.rotation.z) * Math.min(1, 6 * delta)

    // Combat override: face opponent and fight
    if (activeCombat) {
      const opponentId = activeCombat.soulA.id === soul.id
        ? activeCombat.soulB.id : activeCombat.soulA.id
      const opponent = allSouls.find((s) => s.id === opponentId)
      if (opponent?.position) {
        const ox = opponent.position.x || 0
        const oz = opponent.position.z || 0
        g.rotation.y = Math.atan2(ox - currentPos.x, oz - currentPos.z)
      }
      if (currentAnim !== 'fight') setCurrentAnim('fight')
      return
    }

    const dx = targetPos.x - currentPos.x
    const dz = targetPos.z - currentPos.z
    const dist = Math.sqrt(dx * dx + dz * dz)

    if (dist > 0.3) {
      // Base speed modulated by slope (slower uphill, slightly faster downhill)
      const slopeSpeed = Math.max(0.25, 1 - normal.slope * 1.5)
      const speed = 3.5 * slopeSpeed * delta
      const step = Math.min(speed, dist)

      let newX = currentPos.x + (dx / dist) * step
      let newZ = currentPos.z + (dz / dist) * step

      // Water avoidance: if next step is underwater, deflect sideways
      const nextY = sampleHeight(heightmap, newX, newZ)
      if (nextY < WATER_LEVEL + 0.3) {
        // Try deflecting 45deg left, then right
        const angle = Math.atan2(dz, dx)
        for (const deflect of [0.7, -0.7, 1.4, -1.4]) {
          const ax = currentPos.x + Math.cos(angle + deflect) * step
          const az = currentPos.z + Math.sin(angle + deflect) * step
          if (sampleHeight(heightmap, ax, az) > WATER_LEVEL + 0.3) {
            newX = ax
            newZ = az
            break
          }
        }
      }

      // Steep slope avoidance: slow down further or stop on cliffs
      const nextNormal = sampleNormal(heightmap, newX, newZ)
      if (nextNormal.slope > 0.7) {
        // Too steep — don't move there
        if (currentAnim !== 'idle') setCurrentAnim('idle')
        return
      }

      setCurrentPos({ x: newX, z: newZ })
      g.position.x = newX
      g.position.z = newZ
      g.rotation.y = Math.atan2(dx, dz)

      if (currentAnim !== 'walk') setCurrentAnim('walk')
    } else {
      // Stationary — face conversation partner if in dialogue
      if (activeConvo) {
        const otherId = activeConvo.soulA.id === soul.id
          ? activeConvo.soulB.id : activeConvo.soulA.id
        const other = allSouls.find((s) => s.id === otherId)
        if (other?.position) {
          const ox = other.position.x || 0
          const oz = other.position.z || 0
          g.rotation.y = Math.atan2(ox - currentPos.x, oz - currentPos.z)
        }
      }

      if (currentAnim === 'walk') setCurrentAnim(scheduleAnimRef.current || 'idle')
    }
  })

  // Update schedule-based target position
  useEffect(() => {
    if (!soul.isAlive) return

    const schedule = getSoulSchedule(soul, era)
    const hourFraction = (worldYear % 1)
    const hour = getGameHour(hourFraction)
    const entry = getCurrentScheduleEntry(schedule, hour)

    if (entry) {
      // Celebrate override (wedding etc.)
      if (soul.currentActivity === 'celebrating') {
        scheduleAnimRef.current = 'celebrate'
        setCurrentAnim('celebrate')
      } else {
        const anim = entry.animation || 'idle'
        scheduleAnimRef.current = anim
        setCurrentAnim(anim)
      }

      // If builder is scheduled to construction, use actual site position
      let loc = LOCATION_POSITIONS[entry.location] || LOCATION_POSITIONS.home
      const mySite = entry.location === 'construction'
        ? constructionSites.find((s) => s.builder === soul.id)
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

      // Lovers walk together during social activities
      if (SOCIAL_ACTIVITIES.includes(entry.activity)) {
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

      const safe = findSafePosition(raw.x, raw.z)
      setTargetPos(safe)
    }
  }, [Math.floor(worldYear * 10)])

  if (!soul.isAlive) return null

  const groundY = sampleHeight(heightmap, currentPos.x, currentPos.z)
  const startY = Math.max(groundY, WATER_LEVEL + 0.1)

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
        onClick={() => selectSoul(soul.id)}
      />

      {/* 3D dialogue bubble */}
      <SoulDialogueBubble soulId={soul.id} soulName={soul.llmName} aura={soul.aura} />

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
