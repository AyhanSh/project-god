'use client'
import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

const LOADING_PHASES = [
  { text: 'Shaping the earth...', duration: 800 },
  { text: 'Filling the oceans...', duration: 700 },
  { text: 'Planting the first forests...', duration: 600 },
  { text: 'Breathing life into souls...', duration: 900 },
  { text: 'Weaving the threads of fate...', duration: 800 },
  { text: 'The world awaits its God.', duration: 1200 },
]

export default function LoadingScreen({ onComplete }) {
  const [phase, setPhase] = useState(0)
  const [progress, setProgress] = useState(0)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    let timeout
    const totalDuration = LOADING_PHASES.reduce((s, p) => s + p.duration, 0)
    let elapsed = 0

    const advancePhase = (idx) => {
      if (idx >= LOADING_PHASES.length) {
        setReady(true)
        return
      }
      setPhase(idx)
      elapsed += idx > 0 ? LOADING_PHASES[idx - 1].duration : 0
      setProgress(Math.min(100, Math.round((elapsed / totalDuration) * 100)))
      timeout = setTimeout(() => advancePhase(idx + 1), LOADING_PHASES[idx].duration)
    }

    advancePhase(0)
    return () => clearTimeout(timeout)
  }, [])

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9999,
      background: 'linear-gradient(180deg, #0a0a1a 0%, #1a0a2e 50%, #0a0a1a 100%)',
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      fontFamily: "'Georgia', serif", color: '#e0d0c0',
    }}>
      <motion.h1
        initial={{ opacity: 0, y: -30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1.5 }}
        style={{
          fontSize: '4rem', fontWeight: 300, letterSpacing: '0.3em',
          color: '#f0e0c8', textShadow: '0 0 40px rgba(200,180,140,0.3)',
          marginBottom: '2rem',
        }}
      >
        PROJECT GOD
      </motion.h1>

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.5 }}
        transition={{ delay: 0.8, duration: 1 }}
        style={{ fontSize: '0.9rem', letterSpacing: '0.2em', marginBottom: '3rem', color: '#a09080' }}
      >
        Real minds. Real lives. Real world.
      </motion.p>

      <div style={{ width: '300px', marginBottom: '2rem' }}>
        <div style={{
          height: '2px', background: '#2a1a3a', borderRadius: '1px', overflow: 'hidden',
        }}>
          <motion.div
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.5 }}
            style={{ height: '100%', background: 'linear-gradient(90deg, #6B5CE7, #9C27B0)', borderRadius: '1px' }}
          />
        </div>
      </div>

      <AnimatePresence mode="wait">
        <motion.p
          key={phase}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 0.7, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.4 }}
          style={{ fontSize: '0.85rem', color: '#c0b0a0', fontStyle: 'italic', minHeight: '1.5em' }}
        >
          {LOADING_PHASES[phase]?.text}
        </motion.p>
      </AnimatePresence>

      <AnimatePresence>
        {ready && (
          <motion.button
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3, duration: 0.5 }}
            onClick={onComplete}
            style={{
              marginTop: '3rem', padding: '14px 48px',
              background: 'transparent', border: '1px solid #6B5CE7',
              color: '#c0b0e0', fontSize: '1rem', letterSpacing: '0.15em',
              cursor: 'pointer', fontFamily: "'Georgia', serif",
              transition: 'all 0.3s ease',
            }}
            whileHover={{
              background: '#6B5CE720',
              borderColor: '#9C27B0',
              scale: 1.05,
            }}
            whileTap={{ scale: 0.95 }}
          >
            BEGIN CREATION
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  )
}
