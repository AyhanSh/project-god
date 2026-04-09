'use client'

import { useEffect, useRef } from 'react'
import { Canvas } from '@react-three/fiber'
import { useGameStore } from '@/store/useGameStore'
import { getEraForYear } from '@/data/eras'
import { aiQueue } from '@/engine/AIQueue'
import { getWorldEngine } from '@/engine/WorldEngine'
import { weatherSystem } from '@/engine/WeatherSystem'
import { economySystem } from '@/engine/EconomySystem'
import { cityEngine } from '@/engine/CityEngine'

import WorldScene from '@/world/WorldScene'
import HUD from '@/ui/HUD'
import SoulInspector from '@/ui/SoulInspector'
import EventLog from '@/ui/EventLog'
import GodPanel from '@/ui/GodPanel'
import SpeechBubbleOverlay from '@/ui/SpeechBubbleOverlay'
import EventCinematicOverlay from '@/events/EventCinematicOverlay'

export default function GameWorld() {
  const engineRef = useRef(null)
  const store = useGameStore

  useEffect(() => {
    aiQueue.start()
    const worldEngine = getWorldEngine(store)
    worldEngine.initialize()
    engineRef.current = worldEngine

    // Main simulation tick at 10Hz
    const interval = setInterval(() => {
      const state = store.getState()
      if (state.paused) return

      const yearsPerTick = 0.1 * state.speedMultiplier
      const newYear = state.currentYear + yearsPerTick
      const era = getEraForYear(newYear)

      // Update year
      state.setYear(newYear)

      // Era transition
      if (era.id !== state.currentEra) {
        state.setEra(era.id, era)
        state.addEventLog({
          year: Math.round(newYear),
          text: `The ${era.name} begins.`,
          type: 'era_change',
        })
      }

      // World engine tick (souls, events, interactions)
      worldEngine.tick(newYear)

      // Weather (update every ~5 ticks for performance)
      if (Math.random() < 0.2) {
        weatherSystem.update(newYear, store)
      }

      // Economy
      economySystem.update(worldEngine.getSouls(), state.buildings, newYear, store)

      // City growth
      cityEngine.update(worldEngine.getSouls(), newYear, era, store)

    }, 100) // 10 ticks per second

    return () => {
      clearInterval(interval)
      aiQueue.stop()
    }
  }, [])

  return (
    <div id="game-root">
      <Canvas
        camera={{ position: [0, 40, 60], fov: 55, near: 0.1, far: 500 }}
        shadows
        gl={{ antialias: true, alpha: false }}
        style={{ position: 'absolute', inset: 0 }}
      >
        <WorldScene />
      </Canvas>

      {/* UI Overlays */}
      <HUD />
      <SoulInspector />
      <EventLog />
      <GodPanel />
      <SpeechBubbleOverlay />
      <EventCinematicOverlay />
    </div>
  )
}
