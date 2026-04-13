'use client'

import { useState, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import { useGameStore } from '@/store/useGameStore'
import { ERAS } from '@/data/eras'
import { GOD_POWERS } from '@/data/godPowers'
import { createSoul } from '@/data/llmSouls'
import { BUILDING_TYPES_BY_ERA, BUILDING_SIZES } from '@/models/buildings/BuildingFactory'
import { nanoid } from 'nanoid'

const WEATHERS = ['clear', 'rain', 'storm', 'snow', 'heatwave']
const ERA_IDS = ERAS.map((e) => e.id)

const ALL_ANIMATIONS = [
  { id: 'idle', label: 'Idle', desc: 'Breathing, looking around' },
  { id: 'walk', label: 'Walk', desc: 'Arm/leg swing locomotion' },
  { id: 'work', label: 'Work', desc: 'General labor motion' },
  { id: 'pray', label: 'Pray', desc: 'Kneeling, arms raised' },
  { id: 'fight', label: 'Fight', desc: 'Punching, dodging' },
  { id: 'celebrate', label: 'Celebrate', desc: 'Jumping, spinning' },
  { id: 'swim', label: 'Swim', desc: 'Horizontal crawl stroke' },
  { id: 'talk', label: 'Talk', desc: 'Gesturing conversation' },
  { id: 'sleep', label: 'Sleep', desc: 'Lying still' },
  { id: 'chop_tree', label: 'Chop Tree', desc: 'Axe swing motion' },
  { id: 'mine', label: 'Mine', desc: 'Pickaxe motion' },
  { id: 'craft', label: 'Craft', desc: 'Hands working together' },
  { id: 'build', label: 'Build', desc: 'Construction hammering' },
  { id: 'greet', label: 'Greet', desc: 'Wave hello, arm raised' },
]

const SECTIONS = [
  { id: 'souls', label: 'Souls' },
  { id: 'buildings', label: 'Buildings' },
  { id: 'mechanics', label: 'Mechanics' },
  { id: 'animations', label: 'Anims' },
  { id: 'weather', label: 'Weather' },
  { id: 'era', label: 'Era' },
  { id: 'economy', label: 'Economy' },
  { id: 'powers', label: 'God Powers' },
  { id: 'world', label: 'World' },
]

export default function SandboxPanel() {
  const [activeSection, setActiveSection] = useState('souls')
  const [collapsed, setCollapsed] = useState(false)

  const panelStyle = {
    position: 'fixed',
    top: 0,
    right: 0,
    bottom: 0,
    width: collapsed ? '40px' : '300px',
    background: 'var(--hud-bg)',
    borderLeft: '1px solid var(--hud-border)',
    backdropFilter: 'blur(10px)',
    zIndex: 200,
    fontFamily: 'Georgia, serif',
    color: 'var(--text-primary)',
    display: 'flex',
    flexDirection: 'column',
    transition: 'width 0.3s ease',
    overflow: 'hidden',
  }

  return (
    <div style={panelStyle}>
      <div style={{
        padding: collapsed ? '12px 8px' : '12px 16px',
        borderBottom: '1px solid var(--hud-border)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: collapsed ? 'center' : 'space-between',
        flexShrink: 0,
      }}>
        {!collapsed && (
          <span style={{
            fontSize: '12px', fontWeight: 'bold', letterSpacing: '2px',
            textTransform: 'uppercase', color: '#4fc3f7',
            textShadow: '0 0 10px rgba(79,195,247,0.4)',
          }}>
            Sandbox
          </span>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          style={{
            background: 'none', border: 'none',
            color: 'var(--text-secondary)', cursor: 'pointer',
            fontSize: '14px', padding: '2px 4px',
          }}
        >
          {collapsed ? '\u25C0' : '\u25B6'}
        </button>
      </div>

      {!collapsed && (
        <>
          <div style={{
            display: 'flex', flexWrap: 'wrap', gap: '4px',
            padding: '8px 12px',
            borderBottom: '1px solid var(--hud-border)',
            flexShrink: 0,
          }}>
            {SECTIONS.map((s) => (
              <button
                key={s.id}
                onClick={() => setActiveSection(s.id)}
                style={{
                  padding: '3px 8px', fontSize: '9px', fontFamily: 'Georgia, serif',
                  border: activeSection === s.id ? '1px solid #4fc3f7' : '1px solid var(--hud-border)',
                  background: activeSection === s.id ? 'rgba(79,195,247,0.2)' : 'rgba(255,255,255,0.03)',
                  color: activeSection === s.id ? '#4fc3f7' : 'var(--text-secondary)',
                  borderRadius: '3px', cursor: 'pointer',
                  textTransform: 'uppercase', letterSpacing: '0.5px',
                }}
              >
                {s.label}
              </button>
            ))}
          </div>

          <div style={{ flex: 1, overflowY: 'auto', padding: '12px' }}>
            {activeSection === 'souls' && <SoulsSection />}
            {activeSection === 'buildings' && <BuildingsSection />}
            {activeSection === 'mechanics' && <MechanicsSection />}
            {activeSection === 'animations' && <AnimationsSection />}
            {activeSection === 'weather' && <WeatherSection />}
            {activeSection === 'era' && <EraSection />}
            {activeSection === 'economy' && <EconomySection />}
            {activeSection === 'powers' && <PowersSection />}
            {activeSection === 'world' && <WorldStateSection />}
          </div>
        </>
      )}
    </div>
  )
}

// ─── Shared styles ───────────────────────────────────────────────────────────
const labelStyle = {
  fontSize: '10px', letterSpacing: '1px', textTransform: 'uppercase',
  color: 'var(--text-secondary)', marginBottom: '6px', display: 'block',
}

const btnStyle = (active) => ({
  padding: '4px 10px', fontSize: '10px', fontFamily: 'Georgia, serif',
  border: active ? '1px solid #4fc3f7' : '1px solid var(--hud-border)',
  background: active ? 'rgba(79,195,247,0.2)' : 'rgba(255,255,255,0.03)',
  color: active ? '#4fc3f7' : 'var(--text-secondary)',
  borderRadius: '3px', cursor: 'pointer', textTransform: 'capitalize',
  transition: 'all 0.15s',
})

const dangerBtn = {
  ...btnStyle(false), borderColor: '#ff4444', color: '#ff6666',
}

const sectionGap = { display: 'flex', flexDirection: 'column', gap: '12px' }

// ─── Souls Section ───────────────────────────────────────────────────────────
function SoulsSection() {
  const souls = useGameStore((s) => s.souls)
  const currentYear = useGameStore((s) => s.currentYear)

  const spawnSoul = (sex) => {
    const soul = createSoul({ sex, birthYear: currentYear })
    const fullSoul = {
      ...soul,
      isAlive: true, health: 100, hunger: 50, happiness: 70, energy: 80, age: 20,
      position: { x: (Math.random() - 0.5) * 60, z: (Math.random() - 0.5) * 60 },
      currentAction: 'idle', memories: [], relationships: {},
    }
    useGameStore.setState((s) => ({
      souls: [...s.souls, fullSoul],
      population: s.population + 1,
    }))
  }

  const killSoul = (id) => {
    useGameStore.setState((s) => ({
      souls: s.souls.map((soul) => soul.id === id ? { ...soul, isAlive: false } : soul),
      population: Math.max(0, s.population - 1),
    }))
  }

  const killAll = () => {
    useGameStore.setState((s) => ({
      souls: s.souls.map((soul) => ({ ...soul, isAlive: false })),
      population: 0,
    }))
  }

  const clearDead = () => {
    useGameStore.setState((s) => ({ souls: s.souls.filter((soul) => soul.isAlive) }))
  }

  const alive = souls.filter((s) => s.isAlive)

  return (
    <div style={sectionGap}>
      <div>
        <span style={labelStyle}>Spawn Soul</span>
        <div style={{ display: 'flex', gap: '6px' }}>
          <button onClick={() => spawnSoul('male')} style={btnStyle(false)}>+ Male</button>
          <button onClick={() => spawnSoul('female')} style={btnStyle(false)}>+ Female</button>
        </div>
      </div>
      <div style={{ display: 'flex', gap: '6px' }}>
        <button onClick={killAll} style={dangerBtn}>Kill All</button>
        <button onClick={clearDead} style={btnStyle(false)}>Clear Dead</button>
      </div>
      <div>
        <span style={labelStyle}>Alive: {alive.length} / Total: {souls.length}</span>
        <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
          {alive.map((soul) => (
            <div key={soul.id} style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '4px 6px', borderBottom: '1px solid rgba(255,255,255,0.05)',
              fontSize: '10px',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: soul.aura || '#6B5CE7' }} />
                <span>{soul.llmName}</span>
                <span style={{ color: 'var(--text-secondary)', fontSize: '9px' }}>{soul.role}</span>
              </div>
              <button onClick={() => killSoul(soul.id)}
                style={{ background: 'none', border: 'none', color: '#ff6666', cursor: 'pointer', fontSize: '10px' }}>
                x
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ─── Buildings Section ───────────────────────────────────────────────────────
function BuildingsSection() {
  const [selectedEra, setSelectedEra] = useState('ancient')
  const buildings = useGameStore((s) => s.buildings)
  const dragId = useGameStore((s) => s.sandboxDragBuildingId)

  const placeBuilding = (type) => {
    const building = {
      id: `bld_${nanoid(6)}`,
      type, era: selectedEra,
      position: [(Math.random() - 0.5) * 80, 0, (Math.random() - 0.5) * 80],
      progress: 1, health: 100,
    }
    useGameStore.setState((s) => ({ buildings: [...s.buildings, building] }))
  }

  const clearBuildings = () => {
    useGameStore.setState({ buildings: [], sandboxDragBuildingId: null })
  }

  const placeAll = () => {
    const types = BUILDING_TYPES_BY_ERA[selectedEra] || []
    const newBuildings = types.map((type, i) => ({
      id: `bld_${nanoid(6)}`,
      type, era: selectedEra,
      position: [-40 + (i % 5) * 20, 0, -40 + Math.floor(i / 5) * 20],
      progress: 1, health: 100,
    }))
    useGameStore.setState((s) => ({ buildings: [...s.buildings, ...newBuildings] }))
  }

  const deleteBuilding = (id) => {
    useGameStore.setState((s) => ({
      buildings: s.buildings.filter((b) => b.id !== id),
      sandboxDragBuildingId: s.sandboxDragBuildingId === id ? null : s.sandboxDragBuildingId,
    }))
  }

  return (
    <div style={sectionGap}>
      {dragId && (
        <div style={{
          padding: '6px 10px', background: 'rgba(79,195,247,0.15)',
          border: '1px solid #4fc3f7', borderRadius: '4px',
          fontSize: '10px', color: '#4fc3f7',
        }}>
          Dragging building. Click the ground to drop it.
        </div>
      )}

      <div>
        <span style={labelStyle}>Era Filter</span>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
          {ERA_IDS.map((era) => (
            <button key={era} onClick={() => setSelectedEra(era)} style={btnStyle(selectedEra === era)}>
              {era}
            </button>
          ))}
        </div>
      </div>

      <div style={{ display: 'flex', gap: '6px' }}>
        <button onClick={placeAll} style={btnStyle(false)}>Place All ({selectedEra})</button>
        <button onClick={clearBuildings} style={dangerBtn}>Clear All</button>
      </div>

      <div>
        <span style={labelStyle}>Place Individual ({(BUILDING_TYPES_BY_ERA[selectedEra] || []).length})</span>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
          {(BUILDING_TYPES_BY_ERA[selectedEra] || []).map((type) => (
            <button key={type} onClick={() => placeBuilding(type)} style={btnStyle(false)}>
              {type.replace(/_/g, ' ')}
            </button>
          ))}
        </div>
      </div>

      <div>
        <span style={labelStyle}>Placed: {buildings.length} (click in 3D to drag)</span>
        <div style={{ maxHeight: '150px', overflowY: 'auto' }}>
          {buildings.map((b) => (
            <div key={b.id} style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '3px 6px', borderBottom: '1px solid rgba(255,255,255,0.05)',
              fontSize: '9px', color: dragId === b.id ? '#4fc3f7' : 'var(--text-secondary)',
            }}>
              <span>{b.type.replace(/_/g, ' ')}</span>
              <button onClick={() => deleteBuilding(b.id)}
                style={{ background: 'none', border: 'none', color: '#ff6666', cursor: 'pointer', fontSize: '10px' }}>
                x
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ─── Mechanics Section ───────────────────────────────────────────────────────
function MechanicsSection() {
  const trees = useGameStore((s) => s.sandboxTrees)
  const rocks = useGameStore((s) => s.sandboxRocks)
  const buildings = useGameStore((s) => s.buildings)
  const wood = useGameStore((s) => s.wood)
  const stone = useGameStore((s) => s.stone)
  const ore = useGameStore((s) => s.ore)
  const souls = useGameStore((s) => s.souls)
  const harvestTasks = useGameStore((s) => s.sandboxHarvestTasks)

  const aliveSouls = souls.filter((s) => s.isAlive)

  const spawnTree = () => {
    const tree = {
      id: `tree_${nanoid(6)}`,
      position: [(Math.random() - 0.5) * 80, 0, (Math.random() - 0.5) * 80],
      health: 100,
    }
    useGameStore.setState((s) => ({ sandboxTrees: [...s.sandboxTrees, tree] }))
  }

  const spawnRock = (type) => {
    const rock = {
      id: `rock_${nanoid(6)}`,
      position: [(Math.random() - 0.5) * 80, 0, (Math.random() - 0.5) * 80],
      health: 100,
      type, // 'stone' or 'ore'
    }
    useGameStore.setState((s) => ({ sandboxRocks: [...s.sandboxRocks, rock] }))
  }

  const _findFreeSoul = (targetPos) => {
    const state = useGameStore.getState()
    const busyIds = new Set(state.sandboxHarvestTasks.map((t) => t.soulId))
    // Prefer selected soul
    const selected = state.selectedSoulId
      ? aliveSouls.find((s) => s.id === state.selectedSoulId && !busyIds.has(s.id))
      : null
    if (selected) return selected
    // Otherwise closest free soul
    const free = aliveSouls.filter((s) => !busyIds.has(s.id))
    if (free.length === 0) return null
    return free.reduce((best, s) => {
      const dx = (s.position?.x || 0) - targetPos[0]
      const dz = (s.position?.z || 0) - targetPos[2]
      const bx = (best.position?.x || 0) - targetPos[0]
      const bz = (best.position?.z || 0) - targetPos[2]
      return (dx * dx + dz * dz) < (bx * bx + bz * bz) ? s : best
    })
  }

  const chopTree = (id) => {
    const tree = trees.find((t) => t.id === id)
    if (!tree || tree.health <= 0) return
    if (harvestTasks.find((t) => t.targetId === id)) return

    const soul = _findFreeSoul(tree.position)
    if (!soul) return

    useGameStore.setState((s) => ({
      sandboxHarvestTasks: [...s.sandboxHarvestTasks, {
        soulId: soul.id, targetId: id, targetType: 'tree',
      }],
    }))
    useGameStore.getState().addEventLog({
      year: Math.round(useGameStore.getState().currentYear),
      text: `[SANDBOX] ${soul.llmName} sent to chop tree`,
      type: 'economy',
    })
  }

  const mineRock = (id) => {
    const rock = rocks.find((r) => r.id === id)
    if (!rock || rock.health <= 0) return
    if (harvestTasks.find((t) => t.targetId === id)) return

    const soul = _findFreeSoul(rock.position)
    if (!soul) return

    useGameStore.setState((s) => ({
      sandboxHarvestTasks: [...s.sandboxHarvestTasks, {
        soulId: soul.id, targetId: id, targetType: 'rock',
      }],
    }))
    useGameStore.getState().addEventLog({
      year: Math.round(useGameStore.getState().currentYear),
      text: `[SANDBOX] ${soul.llmName} sent to mine rock`,
      type: 'economy',
    })
  }

  const clearDepleted = () => {
    useGameStore.setState((s) => ({
      sandboxTrees: s.sandboxTrees.filter((t) => t.health > 0),
      sandboxRocks: s.sandboxRocks.filter((r) => r.health > 0),
    }))
  }

  const clearAll = () => {
    useGameStore.setState({ sandboxTrees: [], sandboxRocks: [] })
  }

  // Construction progress simulation
  const [constructionId, setConstructionId] = useState(null)
  const progressRef = useRef(null)

  const startConstruction = () => {
    const building = {
      id: `bld_${nanoid(6)}`,
      type: 'stone_cottage',
      era: 'medieval',
      position: [(Math.random() - 0.5) * 40, 0, (Math.random() - 0.5) * 40],
      progress: 0,
      health: 100,
    }
    useGameStore.setState((s) => ({ buildings: [...s.buildings, building] }))
    setConstructionId(building.id)
  }

  useEffect(() => {
    if (!constructionId) return
    const interval = setInterval(() => {
      const state = useGameStore.getState()
      const bld = state.buildings.find((b) => b.id === constructionId)
      if (!bld || bld.progress >= 1) {
        setConstructionId(null)
        clearInterval(interval)
        if (bld) {
          state.addEventLog({
            year: Math.round(state.currentYear),
            text: `[SANDBOX] Construction complete: ${bld.type.replace(/_/g, ' ')}`,
            type: 'build',
          })
        }
        return
      }
      useGameStore.setState((s) => ({
        buildings: s.buildings.map((b) =>
          b.id === constructionId ? { ...b, progress: Math.min(1, b.progress + 0.05) } : b
        ),
      }))
    }, 300)
    progressRef.current = interval
    return () => clearInterval(interval)
  }, [constructionId])

  return (
    <div style={sectionGap}>
      {/* Resource display */}
      <div style={{
        display: 'flex', gap: '12px', padding: '6px 8px',
        background: 'rgba(255,255,255,0.03)', borderRadius: '4px',
        fontSize: '10px',
      }}>
        <span>Wood: <b style={{ color: '#8B5E3C' }}>{Math.round(wood)}</b></span>
        <span>Stone: <b style={{ color: '#888' }}>{Math.round(stone)}</b></span>
        <span>Ore: <b style={{ color: '#b8960a' }}>{Math.round(ore)}</b></span>
      </div>

      {aliveSouls.length === 0 && (
        <div style={{
          padding: '6px 8px', background: 'rgba(255,152,0,0.1)',
          border: '1px solid rgba(255,152,0,0.3)', borderRadius: '4px',
          fontSize: '9px', color: '#FF9800',
        }}>
          Spawn souls first (Souls tab) to send them to chop/mine.
        </div>
      )}

      {/* Tree chopping */}
      <div>
        <span style={labelStyle}>Tree Chopping</span>
        <div style={{ display: 'flex', gap: '6px', marginBottom: '6px' }}>
          <button onClick={spawnTree} style={btnStyle(false)}>+ Spawn Tree</button>
        </div>
        <div style={{ maxHeight: '100px', overflowY: 'auto' }}>
          {trees.map((t) => (
            <div key={t.id} style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '3px 6px', borderBottom: '1px solid rgba(255,255,255,0.05)', fontSize: '9px',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ color: t.health > 0 ? '#4CAF50' : '#666' }}>
                  Tree ({t.health}%)
                </span>
                {/* Mini health bar */}
                <div style={{ width: '40px', height: '4px', background: '#333', borderRadius: '2px' }}>
                  <div style={{
                    width: `${t.health}%`, height: '100%', borderRadius: '2px',
                    background: t.health > 50 ? '#4CAF50' : t.health > 25 ? '#FF9800' : '#f44336',
                  }} />
                </div>
              </div>
              <button
                onClick={() => chopTree(t.id)}
                disabled={t.health <= 0 || !!harvestTasks.find((ht) => ht.targetId === t.id) || aliveSouls.length === 0}
                style={{
                  ...btnStyle(!!harvestTasks.find((ht) => ht.targetId === t.id)),
                  fontSize: '8px', padding: '2px 6px',
                  opacity: t.health > 0 && aliveSouls.length > 0 ? 1 : 0.3,
                }}>
                {harvestTasks.find((ht) => ht.targetId === t.id) ? 'Chopping...' : 'Send Soul'}
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Mining */}
      <div>
        <span style={labelStyle}>Mining</span>
        <div style={{ display: 'flex', gap: '6px', marginBottom: '6px' }}>
          <button onClick={() => spawnRock('stone')} style={btnStyle(false)}>+ Stone Rock</button>
          <button onClick={() => spawnRock('ore')} style={btnStyle(false)}>+ Ore Vein</button>
        </div>
        <div style={{ maxHeight: '100px', overflowY: 'auto' }}>
          {rocks.map((r) => (
            <div key={r.id} style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '3px 6px', borderBottom: '1px solid rgba(255,255,255,0.05)', fontSize: '9px',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ color: r.health > 0 ? (r.type === 'ore' ? '#b8960a' : '#888') : '#666' }}>
                  {r.type === 'ore' ? 'Ore' : 'Stone'} ({r.health}%)
                </span>
                <div style={{ width: '40px', height: '4px', background: '#333', borderRadius: '2px' }}>
                  <div style={{
                    width: `${r.health}%`, height: '100%', borderRadius: '2px',
                    background: r.health > 50 ? '#4CAF50' : r.health > 25 ? '#FF9800' : '#f44336',
                  }} />
                </div>
              </div>
              <button
                onClick={() => mineRock(r.id)}
                disabled={r.health <= 0 || !!harvestTasks.find((ht) => ht.targetId === r.id) || aliveSouls.length === 0}
                style={{
                  ...btnStyle(!!harvestTasks.find((ht) => ht.targetId === r.id)),
                  fontSize: '8px', padding: '2px 6px',
                  opacity: r.health > 0 && aliveSouls.length > 0 ? 1 : 0.3,
                }}>
                {harvestTasks.find((ht) => ht.targetId === r.id) ? 'Mining...' : 'Send Soul'}
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Construction */}
      <div>
        <span style={labelStyle}>Building Construction</span>
        <button
          onClick={startConstruction}
          disabled={!!constructionId}
          style={{
            ...btnStyle(false),
            opacity: constructionId ? 0.4 : 1,
            cursor: constructionId ? 'not-allowed' : 'pointer',
          }}
        >
          {constructionId ? 'Building...' : 'Start Construction (Stone Cottage)'}
        </button>
        {constructionId && (() => {
          const bld = buildings.find((b) => b.id === constructionId)
          if (!bld) return null
          const pct = Math.round((bld.progress || 0) * 100)
          return (
            <div style={{ marginTop: '6px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '9px', color: 'var(--text-secondary)' }}>
                <span>Progress</span>
                <span>{pct}%</span>
              </div>
              <div style={{ width: '100%', height: '6px', background: '#333', borderRadius: '3px', marginTop: '3px' }}>
                <div style={{
                  width: `${pct}%`, height: '100%', borderRadius: '3px',
                  background: 'linear-gradient(90deg, #4fc3f7, #6B5CE7)',
                  transition: 'width 0.2s',
                }} />
              </div>
            </div>
          )
        })()}
      </div>

      {/* Cleanup */}
      <div style={{ display: 'flex', gap: '6px' }}>
        <button onClick={clearDepleted} style={btnStyle(false)}>Clear Depleted</button>
        <button onClick={clearAll} style={dangerBtn}>Clear All Nature</button>
      </div>
    </div>
  )
}

// ─── Animations Section ──────────────────────────────────────────────────────
function AnimationsSection() {
  const forceAnim = useGameStore((s) => s.sandboxForceAnimation)
  const souls = useGameStore((s) => s.souls)
  const aliveCount = souls.filter((s) => s.isAlive).length

  const setForceAnim = (anim) => {
    if (forceAnim === anim) {
      useGameStore.setState({ sandboxForceAnimation: null })
    } else {
      useGameStore.setState({ sandboxForceAnimation: anim })
    }
  }

  const clearForce = () => {
    useGameStore.setState({ sandboxForceAnimation: null })
  }

  return (
    <div style={sectionGap}>
      {aliveCount === 0 && (
        <div style={{
          padding: '8px', background: 'rgba(255,152,0,0.1)',
          border: '1px solid rgba(255,152,0,0.3)', borderRadius: '4px',
          fontSize: '10px', color: '#FF9800',
        }}>
          Spawn souls first (Souls tab) to preview animations.
        </div>
      )}

      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
          <span style={labelStyle}>
            Active: {forceAnim || 'none (natural)'}
          </span>
          {forceAnim && (
            <button onClick={clearForce} style={{ ...btnStyle(false), fontSize: '8px', padding: '2px 6px' }}>
              Clear
            </button>
          )}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
          {ALL_ANIMATIONS.map((anim) => (
            <button
              key={anim.id}
              onClick={() => setForceAnim(anim.id)}
              style={{
                ...btnStyle(forceAnim === anim.id),
                textAlign: 'left',
                padding: '6px 10px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <div>
                <span style={{ fontWeight: forceAnim === anim.id ? 'bold' : 'normal' }}>
                  {anim.label}
                </span>
              </div>
              <span style={{ fontSize: '8px', color: 'var(--text-secondary)', maxWidth: '120px', textAlign: 'right' }}>
                {anim.desc}
              </span>
            </button>
          ))}
        </div>
      </div>

      <div style={{
        fontSize: '9px', color: 'var(--text-secondary)', lineHeight: '1.5',
        padding: '6px', background: 'rgba(255,255,255,0.02)', borderRadius: '3px',
      }}>
        Click an animation to force all souls to play it. Click again to release.
        Souls stop wandering while an animation is forced.
      </div>
    </div>
  )
}

// ─── Weather Section ─────────────────────────────────────────────────────────
function WeatherSection() {
  const weather = useGameStore((s) => s.weather)
  const season = useGameStore((s) => s.season)
  const SEASONS = ['spring', 'summer', 'autumn', 'winter']

  return (
    <div style={sectionGap}>
      <div>
        <span style={labelStyle}>Weather</span>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
          {WEATHERS.map((w) => (
            <button key={w} onClick={() => useGameStore.getState().setWeather(w)} style={btnStyle(weather === w)}>
              {w}
            </button>
          ))}
        </div>
      </div>
      <div>
        <span style={labelStyle}>Season</span>
        <div style={{ display: 'flex', gap: '4px' }}>
          {SEASONS.map((s) => (
            <button key={s} onClick={() => useGameStore.setState({ season: s })} style={btnStyle(season === s)}>
              {s}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

// ─── Era Section ─────────────────────────────────────────────────────────────
function EraSection() {
  const currentEra = useGameStore((s) => s.currentEra)
  const currentYear = useGameStore((s) => s.currentYear)

  const jumpToEra = (era) => {
    useGameStore.setState({
      currentEra: era.id, currentEraData: era,
      currentYear: era.startYear, techLevel: era.techLevel,
    })
  }

  return (
    <div style={sectionGap}>
      <div>
        <span style={labelStyle}>Current: {currentEra} (Year {Math.round(currentYear)})</span>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          {ERAS.map((era) => (
            <button key={era.id} onClick={() => jumpToEra(era)}
              style={{ ...btnStyle(currentEra === era.id), textAlign: 'left', padding: '6px 10px' }}>
              <div style={{ fontWeight: currentEra === era.id ? 'bold' : 'normal' }}>{era.name}</div>
              <div style={{ fontSize: '8px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                {era.startYear} - {era.endYear} | Tech {era.techLevel}
              </div>
            </button>
          ))}
        </div>
      </div>
      <div>
        <span style={labelStyle}>Manual Year</span>
        <input type="range" min="-3000" max="2100" value={currentYear}
          onChange={(e) => {
            const year = parseInt(e.target.value, 10)
            const era = ERAS.find((er) => year >= er.startYear && year < er.endYear) || ERAS[ERAS.length - 1]
            useGameStore.setState({ currentYear: year, currentEra: era.id, currentEraData: era, techLevel: era.techLevel })
          }}
          style={{ width: '100%', accentColor: '#4fc3f7' }}
        />
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '8px', color: 'var(--text-secondary)' }}>
          <span>3000 BC</span><span>2100 AD</span>
        </div>
      </div>
    </div>
  )
}

// ─── Economy Section ─────────────────────────────────────────────────────────
function EconomySection() {
  const foodSupply = useGameStore((s) => s.foodSupply)
  const wood = useGameStore((s) => s.wood)
  const stone = useGameStore((s) => s.stone)
  const ore = useGameStore((s) => s.ore)
  const happinessAvg = useGameStore((s) => s.happinessAvg)
  const godFavor = useGameStore((s) => s.godFavor)

  const setResource = (key, value) => useGameStore.setState({ [key]: value })

  const resources = [
    { key: 'foodSupply', label: 'Food', value: foodSupply, max: 1000 },
    { key: 'wood', label: 'Wood', value: wood, max: 500 },
    { key: 'stone', label: 'Stone', value: stone, max: 500 },
    { key: 'ore', label: 'Ore', value: ore, max: 500 },
    { key: 'happinessAvg', label: 'Happiness', value: happinessAvg, max: 100 },
    { key: 'godFavor', label: 'God Favor', value: godFavor, max: 5000 },
  ]

  return (
    <div style={sectionGap}>
      {resources.map((r) => (
        <div key={r.key}>
          <div style={{ display: 'flex', justifyContent: 'space-between', ...labelStyle, marginBottom: '3px' }}>
            <span>{r.label}</span>
            <span style={{ color: '#4fc3f7' }}>{Math.round(r.value)}</span>
          </div>
          <input type="range" min="0" max={r.max} value={r.value}
            onChange={(e) => setResource(r.key, parseInt(e.target.value, 10))}
            style={{ width: '100%', accentColor: '#4fc3f7' }}
          />
        </div>
      ))}
      <div style={{ display: 'flex', gap: '6px' }}>
        <button onClick={() => {
          setResource('foodSupply', 500); setResource('wood', 250);
          setResource('stone', 250); setResource('ore', 250);
          setResource('happinessAvg', 80); setResource('godFavor', 2000);
        }} style={btnStyle(false)}>Set Abundant</button>
        <button onClick={() => {
          setResource('foodSupply', 10); setResource('wood', 0);
          setResource('stone', 0); setResource('ore', 0);
          setResource('happinessAvg', 20); setResource('godFavor', 50);
        }} style={dangerBtn}>Set Scarce</button>
      </div>
    </div>
  )
}

// ─── God Powers Section ──────────────────────────────────────────────────────
function PowersSection() {
  const godFavor = useGameStore((s) => s.godFavor)
  const souls = useGameStore((s) => s.souls)
  const alive = souls.filter((s) => s.isAlive)

  const usePower = (power) => {
    if (godFavor < power.cost) return
    useGameStore.setState((s) => ({ godFavor: s.godFavor - power.cost }))
    useGameStore.getState().addEventLog({
      year: Math.round(useGameStore.getState().currentYear),
      text: `[SANDBOX] God power "${power.name}" activated (cost: ${power.cost})`,
      type: 'god_power',
    })
    if (alive.length > 0 && power.targetType === 'soul') {
      const target = alive[Math.floor(Math.random() * alive.length)]
      if (power.effect === 'kill') {
        useGameStore.setState((s) => ({
          souls: s.souls.map((soul) => soul.id === target.id ? { ...soul, isAlive: false } : soul),
          population: Math.max(0, s.population - 1),
        }))
      } else if (power.effect === 'bless') {
        useGameStore.setState((s) => ({
          souls: s.souls.map((soul) => soul.id === target.id ? { ...soul, happiness: 100, health: 100, energy: 100 } : soul),
        }))
      }
    }
  }

  return (
    <div style={sectionGap}>
      <span style={labelStyle}>God Favor: {Math.round(godFavor)}</span>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
        {GOD_POWERS.map((power) => {
          const canAfford = godFavor >= power.cost
          return (
            <button key={power.id} onClick={() => usePower(power)} disabled={!canAfford}
              style={{
                ...btnStyle(false), textAlign: 'left', padding: '6px 10px',
                opacity: canAfford ? 1 : 0.4, cursor: canAfford ? 'pointer' : 'not-allowed',
              }}>
              <div>{power.icon} {power.name}</div>
              <div style={{ fontSize: '8px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                {power.description} (Cost: {power.cost})
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}

// ─── World State Section ─────────────────────────────────────────────────────
function WorldStateSection() {
  const worldState = useGameStore((s) => s.worldState)
  const population = useGameStore((s) => s.population)
  const warOngoing = useGameStore((s) => s.warOngoing)
  const paused = useGameStore((s) => s.paused)
  const speedMultiplier = useGameStore((s) => s.speedMultiplier)

  const WORLD_STATES = ['peaceful', 'tense', 'conflict', 'war', 'famine', 'plague', 'golden_age']
  const SPEEDS = [1, 2, 5, 10, 50]

  return (
    <div style={sectionGap}>
      <div>
        <span style={labelStyle}>World State</span>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
          {WORLD_STATES.map((ws) => (
            <button key={ws} onClick={() => useGameStore.getState().setWorldState(ws)} style={btnStyle(worldState === ws)}>
              {ws.replace(/_/g, ' ')}
            </button>
          ))}
        </div>
      </div>
      <div>
        <span style={labelStyle}>Simulation Speed</span>
        <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
          <button onClick={() => useGameStore.getState().togglePause()}
            style={{ ...btnStyle(paused), borderColor: paused ? '#ff4444' : 'var(--hud-border)', color: paused ? '#ff6666' : 'var(--text-secondary)' }}>
            {paused ? 'Paused' : 'Running'}
          </button>
          {SPEEDS.map((s) => (
            <button key={s} onClick={() => useGameStore.getState().setSpeed(s)} style={btnStyle(speedMultiplier === s)}>
              {s}x
            </button>
          ))}
        </div>
      </div>
      <div>
        <span style={labelStyle}>Toggles</span>
        <button onClick={() => useGameStore.setState((s) => ({ warOngoing: !s.warOngoing }))} style={btnStyle(warOngoing)}>
          War: {warOngoing ? 'ON' : 'OFF'}
        </button>
      </div>
      <div>
        <span style={labelStyle}>Stats</span>
        <div style={{ fontSize: '10px', color: 'var(--text-secondary)', lineHeight: '1.6' }}>
          <div>Population: {population}</div>
          <div>World State: {worldState}</div>
          <div>Speed: {speedMultiplier}x {paused ? '(PAUSED)' : ''}</div>
        </div>
      </div>
    </div>
  )
}
