'use client'

const DAILY_SCHEDULES = {
  // Ancient era
  ancient_farmer: [
    { hour: 5, activity: 'wake', animation: 'idle', location: 'home' },
    { hour: 6, activity: 'morning_prayer', animation: 'pray', location: 'temple', thinkChance: 0.3 },
    { hour: 7, activity: 'work', animation: 'work', location: 'farm', duration: 4, interactChance: 0.4 },
    { hour: 12, activity: 'eat', animation: 'idle', location: 'market', socialChance: 0.7 },
    { hour: 13, activity: 'work', animation: 'work', location: 'farm', duration: 4 },
    { hour: 17, activity: 'social', animation: 'idle', location: 'plaza', socialChance: 0.9 },
    { hour: 19, activity: 'family_time', animation: 'idle', location: 'home', intimacyChance: 0.6 },
    { hour: 21, activity: 'sleep', animation: 'sleep', location: 'home' },
  ],
  ancient_healer: [
    { hour: 5, activity: 'wake', animation: 'idle', location: 'home' },
    { hour: 6, activity: 'gather_herbs', animation: 'work', location: 'forest', duration: 3 },
    { hour: 9, activity: 'heal', animation: 'pray', location: 'temple', duration: 4, interactChance: 0.8 },
    { hour: 13, activity: 'eat', animation: 'idle', location: 'market', socialChance: 0.5 },
    { hour: 14, activity: 'study', animation: 'idle', location: 'home', thinkChance: 0.6 },
    { hour: 17, activity: 'social', animation: 'idle', location: 'plaza', socialChance: 0.7 },
    { hour: 20, activity: 'meditate', animation: 'pray', location: 'temple', thinkChance: 0.5 },
    { hour: 22, activity: 'sleep', animation: 'sleep', location: 'home' },
  ],
  ancient_warrior: [
    { hour: 5, activity: 'training', animation: 'fight', location: 'barracks', duration: 3 },
    { hour: 8, activity: 'patrol', animation: 'walk', location: 'perimeter', duration: 4 },
    { hour: 12, activity: 'eat', animation: 'idle', location: 'market', socialChance: 0.6 },
    { hour: 14, activity: 'training', animation: 'fight', location: 'barracks', duration: 3 },
    { hour: 17, activity: 'social', animation: 'idle', location: 'plaza', socialChance: 0.8 },
    { hour: 20, activity: 'rest', animation: 'idle', location: 'home' },
    { hour: 22, activity: 'sleep', animation: 'sleep', location: 'barracks' },
  ],
  ancient_priest: [
    { hour: 4, activity: 'dawn_prayer', animation: 'pray', location: 'temple', thinkChance: 0.7 },
    { hour: 7, activity: 'teach', animation: 'idle', location: 'temple', duration: 3, interactChance: 0.6 },
    { hour: 10, activity: 'ritual', animation: 'pray', location: 'temple', duration: 2 },
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
    { hour: 6, activity: 'work', animation: 'work', location: 'construction', duration: 6, interactChance: 0.3 },
    { hour: 12, activity: 'eat', animation: 'idle', location: 'market', socialChance: 0.5 },
    { hour: 13, activity: 'work', animation: 'work', location: 'construction', duration: 5 },
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
    { hour: 13, activity: 'work', animation: 'work', location: 'workshop', duration: 4 },
    { hour: 17, activity: 'social', animation: 'idle', location: 'plaza', socialChance: 0.8 },
    { hour: 20, activity: 'rest', animation: 'idle', location: 'home' },
    { hour: 22, activity: 'sleep', animation: 'sleep', location: 'home' },
  ],
  renaissance_default: [
    { hour: 7, activity: 'wake', animation: 'idle', location: 'home' },
    { hour: 8, activity: 'study', animation: 'idle', location: 'university', duration: 3, thinkChance: 0.5 },
    { hour: 11, activity: 'create', animation: 'work', location: 'workshop', duration: 3 },
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
    { hour: 7, activity: 'work', animation: 'work', location: 'workplace', duration: 5 },
    { hour: 12, activity: 'eat', animation: 'idle', location: 'market', socialChance: 0.5 },
    { hour: 13, activity: 'work', animation: 'work', location: 'workplace', duration: 4 },
    { hour: 17, activity: 'social', animation: 'idle', location: 'plaza', socialChance: 0.7 },
    { hour: 20, activity: 'rest', animation: 'idle', location: 'home' },
    { hour: 22, activity: 'sleep', animation: 'sleep', location: 'home' },
  ],
}

export function getSoulSchedule(soul, era) {
  const role = (soul.role || 'default').toLowerCase().replace(/\s+/g, '_')
  const eraId = era?.id || 'ancient'

  // Try specific era_role
  const specificKey = `${eraId}_${role}`
  if (DAILY_SCHEDULES[specificKey]) return DAILY_SCHEDULES[specificKey]

  // Try era default
  const eraKey = `${eraId}_default`
  if (DAILY_SCHEDULES[eraKey]) return DAILY_SCHEDULES[eraKey]

  return DAILY_SCHEDULES.default
}

// Convert game year to approximate hour of day
// Each game year is compressed — we cycle through hours based on sub-year fraction
export function getGameHour(yearFraction) {
  return Math.floor((yearFraction % 1) * 24)
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

// Movement locations — kept within the flat zone (radius ~16)
export const LOCATION_POSITIONS = {
  // City-centre locations (within the flat building zone)
  home: { x: 0, z: 0, range: 4 },
  market: { x: -6, z: 8, range: 4 },
  plaza: { x: 0, z: 5, range: 4 },
  tavern: { x: -7, z: 6, range: 3 },
  workshop: { x: 5, z: 9, range: 3 },
  office: { x: 10, z: 7, range: 3 },
  mind_palace: { x: 0, z: 0, range: 3 },
  quantum_server: { x: 7, z: 7, range: 3 },
  arcology: { x: 0, z: 0, range: 5 },

  // Near-city locations (edge of flat zone → gentle hills)
  temple: { x: 12, z: -10, range: 4 },
  cathedral: { x: 12, z: -10, range: 4 },
  castle: { x: 16, z: -5, range: 5 },
  barracks: { x: 14, z: 6, range: 4 },
  construction: { x: 8, z: 12, range: 5 },
  theatre: { x: -10, z: -5, range: 3 },
  university: { x: 10, z: -14, range: 4 },

  // Outer locations (characters explore the terrain)
  farm: { x: -22, z: -16, range: 8 },
  forest: { x: -28, z: -22, range: 10 },
  perimeter: { x: 0, z: 30, range: 8 },
  park: { x: -18, z: 8, range: 6 },
  factory: { x: 20, z: 16, range: 6 },
  bio_dome: { x: -14, z: -14, range: 5 },
}
