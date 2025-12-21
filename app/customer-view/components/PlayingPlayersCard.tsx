"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Zap } from "lucide-react"
import type { Player } from "@/types"

interface PlayingPlayersCardProps {
  players: Player[]
}

export function PlayingPlayersCard({ players }: PlayingPlayersCardProps) {
  const playingPlayers = players.filter((player) => player.isPlaying)

  return (
    <Card className="border-green-200 bg-green-50 shadow-md">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-green-700 text-lg sm:text-xl">
          <Zap className="h-5 w-5" />🎮 現在プレイ中 🎮
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        {playingPlayers.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {playingPlayers.map((player) => (
              <Badge
                key={player.id}
                variant="secondary"
                className="bg-green-100 text-green-800 px-3 py-2 text-sm sm:text-base"
              >
                {player.pokerName || player.name}
              </Badge>
            ))}
          </div>
        ) : (
          <p className="text-center text-gray-600 py-2">現在プレイ中のプレイヤーはいません</p>
        )}
      </CardContent>
    </Card>
  )
}
