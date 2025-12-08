"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import type { Player } from "@/types"

interface PlayingPlayersCardProps {
  players: Player[]
  playerPurchaseHistory: Record<string, number>
}

export function PlayingPlayersCard({ players, playerPurchaseHistory }: PlayingPlayersCardProps) {
  const playingPlayers = players.filter((p) => p.isPlaying)

  return (
    <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
      <CardContent className="pt-4 sm:pt-6 lg:pt-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-blue-800">現在プレイ中</h2>
            <p className="text-xs sm:text-sm lg:text-base text-blue-600 mt-1 sm:mt-2">ゲーム中のプレイヤー</p>
          </div>
          <div className="text-right">
            <div className="text-2xl sm:text-3xl lg:text-4xl font-bold text-blue-800">{playingPlayers.length}人</div>
          </div>
        </div>

        {playingPlayers.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-3">
            {playingPlayers.map((player) => (
              <div key={player.id} className="bg-white rounded-lg p-3 border border-blue-200 shadow-sm">
                <div className="flex items-center justify-between">
                  <div className="flex flex-col">
                    <span className="font-medium text-blue-900">{player.pokerName || player.name}</span>
                    {player.pokerName && <span className="text-xs text-gray-500">{player.name}</span>}
                  </div>
                  <div className="flex flex-col items-end">
                    <Badge className="bg-blue-100 text-blue-800 text-xs">
                      {player.systemBalance.toLocaleString()}©
                    </Badge>
                    <span className="text-xs text-gray-500 mt-1">
                      購入: {(playerPurchaseHistory[player.id] || 0).toLocaleString()}円
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-4">
            <p className="text-blue-600 text-sm sm:text-base">現在プレイ中のプレイヤーはいません</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
