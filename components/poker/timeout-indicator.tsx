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
    console.log("[TimeoutIndicator] Game state:", {
      phase: game.phase,
      turnStartTime: game.turnStartTime,
      timeoutSeconds: game.timeoutSeconds,
      currentPlayerIndex: game.currentPlayerIndex,
      currentPlayer: game.players[game.currentPlayerIndex]
    })
    
    // ゲームがWAITINGまたはSHOWDOWN状態の場合は表示しない
    if (game.phase === "WAITING" || game.phase === "SHOWDOWN") {
      setRemainingTime(null)
      return
    }
    
    // timeoutSecondsのデフォルト値を設定
    const timeoutSeconds = game.timeoutSeconds || 30
    
    // turnStartTimeがnullの場合、デフォルトのタイムアウト時間を表示
    if (!game.turnStartTime) {
      setRemainingTime(timeoutSeconds)
      return
    }
    
    const updateTimer = () => {
      try {
        const now = new Date()
        
        // turnStartTimeをDate型に変換
        let turnStartTime: Date | null = null
        
        if (game.turnStartTime instanceof Date) {
          turnStartTime = game.turnStartTime
        } else if (game.turnStartTime && typeof (game.turnStartTime as any).toDate === 'function') {
          try {
            turnStartTime = (game.turnStartTime as any).toDate()
          } catch (e) {
            console.error('[TimeoutIndicator] Error calling toDate():', e)
          }
        } else if (game.turnStartTime && typeof game.turnStartTime === 'object') {
          // Firestore Timestamp形式 { seconds, nanoseconds }
          if ('seconds' in game.turnStartTime && typeof (game.turnStartTime as any).seconds === 'number') {
            turnStartTime = new Date((game.turnStartTime as any).seconds * 1000)
          } else {
            // 空のオブジェクトまたは無効なオブジェクト
            console.warn('[TimeoutIndicator] Invalid turnStartTime object:', game.turnStartTime)
          }
        }
        
        // turnStartTimeが無効な場合、デフォルトのタイムアウト時間を表示
        if (!turnStartTime || !(turnStartTime instanceof Date) || isNaN(turnStartTime.getTime())) {
          console.warn('[TimeoutIndicator] Using default timeout, turnStartTime is invalid')
          setRemainingTime(timeoutSeconds)
          return
        }
        
        const elapsedSeconds = (now.getTime() - turnStartTime.getTime()) / 1000
        const remaining = timeoutSeconds - elapsedSeconds
      
        if (remaining <= 0) {
          setRemainingTime(0)
        } else {
          setRemainingTime(Math.ceil(remaining))
        }
      } catch (error) {
        console.error('[TimeoutIndicator] Error in updateTimer:', error)
        setRemainingTime(timeoutSeconds)
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
  const timeoutSeconds = game.timeoutSeconds || 30
  const progress = (remainingTime / timeoutSeconds) * 100
  
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
