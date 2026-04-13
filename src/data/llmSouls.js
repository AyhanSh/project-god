import { nanoid } from 'nanoid'

// ─── Name pools ──────────────────────────────────────────────────────────────
const MALE_NAMES = [
  'Adam', 'Seth', 'Enoch', 'Kael', 'Theron', 'Darius', 'Marcus', 'Rowan',
  'Felix', 'Orion', 'Jasper', 'Cyrus', 'Leif', 'Idris', 'Amos', 'Silas',
  'Tobias', 'Caspian', 'Ezra', 'Nolan', 'Alaric', 'Bastian', 'Dorian', 'Emil',
  'Hadrian', 'Lucian', 'Maxim', 'Orin', 'Rael', 'Soren', 'Talan', 'Valen',
]

const FEMALE_NAMES = [
  'Eve', 'Lyra', 'Selene', 'Aria', 'Iris', 'Freya', 'Mira', 'Thea',
  'Calla', 'Ember', 'Sage', 'Wren', 'Nyx', 'Dahlia', 'Elara', 'Seren',
  'Alma', 'Briar', 'Daphne', 'Isolde', 'Liora', 'Nova', 'Petra', 'Vesper',
  'Ayla', 'Cora', 'Faye', 'Hana', 'Juno', 'Lena', 'Runa', 'Tara',
]

const ROLES = ['Healer', 'Builder', 'Warrior', 'Trader', 'Priest', 'Farmer', 'Hunter', 'Artisan']

const AURA_COLORS = [
  '#6B5CE7', '#4285F4', '#FF6B35', '#34A853', '#9C27B0', '#10A37F',
  '#E91E63', '#FF9800', '#00BCD4', '#8BC34A', '#F44336', '#3F51B5',
  '#CDDC39', '#795548', '#607D8B', '#FF5722',
]

const SKIN_TONES = [
  '#cc785c', '#c8a882', '#8d6e4a', '#b8956a', '#c09070', '#c4a078',
  '#d4a574', '#a0724a', '#e0b890', '#b07850',
]

// ─── Name generation ─────────────────────────────────────────────────────────
const usedNames = new Set()

export function generateName(sex) {
  const pool = sex === 'male' ? MALE_NAMES : FEMALE_NAMES
  const available = pool.filter((n) => !usedNames.has(n))
  if (available.length > 0) {
    const name = available[Math.floor(Math.random() * available.length)]
    usedNames.add(name)
    return name
  }
  // All used — add generational suffix
  const base = pool[Math.floor(Math.random() * pool.length)]
  const suffix = ['II', 'III', 'IV', 'V', 'VI', 'VII'][Math.floor(Math.random() * 6)]
  const name = `${base} ${suffix}`
  usedNames.add(name)
  return name
}

// ─── Trait helpers ───────────────────────────────────────────────────────────
function randomTraits() {
  return {
    wisdom: 3 + Math.floor(Math.random() * 8),
    empathy: 3 + Math.floor(Math.random() * 8),
    courage: 3 + Math.floor(Math.random() * 8),
    ambition: 3 + Math.floor(Math.random() * 8),
    creativity: 3 + Math.floor(Math.random() * 8),
  }
}

function blendTraits(traitsA, traitsB) {
  const blend = {}
  for (const key of Object.keys(traitsA)) {
    const avg = (traitsA[key] + traitsB[key]) / 2
    blend[key] = Math.max(1, Math.min(10, Math.round(avg + (Math.random() - 0.5) * 4)))
  }
  return blend
}

function generatePersonality(traits) {
  const parts = []
  if (traits.empathy >= 7) parts.push('compassionate')
  else if (traits.empathy <= 4) parts.push('detached')
  if (traits.courage >= 7) parts.push('brave')
  else if (traits.courage <= 4) parts.push('cautious')
  if (traits.ambition >= 7) parts.push('driven')
  else if (traits.ambition <= 4) parts.push('content')
  if (traits.wisdom >= 7) parts.push('wise')
  if (traits.creativity >= 7) parts.push('inventive')
  if (parts.length === 0) parts.push('balanced')
  return parts.join(', ') + '. A soul finding their way in the world.'
}

// ─── Soul factory ────────────────────────────────────────────────────────────
export function createSoul({ sex, birthYear, traits, parentIds, generation, name, role, aura, skinTone }) {
  const t = traits || randomTraits()
  return {
    id: `soul_${nanoid(8)}`,
    llmName: name || generateName(sex),
    sex,
    aura: aura || AURA_COLORS[Math.floor(Math.random() * AURA_COLORS.length)],
    skinTone: skinTone || SKIN_TONES[Math.floor(Math.random() * SKIN_TONES.length)],
    personality: generatePersonality(t),
    role: role || ROLES[Math.floor(Math.random() * ROLES.length)],
    deepestFear: 'The unknown',
    greatestDesire: 'To find meaning',
    moralCode: 'Live with purpose',
    worldview: 'The world is vast and full of mystery',
    birthYear,
    traits: t,
    parentIds: parentIds || [],
    generation: generation || 1,
  }
}

export function createChildSoul(parentA, parentB, birthYear) {
  const sex = Math.random() < 0.5 ? 'male' : 'female'
  const traits = blendTraits(parentA.traits, parentB.traits)
  const generation = Math.max(parentA.generation || 1, parentB.generation || 1) + 1
  // Blend skin tone from one parent randomly
  const skinTone = Math.random() < 0.5 ? parentA.skinTone : parentB.skinTone

  return createSoul({
    sex,
    birthYear,
    traits,
    parentIds: [parentA.id, parentB.id],
    generation,
    skinTone,
  })
}

// ─── The 2 starter souls (Adam & Eve) ────────────────────────────────────────
export const LLM_SOULS = [
  createSoul({
    sex: 'male',
    birthYear: -2995,
    name: 'Adam',
    role: 'Farmer',
    aura: '#4285F4',
    skinTone: '#c8a882',
    traits: { wisdom: 6, empathy: 7, courage: 7, ambition: 6, creativity: 5 },
  }),
  createSoul({
    sex: 'female',
    birthYear: -2993,
    name: 'Eve',
    role: 'Healer',
    aura: '#E91E63',
    skinTone: '#cc785c',
    traits: { wisdom: 7, empathy: 8, courage: 5, ambition: 5, creativity: 7 },
  }),
]
