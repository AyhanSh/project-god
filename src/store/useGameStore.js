'use client'
import { create } from 'zustand'

export const useGameStore = create((set, get) => ({
  // === TIME ===
  currentYear: -3000,
  tickRate: 1,
  speedMultiplier: 1,
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

  // === EVENTS ===
  activeEvents: [],
  completedEvents: [],
  eventLog: [],

  // === ECONOMY ===
  foodSupply: 100,
  happinessAvg: 60,
  warOngoing: false,

  // === GOD ===
  godFavor: 500,
  godPowerCooldown: {},

  // === UI ===
  showSoulInspector: false,
  showGodPanel: false,
  showEventCinematic: false,
  activeCinematic: null,
  cameraTarget: null,
  cameraMode: 'free', // 'free' | 'follow' | 'cinematic'

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

  startGame: () => set({ gameStarted: true, paused: false }),

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
    eventLog: [entry, ...s.eventLog].slice(0, 200),
  })),

  setGodFavor: (favor) => set({ godFavor: favor }),
  spendGodFavor: (cost) => set((s) => ({
    godFavor: Math.max(0, s.godFavor - cost),
  })),

  setCameraTarget: (target) => set({ cameraTarget: target }),
  setCameraMode: (mode) => set({ cameraMode: mode }),

  triggerCinematic: (cinematic) => set({
    showEventCinematic: true,
    activeCinematic: cinematic,
    paused: true,
  }),
  endCinematic: () => set({
    showEventCinematic: false,
    activeCinematic: null,
  }),

  setWorldState: (state) => set({ worldState: state }),
  setTechLevel: (level) => set({ techLevel: level }),
  setPopulation: (pop) => set({ population: pop }),
}))
