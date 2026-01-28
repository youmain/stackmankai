"use client"

import React from "react"
import { Button } from "@/components/ui/badge"
import { CardDisplay } from "./card-display"
import type { PokerPlayer, GamePhase } from "@/types/poker"

interface PlayerSeatProps {
  player?: PokerPlayer
  seatIndex: number
  isDealer: boolean
  isSB: boolean
  isBB: boolean
  currentUserId: string
  onJoinSeat: (seatIndex: number) => void
  gamePhase: GamePhase
}

export function PlayerSeat({
  player,
  seatIndex,
  isDealer,
  isSB,
  isBB,
  currentUserId,
  onJoinSeat,
  gamePhase,
}: PlayerSeatProps) {
  if (!player) {
    return (
      <div className="flex flex-col items-center justify-center p-2 bg-gray-800/20 border border-dashed border-gray-700 rounded-lg h-24">
        <div className="text-[10px] text-gray-600 mb-1">席 {seatIndex + 1}</div>
        <button
          onClick={() => onJoinSeat(seatIndex)}
          className="text-[10px] bg-gray-700 hover:bg-gray-600 text-gray-300 px-2 py-1 rounded transition-colors"
        >
          座る
        </button>
      </div>
    )
  }

  const isMe = player.userId === currentUserId
  const isFolded = player.isFolded

  return (
    <div className={`relative flex flex-col items-center p-2 rounded-lg border transition-all h-24 ${
      isMe ? 'bg-blue-900/20 border-blue-500/50' : 'bg-gray-800/40 border-gray-700'
    } ${isFolded ? 'opacity-50 grayscale' : ''}`}>
      {/* 役職バッジ */}
      <div className="absolute -top-2 -right-2 flex gap-0.5">
        {isDealer && (
          <div className="w-5 h-5 bg-white text-gray-900 rounded-full flex items-center justify-center text-[8px] font-black shadow">D</div>
        )}
        {isSB && (
          <div className="w-5 h-5 bg-yellow-400 text-yellow-900 rounded-full flex items-center justify-center text-[8px] font-black shadow">SB</div>
        )}
        {isBB && (
          <div className="w-5 h-5 bg-orange-500 text-orange-950 rounded-full flex items-center justify-center text-[8px] font-black shadow">BB</div>
        )}
      </div>

      <div className="text-[10px] font-bold text-white truncate w-full text-center mb-1">
        {player.userName}
      </div>
      
      <div className="text-[10px] font-black text-yellow-400 mb-1">
        ¥{player.stack.toLocaleString()}
      </div>

      {/* カード表示（ショーダウン中または自分自身の場合） */}
      <div className="flex gap-0.5 mt-auto">
        {player.cards && player.cards.length > 0 ? (
          player.cards.map((card, idx) => (
            <CardDisplay key={idx} card={card} size="small" />
          ))
        ) : !isFolded && gamePhase !== "waiting" ? (
          <div className="flex gap-0.5">
            <div className="w-6 h-8 bg-blue-800 border border-blue-600 rounded-sm shadow-sm" />
            <div className="w-6 h-8 bg-blue-800 border border-blue-600 rounded-sm shadow-sm" />
          </div>
        ) : null}
      </div>

      {/* アクションラベル */}
      {player.lastAction && (
        <div className="absolute -bottom-2 bg-gray-900 border border-gray-700 px-1.5 rounded text-[8px] font-bold text-white uppercase shadow-lg">
          {player.lastAction}
        </div>
      )}
    </div>
  )
}
