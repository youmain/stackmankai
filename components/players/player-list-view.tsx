"use client"

import type { Player } from "@/types"
import { PlayerCard } from "@/components/players/player-card"

interface PlayerListViewProps {
  players: Player[]
  deletingPlayerId: string | null
  playerPurchaseHistory: Record<string, number>
  onToggleStatus: (player: Player) => void
  onGenerateId: (player: Player) => void
  onEdit: (player: Player) => void
  onBalanceManagement: (player: Player) => void
  onViewHistory: (player: Player) => void
  onStartGame: (player: Player) => void
  onManageGame: (player: Player) => void
  onDelete: (player: Player) => void
  onShowQRCode: (player: Player) => void
}

export function PlayerListView({
  players,
  deletingPlayerId,
  playerPurchaseHistory,
  onToggleStatus,
  onGenerateId,
  onEdit,
  onBalanceManagement,
  onViewHistory,
  onStartGame,
  onManageGame,
  onDelete,
  onShowQRCode,
}: PlayerListViewProps) {
  if (players.length === 0) {
    return null
  }

  return (
    <div
      className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6 lg:gap-8"
      role="list"
      aria-label="プレイヤー一覧"
      aria-live="polite"
      aria-atomic="false"
    >
      {players.map((player) => {
        const isPlaying = player.isPlaying
        const totalPurchaseAmount = playerPurchaseHistory[player.id] || 0

        return (
          <div key={player.id} role="listitem">
            <PlayerCard
              player={player}
              isPlaying={isPlaying}
              totalPurchaseAmount={totalPurchaseAmount}
              deletingPlayerId={deletingPlayerId}
              onToggleStatus={onToggleStatus}
              onGenerateId={onGenerateId}
              onEdit={onEdit}
              onBalanceManagement={onBalanceManagement}
              onViewHistory={onViewHistory}
              onStartGame={onStartGame}
              onManageGame={onManageGame}
              onDelete={onDelete}
              onShowQRCode={onShowQRCode}
            />
          </div>
        )
      })}
    </div>
  )
}
