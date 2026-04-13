'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { useGameStore } from '@/store/useGameStore'

const WEATHERS = ['clear', 'rain', 'storm', 'snow', 'heatwave']

export default function DevPanel() {
  const show = useGameStore((s) => s.showDevPanel)
  const devWeather = useGameStore((s) => s.devWeather)
  const devFogDensity = useGameStore((s) => s.devFogDensity)
  const devTimeOfDay = useGameStore((s) => s.devTimeOfDay)
  const weather = useGameStore((s) => s.weather)

  const setDevWeather = (v) => {
    useGameStore.setState({ devWeather: v })
    if (v !== null) useGameStore.getState().setWeather(v)
  }
  const setDevFogDensity = (v) => useGameStore.setState({ devFogDensity: v })
  const setDevTimeOfDay = (v) => useGameStore.setState({ devTimeOfDay: v })

  const resetAll = () => {
    useGameStore.setState({ devWeather: null, devFogDensity: null, devTimeOfDay: null })
  }

  const panelStyle = {
    position: 'fixed',
    bottom: '45px',
    left: '310px',
    width: '260px',
    background: 'var(--hud-bg)',
    border: '1px solid var(--hud-border)',
    backdropFilter: 'blur(10px)',
    zIndex: 85,
    fontFamily: 'Georgia, serif',
    color: 'var(--text-primary)',
    borderRadius: '6px 6px 0 0',
    overflow: 'hidden',
  }

  const labelStyle = {
    fontSize: '10px',
    letterSpacing: '1px',
    textTransform: 'uppercase',
    color: 'var(--text-secondary)',
    marginBottom: '4px',
  }

  const sectionStyle = {
    padding: '8px 14px',
    borderBottom: '1px solid var(--hud-border)',
  }

  const btnStyle = (active) => ({
    padding: '3px 8px',
    fontSize: '10px',
    fontFamily: 'Georgia, serif',
    border: active ? '1px solid #4fc3f7' : '1px solid var(--hud-border)',
    background: active ? 'rgba(79,195,247,0.2)' : 'rgba(255,255,255,0.03)',
    color: active ? '#4fc3f7' : 'var(--text-secondary)',
    borderRadius: '3px',
    cursor: 'pointer',
    transition: 'all 0.15s',
    textTransform: 'capitalize',
  })

  const sliderStyle = {
    width: '100%',
    accentColor: '#4fc3f7',
    cursor: 'pointer',
  }

  const hourLabel = (h) => {
    if (h === 0) return '12 AM'
    if (h < 12) return `${h} AM`
    if (h === 12) return '12 PM'
    return `${h - 12} PM`
  }

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 20, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 280, damping: 26 }}
          style={panelStyle}
        >
          {/* Header */}
          <div style={{
            padding: '10px 14px 8px',
            borderBottom: '1px solid var(--hud-border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}>
            <span style={{
              fontSize: '12px',
              fontWeight: 'bold',
              letterSpacing: '2px',
              textTransform: 'uppercase',
              color: '#4fc3f7',
              textShadow: '0 0 10px rgba(79,195,247,0.4)',
            }}>
              Dev Controls
            </span>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={resetAll}
              style={{
                fontSize: '9px',
                fontFamily: 'Georgia, serif',
                padding: '2px 8px',
                border: '1px solid rgba(255,255,255,0.15)',
                background: 'rgba(255,255,255,0.05)',
                color: 'var(--text-secondary)',
                borderRadius: '3px',
                cursor: 'pointer',
                letterSpacing: '0.5px',
                textTransform: 'uppercase',
              }}
            >
              Reset All
            </motion.button>
          </div>

          {/* Weather */}
          <div style={sectionStyle}>
            <div style={{ ...labelStyle, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>Weather</span>
              {devWeather !== null && (
                <button onClick={() => setDevWeather(null)} style={{ ...btnStyle(false), fontSize: '8px', padding: '1px 5px' }}>
                  Auto
                </button>
              )}
            </div>
            <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
              {WEATHERS.map((w) => (
                <motion.button
                  key={w}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setDevWeather(w)}
                  style={btnStyle(devWeather === w || (devWeather === null && weather === w))}
                >
                  {w}
                </motion.button>
              ))}
            </div>
          </div>

          {/* Fog Density */}
          <div style={sectionStyle}>
            <div style={{ ...labelStyle, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>Fog Density</span>
              <span style={{ fontSize: '10px', color: devFogDensity !== null ? '#4fc3f7' : 'var(--text-secondary)' }}>
                {devFogDensity !== null ? devFogDensity.toFixed(4) : 'Auto'}
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="0.04"
              step="0.001"
              value={devFogDensity ?? 0.006}
              onChange={(e) => setDevFogDensity(parseFloat(e.target.value))}
              style={sliderStyle}
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '8px', color: 'var(--text-secondary)', marginTop: '2px' }}>
              <span>None</span>
              {devFogDensity !== null && (
                <button onClick={() => setDevFogDensity(null)} style={{ ...btnStyle(false), fontSize: '8px', padding: '1px 5px' }}>
                  Auto
                </button>
              )}
              <span>Dense</span>
            </div>
          </div>

          {/* Time of Day */}
          <div style={{ ...sectionStyle, borderBottom: 'none' }}>
            <div style={{ ...labelStyle, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>Time of Day</span>
              <span style={{ fontSize: '10px', color: devTimeOfDay !== null ? '#4fc3f7' : 'var(--text-secondary)' }}>
                {devTimeOfDay !== null ? hourLabel(devTimeOfDay) : 'Auto'}
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="23"
              step="1"
              value={devTimeOfDay ?? 12}
              onChange={(e) => setDevTimeOfDay(parseInt(e.target.value, 10))}
              style={sliderStyle}
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '8px', color: 'var(--text-secondary)', marginTop: '2px' }}>
              <span>12 AM</span>
              {devTimeOfDay !== null && (
                <button onClick={() => setDevTimeOfDay(null)} style={{ ...btnStyle(false), fontSize: '8px', padding: '1px 5px' }}>
                  Auto
                </button>
              )}
              <span>11 PM</span>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
