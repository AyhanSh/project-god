'use client'

const DAILY_SCHEDULES = {
  // Ancient era
  ancient_farmer: [
    { hour: 5, activity: 'wake', animation: 'idle', location: 'home' },
    { hour: 6, activity: 'morning_prayer', animation: 'pray', location: 'temple', thinkChance: 0.3 },
    { hour: 7, activity: 'chop_trees', animation: 'chop_tree', location: 'forest_edge', duration: 2, interactChance: 0.2 },
    { hour: 9, activity: 'work', animation: 'work', location: 'farm', duration: 3, interactChance: 0.4 },
    { hour: 12, activity: 'eat', animation: 'idle', location: 'market', socialChance: 0.7 },
    { hour: 13, activity: 'work', animation: 'work', location: 'farm', duration: 4 },
    { hour: 17, activity: 'social', animation: 'idle', location: 'plaza', socialChance: 0.9 },
    { hour: 19, activity: 'family_time', animation: 'idle', location: 'home', intimacyChance: 0.6 },
    { hour: 21, activity: 'sleep', animation: 'sleep', location: 'home' },
  ],
  ancient_healer: [
    { hour: 5, activity: 'wake', animation: 'idle', location: 'home' },
    { hour: 6, activity: 'gather_herbs', animation: 'work', location: 'forest_edge', duration: 3 },
    { hour: 9, activity: 'heal', animation: 'pray', location: 'temple', duration: 3, interactChance: 0.8 },
    { hour: 12, activity: 'eat', animation: 'idle', location: 'market', socialChance: 0.5 },
    { hour: 13, activity: 'gather_herbs', animation: 'work', location: 'forest_edge', duration: 2 },
    { hour: 15, activity: 'study', animation: 'idle', location: 'home', thinkChance: 0.6 },
    { hour: 17, activity: 'social', animation: 'idle', location: 'plaza', socialChance: 0.7 },
    { hour: 20, activity: 'meditate', animation: 'pray', location: 'temple', thinkChance: 0.5 },
    { hour: 22, activity: 'sleep', animation: 'sleep', location: 'home' },
  ],
  ancient_warrior: [
    { hour: 5, activity: 'training', animation: 'fight', location: 'barracks', duration: 3 },
    { hour: 8, activity: 'patrol', animation: 'walk', location: 'perimeter', duration: 4 },
    { hour: 9, activity: 'mine_ore', animation: 'mine', location: 'quarry', duration: 3 },
    { hour: 12, activity: 'eat', animation: 'idle', location: 'market', socialChance: 0.6 },
    { hour: 14, activity: 'training', animation: 'fight', location: 'barracks', duration: 3 },
    { hour: 17, activity: 'social', animation: 'idle', location: 'plaza', socialChance: 0.8 },
    { hour: 20, activity: 'rest', animation: 'idle', location: 'home' },
    { hour: 22, activity: 'sleep', animation: 'sleep', location: 'barracks' },
  ],
  ancient_priest: [
    { hour: 4, activity: 'dawn_prayer', animation: 'pray', location: 'temple', thinkChance: 0.7 },
    { hour: 7, activity: 'teach', animation: 'idle', location: 'temple', duration: 3, interactChance: 0.6 },
    { hour: 10, activity: 'gather_herbs', animation: 'work', location: 'forest_edge', duration: 2 },
    { hour: 12, activity: 'eat', animation: 'idle', location: 'temple' },
    { hour: 14, activity: 'counsel', animation: 'idle', location: 'temple', interactChance: 0.9 },
    { hour: 17, activity: 'meditate', animation: 'pray', location: 'temple', thinkChance: 0.8 },
    { hour: 19, activity: 'evening_prayer', animation: 'pray', location: 'temple' },
    { hour: 21, activity: 'sleep', animation: 'sleep', location: 'temple' },
  ],
  ancient_trader: [
    { hour: 6, activity: 'wake', animation: 'idle', location: 'home' },
    { hour: 7, activity: 'open_stall', animation: 'work', location: 'market', duration: 5, interactChance: 0.9 },
    { hour: 12, activity: 'eat', animation: 'idle', location: 'market', socialChance: 0.8 },
    { hour: 13, activity: 'trade', animation: 'idle', location: 'market', duration: 4, interactChance: 0.9 },
    { hour: 17, activity: 'count_goods', animation: 'work', location: 'home', thinkChance: 0.4 },
    { hour: 19, activity: 'social', animation: 'idle', location: 'plaza', socialChance: 0.9 },
    { hour: 21, activity: 'sleep', animation: 'sleep', location: 'home' },
  ],
  ancient_builder: [
    { hour: 5, activity: 'wake', animation: 'idle', location: 'home' },
    { hour: 6,  activity: 'chop_trees',      animation: 'chop_tree', location: 'forest_edge',   duration: 3, interactChance: 0.2 },
    { hour: 9,  activity: 'mine_ore',        animation: 'mine',      location: 'cave_entrance', duration: 3 },
    { hour: 12, activity: 'eat', animation: 'idle', location: 'market', socialChance: 0.5 },
    { hour: 13, activity: 'build_structure', animation: 'build',     location: 'construction',  duration: 5 },
    { hour: 18, activity: 'social', animation: 'idle', location: 'plaza', socialChance: 0.6 },
    { hour: 20, activity: 'plan', animation: 'idle', location: 'home', thinkChance: 0.5 },
    { hour: 22, activity: 'sleep', animation: 'sleep', location: 'home' },
  ],

  // Medieval era
  medieval_knight: [
    { hour: 5, activity: 'training', animation: 'fight', location: 'barracks', duration: 3 },
    { hour: 8, activity: 'patrol', animation: 'walk', location: 'perimeter', duration: 4 },
    { hour: 12, activity: 'eat', animation: 'idle', location: 'tavern', socialChance: 0.9 },
    { hour: 14, activity: 'council', animation: 'idle', location: 'castle', thinkChance: 0.5 },
    { hour: 17, activity: 'training', animation: 'fight', location: 'barracks' },
    { hour: 20, activity: 'drinking', animation: 'celebrate', location: 'tavern', socialChance: 1.0 },
    { hour: 23, activity: 'sleep', animation: 'sleep', location: 'barracks' },
  ],
  medieval_monk: [
    { hour: 3, activity: 'matins', animation: 'pray', location: 'cathedral', thinkChance: 0.7 },
    { hour: 6, activity: 'study', animation: 'idle', location: 'cathedral', duration: 3 },
    { hour: 9, activity: 'teach', animation: 'idle', location: 'cathedral', interactChance: 0.5 },
    { hour: 12, activity: 'eat', animation: 'idle', location: 'cathedral' },
    { hour: 13, activity: 'copy_texts', animation: 'work', location: 'cathedral', duration: 4 },
    { hour: 17, activity: 'vespers', animation: 'pray', location: 'cathedral' },
    { hour: 19, activity: 'meditate', animation: 'pray', location: 'cathedral', thinkChance: 0.6 },
    { hour: 20, activity: 'sleep', animation: 'sleep', location: 'cathedral' },
  ],
  medieval_lord: [
    { hour: 7, activity: 'wake', animation: 'idle', location: 'castle' },
    { hour: 8, activity: 'court', animation: 'idle', location: 'castle', duration: 4, interactChance: 0.8 },
    { hour: 12, activity: 'feast', animation: 'celebrate', location: 'castle', socialChance: 0.9 },
    { hour: 14, activity: 'govern', animation: 'idle', location: 'castle', thinkChance: 0.6 },
    { hour: 17, activity: 'hunt', animation: 'walk', location: 'forest', duration: 2 },
    { hour: 19, activity: 'evening_feast', animation: 'celebrate', location: 'castle', socialChance: 0.8 },
    { hour: 22, activity: 'sleep', animation: 'sleep', location: 'castle' },
  ],

  // Generic fallbacks per era
  medieval_default: [
    { hour: 6, activity: 'wake', animation: 'idle', location: 'home' },
    { hour: 7, activity: 'work', animation: 'work', location: 'workshop', duration: 5, interactChance: 0.4 },
    { hour: 12, activity: 'eat', animation: 'idle', location: 'tavern', socialChance: 0.7 },
    { hour: 13, activity: 'craft_tools', animation: 'craft', location: 'workshop', duration: 4 },
    { hour: 17, activity: 'social', animation: 'idle', location: 'plaza', socialChance: 0.8 },
    { hour: 20, activity: 'rest', animation: 'idle', location: 'home' },
    { hour: 22, activity: 'sleep', animation: 'sleep', location: 'home' },
  ],
  renaissance_default: [
    { hour: 7, activity: 'wake', animation: 'idle', location: 'home' },
    { hour: 8, activity: 'study', animation: 'idle', location: 'university', duration: 3, thinkChance: 0.5 },
    { hour: 11, activity: 'craft_tools', animation: 'craft', location: 'workshop', duration: 3 },
    { hour: 14, activity: 'dine', animation: 'idle', location: 'market', socialChance: 0.7 },
    { hour: 15, activity: 'discuss', animation: 'idle', location: 'plaza', socialChance: 0.9, interactChance: 0.7 },
    { hour: 18, activity: 'evening_salon', animation: 'idle', location: 'theatre', socialChance: 0.8 },
    { hour: 21, activity: 'reflect', animation: 'idle', location: 'home', thinkChance: 0.6 },
    { hour: 23, activity: 'sleep', animation: 'sleep', location: 'home' },
  ],
  industrial_default: [
    { hour: 5, activity: 'wake', animation: 'idle', location: 'home' },
    { hour: 6, activity: 'commute', animation: 'walk', location: 'factory' },
    { hour: 7, activity: 'work', animation: 'work', location: 'factory', duration: 6 },
    { hour: 13, activity: 'eat', animation: 'idle', location: 'factory' },
    { hour: 14, activity: 'work', animation: 'work', location: 'factory', duration: 4 },
    { hour: 18, activity: 'social', animation: 'idle', location: 'tavern', socialChance: 0.6 },
    { hour: 20, activity: 'rest', animation: 'idle', location: 'home', thinkChance: 0.3 },
    { hour: 22, activity: 'sleep', animation: 'sleep', location: 'home' },
  ],
  modern_default: [
    { hour: 7, activity: 'wake', animation: 'idle', location: 'home' },
    { hour: 8, activity: 'commute', animation: 'walk', location: 'office' },
    { hour: 9, activity: 'work', animation: 'work', location: 'office', duration: 4, interactChance: 0.5 },
    { hour: 13, activity: 'lunch', animation: 'idle', location: 'market', socialChance: 0.6 },
    { hour: 14, activity: 'work', animation: 'work', location: 'office', duration: 4 },
    { hour: 18, activity: 'leisure', animation: 'idle', location: 'park', socialChance: 0.5 },
    { hour: 20, activity: 'social_media', animation: 'idle', location: 'home', thinkChance: 0.4 },
    { hour: 23, activity: 'sleep', animation: 'sleep', location: 'home' },
  ],
  singularity_default: [
    { hour: 0, activity: 'digital_existence', animation: 'idle', location: 'mind_palace', thinkChance: 0.3 },
    { hour: 6, activity: 'interface', animation: 'idle', location: 'quantum_server', interactChance: 0.6 },
    { hour: 12, activity: 'process', animation: 'work', location: 'arcology', duration: 6 },
    { hour: 18, activity: 'commune', animation: 'idle', location: 'bio_dome', socialChance: 0.8, thinkChance: 0.5 },
  ],

  // Ultimate fallback
  default: [
    { hour: 6, activity: 'wake', animation: 'idle', location: 'home' },
    { hour: 7, activity: 'chop_trees', animation: 'chop_tree', location: 'forest_edge', duration: 2 },
    { hour: 9, activity: 'work', animation: 'work', location: 'workplace', duration: 3 },
    { hour: 12, activity: 'eat', animation: 'idle', location: 'market', socialChance: 0.5 },
    { hour: 13, activity: 'work', animation: 'work', location: 'workplace', duration: 4 },
    { hour: 17, activity: 'social', animation: 'idle', location: 'plaza', socialChance: 0.7 },
    { hour: 20, activity: 'rest', animation: 'idle', location: 'home' },
    { hour: 22, activity: 'sleep', animation: 'sleep', location: 'home' },
  ],
}

// Role families carry role identity across eras without enumerating all
// role×era permutations. A Farmer in the Modern era still farms; they just
// do it at a larger scale with better tools (the mechanical difference comes
// from EconomySystem's tech multiplier on output).
const ROLE_TO_ERA_ACTIVITY = {
  farmer: {
    ancient: { location: 'farm', activity: 'work' },
    medieval: { location: 'farm', activity: 'tend_fields' },
    renaissance: { location: 'farm', activity: 'cultivate' },
    industrial: { location: 'factory', activity: 'operate_machinery' },
    modern: { location: 'factory', activity: 'manage_production' },
    singularity: { location: 'arcology', activity: 'oversee_synthesis' },
  },
  warrior: {
    ancient: { location: 'barracks', activity: 'training' },
    medieval: { location: 'barracks', activity: 'training' },
    renaissance: { location: 'barracks', activity: 'drill' },
    industrial: { location: 'barracks', activity: 'rifle_drill' },
    modern: { location: 'office', activity: 'strategic_planning' },
    singularity: { location: 'quantum_server', activity: 'cyber_defense' },
  },
  healer: {
    ancient: { location: 'temple', activity: 'heal' },
    medieval: { location: 'cathedral', activity: 'heal' },
    renaissance: { location: 'university', activity: 'practice_medicine' },
    industrial: { location: 'university', activity: 'surgery' },
    modern: { location: 'office', activity: 'medical_research' },
    singularity: { location: 'bio_dome', activity: 'nanite_therapy' },
  },
  trader: {
    ancient: { location: 'market', activity: 'trade' },
    medieval: { location: 'market', activity: 'trade' },
    renaissance: { location: 'market', activity: 'broker_deals' },
    industrial: { location: 'factory', activity: 'manage_imports' },
    modern: { location: 'office', activity: 'run_markets' },
    singularity: { location: 'quantum_server', activity: 'arbitrage_networks' },
  },
  priest: {
    ancient: { location: 'temple', activity: 'counsel' },
    medieval: { location: 'cathedral', activity: 'counsel' },
    renaissance: { location: 'cathedral', activity: 'teach' },
    industrial: { location: 'cathedral', activity: 'sermon' },
    modern: { location: 'office', activity: 'community_work' },
    singularity: { location: 'mind_palace', activity: 'commune' },
  },
  builder: {
    ancient: { location: 'construction', activity: 'build_structure' },
    medieval: { location: 'construction', activity: 'build_castle' },
    renaissance: { location: 'construction', activity: 'design_buildings' },
    industrial: { location: 'factory', activity: 'assemble_steelwork' },
    modern: { location: 'office', activity: 'engineer_structures' },
    singularity: { location: 'arcology', activity: 'fabricate_megastructures' },
  },
}

function _applyRoleTint(baseSchedule, role, eraId) {
  const override = ROLE_TO_ERA_ACTIVITY[role]?.[eraId]
  if (!override) return baseSchedule
  // Replace the 'work' or 'factory'/'office' slot with the role-era activity
  // so a Farmer in the Modern era actually farms (operates modern machinery)
  // rather than doing a generic office job.
  return baseSchedule.map((entry) => {
    if (entry.activity === 'work') {
      return { ...entry, activity: override.activity, location: override.location }
    }
    return entry
  })
}

export function getSoulSchedule(soul, era) {
  const role = (soul.role || 'default').toLowerCase().replace(/\s+/g, '_')
  const eraId = era?.id || 'ancient'

  // Try specific era_role
  const specificKey = `${eraId}_${role}`
  if (DAILY_SCHEDULES[specificKey]) return DAILY_SCHEDULES[specificKey]

  // Fall back to era default, but tint the 'work' slot with the role's
  // era-appropriate activity so role identity survives era transitions.
  const eraKey = `${eraId}_default`
  if (DAILY_SCHEDULES[eraKey]) return _applyRoleTint(DAILY_SCHEDULES[eraKey], role, eraId)

  return DAILY_SCHEDULES.default
}

// Convert timeOfDay (0-23.99) to integer hour (0-23)
export function getGameHour(timeOfDay) {
  return Math.floor(((timeOfDay % 24) + 24) % 24)
}

export function getCurrentScheduleEntry(schedule, hour) {
  let current = schedule[0]
  for (const entry of schedule) {
    if (hour >= entry.hour) {
      current = entry
    } else {
      break
    }
  }
  return current
}

// Movement locations — close enough to the city centre that the player can see
// souls working, but spread out enough for variety.
export const LOCATION_POSITIONS = {
  // City-centre locations (within the flat building zone)
  home: { x: 0, z: 0, range: 8 },
  market: { x: -15, z: 18, range: 8 },
  plaza: { x: 0, z: 12, range: 8 },
  tavern: { x: -18, z: 14, range: 6 },
  workshop: { x: 14, z: 22, range: 6 },
  office: { x: 22, z: 14, range: 6 },
  mind_palace: { x: 0, z: 0, range: 6 },
  quantum_server: { x: 16, z: 16, range: 6 },
  arcology: { x: 0, z: 0, range: 10 },

  // Near-city locations (visible from default camera)
  temple: { x: 35, z: -28, range: 8 },
  cathedral: { x: 35, z: -28, range: 8 },
  castle: { x: 45, z: -14, range: 10 },
  barracks: { x: 38, z: 22, range: 8 },
  construction: { x: 20, z: 35, range: 4 },
  theatre: { x: -28, z: -14, range: 7 },
  university: { x: 28, z: -38, range: 8 },

  // Work locations (close enough to see souls acting)
  farm: { x: -35, z: -28, range: 8 },
  forest: { x: -50, z: -42, range: 10 },
  perimeter: { x: 0, z: 55, range: 10 },
  park: { x: -30, z: 20, range: 8 },
  factory: { x: 40, z: 30, range: 6 },
  bio_dome: { x: -25, z: -22, range: 8 },

  // Resource gathering locations (within visible range)
  cave_entrance: { x: -55, z: -45, range: 6 },
  forest_edge:   { x: -48, z: -35, range: 8 },
  quarry:        { x: 52,  z: -42, range: 6 },

  // Night gathering
  campfire_spot: { x: 6, z: 18, range: 3 },
}
