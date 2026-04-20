'use client'

import { useGameStore } from '@/store/useGameStore'
import { POPULATION } from '@/engine/PopulationSystem'
import SoulEntity from './SoulEntity'

export default function SoulsRenderer({ worldYear }) {
  const souls = useGameStore((s) => s.souls)

  const renderedSouls = souls
    .filter((soul) => soul.isAlive)
    .slice(0, POPULATION.MAX_RENDERED_SOULS)

  return (
    <group>
      {renderedSouls.map((soul) => (
        <SoulEntity
          key={soul.id}
          soul={soul}
          worldYear={worldYear}
        />
      ))}
    </group>
  )
}
