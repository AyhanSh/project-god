/**
 * Non-reactive shared position map for soul live positions.
 * Updated every frame by SoulEntity, read by other SoulEntity instances
 * for face-to-face interactions without triggering React re-renders.
 */
const positions = new Map()

export function setSoulPosition(id, x, z) {
  positions.set(id, { x, z })
}

export function getSoulPosition(id) {
  return positions.get(id) || null
}

export function clearSoulPosition(id) {
  positions.delete(id)
}

export function allSoulPositions() {
  return positions
}
