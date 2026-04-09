'use client'

import { useState } from 'react'
import dynamic from 'next/dynamic'
import LoadingScreen from '@/screens/LoadingScreen'
import { useGameStore } from '@/store/useGameStore'

const GameWorld = dynamic(() => import('@/screens/GameWorld'), { ssr: false })

export default function Home() {
  const gameStarted = useGameStore((s) => s.gameStarted)
  const startGame = useGameStore((s) => s.startGame)

  if (!gameStarted) {
    return <LoadingScreen onComplete={startGame} />
  }

  return <GameWorld />
}
