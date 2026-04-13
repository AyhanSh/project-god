'use client'

import { useEffect } from 'react'
import { Canvas } from '@react-three/fiber'
import { useGameStore } from '@/store/useGameStore'
import SandboxScene from '@/world/SandboxScene'
import SandboxPanel from '@/ui/SandboxPanel'
import DevPanel from '@/ui/DevPanel'
import EventLog from '@/ui/EventLog'
import SoulInspector from '@/ui/SoulInspector'

export default function SandboxWorld() {
  useEffect(() => {
    // Add initial event log entry
    useGameStore.getState().addEventLog({
      year: 0,
      text: 'Sandbox mode initialized. Use the panel to test features.',
      type: 'system',
    })
  }, [])

  const handleBackToMenu = () => {
    useGameStore.setState({
      gameMode: 'menu',
      gameStarted: false,
      souls: [],
      buildings: [],
      eventLog: [],
      population: 0,
      currentYear: -3000,
      currentEra: 'ancient',
      currentEraData: null,
      paused: true,
      sandboxDragBuildingId: null,
      sandboxForceAnimation: null,
      sandboxTrees: [],
      sandboxRocks: [],
      sandboxHarvestTasks: [],
    })
  }

  return (
    <div id="game-root">
      <Canvas
        camera={{ position: [0, 50, 70], fov: 55, near: 0.1, far: 2000 }}
        shadows
        gl={{ antialias: true, alpha: false }}
        style={{ position: 'absolute', inset: 0 }}
      >
        <SandboxScene />
      </Canvas>

      {/* Sandbox Panel (right side) */}
      <SandboxPanel />

      {/* Dev Panel (bottom left, toggled) */}
      <DevPanel />

      {/* Event Log (bottom left) */}
      <EventLog />

      {/* Soul Inspector (shown when a soul is selected) */}
      <SoulInspector />

      {/* Bottom bar with sandbox label + controls */}
      <div style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: '300px',
        height: '40px',
        background: 'var(--hud-bg)',
        borderTop: '1px solid var(--hud-border)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 16px',
        zIndex: 100,
        backdropFilter: 'blur(8px)',
        fontFamily: 'Georgia, serif',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button
            onClick={handleBackToMenu}
            style={{
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid var(--hud-border)',
              color: 'var(--text-secondary)',
              padding: '3px 10px',
              borderRadius: '3px',
              cursor: 'pointer',
              fontFamily: 'Georgia, serif',
              fontSize: '10px',
              letterSpacing: '0.5px',
            }}
          >
            \u2190 Menu
          </button>
          <span style={{
            fontSize: '12px',
            fontWeight: 'bold',
            letterSpacing: '2px',
            color: '#4fc3f7',
            textShadow: '0 0 10px rgba(79,195,247,0.4)',
            textTransform: 'uppercase',
          }}>
            Sandbox Mode
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{
            fontSize: '10px',
            color: 'var(--text-secondary)',
            letterSpacing: '1px',
          }}>
            Test all game features
          </span>
          <DevPanelToggle />
          <FlyToggle />
          <FlySpeedControl />
        </div>
      </div>
    </div>
  )
}

function DevPanelToggle() {
  const show = useGameStore((s) => s.showDevPanel)
  return (
    <button
      onClick={() => useGameStore.setState({ showDevPanel: !show })}
      style={{
        background: show ? '#4fc3f7' : 'rgba(79,195,247,0.15)',
        border: '1px solid #4fc3f7',
        color: show ? '#000' : '#4fc3f7',
        padding: '2px 10px',
        borderRadius: '3px',
        cursor: 'pointer',
        fontFamily: 'Georgia, serif',
        fontSize: '10px',
        letterSpacing: '0.5px',
        textTransform: 'uppercase',
      }}
    >
      {show ? 'Dev: ON' : 'Dev'}
    </button>
  )
}

function FlyToggle() {
  const flyMode = useGameStore((s) => s.flyMode)
  const toggleFlyMode = useGameStore((s) => s.toggleFlyMode)
  return (
    <button
      onClick={toggleFlyMode}
      style={{
        background: flyMode ? '#ffb74d' : 'rgba(255,183,77,0.15)',
        border: '1px solid #ffb74d',
        color: flyMode ? '#000' : '#ffb74d',
        padding: '2px 10px',
        borderRadius: '3px',
        cursor: 'pointer',
        fontFamily: 'Georgia, serif',
        fontSize: '10px',
        letterSpacing: '0.5px',
        textTransform: 'uppercase',
      }}
    >
      {flyMode ? 'Fly: ON' : 'Fly'}
    </button>
  )
}

function FlySpeedControl() {
  const flyMode = useGameStore((s) => s.flyMode)
  const flySpeed = useGameStore((s) => s.flySpeed)
  const increase = useGameStore((s) => s.increaseFlySpeed)
  const decrease = useGameStore((s) => s.decreaseFlySpeed)

  if (!flyMode) return null

  const btnStyle = {
    background: 'rgba(255,183,77,0.15)',
    border: '1px solid #ffb74d',
    color: '#ffb74d',
    padding: '2px 6px',
    borderRadius: '3px',
    cursor: 'pointer',
    fontFamily: 'Georgia, serif',
    fontSize: '12px',
    lineHeight: '1',
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
      <button onClick={decrease} style={btnStyle}>-</button>
      <span style={{
        fontSize: '10px',
        color: '#ffb74d',
        fontFamily: 'Georgia, serif',
        minWidth: '32px',
        textAlign: 'center',
      }}>
        {flySpeed}
      </span>
      <button onClick={increase} style={btnStyle}>+</button>
    </div>
  )
}
