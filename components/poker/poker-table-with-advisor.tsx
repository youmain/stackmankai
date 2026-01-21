"use client"

import { useState, useEffect } from "react"
import "./animations.css"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import type { PokerGameState, PokerPlayer, Card as PokerCard } from "@/types/poker"
import { TimeoutIndicator } from "./timeout-indicator"
import { WinnerDisplay } from "./winner-display"
import { RoundIndicator, PhaseProgressBar } from "./round-indicator"
import { CompactActionHistory } from "./action-history"
import { PokerAdvisorPanel } from "./PokerAdvisorPanel"
import type { AdvisorType } from "@/lib/ai-poker-advisor"
import { PokerTable } from "./poker-table"

interface PokerTableWithAdvisorProps {
  game: PokerGameState | null
  currentUserId: string
  onAction: (action: string, amount?: number) => void
  onJoinSeat: (seatIndex: number) => void
  onLeaveSeat: () => void
  onStartGame: () => void
  onResetGame?: () => void
  onTimeout?: () => void
  onReadyNextHand?: () => void
  storeId?: string
  enableAdvisor?: boolean
  opponentId?: string
}

/**
 * PokerTableWithAdvisor
 * AIアドバイザーパネルを含むポーカーテーブルコンポーネント
 */
export function PokerTableWithAdvisor({
  game,
  currentUserId,
  onAction,
  onJoinSeat,
  onLeaveSeat,
  onStartGame,
  onResetGame,
  onTimeout,
  onReadyNextHand,
  storeId = "default-store",
  enableAdvisor = true,
  opponentId,
}: PokerTableWithAdvisorProps) {
  const [advisorType, setAdvisorType] = useState<AdvisorType>("balanced")

  if (!game) {
    return <div className="text-center text-gray-400 p-4">ゲームデータを読み込み中...</div>
  }

  // 現在のプレイヤーを取得
  const currentPlayer = game.players.find((p) => p.userId === currentUserId)

  // 対戦相手を取得（複数プレイヤーの場合は最初の他のプレイヤー）
  const opponent = game.players.find((p) => p.userId !== currentUserId && !p.isFolded)

  return (
    <div className="w-full space-y-4">
      {/* ポーカーテーブル */}
      <PokerTable
        game={game}
        currentUserId={currentUserId}
        onAction={onAction}
        onJoinSeat={onJoinSeat}
        onLeaveSeat={onLeaveSeat}
        onStartGame={onStartGame}
        onResetGame={onResetGame}
        onTimeout={onTimeout}
        onReadyNextHand={onReadyNextHand}
      />

      {/* AIアドバイザーパネル */}
      {enableAdvisor && currentPlayer && opponent && game.phase !== "waiting" && (
        <PokerAdvisorPanel
          storeId={storeId}
          gameId={game.gameId || "unknown"}
          playerId={currentUserId}
          playerCards={currentPlayer.cards || []}
          communityCards={game.communityCards || []}
          potSize={game.pot || 0}
          playerStack={currentPlayer.stack || 0}
          opponentStack={opponent.stack || 0}
          gamePhase={game.phase || "preflop"}
          opponentId={opponent.userId || opponentId}
          onAdvisorTypeChange={setAdvisorType}
        />
      )}
    </div>
  )
}
