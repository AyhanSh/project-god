'use client'

import { relationshipManager } from './SoulRelations'

// ─── Action categories with icons ──────────────────────────────────────────
const CATEGORY = {
  SURVIVAL:  { id: 'survival',  icon: '🪓', color: '#c9a96e' },
  COMBAT:    { id: 'combat',    icon: '⚔️',  color: '#e05545' },
  SOCIAL:    { id: 'social',    icon: '💬', color: '#7eb8da' },
  CRAFT:     { id: 'craft',     icon: '🔨', color: '#d4a853' },
  SPIRITUAL: { id: 'spiritual', icon: '🙏', color: '#b590d0' },
  TRADE:     { id: 'trade',     icon: '💰', color: '#5cb85c' },
  ROMANCE:   { id: 'romance',   icon: '❤️',  color: '#e87094' },
  REST:      { id: 'rest',      icon: '💤', color: '#6a7080' },
  MOVEMENT:  { id: 'movement',  icon: '🚶', color: '#8a9ab0' },
  WORK:      { id: 'work',      icon: '⛏️',  color: '#c08040' },
  STUDY:     { id: 'study',     icon: '📖', color: '#60a0d0' },
}

// ─── Activity → intent generator map ────────────────────────────────────────
// Each entry returns { text, detail, category } based on soul context
const ACTIVITY_INTENTS = {
  chop_trees: (soul, ctx) => ({
    text: 'Chopping trees',
    detail: `Harvesting wood at ${_locationName(soul.currentLocation)}`,
    category: CATEGORY.SURVIVAL,
  }),
  mine_ore: (soul, ctx) => ({
    text: 'Mining ore',
    detail: `Digging for ore at the ${_locationName(soul.currentLocation)}`,
    category: CATEGORY.WORK,
  }),
  gather_herbs: (soul, ctx) => ({
    text: 'Gathering herbs',
    detail: `Collecting medicinal plants near the ${_locationName(soul.currentLocation)}`,
    category: CATEGORY.SURVIVAL,
  }),
  work: (soul, ctx) => {
    if (soul.currentLocation === 'farm' || soul.role === 'Farmer') {
      return { text: 'Working the fields', detail: 'Tending crops and soil', category: CATEGORY.WORK }
    }
    if (soul.currentLocation === 'factory') {
      return { text: 'Operating machinery', detail: 'Factory shift in progress', category: CATEGORY.WORK }
    }
    if (soul.currentLocation === 'workshop') {
      return { text: 'Working in the workshop', detail: 'Hands busy with raw materials', category: CATEGORY.CRAFT }
    }
    if (soul.currentLocation === 'office') {
      return { text: 'Working at the office', detail: 'Desk work and calculations', category: CATEGORY.WORK }
    }
    return { text: 'Working', detail: `Laboring at ${_locationName(soul.currentLocation)}`, category: CATEGORY.WORK }
  },
  craft_tools: (soul) => ({
    text: 'Crafting tools',
    detail: 'Shaping wood and metal into useful implements',
    category: CATEGORY.CRAFT,
  }),
  build_structure: (soul) => ({
    text: 'Building a structure',
    detail: soul.currentAmbition?.goal
      ? `Working on: ${soul.currentAmbition.goal}`
      : 'Laying stones and raising walls',
    category: CATEGORY.CRAFT,
  }),
  training: (soul) => ({
    text: 'Training for combat',
    detail: `Drilling ${soul.role === 'Warrior' ? 'sword techniques' : 'self-defense'} at the barracks`,
    category: CATEGORY.COMBAT,
  }),
  patrol: (soul) => ({
    text: 'Patrolling the perimeter',
    detail: 'Watching for threats along the border',
    category: CATEGORY.COMBAT,
  }),
  process: (soul) => ({
    text: 'Processing materials',
    detail: 'Refining raw resources into usable form',
    category: CATEGORY.WORK,
  }),
  open_stall: (soul) => ({
    text: 'Running a market stall',
    detail: 'Selling wares and bartering with passersby',
    category: CATEGORY.TRADE,
  }),
  trade: (soul) => ({
    text: 'Trading goods',
    detail: `Negotiating deals at the ${_locationName(soul.currentLocation)}`,
    category: CATEGORY.TRADE,
  }),
  count_goods: (soul) => ({
    text: 'Counting inventory',
    detail: 'Tallying profits and losses',
    category: CATEGORY.TRADE,
  }),
  heal: (soul, ctx) => ({
    text: 'Healing the wounded',
    detail: ctx.nearbyWounded
      ? `Tending to ${ctx.nearbyWounded}`
      : 'Preparing remedies at the temple',
    category: CATEGORY.SPIRITUAL,
  }),
  morning_prayer: () => ({ text: 'Morning prayer', detail: 'Greeting the dawn with devotion', category: CATEGORY.SPIRITUAL }),
  dawn_prayer: () => ({ text: 'Dawn prayer', detail: 'Rising before the sun to commune with the divine', category: CATEGORY.SPIRITUAL }),
  evening_prayer: () => ({ text: 'Evening prayer', detail: 'Closing the day in quiet reflection', category: CATEGORY.SPIRITUAL }),
  matins: () => ({ text: 'Singing matins', detail: 'Pre-dawn chanting in the cathedral', category: CATEGORY.SPIRITUAL }),
  vespers: () => ({ text: 'Vespers service', detail: 'Evening hymns in the cathedral', category: CATEGORY.SPIRITUAL }),
  pray: () => ({ text: 'Praying', detail: 'Kneeling in silent prayer', category: CATEGORY.SPIRITUAL }),
  meditate: (soul) => ({
    text: 'Meditating',
    detail: soul.stress > 60 ? 'Trying to calm a troubled mind' : 'Deep in contemplation',
    category: CATEGORY.SPIRITUAL,
  }),
  study: (soul) => ({
    text: 'Studying',
    detail: _eraStudyDetail(soul),
    category: CATEGORY.STUDY,
  }),
  teach: (soul) => ({
    text: 'Teaching',
    detail: `Sharing ${soul.role === 'Priest' ? 'spiritual wisdom' : 'knowledge'} with others`,
    category: CATEGORY.STUDY,
  }),
  counsel: (soul) => ({
    text: 'Counseling others',
    detail: 'Offering guidance to those who seek it',
    category: CATEGORY.SOCIAL,
  }),
  copy_texts: () => ({ text: 'Copying sacred texts', detail: 'Carefully transcribing manuscripts by hand', category: CATEGORY.STUDY }),
  court: () => ({ text: 'Holding court', detail: 'Hearing petitions and making judgments', category: CATEGORY.SOCIAL }),
  govern: () => ({ text: 'Governing', detail: 'Making decisions for the realm', category: CATEGORY.SOCIAL }),
  hunt: () => ({ text: 'Hunting', detail: 'Tracking game through the forest', category: CATEGORY.SURVIVAL }),
  council: () => ({ text: 'Attending council', detail: 'Deliberating with other leaders', category: CATEGORY.SOCIAL }),

  // Social / leisure
  social: (soul, ctx) => ({
    text: ctx.nearbyLover ? `With ${ctx.nearbyLover}` : 'Socializing',
    detail: ctx.nearbyLover
      ? `Spending time with ${ctx.nearbyLover} at the ${_locationName(soul.currentLocation)}`
      : `Mingling at the ${_locationName(soul.currentLocation)}`,
    category: ctx.nearbyLover ? CATEGORY.ROMANCE : CATEGORY.SOCIAL,
  }),
  discuss: () => ({ text: 'In discussion', detail: 'Exchanging ideas and debating', category: CATEGORY.SOCIAL }),
  evening_salon: () => ({ text: 'At the salon', detail: 'Attending an evening of art and conversation', category: CATEGORY.SOCIAL }),
  drinking: () => ({ text: 'Drinking at the tavern', detail: 'Sharing ale and stories', category: CATEGORY.SOCIAL }),
  feast: () => ({ text: 'Feasting', detail: 'Eating and celebrating with company', category: CATEGORY.SOCIAL }),
  evening_feast: () => ({ text: 'Evening feast', detail: 'Wine, food, and firelight', category: CATEGORY.SOCIAL }),
  celebrate: () => ({ text: 'Celebrating', detail: 'Joyous revelry with others', category: CATEGORY.SOCIAL }),
  leisure: (soul) => ({
    text: 'Leisure time',
    detail: `Relaxing at the ${_locationName(soul.currentLocation)}`,
    category: CATEGORY.REST,
  }),

  // Family / intimacy
  family_time: (soul, ctx) => {
    if (ctx.nearbySpouse) {
      return { text: `Intimate with ${ctx.nearbySpouse}`, detail: 'Sharing a private moment together', category: CATEGORY.ROMANCE }
    }
    if (ctx.nearbyLover) {
      return { text: `With ${ctx.nearbyLover}`, detail: 'A tender evening together', category: CATEGORY.ROMANCE }
    }
    return { text: 'Family time', detail: 'Spending the evening with loved ones', category: CATEGORY.REST }
  },

  // Rest
  eat: (soul) => ({ text: 'Eating', detail: `Having a meal at the ${_locationName(soul.currentLocation)}`, category: CATEGORY.REST }),
  dine: (soul) => ({ text: 'Dining', detail: `A sit-down meal at the ${_locationName(soul.currentLocation)}`, category: CATEGORY.REST }),
  lunch: () => ({ text: 'Lunch break', detail: 'Eating and catching a breath', category: CATEGORY.REST }),
  rest: (soul) => ({
    text: soul.energy < 30 ? 'Collapsing from exhaustion' : 'Resting',
    detail: soul.energy < 30 ? 'Barely able to stay upright' : `Recovering at ${_locationName(soul.currentLocation)}`,
    category: CATEGORY.REST,
  }),
  sleep: () => ({ text: 'Sleeping', detail: 'Lost in dreams', category: CATEGORY.REST }),
  wake: () => ({ text: 'Waking up', detail: 'Starting a new day', category: CATEGORY.REST }),
  reflect: (soul) => ({
    text: 'Reflecting on life',
    detail: soul.age > 50 ? 'Looking back on a long life' : 'Lost in thought',
    category: CATEGORY.SPIRITUAL,
  }),

  // Modern / Singularity
  commute: () => ({ text: 'Commuting', detail: 'Traveling to the workplace', category: CATEGORY.MOVEMENT }),
  social_media: () => ({ text: 'Scrolling feeds', detail: 'Connected digitally, alone physically', category: CATEGORY.SOCIAL }),
  digital_existence: () => ({ text: 'Existing digitally', detail: 'Consciousness floating in the network', category: CATEGORY.SPIRITUAL }),
  interface: () => ({ text: 'Interfacing with systems', detail: 'Mind linked to the quantum mesh', category: CATEGORY.WORK }),
  commune: () => ({ text: 'Communing with others', detail: 'Shared consciousness in the bio-dome', category: CATEGORY.SOCIAL }),

  // Misc
  plan: (soul) => ({
    text: 'Planning',
    detail: soul.currentAmbition?.goal ? `Scheming: ${soul.currentAmbition.goal}` : 'Thinking about next steps',
    category: CATEGORY.STUDY,
  }),
}

// ─── Core intent resolver ──────────────────────────────────────────────────
export function resolveActionIntent(soul, allSouls, activeConversations, activeCombats) {
  const ctx = _buildContext(soul, allSouls, activeConversations, activeCombats)

  // Priority 1: Dead
  if (!soul.isAlive && soul.deathYear) {
    return _makeIntent('Departed', 'No longer among the living', CATEGORY.REST, ctx)
  }

  // Priority 2: In active combat
  if (ctx.inCombat) {
    return _makeIntent(
      `Fighting ${ctx.combatOpponent}`,
      `Locked in battle — health at ${Math.round(soul.health)}`,
      CATEGORY.COMBAT,
      ctx,
    )
  }

  // Priority 3: In active conversation
  if (ctx.inConversation) {
    return _makeIntent(
      `Talking with ${ctx.conversationPartner}`,
      ctx.conversationType === 'wedding'
        ? 'Exchanging vows'
        : `Deep in ${ctx.conversationType === 'affection' ? 'loving' : ''} conversation`,
      ctx.conversationType === 'wedding' || ctx.conversationType === 'affection'
        ? CATEGORY.ROMANCE
        : CATEGORY.SOCIAL,
      ctx,
    )
  }

  // Priority 4: Critical stat overrides
  if (soul.health < 20 && soul.health > 0) {
    return _makeIntent(
      'Wounded and struggling',
      `Health critical at ${Math.round(soul.health)} — trying to survive`,
      CATEGORY.SURVIVAL,
      ctx,
    )
  }

  // Priority 5: Activity-based intent
  const activity = soul.currentActivity
  const generator = ACTIVITY_INTENTS[activity]
  if (generator) {
    const intent = generator(soul, ctx)
    return _makeIntent(intent.text, intent.detail, intent.category, ctx)
  }

  // Fallback
  return _makeIntent(
    _capitalize(activity?.replace(/_/g, ' ') || 'Idling'),
    `At ${_locationName(soul.currentLocation)}`,
    CATEGORY.REST,
    ctx,
  )
}

// ─── Context builder ────────────────────────────────────────────────────────
function _buildContext(soul, allSouls, activeConversations, activeCombats) {
  const ctx = {
    inCombat: false,
    combatOpponent: null,
    inConversation: false,
    conversationPartner: null,
    conversationType: null,
    nearbyLover: null,
    nearbySpouse: null,
    nearbyWounded: null,
  }

  // Check active combats
  if (activeCombats?.length) {
    for (const combat of activeCombats) {
      if (combat.soulA?.id === soul.id) {
        ctx.inCombat = true
        ctx.combatOpponent = combat.soulB?.name
        break
      }
      if (combat.soulB?.id === soul.id) {
        ctx.inCombat = true
        ctx.combatOpponent = combat.soulA?.name
        break
      }
    }
  }

  // Check active conversations
  if (activeConversations?.length) {
    for (const convo of activeConversations) {
      if (convo.soulA?.id === soul.id) {
        ctx.inConversation = true
        ctx.conversationPartner = convo.soulB?.name
        ctx.conversationType = convo.type
        break
      }
      if (convo.soulB?.id === soul.id) {
        ctx.inConversation = true
        ctx.conversationPartner = convo.soulA?.name
        ctx.conversationType = convo.type
        break
      }
    }
  }

  // Check nearby relationship partners
  if (allSouls) {
    for (const other of allSouls) {
      if (other.id === soul.id || !other.isAlive) continue
      const rel = relationshipManager.get(soul.id, other.id)
      if (!rel) continue

      const dist = _dist(soul.position, other.position)
      if (dist < 15) {
        if (rel.type === 'spouse') ctx.nearbySpouse = other.llmName
        if (rel.type === 'lover') ctx.nearbyLover = other.llmName
        if (other.health < 30) ctx.nearbyWounded = other.llmName
      }
    }
  }

  return ctx
}

// ─── Helpers ────────────────────────────────────────────────────────────────
function _makeIntent(text, detail, category, ctx) {
  return {
    text,
    detail,
    category,
    icon: category.icon,
    color: category.color,
    timestamp: Date.now(),
  }
}

function _dist(a, b) {
  if (!a || !b) return Infinity
  const dx = (a.x || 0) - (b.x || 0)
  const dz = (a.z || 0) - (b.z || 0)
  return Math.sqrt(dx * dx + dz * dz)
}

const LOCATION_NAMES = {
  home: 'home', market: 'market', plaza: 'plaza', tavern: 'tavern',
  workshop: 'workshop', office: 'office', temple: 'temple', cathedral: 'cathedral',
  castle: 'castle', barracks: 'barracks', construction: 'construction site',
  theatre: 'theatre', university: 'university', farm: 'farmland', forest: 'forest',
  perimeter: 'outskirts', park: 'park', factory: 'factory', bio_dome: 'bio-dome',
  cave_entrance: 'caves', forest_edge: 'forest edge', quarry: 'quarry',
  mind_palace: 'mind palace', quantum_server: 'quantum server', arcology: 'arcology',
  workplace: 'workplace',
}

function _locationName(loc) {
  return LOCATION_NAMES[loc] || loc?.replace(/_/g, ' ') || 'somewhere'
}

function _eraStudyDetail(soul) {
  const era = (soul.currentEra || '').toLowerCase()
  if (era.includes('ancient')) return 'Studying star patterns and herb lore'
  if (era.includes('medieval')) return 'Poring over illuminated manuscripts'
  if (era.includes('renaissance')) return 'Investigating natural philosophy'
  if (era.includes('industrial')) return 'Reading technical manuals'
  if (era.includes('modern')) return 'Researching online'
  if (era.includes('singularity')) return 'Downloading knowledge streams'
  return 'Absorbing knowledge'
}

function _capitalize(s) {
  return s ? s.charAt(0).toUpperCase() + s.slice(1) : ''
}
