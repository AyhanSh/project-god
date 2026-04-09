'use client'

import { useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useGameStore } from '@/store/useGameStore'

const EVENT_COLORS = {
  birth: 'var(--success)',
  death: 'var(--danger)',
  era_change: '#9b59b6',
  historical_event: '#f0c040',
}

function getEventColor(type) {
  return EVENT_COLORS[type] || 'var(--text-secondary)'
}

function formatYear(year) {
  if (year == null) return ''
  if (year < 0) return `${Math.abs(year)}BC`
  return `${year}AD`
}

export default function EventLog() {
  const eventLog = useGameStore((s) => s.eventLog)
  const scrollRef = useRef(null)

  const entries = eventLog.slice(0, 50)

  // Auto-scroll to top when a new entry arrives
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = 0
    }
  }, [eventLog.length])

  return (
    <div
      style={{
        position: 'fixed',
        right: 0,
        top: '60px',
        width: '250px',
        maxHeight: '300px',
        background: 'var(--hud-bg)',
        borderLeft: '1px solid var(--hud-border)',
        borderBottom: '1px solid var(--hud-border)',
        backdropFilter: 'blur(8px)',
        zIndex: 80,
        display: 'flex',
        flexDirection: 'column',
        fontFamily: 'Georgia, serif',
        borderRadius: '0 0 0 6px',
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: '7px 12px 6px',
          borderBottom: '1px solid var(--hud-border)',
          fontSize: '9px',
          letterSpacing: '2px',
          textTransform: 'uppercase',
          fontVariant: 'small-caps',
          color: 'var(--text-secondary)',
          flexShrink: 0,
        }}
      >
        Event Log
      </div>

      {/* Scrollable entries */}
      <div
        ref={scrollRef}
        style={{
          overflowY: 'auto',
          flex: 1,
          padding: '4px 0',
        }}
      >
        {entries.length === 0 && (
          <div style={{
            padding: '12px',
            fontSize: '11px',
            color: 'var(--text-secondary)',
            fontStyle: 'italic',
            textAlign: 'center',
          }}>
            No events yet...
          </div>
        )}

        <AnimatePresence initial={false}>
          {entries.map((entry, idx) => {
            const key = entry.id || `${entry.year}-${idx}-${entry.text}`
            const color = getEventColor(entry.type)
            return (
              <motion.div
                key={key}
                initial={{ opacity: 0, x: 12 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.25 }}
                style={{
                  display: 'flex',
                  alignItems: 'baseline',
                  gap: '6px',
                  padding: '4px 12px',
                  borderBottom: '1px solid rgba(107,92,231,0.06)',
                }}
              >
                {/* Year badge */}
                <span
                  style={{
                    fontSize: '9px',
                    fontWeight: 'bold',
                    color: color,
                    flexShrink: 0,
                    minWidth: '42px',
                    letterSpacing: '0.3px',
                  }}
                >
                  {formatYear(entry.year)}
                </span>

                {/* Event text */}
                <span
                  style={{
                    fontSize: '11px',
                    color: 'var(--text-secondary)',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    flex: 1,
                  }}
                  title={entry.text}
                >
                  {entry.text}
                </span>
              </motion.div>
            )
          })}
        </AnimatePresence>
      </div>
    </div>
  )
}
