"use client"

import { useState, useEffect } from "react"
import { AuthGuard } from "@/components/auth-guard"
import { Header } from "@/components/header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Calendar, TrendingUp, DollarSign, Percent, Save, Check, Eye, ChevronLeft, ChevronRight } from 'lucide-react'
import {
  subscribeToReceipts,
  subscribeToRakeHistory,
  settleDailySales,
  subscribeToDailySales,
  confirmDailyRanking,
  updateMonthlyPoints,
  getStoreRankingSettings,
  subscribeToDailyRankings,
} from "@/lib/firestore"
import type { Receipt, RakeHistory, DailySales, PlayerRanking, DailyPointRecord, DailyRanking } from "@/types"
import { SalesHistoryModal } from "@/components/sales-history-modal"
import { PasswordModal } from "@/components/password-modal"

export default function DailySalesPage() {
  const [receipts, setReceipts] = useState<Receipt[]>([])
  const [rakeHistory, setRakeHistory] = useState<RakeHistory[]>([])
  const [dailySales, setDailySales] = useState<DailySales[]>([])
  const [dailyRankings, setDailyRankings] = useState<DailyRanking[]>([])
  const [loading, setLoading] = useState(true)
  const [showHistoryModal, setShowHistoryModal] = useState(false)
  const [selectedSalesData, setSelectedSalesData] = useState<DailySales | null>(null)
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7))
  const [showPasswordModal, setShowPasswordModal] = useState(false)

  useEffect(() => {
    console.log("[v0] 📊 日別売上ページ初期化開始")

    const unsubscribeReceipts = subscribeToReceipts(
      (data) => {
        console.log("[v0] 📋 伝票データ同期受信:", data.length, "件")
        setReceipts(data)
      },
    )

    const unsubscribeRake = subscribeToRakeHistory(
      (data) => {
        console.log("[v0] 💰 レーキ履歴同期受信:", data.length, "件")

        console.log("[v0] 💰 レーキ履歴生データ全件:", data)
        console.log(
          "[v0] 💰 レーキ履歴各項目詳細:",
          data.map((rake, index) => ({
            index,
            id: rake.id,
            playerId: "unknown",
            playerName: "Unknown",
            rake: rake.rake,
            rakeType: typeof rake.rake,
            buyIn: rake.buyIn,
            additionalStack: rake.additionalStack,
            finalStack: rake.finalStack,
            createdAt: rake.createdAt,
            createdAtType: typeof rake.createdAt,
            date: new Date(rake.createdAt).toISOString().split("T")[0],
            calculation: `(${rake.buyIn} + ${rake.additionalStack}) - ${rake.finalStack} = ${rake.rake}`,
          })),
        )

        if (data.length === 0) {
          console.log("[v0] ⚠️ レーキ履歴が0件です")
          console.log("[v0] 🔍 Firestoreコレクション確認が必要です")
        } else {
          console.log("[v0] ✅ レーキ履歴データ正常受信")
          console.log(
            "[v0] 💰 マイナスレーキ確認:",
            data
              .filter((r) => r.amount < 0)
              .map((r) => ({
                playerName: "Unknown",
                rake: r.amount,
              })),
          )
          console.log(
            "[v0] 💰 プラスレーキ確認:",
            data
              .filter((r) => r.amount > 0)
              .map((r) => ({
                playerName: "Unknown",
                rake: r.amount,
              })),
          )
        }

        setRakeHistory(data)
      },
    )

    const unsubscribeDailySales = subscribeToDailySales(
      (data) => {
        console.log("[v0] 📈 日別売上データ同期受信:", data.length, "件")
        setDailySales(data)
        setLoading(false)
      },
    )

    const unsubscribeDailyRankings = subscribeToDailyRankings((dailyData) => {
      console.log("[v0] 📊 日別ランキング同期受信:", dailyData.length, "件")
      setDailyRankings(dailyData)
    })

    return () => {
      unsubscribeReceipts()
      unsubscribeRake()
      unsubscribeDailySales()
      unsubscribeDailyRankings()
    }
  }, [])

  const today = new Date().toISOString().split("T")[0]

  const currentMonth = new Date().toISOString().slice(0, 7) // YYYY-MM format

  const calculateTotalSales = () => {
    return receipts
      .filter((receipt) => receipt.status === "completed")
      .reduce((total, receipt) => total + receipt.totalAmount + receipt.totalTax, 0)
  }

  const todaySalesTotal = calculateTotalSales()

  const completedReceiptsCount = receipts.filter((receipt) => receipt.status === "completed").length

  const calculateTotalRake = () => {
    const total = rakeHistory.reduce((total, game) => total + game.amount, 0)
    console.log("[v0] 💰 レーキ合計計算:", {
      rakeHistoryCount: rakeHistory.length,
      rakeHistoryItems: rakeHistory.map((r) => ({ playerName: "Unknown", rake: r.amount })),
      calculatedTotal: total,
    })
    return total
  }

  const todayRakeTotal = calculateTotalRake()

  const todayRakeCount = rakeHistory.length

  const calculateDynamicSalesTotal = (receipts: Receipt[]) => {
    return receipts
      .filter((receipt) => receipt.status === "settled")
      .reduce((total, receipt) => total + receipt.totalAmount + receipt.totalTax, 0)
  }

  const calculateDynamicReceiptCount = (receipts: Receipt[]) => {
    return receipts.filter((receipt) => receipt.status === "settled").length
  }

  const calculateDynamicMonthlySales = (month: string) => {
    const monthlyReceipts = receipts.filter((receipt) => {
      const receiptDate = new Date(receipt.createdAt).toISOString().slice(0, 7)
      return receiptDate === month && receipt.status === "settled"
    })

    const totalSales = calculateDynamicSalesTotal(monthlyReceipts)
    const totalReceipts = calculateDynamicReceiptCount(monthlyReceipts)

    const monthlyRakeHistory = rakeHistory.filter((rake) => {
      const rakeDate = new Date(rake.createdAt).toISOString().slice(0, 7)
      return rakeDate === month
    })

    const monthlyRakeFromHistory = monthlyRakeHistory.reduce((total, rake) => total + rake.amount, 0)

    // Use salesData.rakeAmount as fallback if no rake history found
    const monthlyRakeFromSales = dailySales
      .filter((sales) => sales.date.startsWith(month))
      .reduce((total, sales) => total + (sales.rakeAmount || 0), 0)

    const totalRake = monthlyRakeHistory.length > 0 ? monthlyRakeFromHistory : monthlyRakeFromSales

    return { totalSales, totalRake, totalReceipts }
  }

  const currentMonthDynamic = calculateDynamicMonthlySales(currentMonth)
  const currentMonthSales = currentMonthDynamic.totalSales + currentMonthDynamic.totalRake

  const todaySalesExists = dailySales.some((sales) => sales.date === today)

  const todayProvisionalRanking = dailyRankings.find((ranking) => {
    const rankingDate = typeof ranking.date === "string" ? new Date(ranking.date) : new Date()
    return rankingDate.toISOString().split("T")[0] === today && !ranking.isConfirmed
  })

  const calculateTodayRankings = (): PlayerRanking[] => {
    const todayRakeData = rakeHistory.filter((rake) => {
      const rakeDate = new Date(rake.createdAt).toISOString().split("T")[0]
      return rakeDate === today
    })

    // Group by player and calculate profit (negative rake = profit)
    const playerProfits: Record<string, { playerId: string; playerName: string; profit: number }> = {}

    todayRakeData.forEach((rake) => {
      if (!playerProfits["unknown"]) {
        playerProfits["unknown"] = {
          playerId: "unknown",
          playerName: "Unknown",
          profit: 0,
        }
      }
      // Profit is negative rake (if rake is -10000, profit is +10000)
      playerProfits["unknown"].profit += -rake.amount
    })

    // Convert to array and sort by profit (highest first)
    const rankings = Object.values(playerProfits)
      .sort((a, b) => b.profit - a.profit)
      .map((player, index) => ({
        playerId: player.playerId,
        playerName: player.playerName,
        rank: index + 1,
        profit: player.profit,
        points: 0, // Will be calculated based on rank
      }))

    return rankings
  }

  const calculatePointsForRank = async (rank: number, pointMultiplier = 1): Promise<number> => {
    try {
      const settings = await getStoreRankingSettings()
      const pointSystem = settings?.pointSystem || {
        first: 8,
        second: 5,
        third: 3,
        fourth: 1,
        fifth: 1,
      }

      let basePoints = 0
      switch (rank) {
        case 1:
          basePoints = pointSystem.first
          break
        case 2:
          basePoints = pointSystem.second
          break
        case 3:
          basePoints = pointSystem.third
          break
        case 4:
          basePoints = pointSystem.fourth
          break
        case 5:
          basePoints = pointSystem.fifth
          break
        default:
          basePoints = 0
      }

      return basePoints * pointMultiplier
    } catch (error) {
      console.error("[v0] ❌ ポイント計算エラー:", error)
      // Default point system fallback
      const defaultPoints = [0, 8, 5, 3, 1, 1]
      return (defaultPoints[rank] || 0) * pointMultiplier
    }
  }

  const getTodayPointMultiplier = async (): Promise<number> => {
    try {
      const settings = await getStoreRankingSettings()
      const doublePointDays = settings?.doublePointDays || []
      return doublePointDays.includes(today) ? 2 : 1
    } catch (error) {
      console.error("[v0] ❌ 2倍デー確認エラー:", error)
      return 1
    }
  }

  const handleSaveDailySales = async () => {
    setShowPasswordModal(true)
  }

  const handlePasswordSuccess = async () => {
    try {
      console.log("[v0] 💾 売上確定・清算開始:", { date: today, sales: todaySalesTotal, rake: todayRakeTotal })

      const completedReceiptIds = receipts
        .filter((receipt) => receipt.status === "completed")
        .map((receipt) => receipt.id)

      let rankingsWithPoints: PlayerRanking[] = []
      let pointMultiplier = 1

      if (todayProvisionalRanking) {
        // Use existing provisional ranking and confirm it
        console.log("[v0] 🏆 暫定ランキングを確定に変更:", todayProvisionalRanking)
        rankingsWithPoints = todayProvisionalRanking.rankings
        pointMultiplier = todayProvisionalRanking.pointMultiplier

        // 暫定ランキングを確定に変更（実際のドキュメントIDを使用）
        await confirmDailyRanking(todayProvisionalRanking.date)
        console.log("[v0] 🏆 日別ランキング確定完了")
      } else {
        // Calculate new rankings if no provisional ranking exists
        const todayRankings = calculateTodayRankings()
        console.log("[v0] 🏆 今日のランキング計算完了:", todayRankings)

        // Get point multiplier for today
        pointMultiplier = await getTodayPointMultiplier()
        console.log("[v0] ⚡ 今日のポイント倍率:", pointMultiplier)

        // Calculate points for each player
        for (const ranking of todayRankings) {
          const points = await calculatePointsForRank(ranking.rank, pointMultiplier)
          rankingsWithPoints.push({
            ...ranking,
            points,
          })
        }

        console.log("[v0] 📊 ポイント計算完了:", rankingsWithPoints)
        console.log("[v0] ⚠️ 暫定ランキングが存在しないため、月間RP更新をスキップ")
      }

      if (todayProvisionalRanking && rankingsWithPoints.length > 0) {
        // Update monthly points for each player
        const currentDate = new Date()
        const year = currentDate.getFullYear()
        const month = currentDate.getMonth() + 1

        for (const ranking of rankingsWithPoints) {
          const dailyPointRecord: DailyPointRecord = {
            date: today,
            rank: ranking.rank,
            profit: ranking.profit,
            points: ranking.points,
            multiplier: pointMultiplier,
          }

          await updateMonthlyPoints(`${year}-${String(month).padStart(2, "0")}`)
        }

        console.log("[v0] 📈 月間RP更新完了")
      }

      // Proceed with normal sales settlement
        await settleDailySales(today, {
        salesAmount: todaySalesTotal,
        rakeAmount: todayRakeTotal,
        receiptCount: completedReceiptsCount,
        settledReceipts: completedReceiptIds,
      })

      console.log("[v0] ✅ 売上確定・清算完了 - ランキング・ポイント計算実行")
    } catch (error) {
      console.error("[v0] ❌ 売上確定・清算エラー:", error)
    }
  }

  const handleViewSalesHistory = (salesData: DailySales) => {
    setSelectedSalesData(salesData)
    setShowHistoryModal(true)
  }

  const getMonthlyData = (month: string) => {
    const monthlyData = dailySales.filter((sales) => sales.date.startsWith(month))

    const dynamicMonthly = calculateDynamicMonthlySales(month)

    return {
      monthlyData,
      totalSales: dynamicMonthly.totalSales,
      totalRake: dynamicMonthly.totalRake,
      totalReceipts: dynamicMonthly.totalReceipts,
    }
  }

  const { monthlyData, totalSales, totalRake, totalReceipts } = getMonthlyData(selectedMonth)

  const navigateMonth = (direction: "prev" | "next") => {
    const currentDate = new Date(selectedMonth + "-01")
    if (direction === "prev") {
      currentDate.setMonth(currentDate.getMonth() - 1)
    } else {
      currentDate.setMonth(currentDate.getMonth() + 1)
    }
    setSelectedMonth(currentDate.toISOString().slice(0, 7))
  }

  if (loading) {
    return (
      <AuthGuard>
        <div className="min-h-screen bg-gray-50">
          <Header />
          <div className="container mx-auto p-6">
            <div className="flex items-center justify-center h-64">
              <div className="text-lg text-muted-foreground">読み込み中...</div>
            </div>
          </div>
        </div>
      </AuthGuard>
    )
  }

  return (
    <AuthGuard>
      <div className="min-h-screen bg-gray-50">
        <Header />
        <main className="container mx-auto px-3 py-4 sm:px-6 lg:px-8 sm:py-8">
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h1 className="text-3xl font-bold flex items-center gap-2">
                <TrendingUp className="h-8 w-8" />
                売上管理
              </h1>
            </div>

            <Tabs defaultValue="daily" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="daily">日別売上</TabsTrigger>
                <TabsTrigger value="monthly">月別売上</TabsTrigger>
              </TabsList>

              <TabsContent value="daily" className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">今日の売上</CardTitle>
                      <DollarSign className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">¥{todaySalesTotal.toLocaleString()}</div>
                      <p className="text-xs text-muted-foreground">{completedReceiptsCount}件の伝票</p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">今日のレーキ</CardTitle>
                      <Percent className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">¥{todayRakeTotal.toLocaleString()}</div>
                      <p className="text-xs text-muted-foreground">{todayRakeCount}人分</p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">今月の売上</CardTitle>
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">¥{currentMonthSales.toLocaleString()}</div>
                      <p className="text-xs text-muted-foreground">{currentMonthDynamic.totalReceipts}日分</p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">売上確定</CardTitle>
                      <Save className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <Button
                        onClick={handleSaveDailySales}
                        disabled={todaySalesExists}
                        className="w-full"
                        variant={todaySalesExists ? "secondary" : "default"}
                      >
                        {todaySalesExists ? (
                          <>
                            <Check className="h-4 w-4 mr-2" />
                            確定済み
                          </>
                        ) : (
                          <>
                            <Save className="h-4 w-4 mr-2" />
                            {todayProvisionalRanking ? "暫定ランキングを確定" : "今日の売上を確定"}
                          </>
                        )}
                      </Button>
                      {todayProvisionalRanking && (
                        <p className="text-xs text-blue-600 mt-1 text-center">
                          暫定ランキングあり - 確定で月間RPに加算
                        </p>
                      )}
                    </CardContent>
                  </Card>
                </div>

                {/* ... existing code for sales history ... */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Calendar className="h-5 w-5" />
                      売上履歴
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {dailySales.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">まだ確定された売上データがありません</div>
                    ) : (
                      <div className="space-y-4">
                        {dailySales
                          .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                          .map((sales) => {
                            const salesDate = sales.date
                            const dayReceipts = receipts.filter((receipt) => {
                              const receiptDate = new Date(receipt.createdAt).toISOString().split("T")[0]
                              return receiptDate === salesDate && receipt.status === "settled"
                            })
                            const dynamicSales = calculateDynamicSalesTotal(dayReceipts)
                            const dynamicCount = calculateDynamicReceiptCount(dayReceipts)

                            const dayRakeHistory = rakeHistory.filter((rake) => {
                              const rakeDate = new Date(rake.createdAt).toISOString().split("T")[0]
                              return rakeDate === salesDate
                            })

                            const dayRake = dayRakeHistory.reduce((total, rake) => total + rake.amount, 0)

                            // Use salesData.rakeAmount as fallback if no rake history found
                            const finalRake = dayRakeHistory.length > 0 ? dayRake : sales.rakeAmount || 0

                            return (
                              <div
                                key={sales.id}
                                className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                                onClick={() => handleViewSalesHistory(sales)}
                              >
                                <div className="flex items-center space-x-4">
                                  <div className="text-sm font-medium">{sales.date}</div>
                                  <Badge variant="outline">{dynamicCount}件</Badge>
                                </div>
                                <div className="flex items-center space-x-4 text-sm">
                                  <div className="text-right">
                                    <div className="font-medium">売上: ¥{dynamicSales.toLocaleString()}</div>
                                    <div className="text-muted-foreground">レーキ: ¥{finalRake.toLocaleString()}</div>
                                    <div className="font-bold text-green-600">
                                      実質売上: ¥{(dynamicSales + finalRake).toLocaleString()}
                                    </div>
                                  </div>
                                  <Eye className="h-4 w-4 text-muted-foreground" />
                                </div>
                              </div>
                            )
                          })}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="monthly" className="space-y-6">
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <Button variant="outline" size="sm" onClick={() => navigateMonth("prev")}>
                        <ChevronLeft className="h-4 w-4" />
                        前月
                      </Button>
                      <CardTitle className="text-xl">
                        {new Date(selectedMonth + "-01").toLocaleDateString("ja-JP", {
                          year: "numeric",
                          month: "long",
                        })}
                      </CardTitle>
                      <Button variant="outline" size="sm" onClick={() => navigateMonth("next")}>
                        次月
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardHeader>
                </Card>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">月間売上</CardTitle>
                      <DollarSign className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">¥{totalSales.toLocaleString()}</div>
                      <p className="text-xs text-muted-foreground">{totalReceipts}件の伝票</p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">月間レーキ</CardTitle>
                      <Percent className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">¥{totalRake.toLocaleString()}</div>
                      <p className="text-xs text-muted-foreground">{monthlyData.length}日分</p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">実質売上</CardTitle>
                      <TrendingUp className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-green-600">
                        ¥{(totalSales + totalRake).toLocaleString()}
                      </div>
                      <p className="text-xs text-muted-foreground">売上 + レーキ</p>
                    </CardContent>
                  </Card>
                </div>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Calendar className="h-5 w-5" />
                      日別売上履歴
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {monthlyData.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">
                        {new Date(selectedMonth + "-01").toLocaleDateString("ja-JP", {
                          year: "numeric",
                          month: "long",
                        })}
                        の売上データがありません
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {monthlyData
                          .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                          .map((sales) => {
                            const salesDate = sales.date
                            const dayReceipts = receipts.filter((receipt) => {
                              const receiptDate = new Date(receipt.createdAt).toISOString().split("T")[0]
                              return receiptDate === salesDate && receipt.status === "settled"
                            })
                            const dynamicSales = calculateDynamicSalesTotal(dayReceipts)
                            const dynamicCount = calculateDynamicReceiptCount(dayReceipts)

                            const dayRakeHistory = rakeHistory.filter((rake) => {
                              const rakeDate = new Date(rake.createdAt).toISOString().split("T")[0]
                              return rakeDate === salesDate
                            })

                            const dayRake = dayRakeHistory.reduce((total, rake) => total + rake.amount, 0)

                            // Use salesData.rakeAmount as fallback if no rake history found
                            const finalRake = dayRakeHistory.length > 0 ? dayRake : sales.rakeAmount || 0

                            return (
                              <div
                                key={sales.id}
                                className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                                onClick={() => handleViewSalesHistory(sales)}
                              >
                                <div className="flex items-center space-x-4">
                                  <div className="text-sm font-medium">
                                    {new Date(sales.date).toLocaleDateString("ja-JP", {
                                      month: "short",
                                      day: "numeric",
                                      weekday: "short",
                                    })}
                                  </div>
                                  <Badge variant="outline">{dynamicCount}件</Badge>
                                </div>
                                <div className="flex items-center space-x-4 text-sm">
                                  <div className="text-right">
                                    <div className="font-medium">売上: ¥{dynamicSales.toLocaleString()}</div>
                                    <div className="text-muted-foreground">レーキ: ¥{finalRake.toLocaleString()}</div>
                                    <div className="font-bold text-green-600">
                                      実質売上: ¥{(dynamicSales + finalRake).toLocaleString()}
                                    </div>
                                  </div>
                                  <Eye className="h-4 w-4 text-muted-foreground" />
                                </div>
                              </div>
                            )
                          })}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </main>

        {selectedSalesData && (
          <SalesHistoryModal
            open={showHistoryModal}
            onClose={() => {
              setShowHistoryModal(false)
              setSelectedSalesData(null)
            }}
            salesData={selectedSalesData}
          />
        )}

        <PasswordModal
          open={showPasswordModal}
          onClose={() => setShowPasswordModal(false)}
          onSuccess={handlePasswordSuccess}
          title="売上確定"
          description="売上を確定するにはスタックマンパスワードが必要です。"
        />
      </div>
    </AuthGuard>
  )
}
