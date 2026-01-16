'use client'

import React, { useState, useCallback } from 'react'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Trophy,
  Medal,
  Award,
  Star,
  Percent,
  AlertCircle,
  Gift,
  BarChart3,
  TrendingUp,
  Zap,
} from 'lucide-react'
import type { Player, StoreSettings, DailyRanking, MonthlyPoints } from '@/types'

interface MainDashboardProps {
  linkedPlayer: Player | undefined
  storeSettings: StoreSettings | null
  dailyRankings: DailyRanking[]
  monthlyRankings: MonthlyPoints[]
  pointHistory: any[]
  isDoublePointDay: boolean
  hasSpecialRate: boolean
  currentRewardRate: number
  currentMonthStr: string
  onDetailedDataClick: (playerId: string, playerName: string, player?: Player) => void
  onViewModeChange: (mode: string) => void
}

export const MainDashboard = React.memo<React.FC<MainDashboardProps>>(({
  linkedPlayer,
  storeSettings,
  dailyRankings,
  monthlyRankings,
  pointHistory,
  isDoublePointDay,
  hasSpecialRate,
  currentRewardRate,
  currentMonthStr,
  onDetailedDataClick,
  onViewModeChange,
}) => {
  const sortedTodayRankings = [...dailyRankings].sort((a, b) => b.points - a.points)
  const monthlyRanking = [...monthlyRankings].sort((a, b) => b.totalPoints - a.totalPoints)

  const formatMonth = (monthStr: string) => {
    const [year, month] = monthStr.split('-')
    return `${year}年${parseInt(month)}月`
  }

  const getRankIcon = (rank: number) => {
    if (rank === 1) return <Trophy className="h-5 w-5 text-yellow-500" />
    if (rank === 2) return <Medal className="h-5 w-5 text-gray-500" />
    if (rank === 3) return <Award className="h-5 w-5 text-orange-500" />
    return <span className="text-sm font-medium">{rank}</span>
  }

  return (
    <>
      {/* ポイント2倍デー表示 */}
      {isDoublePointDay && (
        <Card className="border-yellow-200 bg-yellow-50 shadow-md">
          <CardContent className="py-4">
            <div className="flex items-center justify-center space-x-2">
              <Star className="h-6 w-6 text-yellow-600" />
              <span className="text-lg font-bold text-yellow-800">本日はRP2倍デー！</span>
              <Star className="h-6 w-6 text-yellow-600" />
            </div>
          </CardContent>
        </Card>
      )}

      {/* 特別還元率の日表示 */}
      {hasSpecialRate && (
        <Card className="border-purple-200 bg-purple-50 shadow-md">
          <CardContent className="py-4">
            <div className="flex items-center justify-center space-x-2">
              <Percent className="h-6 w-6 text-purple-600" />
              <span className="text-lg font-bold text-purple-800">
                本日は特別還元率！{currentRewardRate}%還元
              </span>
              <Percent className="h-6 w-6 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      )}

      {/* お知らせメッセージ表示 */}
      {storeSettings?.announcement?.isVisible && storeSettings.announcement.message && (
        <Card className="border-blue-200 bg-blue-50 shadow-md">
          <CardContent className="py-4">
            <div className="flex items-center justify-center space-x-2">
              <AlertCircle className="h-6 w-6 text-blue-600" />
              <span className="text-lg font-bold text-blue-800">{storeSettings.announcement.message}</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 会員ランク特典表示 */}
      {storeSettings?.membershipRankSettings?.enabled &&
        linkedPlayer?.membershipRank &&
        linkedPlayer.membershipRank !== "none" && (
          <Card className="border-green-200 bg-green-50 shadow-md">
            <CardContent className="py-4">
              <div className="text-center space-y-2">
                <div className="flex items-center justify-center space-x-2">
                  <Gift className="h-6 w-6 text-green-600" />
                  <span className="text-lg font-bold text-green-800">
                    {linkedPlayer.membershipRank === "platinum" && "プラチナ"}
                    {linkedPlayer.membershipRank === "gold" && "ゴールド"}
                    {linkedPlayer.membershipRank === "silver" && "シルバー"}
                    会員特典
                  </span>
                  <Gift className="h-6 w-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        )}

      {/* 今日のランキング */}
      <Card className="shadow-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
            <Trophy className="h-5 w-5 text-yellow-500" />
            本日のRPランキング
            {isDoublePointDay && <Badge className="bg-yellow-100 text-yellow-800">2倍デー</Badge>}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {sortedTodayRankings.length > 0 ? (
            <div className="space-y-3">
              {sortedTodayRankings.slice(0, 5).map((ranking, index) => {
                const actualPoints = isDoublePointDay ? ranking.points * 2 : ranking.points
                return (
                  <div
                    key={ranking.playerId}
                    className={`flex items-center justify-between p-4 rounded-lg ${
                      index === 0
                        ? "bg-gradient-to-r from-yellow-100 to-yellow-50 border-yellow-200"
                        : index === 1
                          ? "bg-gradient-to-r from-gray-100 to-gray-50 border-gray-200"
                          : index === 2
                            ? "bg-gradient-to-r from-orange-100 to-orange-50 border-orange-200"
                            : "bg-gray-50 border-gray-100"
                    } border shadow-sm`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex items-center justify-center w-10 h-10 rounded-full bg-white shadow-sm">
                        {getRankIcon(index + 1)}
                      </div>
                      <span className="font-medium text-lg sm:text-xl">{ranking.playerName}</span>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-xl sm:text-2xl text-blue-600">{actualPoints}RP</div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onDetailedDataClick(ranking.playerId, ranking.playerName)}
                      >
                        詳細
                      </Button>
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <Trophy className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p className="text-lg font-medium">今日のランキングはまだ確定していません</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 月間ランキング */}
      <Card className="shadow-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
            <TrendingUp className="h-5 w-5 text-blue-500" />
            {formatMonth(currentMonthStr)}のRPランキング
          </CardTitle>
        </CardHeader>
        <CardContent>
          {monthlyRanking.length > 0 ? (
            <div className="space-y-3">
              {monthlyRanking.slice(0, 5).map((points, index) => (
                <div
                  key={points.playerId}
                  className={`flex items-center justify-between p-4 rounded-lg ${
                    index === 0
                      ? "bg-gradient-to-r from-yellow-100 to-yellow-50 border-yellow-200"
                      : index === 1
                        ? "bg-gradient-to-r from-gray-100 to-gray-50 border-gray-200"
                        : index === 2
                          ? "bg-gradient-to-r from-orange-100 to-orange-50 border-orange-200"
                          : "bg-gray-50 border-gray-100"
                  } border shadow-sm`}
                >
                  <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center w-10 h-10 rounded-full bg-white shadow-sm">
                      {getRankIcon(index + 1)}
                    </div>
                    <span className="font-medium text-lg sm:text-xl">{points.playerName}</span>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-xl sm:text-2xl text-blue-600">{points.totalPoints}RP</div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <BarChart3 className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p className="text-lg font-medium">月間ランキングはまだ確定していません</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* CP履歴 */}
      {linkedPlayer && pointHistory.length > 0 && (
        <Card className="shadow-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
              <Star className="h-5 w-5 text-purple-500" />
              CP履歴
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {pointHistory.slice(0, 10).map((history, index) => (
                <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded text-sm">
                  <span>{new Date(history.timestamp).toLocaleString('ja-JP')}</span>
                  <span className={history.points > 0 ? 'text-green-600' : 'text-red-600'}>
                    {history.points > 0 ? '+' : ''}{history.points}CP
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </>
  )
})
