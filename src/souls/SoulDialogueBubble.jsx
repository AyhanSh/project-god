'use client'

import { useState, useEffect } from 'react'
import { Html } from '@react-three/drei'
import { useGameStore } from '@/store/useGameStore'

export default function SoulDialogueBubble({ soulId, soulName, aura, visible = true }) {
  const conversations = useGameStore((s) => s.activeConversations)
  const [lineIndex, setLineIndex] = useState(0)

  const convo = conversations.find(
    (c) => c.soulA.id === soulId || c.soulB.id === soulId
  )

  // Cycle through dialogue lines every 4 seconds
  useEffect(() => {
    if (!convo) return
    setLineIndex(0)
    const timer = setInterval(() => {
      setLineIndex((i) => i + 1)
    }, 4000)
    return () => clearInterval(timer)
  }, [convo?.timestamp])

  if (!convo || !visible) return null

  const isSoulA = convo.soulA.id === soulId
  const lines = isSoulA
    ? [convo.soulA.text, convo.soulA.followUp].filter(Boolean)
    : [convo.soulB.text].filter(Boolean)
  const currentLine = lines[lineIndex % lines.length] || lines[0]
  if (!currentLine) return null

  const isWedding = convo.type === 'wedding'

  return (
    <Html
      position={[0, 2.6, 0]}
      center
      distanceFactor={15}
      zIndexRange={[10, 0]}
      style={{ pointerEvents: 'none' }}
    >
      <div
        style={{
          background: 'rgba(10, 10, 26, 0.9)',
          backdropFilter: 'blur(8px)',
          borderLeft: `2px solid ${isWedding ? '#ff6090' : aura || '#6B5CE7'}`,
          borderRadius: '6px 6px 6px 0',
          padding: '6px 10px',
          maxWidth: '160px',
          fontFamily: 'Georgia, serif',
          position: 'relative',
        }}
      >
        <div
          style={{
            fontSize: '9px',
            fontWeight: 600,
            color: isWedding ? '#ff6090' : aura || '#6B5CE7',
            letterSpacing: '0.3px',
            marginBottom: '3px',
          }}
        >
          {soulName}
        </div>
        <p
          style={{
            fontSize: '10px',
            color: '#c0b8d8',
            fontStyle: 'italic',
            lineHeight: 1.4,
            margin: 0,
            opacity: 0.85,
            display: '-webkit-box',
            WebkitLineClamp: 3,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
          }}
        >
          {currentLine.slice(0, 120)}
        </p>
        {/* Speech bubble pointer */}
        <div
          style={{
            position: 'absolute',
            bottom: '-6px',
            left: '12px',
            width: 0,
            height: 0,
            borderLeft: '6px solid transparent',
            borderRight: '6px solid transparent',
            borderTop: '6px solid rgba(10, 10, 26, 0.9)',
          }}
        />
      </div>
    </Html>
  )
}
