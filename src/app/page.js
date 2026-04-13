'use client'

import dynamic from 'next/dynamic'
import { useGameStore } from '@/store/useGameStore'
import MainMenu from '@/screens/MainMenu'

const GameWorld = dynamic(() => import('@/screens/GameWorld'), { ssr: false })
const SandboxWorld = dynamic(() => import('@/screens/SandboxWorld'), { ssr: false })

export default function Home() {
  const gameMode = useGameStore((s) => s.gameMode)
  const startGame = useGameStore((s) => s.startGame)
  const startSandbox = useGameStore((s) => s.startSandbox)

  if (gameMode === 'game') {
    return <GameWorld />
  }

  if (gameMode === 'sandbox') {
    return <SandboxWorld />
  }

  return <MainMenu onStartGame={startGame} onStartSandbox={startSandbox} />
}
