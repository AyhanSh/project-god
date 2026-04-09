'use client'

import { motion } from 'framer-motion'
import { useGameStore } from '@/store/useGameStore'

const ERA_NAMES = {
  ancient: 'Ancient Age',
  medieval: 'Medieval Age',
  renaissance: 'Renaissance',
  industrial: 'Industrial Age',
  modern: 'Modern Age',
  singularity: 'The Singularity',
}

const ERA_ORDER = ['ancient', 'medieval', 'renaissance', 'industrial', 'modern', 'singularity']

function formatYear(year) {
  if (year < 0) return `${Math.abs(year)} BC`
  if (year === 0) return '1 AD'
  return `${year} AD`
}

const SPEEDS = [1, 2, 5, 10]

export default function HUD() {
  const currentYear = useGameStore((s) => s.currentYear)
  const currentEra = useGameStore((s) => s.currentEra)
  const population = useGameStore((s) => s.population)
  const showGodPanel = useGameStore((s) => s.showGodPanel)
  const speedMultiplier = useGameStore((s) => s.speedMultiplier)
  const paused = useGameStore((s) => s.paused)
  const setSpeed = useGameStore((s) => s.setSpeed)
  const togglePause = useGameStore((s) => s.togglePause)

  const handleGodPanelToggle = () => {
    useGameStore.setState((s) => ({ showGodPanel: !s.showGodPanel }))
  }

  const eraDisplayName = ERA_NAMES[currentEra] || currentEra

  const baseStyle = {
    fontFamily: 'Georgia, serif',
    color: 'var(--text-primary)',
    userSelect: 'none',
  }

  const topBarStyle = {
    ...baseStyle,
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    height: '50px',
    background: 'var(--hud-bg)',
    borderBottom: '1px solid var(--hud-border)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '0 20px',
    zIndex: 100,
    backdropFilter: 'blur(8px)',
  }

  const bottomBarStyle = {
    ...baseStyle,
    position: 'fixed',
    bottom: 0,
    left: 0,
    right: 0,
    height: '45px',
    background: 'var(--hud-bg)',
    borderTop: '1px solid var(--hud-border)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '0 20px',
    zIndex: 100,
    backdropFilter: 'blur(8px)',
  }

  return (
    <>
      {/* Top Bar */}
      <div style={topBarStyle}>
        {/* Left: Title */}
        <motion.div
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
          style={{
            fontSize: '14px',
            fontWeight: 'bold',
            letterSpacing: '2px',
            color: 'var(--accent)',
            textShadow: '0 0 12px var(--accent-glow)',
            minWidth: '160px',
          }}
        >
          ✦ PROJECT GOD
        </motion.div>

        {/* Center: Year + Era */}
        <motion.div
          initial={{ opacity: 0, y: -5 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '1px',
          }}
        >
          <motion.span
            key={currentYear}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
            style={{
              fontSize: '16px',
              fontWeight: 'bold',
              color: 'var(--text-primary)',
              letterSpacing: '1px',
            }}
          >
            {formatYear(currentYear)}
          </motion.span>
          <span
            style={{
              fontSize: '10px',
              color: 'var(--text-secondary)',
              letterSpacing: '2px',
              textTransform: 'uppercase',
            }}
          >
            {eraDisplayName}
          </span>
        </motion.div>

        {/* Right: Population */}
        <motion.div
          initial={{ opacity: 0, x: 10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
          style={{
            fontSize: '13px',
            color: 'var(--text-secondary)',
            letterSpacing: '1px',
            minWidth: '160px',
            textAlign: 'right',
          }}
        >
          <span style={{ color: 'var(--text-primary)', fontWeight: 'bold' }}>POP:</span>{' '}
          <motion.span
            key={population}
            initial={{ color: 'var(--success)' }}
            animate={{ color: 'var(--text-primary)' }}
            transition={{ duration: 1.5 }}
          >
            {population.toLocaleString()}
          </motion.span>
        </motion.div>
      </div>

      {/* Bottom Bar */}
      <div style={bottomBarStyle}>
        {/* Left: God Powers button */}
        <motion.button
          whileHover={{ scale: 1.05, boxShadow: '0 0 12px var(--accent-glow)' }}
          whileTap={{ scale: 0.95 }}
          onClick={handleGodPanelToggle}
          style={{
            background: showGodPanel ? 'var(--accent)' : 'rgba(107, 92, 231, 0.15)',
            border: '1px solid var(--accent)',
            color: showGodPanel ? '#fff' : 'var(--accent)',
            padding: '4px 14px',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '11px',
            fontFamily: 'Georgia, serif',
            letterSpacing: '1px',
            textTransform: 'uppercase',
            transition: 'background 0.2s',
            minWidth: '120px',
          }}
        >
          ⚡ God Powers
        </motion.button>

        {/* Center: Era Timeline */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
          }}
        >
          {ERA_ORDER.map((era, idx) => {
            const isActive = era === currentEra
            const isPast = ERA_ORDER.indexOf(era) < ERA_ORDER.indexOf(currentEra)
            return (
              <div key={era} style={{ display: 'flex', alignItems: 'center' }}>
                <motion.div
                  title={ERA_NAMES[era]}
                  animate={isActive ? {
                    scale: [1, 1.2, 1],
                    boxShadow: ['0 0 0px var(--accent-glow)', '0 0 8px var(--accent-glow)', '0 0 4px var(--accent-glow)'],
                  } : {}}
                  transition={isActive ? { duration: 2, repeat: Infinity } : {}}
                  style={{
                    width: isActive ? '10px' : '7px',
                    height: isActive ? '10px' : '7px',
                    borderRadius: '50%',
                    background: isActive
                      ? 'var(--accent)'
                      : isPast
                        ? 'rgba(107, 92, 231, 0.5)'
                        : 'rgba(107, 92, 231, 0.15)',
                    border: isActive
                      ? '1px solid var(--accent)'
                      : '1px solid rgba(107, 92, 231, 0.3)',
                    cursor: 'default',
                    transition: 'all 0.3s',
                  }}
                />
                {idx < ERA_ORDER.length - 1 && (
                  <div
                    style={{
                      width: '16px',
                      height: '1px',
                      background: isPast
                        ? 'rgba(107, 92, 231, 0.5)'
                        : 'rgba(107, 92, 231, 0.15)',
                      margin: '0 2px',
                    }}
                  />
                )}
              </div>
            )
          })}
          <span
            style={{
              marginLeft: '8px',
              fontSize: '9px',
              color: 'var(--text-secondary)',
              letterSpacing: '1px',
              textTransform: 'uppercase',
            }}
          >
            {ERA_NAMES[currentEra]}
          </span>
        </div>

        {/* Right: Speed Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          {/* Pause Button */}
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={togglePause}
            style={{
              background: paused ? 'rgba(255, 68, 68, 0.2)' : 'rgba(255,255,255,0.05)',
              border: `1px solid ${paused ? 'var(--danger)' : 'rgba(255,255,255,0.15)'}`,
              color: paused ? 'var(--danger)' : 'var(--text-secondary)',
              width: '28px',
              height: '26px',
              borderRadius: '3px',
              cursor: 'pointer',
              fontSize: '13px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.2s',
              marginRight: '4px',
            }}
          >
            {paused ? '▶' : '⏸'}
          </motion.button>

          {/* Speed Buttons */}
          {SPEEDS.map((s) => (
            <motion.button
              key={s}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => setSpeed(s)}
              style={{
                background: speedMultiplier === s && !paused
                  ? 'var(--accent)'
                  : 'rgba(107, 92, 231, 0.1)',
                border: `1px solid ${speedMultiplier === s && !paused ? 'var(--accent)' : 'rgba(107, 92, 231, 0.25)'}`,
                color: speedMultiplier === s && !paused ? '#fff' : 'var(--text-secondary)',
                width: '32px',
                height: '26px',
                borderRadius: '3px',
                cursor: 'pointer',
                fontSize: '10px',
                fontFamily: 'Georgia, serif',
                letterSpacing: '0.5px',
                transition: 'all 0.2s',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {s}x
            </motion.button>
          ))}
        </div>
      </div>
    </>
  )
}
