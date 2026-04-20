'use client'

import { useState, useEffect, useRef } from 'react'
import { Html } from '@react-three/drei'
import { useGameStore } from '@/store/useGameStore'

/**
 * Turn-based speech bubble that appears above a soul during conversation.
 * Shows each soul's line only when it's their turn to speak:
 *   Turn 0 (0-4s):  Soul A speaks (opener)
 *   Turn 1 (4-8s):  Soul B speaks (reply)
 *   Turn 2 (8-12s): Soul A speaks (follow-up)
 */
export default function SoulDialogueBubble({ soulId, soulName, aura, visible = true }) {
  const conversations = useGameStore((s) => s.activeConversations)
  const [turn, setTurn] = useState(0)
  const convoRef = useRef(null)

  const convo = conversations.find(
    (c) => c.soulA.id === soulId || c.soulB.id === soulId
  )

  // Advance turns every 4 seconds
  useEffect(() => {
    if (!convo) { convoRef.current = null; return }

    // Reset turns when a new conversation starts
    if (convoRef.current !== convo.timestamp) {
      convoRef.current = convo.timestamp
      setTurn(0)
    }

    const timer = setInterval(() => {
      setTurn((t) => Math.min(t + 1, 2))
    }, 4000)
    return () => clearInterval(timer)
  }, [convo?.timestamp])

  if (!convo || !visible) return null

  const isSoulA = convo.soulA.id === soulId
  const isWedding = convo.type === 'wedding'

  // Determine if this soul should show text this turn
  // Turn 0: A speaks, Turn 1: B speaks, Turn 2: A speaks (follow-up)
  let currentLine = null
  if (isSoulA && turn === 0) currentLine = convo.soulA.text
  else if (!isSoulA && turn === 1) currentLine = convo.soulB.text
  else if (isSoulA && turn === 2) currentLine = convo.soulA.followUp

  if (!currentLine) return null

  const accentColor = isWedding ? '#ff6090' : aura || '#6B5CE7'

  return (
    <Html
      position={[0, 2.8, 0]}
      center
      distanceFactor={15}
      zIndexRange={[10, 0]}
      style={{ pointerEvents: 'none' }}
    >
      <div
        style={{
          background: 'rgba(8, 8, 22, 0.92)',
          backdropFilter: 'blur(10px)',
          border: `1px solid ${accentColor}30`,
          borderLeft: `3px solid ${accentColor}`,
          borderRadius: '8px 8px 8px 0',
          padding: '8px 12px',
          maxWidth: '180px',
          minWidth: '80px',
          fontFamily: 'Georgia, serif',
          position: 'relative',
          boxShadow: `0 4px 16px rgba(0,0,0,0.4), inset 0 0 20px ${accentColor}08`,
          animation: 'bubbleFadeIn 0.3s ease-out',
        }}
      >
        {/* Soul name */}
        <div
          style={{
            fontSize: '9px',
            fontWeight: 700,
            color: accentColor,
            letterSpacing: '0.5px',
            marginBottom: '4px',
            textShadow: `0 0 8px ${accentColor}40`,
          }}
        >
          {soulName}
        </div>

        {/* Speech text */}
        <p
          style={{
            fontSize: '11px',
            color: '#d8d4e8',
            lineHeight: 1.45,
            margin: 0,
            display: '-webkit-box',
            WebkitLineClamp: 4,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
          }}
        >
          {currentLine.slice(0, 150)}
        </p>

        {/* Speech bubble pointer */}
        <div
          style={{
            position: 'absolute',
            bottom: '-7px',
            left: '14px',
            width: 0,
            height: 0,
            borderLeft: '7px solid transparent',
            borderRight: '7px solid transparent',
            borderTop: `7px solid rgba(8, 8, 22, 0.92)`,
          }}
        />
      </div>
    </Html>
  )
}
