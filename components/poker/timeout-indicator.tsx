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
    if (!game.turnStartTime || !game.timeoutSeconds) {
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
  }, [game.turnStartTime, game.timeoutSeconds, game.currentPlayerIndex])
  
  if (remainingTime === null) {
    return null
  }
  
  const currentPlayer = game.players[game.currentPlayerIndex]
  const isMyTurn = currentPlayer?.userId === currentUserId
  
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
    <div className={`${isMyTurn ? 'block' : 'hidden'} w-full`}>
      <div className="flex items-center gap-2 px-2 py-1">
        <div className="flex-1 bg-gray-700 rounded-full h-2 overflow-hidden">
          <div
            className={`h-full ${colorClass} transition-all duration-100`}
            style={{ width: `${progress}%` }}
          />
        </div>
        <div className={`text-sm font-bold ${remainingTime <= 5 ? 'text-red-500 animate-pulse' : 'text-white'}`}>
          {remainingTime}s
        </div>
      </div>
    </div>
  )
}
