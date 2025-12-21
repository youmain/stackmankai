"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { BarChart3 } from "lucide-react"

interface PlayerStats {
  totalGames: number
  totalProfit: number
  winRate: number
  averageProfit: number
  todayGames: number
  todayProfit: number
}

interface PlayerStatsCardProps {
  playerStats: PlayerStats | null
}

export function PlayerStatsCard({ playerStats }: PlayerStatsCardProps) {
  if (!playerStats) {
    return null
  }

  return (
    <Card className="shadow-md">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
          <BarChart3 className="h-5 w-5 text-blue-500" />
          戦績サマリー
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center p-4 bg-blue-50 rounded-lg">
            <p className="text-sm text-gray-600">総ゲーム数</p>
            <p className="text-2xl font-bold text-blue-600">{playerStats.totalGames}</p>
          </div>
          <div className="text-center p-4 bg-green-50 rounded-lg">
            <p className="text-sm text-gray-600">総収支</p>
            <p
              className={`text-2xl font-bold ${playerStats.totalProfit >= 0 ? "text-green-600" : "text-red-600"}`}
            >
              {playerStats.totalProfit >= 0 ? "+" : ""}
              {playerStats.totalProfit.toLocaleString()}©
            </p>
          </div>
          <div className="text-center p-4 bg-purple-50 rounded-lg">
            <p className="text-sm text-gray-600">勝率</p>
            <p className="text-2xl font-bold text-purple-600">{playerStats.winRate.toFixed(1)}%</p>
          </div>
          <div className="text-center p-4 bg-orange-50 rounded-lg">
            <p className="text-sm text-gray-600">平均収支</p>
            <p
              className={`text-2xl font-bold ${playerStats.averageProfit >= 0 ? "text-green-600" : "text-red-600"}`}
            >
              {playerStats.averageProfit >= 0 ? "+" : ""}
              {Math.round(playerStats.averageProfit).toLocaleString()}©
            </p>
          </div>
        </div>

        {playerStats.todayGames > 0 && (
          <div className="mt-4 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
            <h3 className="font-semibold text-yellow-800 mb-2">今日の戦績</h3>
            <div className="flex justify-between items-center">
              <span className="text-yellow-700">ゲーム数: {playerStats.todayGames}回</span>
              <span
                className={`font-bold ${playerStats.todayProfit >= 0 ? "text-green-600" : "text-red-600"}`}
              >
                {playerStats.todayProfit >= 0 ? "+" : ""}
                {playerStats.todayProfit.toLocaleString()}©
              </span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
