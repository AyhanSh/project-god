'use client'

import { useGameStore } from '@/store/useGameStore'
import SoulEntity from './SoulEntity'

export default function SoulsRenderer({ worldYear }) {
  const souls = useGameStore((s) => s.souls)

  return (
    <group>
      {souls
        .filter((soul) => soul.isAlive)
        .map((soul) => (
          <SoulEntity
            key={soul.id}
            soul={soul}
            worldYear={worldYear}
          />
        ))}
    </group>
  )
}
