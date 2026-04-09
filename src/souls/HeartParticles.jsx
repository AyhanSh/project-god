'use client'

import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'

export default function HeartParticles() {
  const ref1 = useRef()
  const ref2 = useRef()

  useFrame((state) => {
    const t = state.clock.elapsedTime
    if (ref1.current) {
      ref1.current.position.y = 2.3 + Math.sin(t * 2) * 0.25
      ref1.current.position.x = Math.sin(t * 1.3) * 0.15
      ref1.current.material.opacity = 0.45 + Math.sin(t * 3) * 0.25
    }
    if (ref2.current) {
      ref2.current.position.y = 2.6 + Math.sin(t * 2.5 + 1) * 0.2
      ref2.current.position.x = Math.sin(t * 1.7 + 2) * 0.12
      ref2.current.material.opacity = 0.35 + Math.sin(t * 2.5 + 1) * 0.25
    }
  })

  return (
    <>
      <sprite ref={ref1} position={[0, 2.3, 0]} scale={[0.22, 0.22, 0.22]}>
        <spriteMaterial color="#ff6090" transparent opacity={0.6} />
      </sprite>
      <sprite ref={ref2} position={[0, 2.6, 0]} scale={[0.16, 0.16, 0.16]}>
        <spriteMaterial color="#ff90b0" transparent opacity={0.5} />
      </sprite>
    </>
  )
}
