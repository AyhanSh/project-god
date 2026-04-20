'use client'

import { nanoid } from 'nanoid'
import { sampleHeight, WATER_LEVEL, FLAT_RADIUS } from '@/world/Terrain'
import { worldHeightmap } from './HeightmapRegistry'

/**
 * Campfire lifecycle:
 *   'building'  → soul is constructing (6 real seconds / 60 ticks at 10Hz)
 *   'lit'       → burning through the night
 *   'dying'     → fading at dawn (2 seconds), then removed
 */

const BUILD_TICKS = 60 // 6 seconds at 10Hz
const DYING_TICKS = 20 // 2 seconds fade-out

// Fixed gathering spot near the plaza (matches LOCATION_POSITIONS.campfire_spot)
const CAMPFIRE_SPOT = { x: 6, z: 18 }

const campfires = new Map()

export function requestCampfire(soulId) {
  // Only one campfire per builder
  for (const cf of campfires.values()) {
    if (cf.builderId === soulId) return cf
  }

  // Don't spawn too many
  if (campfires.size >= 4) return null

  // Place near the fixed campfire gathering spot with small random offset
  let x = CAMPFIRE_SPOT.x + (Math.random() - 0.5) * 3
  let z = CAMPFIRE_SPOT.z + (Math.random() - 0.5) * 3

  const y = sampleHeight(worldHeightmap, x, z)
  const cf = {
    id: nanoid(),
    builderId: soulId,
    position: { x, y: Math.max(y, WATER_LEVEL + 0.1), z },
    state: 'building',
    progress: 0,    // 0→1 during building
    ticksInState: 0,
  }
  campfires.set(cf.id, cf)
  return cf
}

/** Called every sim tick (100ms). Advances build progress and state transitions. */
export function tickCampfires() {
  for (const cf of campfires.values()) {
    cf.ticksInState++

    if (cf.state === 'building') {
      cf.progress = Math.min(1, cf.ticksInState / BUILD_TICKS)
      if (cf.progress >= 1) {
        cf.state = 'lit'
        cf.ticksInState = 0
      }
    } else if (cf.state === 'dying') {
      if (cf.ticksInState > DYING_TICKS) {
        campfires.delete(cf.id)
      }
    }
  }
}

/** Transition lit campfires to dying at dawn. */
export function extinguishCampfires() {
  for (const cf of campfires.values()) {
    if (cf.state === 'lit') {
      cf.state = 'dying'
      cf.ticksInState = 0
    }
  }
}

export function getActiveCampfires() {
  return [...campfires.values()]
}

export function getCampfireForSoul(soulId) {
  for (const cf of campfires.values()) {
    if (cf.builderId === soulId) return cf
  }
  return null
}

export function getNearestLitCampfire(x, z) {
  let best = null, bestDist = Infinity
  for (const cf of campfires.values()) {
    if (cf.state !== 'lit') continue
    const dx = cf.position.x - x
    const dz = cf.position.z - z
    const d = dx * dx + dz * dz
    if (d < bestDist) { bestDist = d; best = cf }
  }
  return best
}

export function clearAllCampfires() {
  campfires.clear()
}
