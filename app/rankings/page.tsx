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

export default function RankingsPage() {
  const { userName } = useAuth()
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
  const [debugInfo, setDebugInfo] = useState({
    authInitialized: false,
    firestoreConnected: false,
    subscriptionsActive: false,
    errorMessages: [] as string[],
  })

  const getDisplayName = (playerId: string, fallbackName?: string) => {
    const player = players.find((p) => p.id === playerId)
    if (player?.pokerName) {
      return player.pokerName
    }
    return player?.name || fallbackName || "Unknown Player"
  }

  useEffect(() => {
    console.log("[v0] Rankings Page - Starting data subscriptions")
    setDebugInfo((prev) => ({ ...prev, authInitialized: true, subscriptionsActive: true }))

    const currentDate = new Date()
    const currentYear = currentDate.getFullYear()
    const currentMonth = currentDate.getMonth() + 1 // getMonth() returns 0-11, we need 1-12

    const storeId = localStorage.getItem("storeId")
    const unsubscribePlayers = subscribeToPlayers((playersData) => {
      console.log("[v0] Rankings Page - Players loaded:", playersData.length)
      setPlayers(playersData)
      setDebugInfo((prev) => ({ ...prev, firestoreConnected: true }))
    }, undefined, storeId)

    const unsubscribeRakeHistory = subscribeToRakeHistory((rakeData) => {
      console.log("[v0] Rankings Page - Rake history loaded:", rakeData.length)
      setRakeHistory(rakeData)
    }, storeId)

    const unsubscribeStoreSettings = subscribeToStoreRankingSettings((settingsData) => {
      console.log("[v0] Rankings Page - Store settings loaded:", settingsData ? "Yes" : "No")
      setStoreRankingSettings(settingsData)
    })

    const unsubscribeDailyRankings = subscribeToDailyRankings((dailyData) => {
      console.log("[v0] Rankings Page - Daily rankings loaded:", dailyData.length)
      setDailyRankings(dailyData)
    })

    const unsubscribeMonthlyPoints = subscribeToMonthlyPoints(currentYear, currentMonth, (monthlyData) => {
      console.log("[v0] Rankings Page - Monthly points loaded:", monthlyData.length)
      setMonthlyPoints(monthlyData)
    })

    const unsubscribeMonthlyRankings = subscribeToMonthlyRankings((rankingData) => {
      console.log("[v0] Rankings Page - Monthly rankings loaded:", rankingData.length)
      setMonthlyRankings(rankingData)
    })

    const handleError = (error: any) => {
      console.error("[v0] Rankings Page - Subscription error:", error)
      setDebugInfo((prev) => ({
        ...prev,
        errorMessages: [...prev.errorMessages, error.message || "Unknown error"],
      }))
    }

    return () => {
      unsubscribePlayers()
      unsubscribeRakeHistory()
      unsubscribeStoreSettings()
      unsubscribeDailyRankings()
      unsubscribeMonthlyPoints()
      unsubscribeMonthlyRankings()
    }
  }, [])

  useEffect(() => {
    console.log("[v0] Rankings Page - Current data state:", {
      playersCount: players.length,
      rakeHistoryCount: rakeHistory.length,
      dailyRankingsCount: dailyRankings.length,
      monthlyPointsCount: monthlyPoints.length,
      hasStoreSettings: !!storeSettings,
    })
  }, [players, rakeHistory, dailyRankings, monthlyPoints, storeSettings])

  const currentlyPlaying = players.filter((player) => player.isPlaying)

  const today = new Date().toISOString().split("T")[0]
  const currentMonthStr = new Date().toISOString().slice(0, 7) // YYYY-MM
  const currentMonth = new Date(currentMonthStr)

  const todayRanking = dailyRankings.find((ranking) => {
    const rankingDate = typeof ranking.date === "string" ? new Date(ranking.date) : new Date()
    return rankingDate.toISOString().split("T")[0] === today
  })

  useEffect(() => {
    if (todayRanking) {
      console.log("[v0] 📊 今日のランキングデータ詳細:", {
        totalRankings: todayRanking.rankings.length,
        rankings: todayRanking.rankings.map((r) => ({
          playerName: r.playerName,
          profit: r.profit,
          points: r.points,
        })),
      })
    }
  }, [todayRanking])

  const allTimeRankings = useMemo(() => calculateRankings(rakeHistory, players), [rakeHistory, players])

  const monthlyGames = useMemo(() => {
    return rakeHistory.filter((game) => {
      const gameDate = typeof game.createdAt === "string" ? new Date(game.createdAt) : new Date()
      const gameMonth = new Date(gameDate.toISOString().slice(0, 7))
      return gameMonth.getFullYear() === currentMonth.getFullYear() && gameMonth.getMonth() === currentMonth.getMonth()
    })
  }, [rakeHistory, currentMonth])

  const monthlyRankingsCalculated = useMemo(() => calculateRankings(monthlyGames, players), [monthlyGames, players])

  const handlePlayerClick = useCallback((playerId: string, playerName: string) => {
    setSelectedPlayer(playerId)
    setIsChartModalOpen(true)
  }, [])

  const getPlayerChartData = useCallback(
    (playerId: string) => {
      const playerGames = rakeHistory
        .sort((a, b) => {
          const dateA = typeof a.createdAt === "string" ? new Date(a.createdAt) : new Date()
          const dateB = typeof b.createdAt === "string" ? new Date(b.createdAt) : new Date()
          return dateB.getTime() - dateA.getTime()
        })

      const dailyProfits: Record<string, number> = {}
      playerGames.forEach((game) => {
        const gameDate = typeof game.createdAt === "string" ? new Date(game.createdAt) : new Date()
        const dateStr = gameDate.toISOString().split("T")[0]
        const profit = game.amount // RakeHistory has 'amount' property
        dailyProfits[dateStr] = (dailyProfits[dateStr] || 0) + profit
      })

      const recentDays = Object.entries(dailyProfits)
        .sort(([a], [b]) => b.localeCompare(a))
        .slice(0, 5)
        .reverse()

      return recentDays.map(([date, profit]) => ({
        date: formatDate(new Date(date)),
        profit,
        gamesCount: playerGames.filter((game) => {
          const gameDate = typeof game.createdAt === "string" ? new Date(game.createdAt) : new Date()
          return gameDate.toISOString().split("T")[0] === date
        }).length,
      }))
    },
    [rakeHistory],
  )

  const isDoublePointDay =
    storeSettings?.doublePointDays.some((date) => new Date(date).toISOString().split("T")[0] === today) || false

  const handleResetRankings = useCallback(async () => {
    try {
      setIsResetting(true)
      await resetAllRankings()
      setIsResetDialogOpen(false)
      console.log("[v0] ✅ ランキング完全リセット完了")
    } catch (error) {
      console.error("[v0] ❌ ランキングリセットエラー:", error)
    } finally {
      setIsResetting(false)
    }
  }, [])

  const handleRecalculateRanking = useCallback(async () => {
    try {
      if (!userName) {
        console.error("[v0] ❌ ユーザー認証が必要です")
        return
      }

      setIsRecalculating(true)
      console.log("[v0] 🔄 手動ランキング再計算開始")
      await updateProvisionalRankingForToday()
      console.log("[v0] ✅ 手動ランキング再計算完了")
    } catch (error) {
      console.error("[v0] ❌ 暫定ランキング保存エラー:", error)
    } finally {
      setIsRecalculating(false)
    }
  }, [userName])

  const handleReloadRanking = async () => {
    try {
      setIsReloading(true)
      console.log("[v0] 🔄 暫定ランキング再読み込み開始")

      // Force refresh of daily rankings
      const today = new Date().toISOString().split("T")[0]
      console.log("[v0] 今日の日付:", today)

      // Trigger a re-subscription to get fresh data
      window.location.reload()
    } catch (error) {
      console.error("[v0] ❌ 暫定ランキング再読み込みエラー:", error)
    } finally {
      setIsReloading(false)
    }
  }

  const handleCheckUnprocessed = async () => {
    try {
      setIsCheckingUnprocessed(true)
      console.log("[v0] 🔍 未処理ゲーム確認開始")

      // Get all games that are not confirmed (sales not finalized)
      const unsubscribeGames = subscribeToGames((games) => {
        const unconfirmedGames = games.filter((game) => game.id !== null && game.id !== undefined)
        console.log("[v0] 未処理ゲーム数:", unconfirmedGames.length)
        setUnprocessedGames(unconfirmedGames)
        setShowUnprocessedDialog(true)
        unsubscribeGames() // Unsubscribe after getting the data
      })
    } catch (error) {
      console.error("[v0] ❌ 未処理ゲーム確認エラー:", error)
    } finally {
      setIsCheckingUnprocessed(false)
    }
  }

  const displayMonthlyRankings = useMemo(
    () => {
      const rankings = monthlyRankings.length > 0 ? monthlyRankings[0]?.rankings || [] : monthlyRankingsCalculated
      return rankings.slice(0, 10) // 10位まで制限
    },
    [monthlyRankings, monthlyRankingsCalculated],
  )


  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="container mx-auto px-3 py-4 sm:px-6 lg:px-8 sm:py-8">
        <div className="mb-6 sm:mb-8 lg:mb-10">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold">プレイヤーランキング</h1>
              <p className="text-sm sm:text-base lg:text-lg text-muted-foreground mt-1 sm:mt-2">
                RP（ランキングポイント）制ランキング・月間チャンピオン
              </p>
            </div>
            <div className="flex space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleReloadRanking}
                disabled={isReloading}
                className="flex items-center space-x-2 bg-transparent"
              >
                <RefreshCw className={`h-4 w-4 ${isReloading ? "animate-spin" : ""}`} />
                <span>{isReloading ? "再読み込み中..." : "再読み込み"}</span>
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleCheckUnprocessed}
                disabled={isCheckingUnprocessed}
                className="flex items-center space-x-2 bg-transparent"
              >
                <AlertCircle className={`h-4 w-4 ${isCheckingUnprocessed ? "animate-pulse" : ""}`} />
                <span>{isCheckingUnprocessed ? "確認中..." : "未処理確認"}</span>
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleRecalculateRanking}
                disabled={isRecalculating}
                className="flex items-center space-x-2 bg-transparent"
              >
                <RotateCcw className={`h-4 w-4 ${isRecalculating ? "animate-spin" : ""}`} />
                <span>{isRecalculating ? "再計算中..." : "ランキング再計算"}</span>
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={() => setIsResetDialogOpen(true)}
                className="flex items-center space-x-2"
              >
                <RotateCcw className="h-5 w-5 mr-2" />
                <span>ランキングリセット</span>
              </Button>
            </div>
          </div>

          {isDoublePointDay && (
            <div className="mt-2">
              <Badge className="bg-yellow-100 text-yellow-800 border-yellow-300">
                <Star className="h-3 w-3 mr-1" />
                本日はRP2倍デー！
              </Badge>
            </div>
          )}
        </div>

        <Card className="mb-6 bg-yellow-50 border-yellow-200">
          <CardHeader>
            <CardTitle className="text-yellow-800">デバッグ情報（一時表示）</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded">
              <h4 className="font-medium text-blue-800 mb-2">システム状態</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-sm">
                <div className="flex items-center space-x-2">
                  <span
                    className={`w-2 h-2 rounded-full ${debugInfo.authInitialized ? "bg-green-500" : "bg-red-500"}`}
                  ></span>
                  <span>認証: {debugInfo.authInitialized ? "初期化済み" : "未初期化"}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span
                    className={`w-2 h-2 rounded-full ${debugInfo.firestoreConnected ? "bg-green-500" : "bg-red-500"}`}
                  ></span>
                  <span>Firestore: {debugInfo.firestoreConnected ? "接続済み" : "未接続"}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span
                    className={`w-2 h-2 rounded-full ${debugInfo.subscriptionsActive ? "bg-green-500" : "bg-red-500"}`}
                  ></span>
                  <span>データ同期: {debugInfo.subscriptionsActive ? "アクティブ" : "非アクティブ"}</span>
                </div>
              </div>
              {debugInfo.errorMessages.length > 0 && (
                <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded">
                  <p className="text-red-800 font-medium text-sm">エラー:</p>
                  {debugInfo.errorMessages.map((error, index) => (
                    <p key={index} className="text-red-600 text-xs">
                      {error}
                    </p>
                  ))}
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
              <div>
                <p className="font-medium">プレイヤー数</p>
                <p className="text-lg font-bold">{players.length}</p>
              </div>
              <div>
                <p className="font-medium">レーキ履歴</p>
                <p className="text-lg font-bold">{rakeHistory.length}</p>
              </div>
              <div>
                <p className="font-medium">日別ランキング</p>
                <p className="text-lg font-bold">{dailyRankings.length}</p>
              </div>
              <div>
                <p className="font-medium">月間RP</p>
                <p className="text-lg font-bold">{monthlyPoints.length}</p>
              </div>
              <div>
                <p className="font-medium">店舗設定</p>
                <p className="text-lg font-bold">{storeSettings ? "あり" : "なし"}</p>
              </div>
            </div>
            {players.length === 0 && (
              <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded">
                <p className="text-red-800 font-medium">⚠️ プレイヤーデータが取得できていません</p>
                <p className="text-red-600 text-sm">プレイヤー管理画面でプレイヤーを登録してください</p>
              </div>
            )}
            {rakeHistory.length === 0 && (
              <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded">
                <p className="text-red-800 font-medium">⚠️ ゲーム履歴データがありません</p>
                <p className="text-red-600 text-sm">売上確定を行うとランキングが表示されます</p>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="mb-6 sm:mb-8">
          <Card className="bg-gradient-to-r from-blue-50 to-green-50 border-blue-200">
            <CardHeader>
              <CardTitle className="flex items-center text-blue-800">
                <Users className="h-5 w-5 mr-2" />
                現在プレイ中
              </CardTitle>
            </CardHeader>
            <CardContent>
              {currentlyPlaying.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {currentlyPlaying.map((player) => (
                    <div
                      key={player.id}
                      className="flex items-center justify-between bg-white rounded-lg p-3 shadow-sm"
                    >
                      <span className="font-medium">{player.pokerName || player.name}</span>
                      <Badge className="bg-blue-100 text-blue-800">プレイ中</Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground">現在プレイ中のプレイヤーはいません</p>
              )}
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="today" className="space-y-6">
          <div className="overflow-x-auto">
            <TabsList className="grid w-full grid-cols-4 sm:grid-cols-6 min-w-max">
              <TabsTrigger value="today" className="text-xs sm:text-sm">
                今日
              </TabsTrigger>
              <TabsTrigger value="monthly" className="text-xs sm:text-sm">
                月間
              </TabsTrigger>
              {/* <TabsTrigger value="points" className="text-xs sm:text-sm">
                ポイント
              </TabsTrigger> */}
              <TabsTrigger value="winrate" className="text-xs sm:text-sm">
                勝率
              </TabsTrigger>
              <TabsTrigger value="maxwin" className="text-xs sm:text-sm">
                最大勝利
              </TabsTrigger>
              <TabsTrigger value="streak" className="text-xs sm:text-sm">
                連勝記録
              </TabsTrigger>
              <TabsTrigger value="champions" className="text-xs sm:text-sm">
                チャンピオン
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="today" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center">
                    <Trophy className="h-5 w-5 mr-2 text-yellow-500" />
                    今日のRPランキング
                    {isDoublePointDay && <Badge className="ml-2 bg-yellow-100 text-yellow-800">2倍デー</Badge>}
                  </div>
                  <div className="text-right">
                    {todayRanking ? (
                      todayRanking.isConfirmed ? (
                        <Badge className="bg-green-100 text-green-800 font-bold">確定</Badge>
                      ) : (
                        <div className="text-xs text-muted-foreground">
                          {todayRanking.date && (
                            <>
                              {new Date(todayRanking.date).toLocaleTimeString("ja-JP", {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                              時点
                            </>
                          )}
                        </div>
                      )
                    ) : null}
                  </div>
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  {todayRanking?.isConfirmed
                    ? "売上確定時に確定されました（1位8RP、2位5RP、3位3RP、4位・5位1RP）"
                    : "ゲーム終了時点での暫定ランキング（売上確定時に月間RPに加算されます）"}
                </p>
              </CardHeader>
              <CardContent>
                {todayRanking ? (
                  <div className="space-y-3">
                    {(() => {
                      const groupedByProfit = todayRanking.rankings.reduce(
                        (acc, ranking) => {
                          const profit = ranking.profit
                          if (!acc[profit]) {
                            acc[profit] = []
                          }
                          acc[profit].push(ranking)
                          return acc
                        },
                        {} as Record<number, typeof todayRanking.rankings>,
                      )

                      const sortedProfits = Object.keys(groupedByProfit)
                        .map(Number)
                        .sort((a, b) => b - a)

                      let currentRank = 0
                      return sortedProfits.flatMap((profit) => {
                        const playersWithSameProfit = groupedByProfit[profit]
                        const rankForThisGroup = currentRank
                        currentRank += playersWithSameProfit.length

                        return playersWithSameProfit.map((ranking, indexInGroup) => {
                          const actualPoints = isDoublePointDay ? ranking.points * 2 : ranking.points
                          return (
                            <div
                              key={ranking.playerId}
                              className={`flex items-center justify-between p-3 rounded-lg ${
                                todayRanking.isConfirmed ? "bg-green-50 border border-green-200" : "bg-gray-50"
                              }`}
                            >
                              <div className="flex items-center space-x-3">
                                <span className="text-lg font-bold w-8">{getRankIcon(rankForThisGroup)}</span>
                                <div>
                                  <p className="font-medium">{getDisplayName(ranking.playerId, ranking.playerName)}</p>
                                  <p className="text-sm text-muted-foreground">
                                    収支: {ranking.profit >= 0 ? "+" : ""}
                                    {ranking.profit.toLocaleString()}©
                                  </p>
                                </div>
                              </div>
                              <div className="text-right">
                                <div
                                  className={`text-lg font-bold ${
                                    todayRanking.isConfirmed ? "text-green-600" : "text-blue-600"
                                  }`}
                                >
                                  {actualPoints}RP
                                </div>
                                {isDoublePointDay && (
                                  <div className="text-xs text-yellow-600">(通常{ranking.points}RP × 2)</div>
                                )}
                                {!todayRanking.isConfirmed && <div className="text-xs text-muted-foreground">暫定</div>}
                              </div>
                            </div>
                          )
                        })
                      })
                    })()}
                  </div>
                ) : (
                  <p className="text-muted-foreground text-center py-8">
                    今日のランキングはまだありません
                    <br />
                    <span className="text-xs">ゲーム終了時に暫定ランキングが表示されます</span>
                  </p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="monthly" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Calendar className="h-5 w-5 mr-2 text-blue-500" />
                  {formatMonth(currentMonthStr)}のRPランキング
                </CardTitle>
                {storeSettings && (
                  <div className="text-sm text-muted-foreground space-y-1">
                    <p>🥇 1位プライズ: {formatChips(storeSettings.monthlyPrizes.first)}©</p>
                    <p>🥈 2位プライズ: {formatChips(storeSettings.monthlyPrizes.second)}©</p>
                    <p>🥉 3位プライズ: {formatChips(storeSettings.monthlyPrizes.third)}©</p>
                  </div>
                )}
              </CardHeader>
              <CardContent>
                {displayMonthlyRankings.length > 0 ? (
                  <div className="space-y-3">
                    {displayMonthlyRankings
                      .sort((a: any, b: any) => (b.totalPoints || 0) - (a.totalPoints || 0))
                      .map((player: any, index: number) => (
                        <div
                          key={player.playerId}
                          className="flex items-center justify-between p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors"
                          onClick={() => handlePlayerClick(player.playerId, player.playerName)}
                        >
                          <div className="flex items-center space-x-3">
                            <span className="text-lg font-bold w-8">{getRankIcon(index)}</span>
                            <div>
                              <p className="font-medium text-blue-600 hover:underline">
                                {getDisplayName(player.playerId, player.playerName)}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-lg font-bold text-blue-600">{player.totalPoints || 0}RP</div>
                            {index < 3 && storeSettings && (
                              <div className="text-xs text-green-600 font-bold">
                                プライズ:{" "}
                                {index === 0
                                  ? formatChips(storeSettings.monthlyPrizes.first)
                                  : index === 1
                                    ? formatChips(storeSettings.monthlyPrizes.second)
                                    : formatChips(storeSettings.monthlyPrizes.third)}
                                ©
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground text-center py-8">今月のデータがありません</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* <TabsContent value="average" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <TrendingUp className="h-5 w-5 mr-2 text-blue-500" />
                  1ゲーム当たりの平均収支ランキング
                </CardTitle>
              </CardHeader>
              <CardContent>
                {monthlyRankings.length > 0 ? (
                  <div className="space-y-3">
                    {getAverageRankings(monthlyRankings).map((player, index) => (
                      <div
                        key={player.playerId}
                        className="flex items-center justify-between p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors"
                        onClick={() => handlePlayerClick(player.playerId, player.playerName)}
                      >
                        <div className="flex items-center space-x-3">
                          <span className="text-lg font-bold w-8">{getRankIcon(index)}</span>
                          <div>
                            <p className="font-medium text-blue-600 hover:underline">
                              {getDisplayName(player.playerId, player.playerName)}
                            </p>
                            <p className="text-sm text-muted-foreground">{player.totalGames}ゲーム参加</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-lg font-bold text-green-600">
                            +{Math.round(player.averageProfit).toLocaleString()}©/ゲーム
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground text-center py-8">データがありません</p>
                )}
              </CardContent>
            </Card>
          </TabsContent> */}

          <TabsContent value="winrate" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Percent className="h-5 w-5 mr-2 text-green-500" />
                  勝率ランキング
                </CardTitle>
                <p className="text-sm text-muted-foreground">※3ゲーム以上参加したプレイヤーのみ表示</p>
              </CardHeader>
              <CardContent>
                {displayMonthlyRankings.length > 0 ? (
                  <div className="space-y-3">
                    {getWinRateRankings(displayMonthlyRankings).map((player, index) => (
                      <div
                        key={player.playerId}
                        className="flex items-center justify-between p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors"
                        onClick={() => handlePlayerClick(player.playerId, player.playerName)}
                      >
                        <div className="flex items-center space-x-3">
                          <span className="text-lg font-bold w-8">{getRankIcon(index)}</span>
                          <div>
                            <p className="font-medium text-blue-600 hover:underline">
                              {getDisplayName(player.playerId, player.playerName)}
                            </p>
                            <p className="text-sm text-muted-foreground">{player.totalGames}ゲーム参加</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-lg font-bold text-green-600">{player.winRate.toFixed(1)}%</div>
                          <div className="text-sm text-muted-foreground">
                            勝利{Math.round((player.winRate / 100) * player.totalGames)}回
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground text-center py-8">データがありません</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="maxwin" className="space-y-4">
            <div className="bg-gradient-to-r from-purple-50 to-pink-50 p-4 rounded-lg border border-purple-200 mb-4">
              <h2 className="text-lg font-bold text-purple-800 mb-2 flex items-center">
                <Trophy className="h-5 w-5 mr-2" />🏆 歴代記録 🏆
              </h2>
              <p className="text-sm text-purple-600">全期間を通じた最高記録</p>
            </div>
            <Card className="border-purple-200">
              <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50">
                <CardTitle className="flex items-center text-purple-800">
                  <Target className="h-5 w-5 mr-2 text-green-500" />
                  1ゲームでの最大勝利©ランキング
                </CardTitle>
                <p className="text-sm text-purple-600 mt-2">※ 10位まで、3万©以上の記録のみ表示</p>
              </CardHeader>
              <CardContent>
                {rakeHistory.length > 0 ? (
                  <div className="space-y-3">
                    {getMaxWinRankings(allTimeRankings).map((player, index) => (
                      <div
                        key={player.playerId}
                        className="flex items-center justify-between p-3 bg-gradient-to-r from-purple-25 to-pink-25 rounded-lg cursor-pointer hover:bg-gradient-to-r hover:from-purple-50 hover:to-pink-50 transition-colors border border-purple-100"
                        onClick={() => handlePlayerClick(player.playerId, player.playerName)}
                      >
                        <div className="flex items-center space-x-3">
                          <span className="text-lg font-bold w-8 text-purple-700">{getRankIcon(index)}</span>
                          <div>
                            <p className="font-medium text-blue-600 hover:underline">
                              {getDisplayName(player.playerId, player.playerName)}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-lg font-bold text-green-600">{formatChips(player.maxWin)}©</div>
                          <div className="text-xs text-purple-600">歴代最高記録</div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-center text-muted-foreground py-8">データがありません</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="streak" className="space-y-4">
            <div className="bg-gradient-to-r from-purple-50 to-pink-50 p-4 rounded-lg border border-purple-200 mb-4">
              <h2 className="text-lg font-bold text-purple-800 mb-2 flex items-center">
                <Trophy className="h-5 w-5 mr-2" />🏆 歴代記録 🏆
              </h2>
              <p className="text-sm text-purple-600">全期間を通じた最高記録</p>
            </div>
            <Card className="border-purple-200">
              <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50">
                <CardTitle className="flex items-center text-purple-800">
                  <Zap className="h-5 w-5 mr-2 text-orange-500" />
                  最大連勝ランキング
                </CardTitle>
                <p className="text-sm text-purple-600 mt-1">※ 10位まで、3連勝以上の記録のみ表示</p>
              </CardHeader>
              <CardContent>
                {rakeHistory.length > 0 ? (
                  <div className="space-y-3">
                    {getWinStreakRankings(allTimeRankings).map((player, index) => (
                      <div
                        key={player.playerId}
                        className="flex items-center justify-between p-3 bg-gradient-to-r from-purple-25 to-pink-25 rounded-lg cursor-pointer hover:bg-gradient-to-r hover:from-purple-50 hover:to-pink-50 transition-colors border border-purple-100"
                        onClick={() => handlePlayerClick(player.playerId, player.playerName)}
                      >
                        <div className="flex items-center space-x-3">
                          <span className="text-lg font-bold w-8 text-purple-700">{getRankIcon(index)}</span>
                          <div>
                            <p className="font-medium text-blue-600 hover:underline">
                              {getDisplayName(player.playerId, player.playerName)}
                            </p>
                            <p className="text-sm text-muted-foreground">現在の連勝: {player.currentStreak}ゲーム</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-lg font-bold text-orange-600">{player.maxWinStreak}連勝</div>
                          <div className="text-xs text-purple-600">歴代最高記録</div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-center text-muted-foreground py-8">データがありません</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="champions" className="space-y-4">
            <div className="bg-gradient-to-r from-purple-50 to-pink-50 p-4 rounded-lg border border-purple-200 mb-4">
              <h2 className="text-lg font-bold text-purple-800 mb-2 flex items-center">
                <Trophy className="h-5 w-5 mr-2" />🏆 歴代記録 🏆
              </h2>
              <p className="text-sm text-purple-600">月間チャンピオン殿堂</p>
            </div>
            <Card className="border-purple-200">
              <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50">
                <CardTitle className="text-lg">月間チャンピオン履歴（1位〜3位）</CardTitle>
              </CardHeader>
              <CardContent>
                {monthlyPoints.length > 0 ? (
                  <div className="space-y-6">
                    {(Array.from(
                      new Set(monthlyPoints.filter((points) => `${points.year}-${String(points.month).padStart(2, '0')}` !== currentMonthStr).map((p) => `${p.year}-${String(p.month).padStart(2, '0')}`) as unknown as string[]),
                    ) as unknown as string[])
                      .sort((a: string, b: string) => b.localeCompare(a))
                      .map((month: string) => {
                        const monthData = monthlyPoints
                          .filter((points) => `${points.year}-${String(points.month).padStart(2, '0')}` === month)
                          .sort((a, b) => b.totalPoints - a.totalPoints)
                          .slice(0, 3) // 上位3位まで取得

                        return (
                          <div key={month} className="space-y-3">
                            <h3 className="font-bold text-lg text-purple-800 border-b border-purple-200 pb-2">
                              {formatMonth(month)}
                            </h3>
                            {monthData.map((champion, index) => {
                              const rankColors = [
                                "from-yellow-50 to-orange-50 border-yellow-200",
                                "from-gray-50 to-slate-50 border-gray-200",
                                "from-orange-50 to-amber-50 border-orange-200",
                              ]
                              const rankIcons = ["🥇", "🥈", "🥉"]

                              return (
                                <div
                                  key={champion.playerId}
                                  className={`flex items-center justify-between p-4 bg-gradient-to-r ${rankColors[index]} rounded-lg border`}
                                >
                                  <div className="flex items-center space-x-3">
                                    <span className="text-2xl">{rankIcons[index]}</span>
                                    <div>
                                      <p className="font-bold text-lg">1位</p>
                                      <p className="text-sm text-muted-foreground">1日参加</p>
                                    </div>
                                  </div>
                                  <div className="text-right">
                                    <p className="font-bold text-xl text-gray-800">
                                      {getDisplayName(champion.playerId, champion.playerName)}
                                    </p>
                                    <p className="text-lg font-medium text-blue-600">{champion.totalPoints}RP</p>
                                  </div>
                                </div>
                              )
                            })}
                          </div>
                        )
                      })}
                  </div>
                ) : (
                  <p className="text-center text-muted-foreground py-8">月間チャンピオン履歴がありません</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <Dialog open={isChartModalOpen} onOpenChange={setIsChartModalOpen}>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center">
                <BarChart3 className="h-5 w-5 mr-2" />
                {selectedPlayer && getDisplayName(selectedPlayer)}の収支チャート（直近5日）
              </DialogTitle>
            </DialogHeader>
            {selectedPlayer && (
              <div className="space-y-4">
                {(() => {
                  const chartData = getPlayerChartData(selectedPlayer)
                  return chartData.length > 0 ? (
                    <div className="space-y-4">
                      <Card>
                        <CardContent className="pt-4">
                          <div className="text-center">
                            <p className="text-sm text-muted-foreground">直近5日のデータ</p>
                            <p className="text-2xl font-bold">{chartData.length}日間</p>
                          </div>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardHeader>
                          <CardTitle className="text-lg">日別収支（直近5日）</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-2 max-h-60 overflow-y-auto">
                            {chartData.map((day, index) => (
                              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                                <div className="flex items-center space-x-3">
                                  <span className="text-sm font-medium">{day.date}</span>
                                  <span className="text-xs text-muted-foreground">{day.gamesCount}ゲーム</span>
                                </div>
                                <div className="flex items-center space-x-4">
                                  <span
                                    className={`font-bold text-lg ${day.profit >= 0 ? "text-green-600" : "text-red-600"}`}
                                  >
                                    {day.profit >= 0 ? "+" : ""}
                                    {day.profit.toLocaleString()}©
                                  </span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  ) : (
                    <p className="text-center text-muted-foreground py-8">直近5日のデータがありません</p>
                  )
                })()}
              </div>
            )}
          </DialogContent>
        </Dialog>

        <Dialog open={isResetDialogOpen} onOpenChange={setIsResetDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="flex items-center text-red-600">
                <RotateCcw className="h-5 w-5 mr-2" />
                ランキング完全リセット
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-800 font-medium mb-2">⚠️ 重要な操作です</p>
                <p className="text-red-700 text-sm">以下のデータが完全に削除されます：</p>
                <ul className="text-red-700 text-sm mt-2 space-y-1 list-disc list-inside">
                  <li>日別ランキングデータ</li>
                  <li>月間ポイントデータ</li>
                  <li>レーキ履歴</li>
                  <li>購入履歴</li>
                </ul>
                <p className="text-red-700 text-sm mt-2 font-medium">この操作は取り消すことができません。</p>
              </div>
              <div className="flex justify-end space-x-3">
                <Button variant="outline" onClick={() => setIsResetDialogOpen(false)} disabled={isResetting}>
                  キャンセル
                </Button>
                <Button variant="destructive" onClick={handleResetRankings} disabled={isResetting}>
                  {isResetting ? "リセット中..." : "完全リセット実行"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        <Dialog open={showUnprocessedDialog} onOpenChange={setShowUnprocessedDialog}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle className="flex items-center text-orange-600">
                <AlertCircle className="h-5 w-5 mr-2" />
                未処理ゲーム確認
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              {unprocessedGames.length > 0 ? (
                <div>
                  <p className="text-sm text-muted-foreground mb-4">
                    以下のゲームは売上確定されていないため、暫定ランキングに反映されていません：
                  </p>
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {unprocessedGames.map((game, index) => (
                      <div key={game.id || index} className="p-3 bg-orange-50 border border-orange-200 rounded-lg">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium">ゲーム ID: {game.id}</p>
                            <p className="text-sm text-muted-foreground">
                              作成日時:{" "}
                              {game.createdAt ? new Date(new Date(game.createdAt)).toLocaleString("ja-JP") : "不明"}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              参加プレイヤー数: {game.players ? game.players.length : 0}人
                            </p>
                          </div>
                          <Badge variant="outline" className="bg-orange-100 text-orange-800">
                            未確定
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <p className="text-blue-800 text-sm">
                      💡 これらのゲームを暫定ランキングに反映させるには、売上確定画面で売上を確定してください。
                    </p>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <div className="text-green-600 mb-2">
                    <Trophy className="h-12 w-12 mx-auto" />
                  </div>
                  <p className="text-green-800 font-medium">すべてのゲームが処理済みです</p>
                  <p className="text-green-600 text-sm">未処理のゲームはありません。</p>
                </div>
              )}
              <div className="flex justify-end">
                <Button onClick={() => setShowUnprocessedDialog(false)}>閉じる</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </main>
    </div>
  )
}
