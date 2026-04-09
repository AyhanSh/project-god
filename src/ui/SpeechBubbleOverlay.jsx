'use client'

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useGameStore } from '@/store/useGameStore'

const THOUGHT_STYLES = {
  thought_bubble: {
    icon: '💭',
    borderAccent: 'rgba(150, 140, 200, 0.4)',
    textColor: '#c0b8d8',
    label: 'Thinking',
  },
  speech_bubble: {
    icon: '💬',
    borderAccent: 'rgba(200, 200, 220, 0.4)',
    textColor: '#d8d4e0',
    label: 'Speaking',
  },
  divine_revelation: {
    icon: '✨',
    borderAccent: 'rgba(240, 192, 64, 0.5)',
    textColor: '#f0d070',
    label: 'Divine Vision',
  },
  love_panel: {
    icon: '💕',
    borderAccent: 'rgba(255, 105, 180, 0.45)',
    textColor: '#f0a0c0',
    label: 'Heart',
  },
  death_panel: {
    icon: '💀',
    borderAccent: 'rgba(200, 80, 80, 0.4)',
    textColor: '#c09090',
    label: 'Last Words',
  },
  revelation_panel: {
    icon: '🔮',
    borderAccent: 'rgba(156, 39, 176, 0.5)',
    textColor: '#d0a0f0',
    label: 'Awakening',
  },
  ambition_notification: {
    icon: '🔥',
    borderAccent: 'rgba(255, 160, 50, 0.45)',
    textColor: '#e0c090',
    label: 'Ambition',
  },
}

function getStyle(type) {
  return THOUGHT_STYLES[type] || THOUGHT_STYLES.thought_bubble
}

// Map soul ids to their aura colors for the accent dot
const SOUL_AURAS = {
  soul_claude: '#6B5CE7',
  soul_gemini: '#4285F4',
  soul_mistral: '#FF6B35',
  soul_palm: '#34A853',
  soul_llama: '#9C27B0',
  soul_gpt: '#10A37F',
}

let nextId = 0

export default function SpeechBubbleOverlay() {
  const souls = useGameStore((s) => s.souls)
  const [queue, setQueue] = useState([])
  const seenRef = useRef(new Map())

  useEffect(() => {
    if (!souls || souls.length === 0) return

    souls.forEach((soul) => {
      const thought = soul.latestThought
      if (!thought || !thought.text) return

      const lastSeen = seenRef.current.get(soul.id)
      if (lastSeen === thought.text) return

      seenRef.current.set(soul.id, thought.text)

      const item = {
        id: nextId++,
        soulId: soul.id,
        soulName: soul.llmName || thought.soulName || 'Unknown Soul',
        aura: soul.aura || SOUL_AURAS[soul.id] || '#6B5CE7',
        text: thought.text,
        type: thought.displayAs || thought.type || 'thought_bubble',
        timestamp: Date.now(),
      }

      setQueue((prev) => [...prev, item].slice(-4))
    })
  }, [souls])

  // Auto-dismiss oldest after 10 seconds
  useEffect(() => {
    if (queue.length === 0) return
    const timer = setTimeout(() => {
      setQueue((prev) => prev.slice(1))
    }, 10000)
    return () => clearTimeout(timer)
  }, [queue])

  const dismissItem = (id) => {
    setQueue((prev) => prev.filter((item) => item.id !== id))
  }

  return (
    <div
      style={{
        position: 'fixed',
        right: 0,
        top: '368px', // Below event log (60px top + 300px log + 8px gap)
        width: '250px',
        maxHeight: 'calc(100vh - 420px)',
        overflowY: 'auto',
        zIndex: 80,
        display: 'flex',
        flexDirection: 'column',
        gap: '6px',
        padding: '0 0 8px 0',
        pointerEvents: 'none',
      }}
    >
      {/* Section header */}
      {queue.length > 0 && (
        <div
          style={{
            padding: '6px 12px 4px',
            fontSize: '9px',
            letterSpacing: '2px',
            textTransform: 'uppercase',
            color: 'var(--text-secondary)',
            fontFamily: 'Georgia, serif',
            background: 'var(--hud-bg)',
            borderLeft: '1px solid var(--hud-border)',
            borderBottom: '1px solid var(--hud-border)',
            borderRadius: '0 0 0 6px',
          }}
        >
          Soul Thoughts
        </div>
      )}

      <AnimatePresence>
        {queue.map((item) => {
          const style = getStyle(item.type)
          return (
            <motion.div
              key={item.id}
              layout
              initial={{ opacity: 0, x: 30, scale: 0.95 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 20, scale: 0.95 }}
              transition={{ type: 'spring', stiffness: 400, damping: 30 }}
              style={{
                background: 'rgba(10, 10, 26, 0.88)',
                backdropFilter: 'blur(12px)',
                borderLeft: `2px solid ${style.borderAccent}`,
                borderTop: '1px solid rgba(107, 92, 231, 0.1)',
                borderBottom: '1px solid rgba(107, 92, 231, 0.1)',
                borderRight: 'none',
                borderRadius: '6px 0 0 6px',
                padding: '8px 10px',
                fontFamily: 'Georgia, serif',
                pointerEvents: 'auto',
                cursor: 'pointer',
                position: 'relative',
                overflow: 'hidden',
              }}
              onClick={() => dismissItem(item.id)}
            >
              {/* Header: aura dot + name + type badge */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                marginBottom: '5px',
              }}>
                {/* Soul aura dot */}
                <div style={{
                  width: '7px',
                  height: '7px',
                  borderRadius: '50%',
                  background: item.aura,
                  boxShadow: `0 0 6px ${item.aura}60`,
                  flexShrink: 0,
                }} />

                {/* Soul name */}
                <span style={{
                  fontSize: '10.5px',
                  fontWeight: 600,
                  color: item.aura,
                  letterSpacing: '0.3px',
                  flex: 1,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}>
                  {item.soulName}
                </span>

                {/* Type badge */}
                <span style={{
                  fontSize: '8px',
                  letterSpacing: '0.8px',
                  textTransform: 'uppercase',
                  color: style.textColor,
                  opacity: 0.5,
                  flexShrink: 0,
                }}>
                  {style.icon}
                </span>
              </div>

              {/* Thought text */}
              <p style={{
                fontSize: '11px',
                color: style.textColor,
                fontStyle: 'italic',
                lineHeight: 1.5,
                margin: 0,
                opacity: 0.85,
                display: '-webkit-box',
                WebkitLineClamp: 3,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden',
              }}>
                {item.text}
              </p>

              {/* Countdown bar */}
              <motion.div
                initial={{ scaleX: 1 }}
                animate={{ scaleX: 0 }}
                transition={{ duration: 10, ease: 'linear' }}
                style={{
                  position: 'absolute',
                  bottom: 0,
                  left: 0,
                  right: 0,
                  height: '1.5px',
                  background: `linear-gradient(90deg, ${item.aura}40, ${item.aura}00)`,
                  transformOrigin: 'left',
                }}
              />
            </motion.div>
          )
        })}
      </AnimatePresence>
    </div>
  )
}
