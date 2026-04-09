'use client'

import { useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useGameStore } from '@/store/useGameStore'

export default function EventCinematicOverlay() {
  const showEventCinematic = useGameStore((s) => s.showEventCinematic)
  const activeCinematic = useGameStore((s) => s.activeCinematic)
  const endCinematic = useGameStore((s) => s.endCinematic)
  const setPaused = useGameStore((s) => s.setPaused)

  useEffect(() => {
    if (!showEventCinematic) return
    const timer = setTimeout(() => {
      endCinematic()
      setPaused(false)
    }, 6000)
    return () => clearTimeout(timer)
  }, [showEventCinematic, endCinematic, setPaused])

  const title = activeCinematic?.title || activeCinematic?.name || 'A Divine Event'
  const description = activeCinematic?.description || activeCinematic?.text || ''

  return (
    <AnimatePresence>
      {showEventCinematic && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.6 }}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.8)',
            zIndex: 200,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            fontFamily: 'Georgia, serif',
            padding: '40px',
            cursor: 'pointer',
          }}
          onClick={() => {
            endCinematic()
            setPaused(false)
          }}
        >
          {/* Decorative top line */}
          <motion.div
            initial={{ scaleX: 0, opacity: 0 }}
            animate={{ scaleX: 1, opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            style={{
              width: '180px',
              height: '1px',
              background: 'linear-gradient(90deg, transparent, #f0c040, transparent)',
              marginBottom: '28px',
            }}
          />

          {/* Title */}
          <motion.h1
            initial={{ opacity: 0, scale: 0.85, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{
              duration: 0.9,
              ease: [0.16, 1, 0.3, 1],
            }}
            style={{
              fontSize: 'clamp(28px, 5vw, 52px)',
              fontWeight: 'bold',
              color: '#f0c040',
              textAlign: 'center',
              letterSpacing: '3px',
              textShadow: '0 0 30px rgba(240,192,64,0.5), 0 0 60px rgba(240,192,64,0.2)',
              lineHeight: 1.2,
              maxWidth: '700px',
              margin: 0,
            }}
          >
            {title}
          </motion.h1>

          {/* Description */}
          {description && (
            <motion.p
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 1 }}
              style={{
                fontSize: 'clamp(14px, 2vw, 18px)',
                color: 'rgba(224, 208, 192, 0.75)',
                textAlign: 'center',
                maxWidth: '560px',
                lineHeight: 1.7,
                marginTop: '20px',
                fontStyle: 'italic',
                letterSpacing: '0.5px',
              }}
            >
              {description}
            </motion.p>
          )}

          {/* Decorative bottom line */}
          <motion.div
            initial={{ scaleX: 0, opacity: 0 }}
            animate={{ scaleX: 1, opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            style={{
              width: '180px',
              height: '1px',
              background: 'linear-gradient(90deg, transparent, #f0c040, transparent)',
              marginTop: '28px',
            }}
          />

          {/* Dismiss hint */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.4 }}
            transition={{ duration: 0.5, delay: 2.5 }}
            style={{
              position: 'absolute',
              bottom: '32px',
              fontSize: '11px',
              letterSpacing: '2px',
              color: 'var(--text-secondary)',
              textTransform: 'uppercase',
            }}
          >
            Click to continue
          </motion.div>

          {/* Progress bar */}
          <motion.div
            initial={{ scaleX: 1 }}
            animate={{ scaleX: 0 }}
            transition={{ duration: 6, ease: 'linear' }}
            style={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              height: '2px',
              background: 'linear-gradient(90deg, #f0c040, rgba(240,192,64,0.3))',
              transformOrigin: 'left',
            }}
          />
        </motion.div>
      )}
    </AnimatePresence>
  )
}
