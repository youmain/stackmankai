"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { User, BarChart3 } from "lucide-react"
import { useRouter } from "next/navigation"
import type { Player, StoreRankingSettings } from "@/types"

interface PlayerInfoCardProps {
  linkedPlayer: {
    id: string
    name: string
    player?: Player
  } | null
  currentRewardRate: number
  storeSettings: StoreRankingSettings | null
  onDetailedDataClick: () => void
}

export function PlayerInfoCard({
  linkedPlayer,
  currentRewardRate,
  storeSettings,
  onDetailedDataClick,
}: PlayerInfoCardProps) {
  const router = useRouter()

  if (!linkedPlayer?.player) {
    return null
  }

  const player = linkedPlayer.player

  const getDisplayName = (linkedPlayer: { id: string; name: string; player?: Player } | null) => {
    if (!linkedPlayer) return "未設定"
    return linkedPlayer.player?.name || linkedPlayer.name || "未設定"
  }

  return (
    <Card className="border-green-200 bg-green-50 shadow-md">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-green-700 text-lg sm:text-xl">
          <User className="h-5 w-5" />
          プレイヤー情報
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-gray-600">プレイヤー名</p>
            <p className="text-lg font-semibold text-gray-900">{getDisplayName(linkedPlayer)}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">ホーム店舗</p>
            <p className="text-lg font-semibold text-gray-900">{player.storeName || "未設定"}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">貯スタック</p>
            <p className="text-lg font-semibold text-blue-600">
              {player.systemBalance?.toLocaleString() || 0}💰
            </p>
          </div>
          <div 
            className="cursor-pointer hover:bg-green-50 p-2 rounded-lg transition-colors"
            onClick={() => router.push('/stack-man-hand/purchase')}
          >
            <p className="text-sm text-gray-600">スタポカ貯スタック</p>
            <p className="text-lg font-semibold text-green-600">
              {player.systemBalance?.toLocaleString() || 0}💰
            </p>
            <p className="text-xs text-green-500 mt-1">クリックでStack Man Hand購入</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">CP (Cashback Points)</p>
            <p className="text-lg font-semibold text-purple-600">
              {player.rewardPoints?.toLocaleString() || 0}CP
            </p>
            <p className="text-xs text-gray-500">今日のCP率: {currentRewardRate}%</p>
          </div>
          {storeSettings?.membershipRankSettings?.enabled && (
            <div>
              <p className="text-sm text-gray-600">会員ランク</p>
              <div className="flex items-center gap-2">
                {player.membershipRank === "platinum" && (
                  <Badge className="bg-purple-600 text-white">プラチナ</Badge>
                )}
                {player.membershipRank === "gold" && (
                  <Badge className="bg-yellow-500 text-white">ゴールド</Badge>
                )}
                {player.membershipRank === "silver" && (
                  <Badge className="bg-gray-400 text-white">シルバー</Badge>
                )}
                {(!player.membershipRank || player.membershipRank === "none") && (
                  <Badge variant="outline">一般</Badge>
                )}
              </div>
              {player.membershipRank && player.membershipRank !== "none" && player.membershipRank !== "platinum" && (
                <p className="text-xs text-gray-500 mt-1">
                  次のランクまで: {(() => {
                    const currentRank = player.membershipRank
                    const totalCP = player.totalCPEarned || 0
                    if (currentRank === "silver") {
                      const required = storeSettings.membershipRankSettings.ranks.gold.requiredCP
                      return `${(required - totalCP).toLocaleString()}CP`
                    } else if (currentRank === "gold") {
                      const required = storeSettings.membershipRankSettings.ranks.platinum.requiredCP
                      return `${(required - totalCP).toLocaleString()}CP`
                    }
                    return "0CP"
                  })()}
                </p>
              )}
              {(!player.membershipRank || player.membershipRank === "none") && (
                <p className="text-xs text-gray-500 mt-1">
                  シルバーまで: {(() => {
                    const totalCP = player.totalCPEarned || 0
                    const required = storeSettings.membershipRankSettings.ranks.silver.requiredCP
                    return `${(required - totalCP).toLocaleString()}CP`
                  })()}
                </p>
              )}
            </div>
          )}
          {player.pokerName && (
            <div>
              <p className="text-sm text-gray-600">ポーカーネーム</p>
              <p className="text-lg font-semibold text-purple-600">{player.pokerName}</p>
            </div>
          )}
          <div>
            <p className="text-sm text-gray-600">ステータス</p>
            <Badge variant={player.isPlaying ? "default" : "secondary"}>
              {player.isPlaying ? "プレイ中" : "待機中"}
            </Badge>
          </div>
        </div>
        <Button onClick={onDetailedDataClick} className="w-full bg-blue-600 hover:bg-blue-700">
          <BarChart3 className="h-4 w-4 mr-2" />
          詳細データを見る
        </Button>
      </CardContent>
    </Card>
  )
}
