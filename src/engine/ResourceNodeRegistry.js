/**
 * Non-reactive registry of harvestable resource nodes (trees, rocks).
 * Populated by Trees.jsx / Rocks.jsx on mount.
 * Queried by SoulEntity.jsx to find the nearest resource to interact with.
 */

// { tree: [{x, z, index}], rock: [{x, z, index}] }
const _nodes = { tree: [], rock: [] }

// Set of "tree_42" / "rock_7" keys — nodes currently being harvested
const _active = new Set()

export function registerNodes(type, positions) {
  _nodes[type] = positions
}

/**
 * Find the nearest node of `type` to (x, z).
 * Skips nodes already being harvested by someone else.
 */
export function findNearestNode(type, x, z) {
  const nodes = _nodes[type]
  if (!nodes || nodes.length === 0) return null

  let best = null
  let bestDist = Infinity

  for (const node of nodes) {
    const key = `${type}_${node.index}`
    if (_active.has(key)) continue // already claimed
    const dx = node.x - x
    const dz = node.z - z
    const dist = dx * dx + dz * dz
    if (dist < bestDist) {
      bestDist = dist
      best = node
    }
  }

  return best
}

export function markNodeActive(type, index) {
  _active.add(`${type}_${index}`)
}

export function markNodeInactive(type, index) {
  _active.delete(`${type}_${index}`)
}

export function isNodeActive(type, index) {
  return _active.has(`${type}_${index}`)
}

export function getActiveNodes() {
  return _active
}
