'use client'

import { useGameStore } from '@/store/useGameStore'
import BuildingFactory, { BUILDING_SIZES } from '@/models/buildings/BuildingFactory'

export default function BuildingsRenderer() {
  const buildings = useGameStore((s) => s.buildings)

  return (
    <group>
      {buildings.map((building) => {
        const pos = building.position || [0, 0, 0]
        const progress = building.progress ?? 1

        return (
          <group key={building.id}>
            <BuildingFactory
              type={building.type}
              position={pos}
              progress={progress}
            />

            {/* Wireframe scaffolding for in-progress buildings */}
            {progress < 1 && (() => {
              const size = BUILDING_SIZES[building.type] || { width: 2, depth: 2, height: 3 }
              const h = size.height
              return (
                <mesh position={[pos[0], pos[1] + h * 0.5, pos[2]]}>
                  <boxGeometry args={[size.width + 0.4, h + 0.5, size.depth + 0.4]} />
                  <meshBasicMaterial color="#a08040" wireframe transparent opacity={0.25} />
                </mesh>
              )
            })()}
          </group>
        )
      })}
    </group>
  )
}
