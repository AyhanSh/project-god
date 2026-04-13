'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useGameStore } from '@/store/useGameStore'
import { GOD_POWERS } from '@/data/godPowers'

export default function GodPanel() {
  const showGodPanel = useGameStore((s) => s.showGodPanel)
  const godFavor = useGameStore((s) => s.godFavor)
  const spendGodFavor = useGameStore((s) => s.spendGodFavor)
  const setGodTargeting = useGameStore((s) => s.setGodTargeting)
  const clearGodTargeting = useGameStore((s) => s.clearGodTargeting)
  const currentEra = useGameStore((s) => s.currentEra)

  const [activePower, setActivePower] = useState(null)
  const [messageText, setMessageText] = useState('')
  const [feedback, setFeedback] = useState(null)

  const showFeedback = (msg) => {
    setFeedback(msg)
    setTimeout(() => setFeedback(null), 3000)
  }

  const handlePowerClick = (power) => {
    if (power.cost > godFavor) return
    if (power.prerequisite && currentEra !== power.prerequisite) {
      showFeedback(`Requires ${power.prerequisite} era`)
      return
    }

    if (activePower?.id === power.id) {
      setActivePower(null)
      setMessageText('')
      clearGodTargeting()
      return
    }

    setActivePower(power)
    setMessageText('')
    setFeedback(null)

    if (power.targetType === 'city') {
      // City-wide powers fire immediately (single city world)
      setGodTargeting({ powerId: power.id, type: 'city' })
      // Will be invoked from SoulEntity/GameWorld via store
      import('@/engine/GodPowerEngine').then(({ godPowerEngine }) => {
        import('@/engine/WorldEngine').then(({ getWorldEngine }) => {
          const store = useGameStore
          const worldEngine = getWorldEngine(store)
          const result = godPowerEngine.invoke(power.id, {}, worldEngine, store)
          if (result.success) {
            spendGodFavor(power.cost)
            showFeedback(`${power.icon} ${power.name} activated!`)
          } else {
            showFeedback(result.reason || 'Failed')
          }
        })
      })
      setActivePower(null)
      clearGodTargeting()
    } else if (power.requiresInput) {
      // Show text input — don't set targeting yet
      setGodTargeting({ powerId: power.id, type: 'input' })
    } else if (power.targetType === 'soul') {
      setGodTargeting({ powerId: power.id, type: 'soul' })
    } else if (power.targetType === 'two_souls') {
      setGodTargeting({ powerId: power.id, type: 'two_souls' })
    }
  }

  const handleSendMessage = () => {
    if (!messageText.trim() || !activePower) return
    // 'speak' power — need to click a soul after entering text
    setGodTargeting({ powerId: activePower.id, type: 'soul', text: messageText })
    showFeedback(`Click a soul to deliver: "${messageText.slice(0, 40)}"`)
    setMessageText('')
  }

  const panelStyle = {
    position: 'fixed',
    bottom: '45px',
    left: 0,
    width: '300px',
    background: 'var(--hud-bg)',
    borderRight: '1px solid var(--hud-border)',
    borderTop: '1px solid var(--hud-border)',
    backdropFilter: 'blur(10px)',
    zIndex: 85,
    fontFamily: 'Georgia, serif',
    color: 'var(--text-primary)',
    borderRadius: '0 6px 0 0',
    overflow: 'hidden',
  }

  return (
    <AnimatePresence>
      {showGodPanel && (
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
              color: '#f0c040',
              textShadow: '0 0 10px rgba(240,192,64,0.4)',
            }}>
              Divine Powers
            </span>
            <span style={{
              fontSize: '13px',
              color: '#f0c040',
              letterSpacing: '1px',
            }}>
              ⚡ {godFavor}
            </span>
          </div>

          {/* Status / instruction */}
          <AnimatePresence>
            {(activePower || feedback) && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                style={{
                  overflow: 'hidden',
                  borderBottom: '1px solid var(--hud-border)',
                }}
              >
                {feedback && (
                  <div style={{
                    padding: '8px 14px',
                    fontSize: '11px',
                    color: 'var(--success)',
                    fontStyle: 'italic',
                  }}>
                    {feedback}
                  </div>
                )}
                {activePower && !feedback && (
                  <div style={{ padding: '8px 14px' }}>
                    {activePower.targetType === 'two_souls' && (
                      <div style={{
                        fontSize: '11px',
                        color: '#f0c040',
                        fontStyle: 'italic',
                      }}>
                        Click two souls to target with {activePower.name}
                      </div>
                    )}
                    {activePower.targetType === 'soul' && !activePower.requiresInput && (
                      <div style={{
                        fontSize: '11px',
                        color: '#f0c040',
                        fontStyle: 'italic',
                      }}>
                        Click a soul to target with {activePower.name}
                      </div>
                    )}
                    {activePower.requiresInput && (
                      <div>
                        <div style={{
                          fontSize: '11px',
                          color: '#f0c040',
                          fontStyle: 'italic',
                          marginBottom: '6px',
                        }}>
                          Enter your divine message:
                        </div>
                        <div style={{ display: 'flex', gap: '6px' }}>
                          <input
                            type='text'
                            value={messageText}
                            onChange={(e) => setMessageText(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                            placeholder='Speak, O God...'
                            autoFocus
                            style={{
                              flex: 1,
                              padding: '5px 8px',
                              background: 'rgba(255,255,255,0.05)',
                              border: '1px solid var(--hud-border)',
                              color: 'var(--text-primary)',
                              borderRadius: '4px',
                              fontFamily: 'Georgia, serif',
                              fontSize: '11px',
                              outline: 'none',
                            }}
                          />
                          <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={handleSendMessage}
                            style={{
                              padding: '5px 10px',
                              background: 'rgba(240,192,64,0.2)',
                              border: '1px solid #f0c040',
                              color: '#f0c040',
                              borderRadius: '4px',
                              cursor: 'pointer',
                              fontFamily: 'Georgia, serif',
                              fontSize: '11px',
                            }}
                          >
                            Send
                          </motion.button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Power Grid */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '6px',
            padding: '10px',
            maxHeight: '260px',
            overflowY: 'auto',
          }}>
            {GOD_POWERS.map((power) => {
              const isDisabled = power.cost > godFavor || (power.prerequisite && currentEra !== power.prerequisite)
              const isActive = activePower?.id === power.id
              return (
                <motion.button
                  key={power.id}
                  whileHover={!isDisabled ? { scale: 1.03, boxShadow: '0 0 10px rgba(240,192,64,0.2)' } : {}}
                  whileTap={!isDisabled ? { scale: 0.97 } : {}}
                  onClick={() => handlePowerClick(power)}
                  disabled={isDisabled}
                  title={power.description}
                  style={{
                    background: isActive
                      ? 'rgba(240,192,64,0.2)'
                      : isDisabled
                        ? 'rgba(255,255,255,0.02)'
                        : 'rgba(107,92,231,0.08)',
                    border: isActive
                      ? '1px solid #f0c040'
                      : isDisabled
                        ? '1px solid rgba(255,255,255,0.06)'
                        : '1px solid var(--hud-border)',
                    borderRadius: '5px',
                    padding: '8px 6px',
                    cursor: isDisabled ? 'not-allowed' : 'pointer',
                    textAlign: 'left',
                    color: isDisabled ? 'rgba(255,255,255,0.2)' : 'var(--text-primary)',
                    fontFamily: 'Georgia, serif',
                    opacity: isDisabled ? 0.5 : 1,
                    transition: 'all 0.2s',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '3px',
                  }}
                >
                  <div style={{ fontSize: '16px', lineHeight: 1 }}>{power.icon}</div>
                  <div style={{
                    fontSize: '10px',
                    fontWeight: 'bold',
                    letterSpacing: '0.3px',
                    lineHeight: 1.2,
                    color: isActive ? '#f0c040' : 'var(--text-primary)',
                  }}>
                    {power.name}
                  </div>
                  <div style={{
                    fontSize: '9px',
                    color: isDisabled ? 'rgba(240,192,64,0.3)' : 'rgba(240,192,64,0.8)',
                    letterSpacing: '0.3px',
                  }}>
                    ⚡ {power.cost}
                  </div>
                </motion.button>
              )
            })}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
