'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useGameStore } from '@/store/useGameStore'

function StatBar({ value, max = 100, color, label }) {
  const pct = Math.min(100, Math.max(0, (value / max) * 100))
  return (
    <div style={{ marginBottom: '10px' }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        marginBottom: '3px',
        fontSize: '11px',
        color: 'var(--text-secondary)',
        letterSpacing: '0.5px',
      }}>
        <span>{label}</span>
        <span style={{ color: 'var(--text-primary)' }}>{Math.round(value)}</span>
      </div>
      <div style={{
        height: '5px',
        background: 'rgba(255,255,255,0.07)',
        borderRadius: '3px',
        overflow: 'hidden',
      }}>
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          style={{
            height: '100%',
            background: color,
            borderRadius: '3px',
            boxShadow: `0 0 6px ${color}`,
          }}
        />
      </div>
    </div>
  )
}

function healthColor(v) {
  if (v > 60) return 'var(--success)'
  if (v > 30) return '#f0b429'
  return 'var(--danger)'
}

function happinessColor(v) {
  if (v > 60) return 'var(--success)'
  if (v > 30) return '#f0b429'
  return 'var(--danger)'
}

function Divider() {
  return (
    <div style={{
      height: '1px',
      background: 'var(--hud-border)',
      margin: '12px 0',
    }} />
  )
}

export default function SoulInspector() {
  const showSoulInspector = useGameStore((s) => s.showSoulInspector)
  const selectedSoulId = useGameStore((s) => s.selectedSoulId)
  const souls = useGameStore((s) => s.souls)
  const selectSoul = useGameStore((s) => s.selectSoul)
  const setCameraMode = useGameStore((s) => s.setCameraMode)
  const setCameraTarget = useGameStore((s) => s.setCameraTarget)

  const [questionInput, setQuestionInput] = useState('')
  const [showQuestion, setShowQuestion] = useState(false)
  const [questionLoading, setQuestionLoading] = useState(false)
  const [questionResponse, setQuestionResponse] = useState(null)

  const soul = souls.find((s) => s.id === selectedSoulId)

  const handleClose = () => {
    selectSoul(null)
    setShowQuestion(false)
    setQuestionInput('')
    setQuestionResponse(null)
  }

  const handleFollow = () => {
    setCameraMode('follow')
    setCameraTarget(selectedSoulId)
  }

  const handleAskQuestion = async () => {
    if (!questionInput.trim() || !soul) return
    setQuestionLoading(true)
    setQuestionResponse(null)
    try {
      const res = await fetch('/api/soul-think', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          systemPrompt: `You are ${soul.name}, a soul living in a simulated world. You are a ${soul.role || 'person'}. Respond in character, briefly.`,
          userPrompt: `GOD asks you: ${questionInput}`,
          maxTokens: 150,
        }),
      })
      const data = await res.json()
      setQuestionResponse(data.result || data.error || 'No response.')
    } catch {
      setQuestionResponse('The soul did not respond.')
    } finally {
      setQuestionLoading(false)
    }
  }

  const panelStyle = {
    position: 'fixed',
    top: '50px',
    right: 0,
    bottom: '45px',
    width: '280px',
    background: 'var(--hud-bg)',
    borderLeft: '1px solid var(--hud-border)',
    backdropFilter: 'blur(10px)',
    zIndex: 90,
    display: 'flex',
    flexDirection: 'column',
    fontFamily: 'Georgia, serif',
    color: 'var(--text-primary)',
  }

  return (
    <AnimatePresence>
      {showSoulInspector && soul && (
        <motion.div
          initial={{ x: 280, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: 280, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          style={panelStyle}
        >
          {/* Close Button */}
          <motion.button
            whileHover={{ scale: 1.2, color: 'var(--danger)' }}
            whileTap={{ scale: 0.9 }}
            onClick={handleClose}
            style={{
              position: 'absolute',
              top: '10px',
              right: '12px',
              background: 'transparent',
              border: 'none',
              color: 'var(--text-secondary)',
              fontSize: '16px',
              cursor: 'pointer',
              lineHeight: 1,
              zIndex: 10,
            }}
          >
            ✕
          </motion.button>

          {/* Scrollable content */}
          <div style={{
            overflowY: 'auto',
            flex: 1,
            padding: '16px',
          }}>
            {/* Name + Role */}
            <div style={{ paddingRight: '24px', marginBottom: '4px' }}>
              <motion.h2
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                style={{
                  fontSize: '20px',
                  fontWeight: 'bold',
                  color: soul.aura || 'var(--accent)',
                  textShadow: `0 0 12px ${soul.aura || 'var(--accent-glow)'}`,
                  marginBottom: '3px',
                  lineHeight: 1.2,
                }}
              >
                {soul.name || 'Unknown Soul'}
              </motion.h2>
              <div style={{
                fontSize: '11px',
                color: 'var(--text-secondary)',
                letterSpacing: '1px',
                textTransform: 'uppercase',
              }}>
                {soul.role || 'Wanderer'}
              </div>
            </div>

            <Divider />

            {/* Stats */}
            <div>
              <StatBar
                value={soul.age || 0}
                max={100}
                color='var(--text-secondary)'
                label='Age'
              />
              <StatBar
                value={soul.health ?? 80}
                max={100}
                color={healthColor(soul.health ?? 80)}
                label='Health'
              />
              <StatBar
                value={soul.happiness ?? 60}
                max={100}
                color={happinessColor(soul.happiness ?? 60)}
                label='Happiness'
              />
              <StatBar
                value={soul.stress ?? 20}
                max={100}
                color='var(--danger)'
                label='Stress'
              />
            </div>

            {/* Numeric stats */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '8px',
              marginTop: '4px',
            }}>
              {[
                { label: 'Wisdom', value: soul.wisdom ?? 0 },
                { label: 'Influence', value: soul.influence ?? 0 },
              ].map(({ label, value }) => (
                <div
                  key={label}
                  style={{
                    background: 'rgba(107,92,231,0.08)',
                    border: '1px solid var(--hud-border)',
                    borderRadius: '5px',
                    padding: '8px',
                    textAlign: 'center',
                  }}
                >
                  <div style={{ fontSize: '16px', fontWeight: 'bold', color: 'var(--accent)' }}>
                    {Math.round(value)}
                  </div>
                  <div style={{ fontSize: '10px', color: 'var(--text-secondary)', letterSpacing: '1px' }}>
                    {label}
                  </div>
                </div>
              ))}
            </div>

            <Divider />

            {/* Latest Thought */}
            <div>
              <div style={{
                fontSize: '10px',
                color: 'var(--text-secondary)',
                letterSpacing: '1.5px',
                textTransform: 'uppercase',
                marginBottom: '8px',
              }}>
                Latest Thought
              </div>
              <motion.p
                key={soul.latestThought?.text}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5 }}
                style={{
                  fontSize: '12px',
                  fontStyle: 'italic',
                  color: 'var(--text-secondary)',
                  lineHeight: 1.6,
                  padding: '8px',
                  background: 'rgba(255,255,255,0.03)',
                  borderRadius: '4px',
                  borderLeft: '2px solid var(--hud-border)',
                }}
              >
                "{soul.latestThought?.text || 'Thinking...'}"
              </motion.p>
            </div>

            <Divider />

            {/* Ask Question */}
            <div style={{ marginBottom: '8px' }}>
              <motion.button
                whileHover={{ scale: 1.02, boxShadow: '0 0 10px var(--accent-glow)' }}
                whileTap={{ scale: 0.98 }}
                onClick={() => {
                  setShowQuestion((v) => !v)
                  setQuestionResponse(null)
                }}
                style={{
                  width: '100%',
                  padding: '8px',
                  background: 'rgba(107,92,231,0.15)',
                  border: '1px solid var(--accent)',
                  color: 'var(--accent)',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontFamily: 'Georgia, serif',
                  fontSize: '12px',
                  letterSpacing: '0.5px',
                  transition: 'all 0.2s',
                }}
              >
                📜 Ask Question
              </motion.button>

              <AnimatePresence>
                {showQuestion && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    style={{ overflow: 'hidden', marginTop: '8px' }}
                  >
                    <input
                      type='text'
                      value={questionInput}
                      onChange={(e) => setQuestionInput(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleAskQuestion()}
                      placeholder='Speak, O God...'
                      style={{
                        width: '100%',
                        padding: '7px 10px',
                        background: 'rgba(255,255,255,0.05)',
                        border: '1px solid var(--hud-border)',
                        color: 'var(--text-primary)',
                        borderRadius: '4px',
                        fontFamily: 'Georgia, serif',
                        fontSize: '12px',
                        outline: 'none',
                        marginBottom: '6px',
                        boxSizing: 'border-box',
                      }}
                    />
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={handleAskQuestion}
                      disabled={questionLoading}
                      style={{
                        width: '100%',
                        padding: '6px',
                        background: questionLoading ? 'rgba(107,92,231,0.1)' : 'var(--accent)',
                        border: 'none',
                        color: '#fff',
                        borderRadius: '4px',
                        cursor: questionLoading ? 'not-allowed' : 'pointer',
                        fontFamily: 'Georgia, serif',
                        fontSize: '12px',
                        transition: 'all 0.2s',
                      }}
                    >
                      {questionLoading ? 'Channeling...' : 'Send'}
                    </motion.button>

                    <AnimatePresence>
                      {questionResponse && (
                        <motion.div
                          initial={{ opacity: 0, y: 4 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0 }}
                          style={{
                            marginTop: '8px',
                            padding: '8px',
                            background: 'rgba(255,255,255,0.04)',
                            borderRadius: '4px',
                            fontSize: '12px',
                            fontStyle: 'italic',
                            color: 'var(--text-secondary)',
                            lineHeight: 1.5,
                          }}
                        >
                          "{questionResponse}"
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Follow Soul */}
            <motion.button
              whileHover={{ scale: 1.02, boxShadow: '0 0 10px rgba(52, 168, 83, 0.3)' }}
              whileTap={{ scale: 0.98 }}
              onClick={handleFollow}
              style={{
                width: '100%',
                padding: '8px',
                background: 'rgba(52,168,83,0.1)',
                border: '1px solid var(--success)',
                color: 'var(--success)',
                borderRadius: '4px',
                cursor: 'pointer',
                fontFamily: 'Georgia, serif',
                fontSize: '12px',
                letterSpacing: '0.5px',
                transition: 'all 0.2s',
              }}
            >
              🎯 Follow Soul
            </motion.button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
