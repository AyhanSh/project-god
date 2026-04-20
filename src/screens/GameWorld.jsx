'use client'

import { useEffect, useRef } from 'react'
import { Canvas } from '@react-three/fiber'
import { useGameStore } from '@/store/useGameStore'
import { getEraForYear } from '@/data/eras'
import { aiQueue } from '@/engine/AIQueue'
import { getWorldEngine, destroyWorldEngine } from '@/engine/WorldEngine'
import { weatherSystem } from '@/engine/WeatherSystem'
import { economySystem, diplomacySystem } from '@/engine/EconomySystem'
import { cityEngine } from '@/engine/CityEngine'
import { audioEngine } from '@/engine/AudioEngine'
import { saveLoadEngine } from '@/engine/SaveLoadEngine'
import { resetAllEngines } from '@/engine/resetEngines'

import WorldScene from '@/world/WorldScene'
import HUD from '@/ui/HUD'
import SoulInspector from '@/ui/SoulInspector'
import EventLog from '@/ui/EventLog'
import GodPanel from '@/ui/GodPanel'
import DevPanel from '@/ui/DevPanel'
import EventCinematicOverlay from '@/events/EventCinematicOverlay'
import { CanvasErrorBoundary, UIErrorBoundary } from '@/ui/ErrorBoundary'
import OnboardingOverlay from '@/ui/OnboardingOverlay'
import DiplomacyPanel from '@/ui/DiplomacyPanel'

export default function GameWorld() {
  const engineRef = useRef(null)
  const store = useGameStore

  useEffect(() => {
    // Clear any residual state from a previous session (singletons persist
    // across HMR and menu→game transitions).
    resetAllEngines()
    aiQueue.start()
    const worldEngine = getWorldEngine(store)
    worldEngine.initialize()
    engineRef.current = worldEngine

    // Main simulation tick at 10Hz
    const TICK_MS = 100 // 10Hz
    const HOURS_PER_TICK_1X = 24 / 600   // 24 hours in 600 ticks (60s) = 0.04 hours/tick
    const YEARS_PER_TICK_1X = 1 / 60     // ~0.01667 years/tick → 1 year per 6 seconds

    const interval = setInterval(() => {
      const state = store.getState()
      if (state.paused) return

      const speed = state.speedMultiplier

      // Advance time of day (drives day/night cycle, visuals, routines)
      const newTimeOfDay = state.timeOfDay + HOURS_PER_TICK_1X * speed
      state.setTimeOfDay(newTimeOfDay)

      // Advance game year at slower rate (drives era transitions, events, aging)
      const yearsPerTick = YEARS_PER_TICK_1X * speed
      const newYear = state.currentYear + yearsPerTick
      const era = getEraForYear(newYear)

      state.setYear(newYear)

      if (era.id !== state.currentEra) {
        state.setEra(era.id, era)
        state.addEventLog({
          year: Math.round(newYear),
          text: `The ${era.name} begins.`,
          type: 'era_change',
        })
      }

      worldEngine.tick(newYear)

      if (Math.random() < 0.2) {
        weatherSystem.update(newYear, store)
      }

      economySystem.update(worldEngine.getSouls(), state.buildings, newYear, store, era)
      diplomacySystem.update(worldEngine.getSouls(), cityEngine.getCities(), newYear, store)
      cityEngine.update(worldEngine.getSouls(), newYear, era, store)
    }, TICK_MS)

    // Audio: subscribe to state changes for SFX + ambient + mute
    let lastEventTimestamp = 0
    let prevEra = store.getState().currentEra
    let prevMuted = store.getState().muted
    const unsubAudio = store.subscribe((state) => {
      // SFX on new event log entries
      const latest = state.eventLog[0]
      if (latest && latest.timestamp !== lastEventTimestamp) {
        lastEventTimestamp = latest.timestamp || Date.now()
        const sfxTypes = ['birth', 'death', 'combat', 'marriage', 'era_change', 'building_complete', 'lightning', 'plague', 'god_power', 'blessing']
        if (sfxTypes.includes(latest.type)) {
          audioEngine.playEvent(latest.type)
        }
      }
      // Era change → ambient swap
      if (state.currentEra !== prevEra) {
        prevEra = state.currentEra
        audioEngine.playAmbient(state.currentEra)
      }
      // Mute toggle
      if (state.muted !== prevMuted) {
        prevMuted = state.muted
        state.muted ? audioEngine.mute() : audioEngine.unmute()
      }
    })

    // Auto-save every 60 seconds while unpaused
    const autoSaveInterval = setInterval(() => {
      if (!store.getState().paused) {
        saveLoadEngine.save('auto')
      }
    }, 60000)

    return () => {
      clearInterval(interval)
      clearInterval(autoSaveInterval)
      aiQueue.stop()
      unsubAudio()
      destroyWorldEngine()
      resetAllEngines()
    }
  }, [])

  return (
    <div id="game-root">
      <CanvasErrorBoundary>
        <Canvas
          camera={{ position: [0, 60, 90], fov: 55, near: 0.1, far: 2000 }}
          shadows
          gl={{ antialias: true, alpha: false }}
          style={{ position: 'absolute', inset: 0 }}
        >
          <WorldScene />
        </Canvas>
      </CanvasErrorBoundary>

      <OnboardingOverlay />

      {/* UI Overlays */}
      <UIErrorBoundary>
        <HUD />
        <SoulInspector />
        <EventLog />
        <GodPanel />
        <DevPanel />
        <DiplomacyPanel />
        <EventCinematicOverlay />
      </UIErrorBoundary>
    </div>
  )
}
