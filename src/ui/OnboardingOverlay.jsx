'use client'

import { useState, useEffect, useCallback } from 'react'

const STORAGE_KEY = 'projectGod_onboardingDone'

const CONTROLS = [
  ['Left-click drag', 'Orbit camera'],
  ['Scroll', 'Zoom in / out'],
  ['Right-click drag', 'Pan'],
  ['Space', 'Pause / Resume'],
  ['1 – 4', 'Set speed'],
  ['G', 'God powers panel'],
  ['Click a soul', 'Inspect'],
]

function shouldShow() {
  if (typeof window === 'undefined') return false
  return !localStorage.getItem(STORAGE_KEY)
}

export default function OnboardingOverlay() {
  const [visible, setVisible] = useState(shouldShow)

  const dismiss = useCallback(() => {
    setVisible(false)
    try { localStorage.setItem(STORAGE_KEY, '1') } catch {}
  }, [])

  useEffect(() => {
    if (!visible) return
    const timer = setTimeout(() => dismiss(), 15000)
    return () => clearTimeout(timer)
  }, [visible, dismiss])

  if (!visible) return null

  return (
    <div
      onClick={dismiss}
      style={{
        position: 'fixed', inset: 0, zIndex: 10000,
        background: 'rgba(4, 4, 14, 0.82)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        cursor: 'pointer',
      }}
    >
      <div style={{
        background: 'rgba(12, 12, 28, 0.95)',
        border: '1px solid rgba(120, 100, 180, 0.25)',
        borderRadius: 14, padding: '36px 48px',
        maxWidth: 420, width: '90%',
        fontFamily: 'Georgia, serif', color: '#c0c0d8',
      }}>
        <h2 style={{ margin: '0 0 6px', fontSize: 22, color: '#e0daf0', fontWeight: 'normal' }}>
          Project God
        </h2>
        <p style={{ margin: '0 0 22px', fontSize: 13, opacity: 0.55, lineHeight: 1.5 }}>
          Watch AI souls live, think, and shape 5,000 years of history.
        </p>

        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
          <tbody>
            {CONTROLS.map(([key, desc]) => (
              <tr key={key}>
                <td style={{
                  padding: '5px 12px 5px 0', whiteSpace: 'nowrap',
                  color: '#a090d0', fontFamily: 'monospace', fontSize: 13,
                }}>
                  {key}
                </td>
                <td style={{ padding: '5px 0', opacity: 0.7 }}>{desc}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <p style={{ margin: '22px 0 0', fontSize: 12, opacity: 0.35, textAlign: 'center' }}>
          Click anywhere to dismiss
        </p>
      </div>
    </div>
  )
}
