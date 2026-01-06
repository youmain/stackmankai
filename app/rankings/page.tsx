"use client"

import { useState, useEffect, useMemo, useCallback } from "react"
import { Header } from "@/components/header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Trophy, Users, Zap, RefreshCw, Star, TrendingUp, Target } from 'lucide-react'
import {
  subscribeToPlayers,
  subscribeToRakeHistory,
  subscribeToStoreRankingSettings,
  subscribeToDailyRankings,
  subscribeToMonthlyPoints,
  updateProvisionalRankingForToday,
  subscribeToMonthlyRankings,
} from "@/lib/firestore"
import type { Player, RakeHistory, StoreRankingSettings, DailyRanking, MonthlyPoints } from "@/types"
import { useAuth } from "@/contexts/auth-context"
import {
  calculateRankings,
  getWinRateRankings,
  getMaxWinRankings,
  getWinStreakRankings,
} from "@/lib/utils/ranking-calculator"
import { getRankIcon, formatChips } from "@/lib/utils/formatters"
import { AuthGuard } from "@/components/auth-guard"

export default function RankingsPage() {
  return (
    <AuthGuard>
      <RankingsContent />
    </AuthGuard>
  )
}

function RankingsContent() {
  const { storeId, isStoreOwner } = useAuth()
  const [players, setPlayers] = useState<Player[]>([])
  const [rakeHistory, setRakeHistory] = useState<RakeHistory[]>([])
  const [storeSettings, setStoreRankingSettings] = useState<StoreRankingSettings | null>(null)
  const [dailyRankings, setDailyRankings] = useState<DailyRanking[]>([])
  const [monthlyPoints, setMonthlyPoints] = useState<MonthlyPoints[]>([])
  const [monthlyRankings, setMonthlyRankings] = useState<any[]>([])
  const [isRecalculating, setIsRecalculating] = useState(false)

  useEffect(() => {
    if (!storeId) return

    const currentDate = new Date()
    const currentYear = currentDate.getFullYear()
    const currentMonth = currentDate.getMonth() + 1

    const unsubscribePlayers = subscribeToPlayers((playersData) => {
      setPlayers(playersData)
    }, undefined, storeId)

    const unsubscribeRakeHistory = subscribeToRakeHistory((rakeData) => {
      setRakeHistory(rakeData)
    }, storeId)

    const unsubscribeStoreSettings = subscribeToStoreRankingSettings((settingsData) => {
      setStoreRankingSettings(settingsData)
    }, storeId)

    const unsubscribeDailyRankings = subscribeToDailyRankings((dailyData) => {
      setDailyRankings(dailyData)
    }, storeId)

    const unsubscribeMonthlyPoints = subscribeToMonthlyPoints(currentYear, currentMonth, (monthlyData) => {
      setMonthlyPoints(monthlyData)
    }, storeId)

    const unsubscribeMonthlyRankings = subscribeToMonthlyRankings((rankingData) => {
      setMonthlyRankings(rankingData)
    }, storeId)

    return () => {
      unsubscribePlayers()
      unsubscribeRakeHistory()
      unsubscribeStoreSettings()
      unsubscribeDailyRankings()
      unsubscribeMonthlyPoints()
      unsubscribeMonthlyRankings()
    }
  }, [storeId])

  const allTimeRankings = useMemo(() => {
    return calculateRankings(rakeHistory, players)
  }, [rakeHistory, players])

  const winRateRankings = useMemo(() => {
    return getWinRateRankings(allTimeRankings)
  }, [allTimeRankings])

  const maxWinRankings = useMemo(() => {
    return getMaxWinRankings(allTimeRankings)
  }, [allTimeRankings])

  const winStreakRankings = useMemo(() => {
    return getWinStreakRankings(allTimeRankings)
  }, [allTimeRankings])

  const handleReloadRanking = () => {
    window.location.reload()
  }

  const handleRecalculateRanking = useCallback(async () => {
    try {
      if (!storeId) return
      setIsRecalculating(true)
      await updateProvisionalRankingForToday(storeId)
    } catch (error) {
      console.error("暫定ランキング保存エラー:", error)
    } finally {
      setIsRecalculating(false)
    }
  }, [storeId])

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="container mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold flex items-center">
              <Trophy className="h-8 w-8 text-yellow-500 mr-3" />
              ランキング
            </h1>
            <p className="text-muted-foreground mt-1">
              プレイヤーの成績とランキング統計
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" onClick={handleReloadRanking}>
              <RefreshCw className="h-4 w-4 mr-2" />
              再読み込み
            </Button>
            {isStoreOwner && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleRecalculateRanking}
                disabled={isRecalculating}
                className="text-blue-600 border-blue-200 hover:bg-blue-50"
              >
                <Zap className={`h-4 w-4 mr-2 ${isRecalculating ? "animate-spin" : ""}`} />
                暫定計算
              </Button>
            )}
          </div>
        </div>

        <Tabs defaultValue="profit" className="space-y-6">
          <TabsList className="grid grid-cols-2 md:grid-cols-4 w-full max-w-2xl">
            <TabsTrigger value="profit">収支</TabsTrigger>
            <TabsTrigger value="winrate">勝率</TabsTrigger>
            <TabsTrigger value="maxwin">最大勝利</TabsTrigger>
            <TabsTrigger value="streak">連勝</TabsTrigger>
          </TabsList>

          <TabsContent value="profit">
            <RankingTable 
              title="通算収支ランキング" 
              data={allTimeRankings} 
              icon={<TrendingUp className="h-5 w-5 text-blue-500" />}
              valueKey="totalProfit"
              valueFormatter={(v) => formatChips(v, true)}
            />
          </TabsContent>

          <TabsContent value="winrate">
            <RankingTable 
              title="勝率ランキング (3戦以上)" 
              data={winRateRankings} 
              icon={<Target className="h-5 w-5 text-green-500" />}
              valueKey="winRate"
              valueFormatter={(v) => `${v.toFixed(1)}%`}
            />
          </TabsContent>

          <TabsContent value="maxwin">
            <RankingTable 
              title="最大勝利額ランキング" 
              data={maxWinRankings} 
              icon={<Star className="h-5 w-5 text-yellow-500" />}
              valueKey="maxWin"
              valueFormatter={(v) => formatChips(v)}
            />
          </TabsContent>

          <TabsContent value="streak">
            <RankingTable 
              title="最多連勝ランキング" 
              data={winStreakRankings} 
              icon={<Zap className="h-5 w-5 text-orange-500" />}
              valueKey="maxWinStreak"
              valueFormatter={(v) => `${v}連勝`}
            />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}

interface RankingTableProps {
  title: string
  data: any[]
  icon: React.ReactNode
  valueKey: string
  valueFormatter: (value: any) => string
}

function RankingTable({ title, data, icon, valueKey, valueFormatter }: RankingTableProps) {
  if (data.length === 0) {
    return (
      <Card>
        <CardContent className="py-10 text-center text-muted-foreground">
          データがありません
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center space-x-2">
        {icon}
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-left text-sm text-muted-foreground border-b">
                <th className="pb-2 font-medium w-16">順位</th>
                <th className="pb-2 font-medium">プレイヤー</th>
                <th className="pb-2 font-medium text-right">スコア</th>
                <th className="pb-2 font-medium text-right">ゲーム数</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {data.slice(0, 20).map((player, index) => (
                <tr key={player.playerId} className="hover:bg-gray-50 transition-colors">
                  <td className="py-3 font-bold text-lg">
                    {getRankIcon(index)}
                  </td>
                  <td className="py-3">
                    <div className="font-medium">{player.playerName}</div>
                  </td>
                  <td className="py-3 text-right font-bold">
                    <Badge variant={player[valueKey] > 0 ? "default" : "outline"} className={player[valueKey] > 0 ? "bg-blue-100 text-blue-700 hover:bg-blue-100" : ""}>
                      {valueFormatter(player[valueKey])}
                    </Badge>
                  </td>
                  <td className="py-3 text-right text-muted-foreground">
                    {player.totalGames}戦
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  )
}
