'use client'

import { useGameStore } from '@/store/useGameStore'
import Campfire from '@/models/Campfire'

export default function CampfireRenderer() {
  const campfires = useGameStore((s) => s.campfires)

  if (!campfires || campfires.length === 0) return null

  return (
    <group>
      {campfires.map((cf) => (
        <Campfire
          key={cf.id}
          position={[cf.position.x, cf.position.y, cf.position.z]}
          state={cf.state}
          progress={cf.state === 'building' ? cf.progress : cf.state === 'dying' ? cf.ticksInState / 20 : 1}
        />
      ))}
    </group>
  )
}
