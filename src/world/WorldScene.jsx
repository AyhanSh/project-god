'use client'

import { useMemo } from 'react'
import { OrbitControls } from '@react-three/drei'
import { useGameStore } from '@/store/useGameStore'
import { ERAS } from '@/data/eras'

import { generateHeightmap } from './Terrain'
import Terrain from './Terrain'
import Sky from './Sky'
import Water from './Water'
import Atmosphere from './Atmosphere'
import Trees from '@/models/nature/Trees'
import Rocks from '@/models/nature/Rocks'
import SoulsRenderer from '@/souls/SoulsRenderer'
import BuildingsRenderer from '@/world/BuildingsRenderer'

const DEFAULT_ERA = ERAS[0]

const WORLD_HEIGHTMAP = generateHeightmap(1337)

export default function WorldScene() {
  const currentEra     = useGameStore((s) => s.currentEra)
  const currentEraData = useGameStore((s) => s.currentEraData)
  const currentYear    = useGameStore((s) => s.currentYear)

  const era = currentEraData ?? ERAS.find((e) => e.id === currentEra) ?? DEFAULT_ERA

  return (
    <>
      <OrbitControls
        makeDefault
        enableDamping
        dampingFactor={0.08}
        minDistance={8}
        maxDistance={280}
        maxPolarAngle={Math.PI / 2 - 0.04}
        target={[0, 0, 0]}
      />

      <Atmosphere />
      <Sky />
      <Terrain heightmap={WORLD_HEIGHTMAP} />
      <Water />
      <Trees heightmap={WORLD_HEIGHTMAP} seed={42} />
      <Rocks heightmap={WORLD_HEIGHTMAP} seed={99} />

      {/* Living souls */}
      <SoulsRenderer worldYear={currentYear} />

      {/* Buildings */}
      <BuildingsRenderer />
    </>
  )
}
