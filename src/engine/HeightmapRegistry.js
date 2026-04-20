'use client'

import { generateHeightmap } from '@/world/Terrain'

/**
 * Shared heightmap singleton.
 *
 * generateHeightmap() produces a ~1 MB Float32Array. Previously it was called
 * independently in WorldEngine, CityEngine, SoulEntity, WorldScene, and
 * SandboxScene — each holding its own copy.  This module generates once with
 * the canonical seed (1337) and exports the single shared reference.
 *
 * Generation is now lazy: the first consumer to read `worldHeightmap` or call
 * `getWorldHeightmap()` triggers the (~50–200ms) build.  Deferring past
 * module-evaluation time keeps the first paint responsive.
 */
const WORLD_SEED = 1337

let _cached = null
function _ensure() {
  if (!_cached) _cached = generateHeightmap(WORLD_SEED)
  return _cached
}

export function getWorldHeightmap() {
  return _ensure()
}

// Backward-compat lazy accessor. Existing callers import `worldHeightmap` as a
// Float32Array; the Proxy forwards every read to the lazily-built array.
export const worldHeightmap = new Proxy(
  {},
  {
    get(_t, prop) {
      return _ensure()[prop]
    },
    has(_t, prop) {
      return prop in _ensure()
    },
    ownKeys() {
      return Reflect.ownKeys(_ensure())
    },
    getOwnPropertyDescriptor(_t, prop) {
      return Object.getOwnPropertyDescriptor(_ensure(), prop)
    },
  },
)
