"use client"

import { useEffect, useState } from "react"
import type { PokerGameState } from "@/types/poker"
import { getRemainingTime } from "@/lib/poker-timeout"

interface TimeoutIndicatorProps {
  game: PokerGameState
  currentUserId: string
}

export function TimeoutIndicator({ game, currentUserId }: TimeoutIndicatorProps) {
  const [remainingTime, setRemainingTime] = useState<number | null>(null)
  
  useEffect(() => {
    // ゲームがWAITINGまたはSHOWDOWN状態の場合は表示しない
    if (game.phase === "WAITING" || game.phase === "SHOWDOWN") {
      setRemainingTime(null)
      return
    }
    
    // turnStartTimeがnullの場合、デフォルトのタイムアウト時間を表示
    if (!game.turnStartTime) {
      setRemainingTime(game.timeoutSeconds || 30)
      return
    }
    
    if (!game.timeoutSeconds) {
      setRemainingTime(null)
      return
    }
    
    const updateTimer = () => {
      const now = new Date()
      const turnStartTime = game.turnStartTime instanceof Date 
        ? game.turnStartTime 
        : (game.turnStartTime as any).toDate()
      
      const elapsedSeconds = (now.getTime() - turnStartTime.getTime()) / 1000
      const remaining = game.timeoutSeconds! - elapsedSeconds
      
      if (remaining <= 0) {
        setRemainingTime(0)
      } else {
        setRemainingTime(Math.ceil(remaining))
      }
    }
    
    updateTimer()
    const interval = setInterval(updateTimer, 100)
    
    return () => clearInterval(interval)
  }, [game.turnStartTime, game.timeoutSeconds, game.currentPlayerIndex, game.phase])
  
  if (remainingTime === null) {
    return null
  }
  
  const currentPlayer = game.players[game.currentPlayerIndex]
  if (!currentPlayer) {
    return null
  }
  
  const isMyTurn = currentPlayer.userId === currentUserId
  
  // Calculate progress percentage
  const progress = game.timeoutSeconds ? (remainingTime / game.timeoutSeconds) * 100 : 0
  
  // Determine color based on remaining time
  let colorClass = "bg-green-500"
  if (remainingTime <= 5) {
    colorClass = "bg-red-500"
  } else if (remainingTime <= 10) {
    colorClass = "bg-yellow-500"
  }
  
  return (
    <div className="w-full px-2 py-2 bg-gray-800/50 backdrop-blur-sm">
      <div className="flex items-center gap-3">
        <div className="text-sm font-medium text-white min-w-[120px]">
          {isMyTurn ? "あなたのターン" : `${currentPlayer.name}のターン`}
        </div>
        <div className="flex-1 bg-gray-700 rounded-full h-3 overflow-hidden">
          <div
            className={`h-full ${colorClass} transition-all duration-100`}
            style={{ width: `${progress}%` }}
          />
        </div>
        <div className={`text-sm font-bold min-w-[40px] text-right ${remainingTime <= 5 ? 'text-red-500 animate-pulse' : 'text-white'}`}>
          {remainingTime}s
        </div>
      </div>
    </div>
  )
}
