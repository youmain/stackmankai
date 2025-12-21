"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Star } from "lucide-react"
import type { PointHistory, Player } from "@/types"

interface PointHistorySectionProps {
  pointHistory: PointHistory[]
  linkedPlayer: {
    id: string
    name: string
    player?: Player
  } | null
}

export function PointHistorySection({ pointHistory, linkedPlayer }: PointHistorySectionProps) {
  if (pointHistory.length === 0 || !linkedPlayer?.player) {
    return null
  }

  const player = linkedPlayer.player

  return (
    <Card className="shadow-md">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
          <Star className="h-5 w-5 text-purple-500" />
          CP履歴
        </CardTitle>
        <p className="text-sm text-gray-600">
          現在の保有CP: <span className="font-bold text-purple-600">{player.rewardPoints?.toLocaleString() || 0}CP</span>
        </p>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {pointHistory.slice(0, 10).map((history) => (
            <div
              key={history.id}
              className={`flex items-center justify-between p-4 rounded-lg border ${
                history.type === "earn"
                  ? "bg-green-50 border-green-200"
                  : "bg-red-50 border-red-200"
              }`}
            >
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <Badge
                    variant={history.type === "earn" ? "default" : "destructive"}
                    className="text-xs"
                  >
                    {history.type === "earn" ? "獲得" : "使用"}
                  </Badge>
                  <span className="text-sm text-gray-600">
                    {history.createdAt?.toLocaleString("ja-JP", {
                      year: "numeric",
                      month: "2-digit",
                      day: "2-digit",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
                <p className="text-sm text-gray-700 mt-1">{history.reason}</p>
                {history.purchaseAmount && history.rate && (
                  <p className="text-xs text-gray-500 mt-1">
                    購入金額: {history.purchaseAmount.toLocaleString()}円 × {history.rate}%
                  </p>
                )}
              </div>
              <div className="text-right">
                <div
                  className={`text-lg font-bold ${
                    history.type === "earn" ? "text-green-600" : "text-red-600"
                  }`}
                >
                  {history.type === "earn" ? "+" : "-"}
                  {history.points.toLocaleString()}P
                </div>
                <div className="text-xs text-gray-500">
                  残高: {history.balanceAfter.toLocaleString()}P
                </div>
              </div>
            </div>
          ))}
        </div>
        {pointHistory.length > 10 && (
          <p className="text-center text-sm text-gray-500 mt-4">
            最新10件を表示中（全{pointHistory.length}件）
          </p>
        )}
      </CardContent>
    </Card>
  )
}
