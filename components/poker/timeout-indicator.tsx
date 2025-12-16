"use client"

import { useEffect, useState } from "react"
import type { PokerGameState } from "@/types/poker"

interface TimeoutIndicatorProps {
  game: PokerGameState
  currentUserId: string
}

export function TimeoutIndicator({ game, currentUserId }: TimeoutIndicatorProps) {
  const [countdown, setCountdown] = useState<number | null>(null)
  
  useEffect(() => {
    // ゲームがWAITINGまたはSHOWDOWN状態の場合は表示しない
    if (game.phase === "WAITING" || game.phase === "SHOWDOWN") {
      setCountdown(null)
      return
    }
    
    // timeoutSecondsのデフォルト値を設定
    const timeoutSeconds = game.timeoutSeconds || 30
    
    // カウントダウンを開始
    setCountdown(timeoutSeconds)
    
    const interval = setInterval(() => {
      setCountdown(prev => {
        if (prev === null || prev <= 1) {
          clearInterval(interval)
          return 0
        }
        return prev - 1
      })
    }, 1000)
    
    return () => clearInterval(interval)
  }, [game.currentPlayerIndex, game.phase, game.timeoutSeconds])
  
  if (countdown === null) {
    return null
  }
  
  const currentPlayer = game.players[game.currentPlayerIndex]
  
  if (!currentPlayer) {
    return null
  }
  
  const isMyTurn = currentPlayer.userId === currentUserId
  
  return (
    <div className="w-full px-2 py-2 bg-gray-800/50 backdrop-blur-sm">
      <div className="flex items-center justify-between">
        <div className="text-sm font-medium text-white">
          {isMyTurn ? "あなたのターン" : `${currentPlayer.userName}のターン`}
        </div>
        <div className={`text-sm font-bold ${countdown <= 5 ? 'text-red-500 animate-pulse' : 'text-white'}`}>
          {countdown}s
        </div>
      </div>
    </div>
  )
}
