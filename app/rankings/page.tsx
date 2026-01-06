"use client"

import { useState, useEffect, useMemo, useCallback } from "react"
import { Header } from "@/components/header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Trophy, Users, Calendar, Target, Zap, BarChart3, Percent, Star, RotateCcw, AlertCircle, RefreshCw } from 'lucide-react'
import {
  subscribeToPlayers,
  subscribeToRakeHistory,
  subscribeToStoreRankingSettings,
  subscribeToDailyRankings,
  subscribeToMonthlyPoints,
  resetAllRankings,
  updateProvisionalRankingForToday,
  subscribeToGames,
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
import { formatMonth, getRankIcon, formatChips, formatDate } from "@/lib/utils/formatters"
import { AuthGuard } from "@/components/auth-guard"

export default function RankingsPage() {
  return (
    <AuthGuard>
      <RankingsContent />
    </AuthGuard>
  )
}

function RankingsContent() {
  const { userName, storeId, isStoreOwner } = useAuth()
  const [players, setPlayers] = useState<Player[]>([])
  const [rakeHistory, setRakeHistory] = useState<RakeHistory[]>([])
  const [storeSettings, setStoreRankingSettings] = useState<StoreRankingSettings | null>(null)
  const [dailyRankings, setDailyRankings] = useState<DailyRanking[]>([])
  const [monthlyPoints, setMonthlyPoints] = useState<MonthlyPoints[]>([])
  const [monthlyRankings, setMonthlyRankings] = useState<any[]>([])
  const [selectedPlayer, setSelectedPlayer] = useState<string | null>(null)
  const [isChartModalOpen, setIsChartModalOpen] = useState(false)
  const [isResetDialogOpen, setIsResetDialogOpen] = useState(false)
  const [isResetting, setIsResetting] = useState(false)
  const [isRecalculating, setIsRecalculating] = useState(false)
  const [isReloading, setIsReloading] = useState(false)
  const [isCheckingUnprocessed, setIsCheckingUnprocessed] = useState(false)
  const [unprocessedGames, setUnprocessedGames] = useState<any[]>([])
  const [showUnprocessedDialog, setShowUnprocessedDialog] = useState(false)

  useEffect(() => {
    if (!storeId) return

    console.log("[v0] Rankings Page - Starting data subscriptions with storeId:", storeId)

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

  const handleReloadRanking = async () => {
    window.location.reload()
  }

  const handleRecalculateRanking = useCallback(async () => {
    try {
      if (!userName || !storeId) return
      setIsRecalculating(true)
      await updateProvisionalRankingForToday(storeId)
    } catch (error) {
      console.error("暫定ランキング保存エラー:", error)
    } finally {
      setIsRecalculating(false)
    }
  }, [userName, storeId])

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
          </div>
        </div>

        <div className="grid grid-cols-1 gap-8">
          <Card>
            <CardHeader>
              <CardTitle>プレイヤーランキング</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-10">
                <Trophy className="h-12 w-12 text-yellow-400 mx-auto mb-4" />
                <p>ランキングデータを表示中...</p>
                <p className="text-sm text-muted-foreground mt-2">
                  店舗ID: {storeId}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
