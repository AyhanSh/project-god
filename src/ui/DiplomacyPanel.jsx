'use client'

import { useGameStore } from '@/store/useGameStore'
import { diplomacySystem } from '@/engine/EconomySystem'

export default function DiplomacyPanel() {
  const show = useGameStore((s) => s.showDiplomacyPanel)
  const toggle = useGameStore((s) => s.toggleDiplomacyPanel)
  const souls = useGameStore((s) => s.souls)

  if (!show) return null

  const alliances = diplomacySystem.getAlliances()
  const isAtWar = diplomacySystem.isAtWar()
  const leader = diplomacySystem.getLeader()
  const treaties = diplomacySystem.getTreaties()

  // Resolve soul names for display
  const getName = (id) => souls.find((s) => s.id === id)?.llmName || id

  return (
    <div style={{
      position: 'absolute', top: 80, right: 10, width: 260,
      background: 'rgba(10, 10, 30, 0.88)', borderRadius: 12,
      padding: 16, color: '#c0c0d8', fontSize: '0.8rem',
      border: '1px solid rgba(107, 92, 231, 0.3)',
      maxHeight: '60vh', overflowY: 'auto',
      fontFamily: 'Georgia, serif', zIndex: 100,
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
        <span style={{ fontWeight: 700, fontSize: '1rem', color: '#e0daf0' }}>Diplomacy</span>
        <button onClick={toggle} style={{
          background: 'none', border: 'none', color: '#c0c0d8',
          cursor: 'pointer', fontSize: 16,
        }}>x</button>
      </div>

      <div style={{ marginBottom: 12, padding: 8, background: 'rgba(255,255,255,0.04)', borderRadius: 8 }}>
        <div style={{ fontSize: '0.65rem', opacity: 0.5, marginBottom: 2 }}>WORLD LEADER</div>
        <div style={{ color: leader ? (leader.aura || 'var(--accent)') : '#666', fontWeight: 600 }}>
          {leader?.llmName || 'None'}
        </div>
      </div>

      <div style={{ marginBottom: 12 }}>
        <div style={{ fontSize: '0.65rem', opacity: 0.5, marginBottom: 4 }}>STATUS</div>
        {isAtWar ? (
          <div style={{ color: '#ff6b6b' }}>War ongoing</div>
        ) : (
          <div style={{ opacity: 0.4 }}>Peace</div>
        )}
      </div>

      <div style={{ marginBottom: 12 }}>
        <div style={{ fontSize: '0.65rem', opacity: 0.5, marginBottom: 4 }}>
          ALLIANCES ({alliances.length})
        </div>
        {alliances.length === 0 ? (
          <div style={{ opacity: 0.3, fontSize: '0.75rem' }}>No alliances</div>
        ) : alliances.map((a, i) => (
          <div key={i} style={{
            padding: '4px 8px', background: 'rgba(52, 168, 83, 0.08)',
            borderRadius: 4, marginBottom: 2, fontSize: '0.75rem',
          }}>
            {a.members?.map(getName).join(' & ')}
          </div>
        ))}
      </div>

      <div>
        <div style={{ fontSize: '0.65rem', opacity: 0.5, marginBottom: 4 }}>
          TREATIES ({treaties.length})
        </div>
        {treaties.length === 0 ? (
          <div style={{ opacity: 0.3, fontSize: '0.75rem' }}>No active treaties</div>
        ) : treaties.map((t, i) => (
          <div key={i} style={{
            padding: '4px 8px', background: 'rgba(66, 133, 244, 0.08)',
            borderRadius: 4, marginBottom: 2, fontSize: '0.75rem',
          }}>
            {t.type} — {t.parties?.map(getName).join(' & ')}
          </div>
        ))}
      </div>
    </div>
  )
}
