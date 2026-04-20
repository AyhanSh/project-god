'use client'

import { useMemo } from 'react'
import { OrbitControls } from '@react-three/drei'
import { useGameStore } from '@/store/useGameStore'
import FlyCamera from './FlyCamera'
import { ERAS } from '@/data/eras'

import { worldHeightmap } from '@/engine/HeightmapRegistry'
import Terrain from './Terrain'
import Sky from './Sky'
import Water from './Water'
import Atmosphere from './Atmosphere'
import Trees from '@/models/nature/Trees'
import Rocks from '@/models/nature/Rocks'
import Caves from './Caves'
import SoulsRenderer from '@/souls/SoulsRenderer'
import BuildingsRenderer from '@/world/BuildingsRenderer'
import CampfireRenderer from '@/world/CampfireRenderer'

const DEFAULT_ERA = ERAS[0]

const WORLD_HEIGHTMAP = worldHeightmap

export default function WorldScene() {
  const currentEra     = useGameStore((s) => s.currentEra)
  const currentEraData = useGameStore((s) => s.currentEraData)
  const currentYear    = useGameStore((s) => s.currentYear)
  const flyMode        = useGameStore((s) => s.flyMode)

  const era = currentEraData ?? ERAS.find((e) => e.id === currentEra) ?? DEFAULT_ERA

  return (
    <>
      {flyMode ? (
        <FlyCamera />
      ) : (
        <OrbitControls
          makeDefault
          enableDamping
          dampingFactor={0.08}
          minDistance={8}
          maxDistance={1200}
          maxPolarAngle={Math.PI / 2 - 0.04}
          target={[0, 0, 0]}
        />
      )}

      <Atmosphere />
      <Sky />
      <Terrain heightmap={WORLD_HEIGHTMAP} />
      <Water />
      <Trees heightmap={WORLD_HEIGHTMAP} seed={42} />
      <Rocks heightmap={WORLD_HEIGHTMAP} seed={99} />
      <Caves heightmap={WORLD_HEIGHTMAP} />

      {/* Living souls */}
      <SoulsRenderer worldYear={currentYear} />

      {/* Buildings */}
      <BuildingsRenderer />

      {/* Night campfires */}
      <CampfireRenderer />
    </>
  )
}
