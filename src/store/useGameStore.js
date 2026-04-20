'use client'
import { create } from 'zustand'

export const useGameStore = create((set, get) => ({
  // === MODE ===
  gameMode: 'menu', // 'menu' | 'game' | 'sandbox'

  // === TIME ===
  currentYear: -3000,
  tickRate: 1,
  speedMultiplier: 1,
  timeOfDay: 0, // 0-23.99 hours, cycles independently of year
  paused: true,
  gameStarted: false,

  // === ERA ===
  currentEra: 'ancient',
  currentEraData: null,

  // === SOULS ===
  souls: [],
  selectedSoulId: null,

  // === CITIES ===
  cities: [],
  buildings: [],
  buildingQueue: [],
  constructionSites: [],

  // === INTERACTIONS ===
  activeConversations: [],
  activeCombats: [],

  // === WORLD ===
  terrain: null,
  weather: 'clear',
  season: 'spring',
  temperature: 20,
  worldState: 'peaceful',
  techLevel: 0,
  lastMajorEvent: 'The dawn of civilization',
  population: 6,
  populationStats: { totalBorn: 0, totalDied: 0, generationStats: {} },
  setPopulationStats: (stats) => set({ populationStats: stats }),

  // === EVENTS ===
  activeEvents: [],
  completedEvents: [],
  eventLog: [],

  // === ECONOMY ===
  foodSupply: 100,
  happinessAvg: 60,
  warOngoing: false,
  wood: 0,
  stone: 0,
  ore: 0,

  // === GOD ===
  godFavor: 500,
  godPowerCooldown: {},

  // === UI ===
  showSoulInspector: false,
  showGodPanel: false,
  showDevPanel: false,
  showDiplomacyPanel: false,
  showEventCinematic: false,
  activeCinematic: null,
  cameraTarget: null,
  cameraMode: 'free', // 'free' | 'follow' | 'cinematic'
  flyMode: false,
  flySpeed: 40, // base fly speed (WASD movement units/sec)
  flySmoothness: 0, // 0 = instant (no lerp), 1 = very smooth/sluggish

  // === DEV OVERRIDES === (null = auto / use engine values)
  devWeather: null,
  devFogDensity: null,
  devTimeOfDay: null, // 0-23 hour override

  // === SANDBOX ===
  sandboxDragBuildingId: null,  // building id being dragged (null = none)
  sandboxDragSoulId: null,      // soul id being dragged (null = none)
  sandboxForceAnimation: null,  // force all sandbox souls to this animation
  sandboxTrees: [],              // sandbox-placed trees [{id, position, health}]
  sandboxRocks: [],              // sandbox-placed rocks [{id, position, health, type}]
  sandboxHarvestTasks: [],       // [{soulId, targetId, targetType: 'tree'|'rock'}]

  // === ACTIONS ===
  setYear: (year) => set({ currentYear: year }),
  advanceYear: (delta) => set((s) => {
    const newYear = s.currentYear + delta
    return { currentYear: newYear }
  }),

  setEra: (era, eraData) => set({ currentEra: era, currentEraData: eraData }),

  togglePause: () => set((s) => ({ paused: !s.paused })),
  setPaused: (p) => set({ paused: p }),
  setSpeed: (mult) => set({ speedMultiplier: mult }),
  setTimeOfDay: (t) => set({ timeOfDay: ((t % 24) + 24) % 24 }),

  startGame: () => set({ gameStarted: true, paused: false, gameMode: 'game' }),
  startSandbox: () => set({ gameStarted: true, paused: true, gameMode: 'sandbox' }),
  setGameMode: (mode) => set({ gameMode: mode }),

  setSouls: (souls) => set({ souls }),
  updateSoul: (id, updates) => set((s) => ({
    souls: s.souls.map((soul) =>
      soul.id === id ? { ...soul, ...updates } : soul
    ),
  })),
  selectSoul: (id) => set({ selectedSoulId: id, showSoulInspector: !!id }),

  addCity: (city) => set((s) => ({ cities: [...s.cities, city] })),
  addBuilding: (building) => set((s) => ({ buildings: [...s.buildings, building] })),
  updateBuilding: (id, updates) => set((s) => ({
    buildings: s.buildings.map((b) => b.id === id ? { ...b, ...updates } : b),
  })),
  setConstructionSites: (sites) => set({ constructionSites: sites }),
  setActiveConversations: (convos) => set({ activeConversations: convos }),
  setActiveCombats: (combats) => set({ activeCombats: combats }),

  setWeather: (weather) => set({ weather }),
  setSeason: (season) => set({ season }),

  addEventLog: (entry) => set((s) => ({
    eventLog: [{ ...entry, timestamp: Date.now() }, ...s.eventLog].slice(0, 200),
  })),

  setGodFavor: (favor) => set({ godFavor: favor }),
  spendGodFavor: (cost) => set((s) => ({
    godFavor: Math.max(0, s.godFavor - cost),
  })),

  setCameraTarget: (target) => set({ cameraTarget: target }),
  setCameraMode: (mode) => set({ cameraMode: mode }),
  toggleFlyMode: () => set((s) => ({ flyMode: !s.flyMode })),
  setFlySpeed: (speed) => set({ flySpeed: Math.max(5, Math.min(200, speed)) }),
  setFlySmoothness: (v) => set({ flySmoothness: Math.max(0, Math.min(1, v)) }),
  increaseFlySpeed: () => set((s) => ({ flySpeed: Math.min(200, s.flySpeed + 10) })),
  decreaseFlySpeed: () => set((s) => ({ flySpeed: Math.max(5, s.flySpeed - 10) })),

  triggerCinematic: (cinematic) => set({
    showEventCinematic: true,
    activeCinematic: cinematic,
    paused: true,
  }),
  endCinematic: () => set({
    showEventCinematic: false,
    activeCinematic: null,
  }),

  addResource: (type, amount) => set((s) => ({ [type]: (s[type] || 0) + amount })),

  setWorldState: (state) => set({ worldState: state }),
  setTechLevel: (level) => set({ techLevel: level }),
  setPopulation: (pop) => set({ population: pop }),
  setWarOngoing: (v) => set({ warOngoing: v }),

  // === GOD TARGETING ===
  godTargeting: null,
  godTargetingFirst: null, // first soul id for two_souls powers
  setGodTargeting: (p) => set({ godTargeting: p, godTargetingFirst: null }),
  setGodTargetingFirst: (id) => set({ godTargetingFirst: id }),
  clearGodTargeting: () => set({ godTargeting: null, godTargetingFirst: null }),

  // === CAMPFIRES ===
  campfires: [],
  setCampfires: (campfires) => set({ campfires }),

  // === AUDIO ===
  muted: false,
  toggleMute: () => set((s) => ({ muted: !s.muted })),
  toggleDiplomacyPanel: () => set((s) => ({ showDiplomacyPanel: !s.showDiplomacyPanel })),
}))
