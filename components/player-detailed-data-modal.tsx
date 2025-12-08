"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from "recharts"
import { TrendingUp, TrendingDown, Trophy, Target, Calendar, Coins, BarChart3, PieChartIcon, Activity } from 'lucide-react'
import type { Player, Receipt, DailyRanking, MonthlyPoints, PointHistory } from "@/types"
import { subscribeToReceipts, subscribeToDailyRankings, subscribeToMonthlyPoints, subscribeToPointHistory, subscribeToStores, updatePlayerStore } from "@/lib/firestore"

interface PlayerDetailedDataModalProps {
  isOpen: boolean
  onClose: () => void
  playerId: string
  playerName: string
  player?: Player
}

function PlayerDetailedDataModal({
  isOpen,
  onClose,
  playerId,
  playerName,
  player: passedPlayer,
}: PlayerDetailedDataModalProps) {
  const [player, setPlayer] = useState<Player | null>(passedPlayer || null)
  const [receipts, setReceipts] = useState<Receipt[]>([])
  const [dailyRankings, setDailyRankings] = useState<DailyRanking[]>([])
  const [monthlyPoints, setMonthlyPoints] = useState<MonthlyPoints[]>([])
  const [pointHistory, setPointHistory] = useState<PointHistory[]>([])
  const [loading, setLoading] = useState(true)
  const [stores, setStores] = useState<any[]>([])
  const [isStoreDialogOpen, setIsStoreDialogOpen] = useState(false)
  const [selectedStore, setSelectedStore] = useState<any>(null)

  useEffect(() => {
    if (!isOpen || !playerId) return

    const loadPlayerData = async () => {
      setLoading(true)
      try {
        if (passedPlayer) {
          setPlayer(passedPlayer)
        }

        // 各種データの購読開始
        const unsubscribeReceipts = subscribeToReceipts(setReceipts)
        const unsubscribeDailyRankings = subscribeToDailyRankings(setDailyRankings)
        const currentYear = new Date().getFullYear()
        const currentMonth = new Date().getMonth() + 1
        const unsubscribeMonthlyPoints = subscribeToMonthlyPoints(currentYear, currentMonth, setMonthlyPoints)
        const unsubscribePointHistory = subscribeToPointHistory(playerId, setPointHistory)
        const unsubscribeStores = subscribeToStores(setStores)

        setLoading(false)

        return () => {
          unsubscribeReceipts()
          unsubscribeDailyRankings()
          unsubscribeMonthlyPoints()
          unsubscribePointHistory()
          unsubscribeStores()
        }
      } catch (error) {
        console.error("プレイヤーデータ読み込みエラー:", error)
        setLoading(false)
      }
    }

    const cleanup = loadPlayerData()
    return () => {
      cleanup?.then((fn) => fn?.())
    }
  }, [isOpen, playerId, passedPlayer])

  const handleStoreSelect = async (store: any) => {
    try {
      await updatePlayerStore(playerId, store.id, store.name)
      if (player) {
        setPlayer({ ...player, storeId: store.id, storeName: store.name })
      }
      setIsStoreDialogOpen(false)
      alert(`ホーム店舗を「${store.name}」に設定しました`)
    } catch (error) {
      console.error("店舗設定エラー:", error)
      alert("店舗設定に失敗しました")
    }
  }

  // プレイヤーの伝票データをフィルタリング
  const playerReceipts = receipts.filter(
    (receipt) =>
      receipt.playerName === playerName ||
      receipt.playerName === player?.name ||
      receipt.playerName === player?.pokerName,
  )

  // 損益計算
  const totalProfit = playerReceipts.reduce((sum, receipt) => sum + ((0 - (0 || 0)) || 0), 0)
  const totalGames = playerReceipts.length
  const winCount = playerReceipts.filter((receipt) => ((0 - (0 || 0)) || 0) > 0).length
  const winRate = totalGames > 0 ? (winCount / totalGames) * 100 : 0
  const averageProfit = totalGames > 0 ? totalProfit / totalGames : 0

  // 直近10日間のデータ（拡張）
  const last10Days = playerReceipts
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 10)
    .reverse()
    .map((receipt, index) => ({
      day: `${10 - index}日前`,
      profit: (0 - (0 || 0)) || 0,
      date: new Date(receipt.createdAt).toLocaleDateString("ja-JP", { month: "numeric", day: "numeric" }),
      buyIn: 0 || 0,
      finalStack: 0 || 0,
      gameNumber: index + 1,
    }))

  // 月別パフォーマンス分析
  const monthlyPerformance = playerReceipts.reduce(
    (acc, receipt) => {
      const month = new Date(receipt.createdAt).toISOString().slice(0, 7)
      if (!acc[month]) {
        acc[month] = { month, profit: 0, games: 0, wins: 0 }
      }
      acc[month].profit += (0 - (0 || 0)) || 0
      acc[month].games += 1
      if (((0 - (0 || 0)) || 0) > 0) acc[month].wins += 1
      return acc
    },
    {} as Record<string, { month: string; profit: number; games: number; wins: number }>,
  )

  const monthlyData = Object.values(monthlyPerformance)
    .sort((a, b) => a.month.localeCompare(b.month))
    .map((data) => ({
      ...data,
      winRate: data.games > 0 ? (data.wins / data.games) * 100 : 0,
      monthLabel: new Date(data.month + "-01").toLocaleDateString("ja-JP", { year: "numeric", month: "short" }),
    }))

  // 勝敗分布データ
  const winLossData = [
    { name: "勝利", value: winCount, color: "#10b981" },
    { name: "敗北", value: totalGames - winCount, color: "#ef4444" },
  ]

  // 収支レンジ分析
  const profitRanges = {
    bigWin: playerReceipts.filter((r) => (r.profit || 0) >= 50000).length,
    smallWin: playerReceipts.filter((r) => (r.profit || 0) > 0 && (r.profit || 0) < 50000).length,
    smallLoss: playerReceipts.filter((r) => (r.profit || 0) < 0 && (r.profit || 0) >= -50000).length,
    bigLoss: playerReceipts.filter((r) => (r.profit || 0) < -50000).length,
  }

  const profitRangeData = [
    { name: "大勝(+50k以上)", value: profitRanges.bigWin, color: "#059669" },
    { name: "小勝(+1~49k)", value: profitRanges.smallWin, color: "#10b981" },
    { name: "小負(-1~-49k)", value: profitRanges.smallLoss, color: "#f59e0b" },
    { name: "大負(-50k以下)", value: profitRanges.bigLoss, color: "#dc2626" },
  ]

  // プレイヤーのランキングデータ
  const playerDailyRanking = dailyRankings.find(
    (ranking) =>
      ranking.playerName === playerName ||
      ranking.playerName === player?.name ||
      ranking.playerName === player?.pokerName,
  )

  const playerMonthlyPoints = monthlyPoints.find(
    (points) =>
      points.playerName === playerName || points.playerName === player?.name || points.playerName === player?.pokerName,
  )

  const monthlyRank =
    monthlyPoints
      .sort((a, b) => (b.totalPoints || 0) - (a.totalPoints || 0))
      .findIndex(
        (points) =>
          points.playerName === playerName ||
          points.playerName === player?.name ||
          points.playerName === player?.pokerName,
      ) + 1

  const calculateWinRate = (gameCount: number) => {
    const recentGames = playerReceipts
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, gameCount)

    if (recentGames.length === 0) return { winRate: 0, actualGames: 0 }

    const wins = recentGames.filter((receipt) => ((0 - (0 || 0)) || 0) > 0).length
    return {
      winRate: (wins / recentGames.length) * 100,
      actualGames: recentGames.length,
    }
  }

  const winRateData = [
    { games: 10, ...calculateWinRate(10) },
    { games: 25, ...calculateWinRate(25) },
    { games: 50, ...calculateWinRate(50) },
    { games: 100, ...calculateWinRate(100) },
  ]

  if (loading) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-[95vw] sm:max-w-6xl max-h-[90vh] overflow-y-auto p-4 sm:p-6">
          <DialogHeader>
            <DialogTitle className="text-lg sm:text-xl">データ読み込み中...</DialogTitle>
          </DialogHeader>
          <div className="flex justify-center items-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <>
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="fixed top-[50%] left-[50%] translate-x-[-50%] translate-y-[-50%] z-[9999] max-w-[95vw] sm:max-w-6xl max-h-[90vh] overflow-y-auto p-4 sm:p-6 bg-white border shadow-lg">
        <DialogHeader>
          <DialogTitle className="text-lg sm:text-2xl font-bold text-center">{playerName}さんの詳細データ</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 sm:space-y-6">
          {/* 基本情報 */}
          {player && (
            <Card className="bg-gradient-to-r from-blue-50 to-purple-50">
              <CardHeader>
                <CardTitle className="text-base sm:text-lg flex items-center gap-2">
                  <Activity className="h-5 w-5 text-blue-600" />
                  基本情報
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">名前</p>
                    <p className="text-lg font-semibold">{player.name}</p>
                  </div>
                  {player.pokerName && (
                    <div>
                      <p className="text-sm text-gray-600">ポーカーネーム</p>
                      <p className="text-lg font-semibold">{player.pokerName}</p>
                    </div>
                  )}
                  <div>
                    <p className="text-sm text-gray-600">ホーム店舗</p>
                    {player.storeName ? (
                      <Badge 
                        className="bg-blue-100 text-blue-800 text-sm px-3 py-1 cursor-pointer hover:bg-blue-200 transition-colors"
                        onClick={() => setIsStoreDialogOpen(true)}
                      >
                        {player.storeName}
                      </Badge>
                    ) : (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setIsStoreDialogOpen(true)}
                        className="text-xs"
                      >
                        店舗を設定
                      </Button>
                    )}
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">貯スタック</p>
                    <p className="text-lg font-semibold">{player.systemBalance?.toLocaleString() || 0}©</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">貯CP</p>
                    <p className="text-lg font-semibold">{player.rewardPoints?.toLocaleString() || 0}CP</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* 基本統計 */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-xs sm:text-sm flex items-center gap-1">
                  <Coins className="h-3 w-3 sm:h-4 sm:w-4" />
                  貯スタック
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-lg sm:text-2xl font-bold">{player?.systemBalance?.toLocaleString() || 0}©</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-xs sm:text-sm flex items-center gap-1">
                  {totalProfit >= 0 ? (
                    <TrendingUp className="h-3 w-3 sm:h-4 sm:w-4 text-green-600" />
                  ) : (
                    <TrendingDown className="h-3 w-3 sm:h-4 sm:w-4 text-red-600" />
                  )}
                  損益
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div
                  className={`text-lg sm:text-2xl font-bold ${totalProfit >= 0 ? "text-green-600" : "text-red-600"}`}
                >
                  {totalProfit >= 0 ? "+" : ""}
                  {totalProfit.toLocaleString()}©
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-xs sm:text-sm flex items-center gap-1">
                  <Target className="h-3 w-3 sm:h-4 sm:w-4" />
                  勝率
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-lg sm:text-2xl font-bold">{winRate.toFixed(1)}%</div>
                <div className="text-xs text-gray-500">
                  {winCount}/{totalGames}戦
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-xs sm:text-sm flex items-center gap-1">
                  <Trophy className="h-3 w-3 sm:h-4 sm:w-4" />
                  平均収支
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div
                  className={`text-lg sm:text-2xl font-bold ${averageProfit >= 0 ? "text-green-600" : "text-red-600"}`}
                >
                  {averageProfit >= 0 ? "+" : ""}
                  {averageProfit.toLocaleString()}©
                </div>
              </CardContent>
            </Card>
          </div>

          <Tabs defaultValue="timeline" className="w-full">
            <TabsList className="grid w-full grid-cols-2 sm:grid-cols-5 h-auto">
              <TabsTrigger value="timeline" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm p-2">
                <Activity className="h-3 w-3 sm:h-4 sm:w-4" />
                <span className="hidden sm:inline">収支推移</span>
                <span className="sm:hidden">推移</span>
              </TabsTrigger>
              <TabsTrigger value="monthly" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm p-2">
                <BarChart3 className="h-3 w-3 sm:h-4 sm:w-4" />
                <span className="hidden sm:inline">月別分析</span>
                <span className="sm:hidden">月別</span>
              </TabsTrigger>
              <TabsTrigger value="distribution" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm p-2">
                <PieChartIcon className="h-3 w-3 sm:h-4 sm:w-4" />
                <span className="hidden sm:inline">勝率分析</span>
                <span className="sm:hidden">勝率</span>
              </TabsTrigger>
              <TabsTrigger value="ranking" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm p-2">
                <Trophy className="h-3 w-3 sm:h-4 sm:w-4" />
                <span className="hidden sm:inline">ランキング</span>
                <span className="sm:hidden">順位</span>
              </TabsTrigger>
              <TabsTrigger value="points" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm p-2">
                <Coins className="h-3 w-3 sm:h-4 sm:w-4" />
                <span className="hidden sm:inline">P履歴</span>
                <span className="sm:hidden">P</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="timeline" className="space-y-4">
              {last10Days.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-sm sm:text-base">
                      <Calendar className="h-4 w-4 sm:h-5 sm:w-5" />
                      直近10日間の収支推移
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={250}>
                      <LineChart data={last10Days}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" fontSize={12} />
                        <YAxis />
                        <Tooltip
                          formatter={(value: number) => [`${value >= 0 ? "+" : ""}${value.toLocaleString()}©`, "収支"]}
                        />
                        <Line
                          type="monotone"
                          dataKey="profit"
                          stroke="#2563eb"
                          strokeWidth={3}
                          dot={{ fill: "#2563eb", strokeWidth: 2, r: 6 }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="monthly" className="space-y-4">
              {monthlyData.length > 0 && (
                <div className="grid grid-cols-1 gap-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm sm:text-base">月別収支</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={200}>
                        <BarChart data={monthlyData}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="monthLabel" fontSize={12} />
                          <YAxis />
                          <Tooltip
                            formatter={(value: number) => [
                              `${value >= 0 ? "+" : ""}${value.toLocaleString()}©`,
                              "収支",
                            ]}
                          />
                          <Bar dataKey="profit" fill="#3b82f6" />
                        </BarChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm sm:text-base">月別勝率</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={200}>
                        <LineChart data={monthlyData}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="monthLabel" fontSize={12} />
                          <YAxis domain={[0, 100]} />
                          <Tooltip formatter={(value: number) => [`${value.toFixed(1)}%`, "勝率"]} />
                          <Line
                            type="monotone"
                            dataKey="winRate"
                            stroke="#10b981"
                            strokeWidth={3}
                            dot={{ fill: "#10b981", strokeWidth: 2, r: 4 }}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>
                </div>
              )}
            </TabsContent>

            <TabsContent value="distribution" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm sm:text-base">勝率分析</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    {winRateData.map((data) => (
                      <div key={data.games} className="text-center p-4 bg-gray-50 rounded-lg">
                        <div className="text-lg sm:text-xl font-bold text-blue-600">{data.winRate.toFixed(1)}%</div>
                        <div className="text-xs sm:text-sm text-gray-600">直近{data.games}戦</div>
                        <div className="text-xs text-gray-500">({data.actualGames}戦中)</div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="ranking" className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm sm:text-lg">日別ランキングRP</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {playerDailyRanking ? (
                      <div className="space-y-2">
                        <div className="text-2xl sm:text-3xl font-bold text-blue-600">
                          {playerDailyRanking.points || 0}RP
                        </div>
                        <Badge variant="secondary" className="text-xs sm:text-sm">
                          今日の獲得RP
                        </Badge>
                      </div>
                    ) : (
                      <div className="text-gray-500 text-sm">今日のデータなし</div>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm sm:text-lg">月間ランキング</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {playerMonthlyPoints ? (
                      <div className="space-y-2">
                        <div className="text-2xl sm:text-3xl font-bold text-purple-600">
                          {playerMonthlyPoints.totalPoints || 0}RP
                        </div>
                        <Badge variant="outline" className="text-xs sm:text-sm">
                          {monthlyRank > 0 ? `${monthlyRank}位` : "圏外"}
                        </Badge>
                      </div>
                    ) : (
                      <div className="text-gray-500 text-sm">今月のデータなし</div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="points" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm sm:text-base flex items-center gap-2">
                    <Coins className="h-4 w-4 sm:h-5 sm:w-5" />
                    ポイント履歴
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {pointHistory.length > 0 ? (
                    <div className="space-y-2 max-h-96 overflow-y-auto">
                      {pointHistory.map((history) => (
                        <div
                          key={history.id}
                          className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                        >
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <Badge variant={history.type === "earn" ? "default" : "destructive"} className="text-xs">
                                {history.type === "earn" ? "獲得" : "使用"}
                              </Badge>
                              <span className="text-sm font-medium">
                                {history.type === "earn" ? "+" : "-"}{history.points}P
                              </span>
                            </div>
                            <div className="text-xs text-gray-600 mt-1">{history.description}</div>
                            {history.purchaseAmount && history.rate && (
                              <div className="text-xs text-gray-500 mt-1">
                                購入金額: {history.purchaseAmount.toLocaleString()}円 × {history.rate}%
                              </div>
                            )}
                            <div className="text-xs text-gray-400 mt-1">
                              {new Date(history.createdAt).toLocaleString("ja-JP")}
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-xs text-gray-500">残高</div>
                            <div className="text-sm font-bold">{history.balanceAfter}P</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center text-gray-500 py-8">ポイント履歴がありません</div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
          {/* 閉じるボタン */}
          <div className="flex justify-center pt-4">
            <Button onClick={onClose} variant="outline" className="text-sm sm:text-base bg-transparent">
              閉じる
            </Button>
          </div>
        </div>
       </DialogContent>
    </Dialog>

    {/* 店舗選択ダイアログ */}
    <Dialog open={isStoreDialogOpen} onOpenChange={setIsStoreDialogOpen}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>ホーム店舗を選択</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          {stores.length > 0 ? (
            stores.map((store) => (
              <Button
                key={store.id}
                variant="outline"
                className="w-full justify-start text-left"
                onClick={() => {
                  setSelectedStore(store)
                  handleStoreSelect(store)
                }}
              >
                {store.name}
              </Button>
            ))
          ) : (
            <p className="text-center text-gray-500">店舗が見つかりません</p>
          )}
        </div>
      </DialogContent>
    </Dialog>
    </>
  )
}
export default PlayerDetailedDataModal
