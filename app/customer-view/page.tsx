"use client"

import { useState, useEffect, useMemo, useCallback } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Calendar } from "@/components/ui/calendar"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Separator } from "@/components/ui/separator"
import { useAuth } from "@/contexts/auth-context"
import { Trophy, Medal, Award, TrendingUp, Target, Zap, BarChart3, Percent, Star, Menu, AlertCircle, AlertTriangle, RefreshCw, LogOut, User, FileText, History, Bot, Gift, MessageCircle } from 'lucide-react'
import {
  subscribeToPlayers,
  subscribeToDailyRankings,
  subscribeToMonthlyPoints,
  subscribeToStoreRankingSettings,
  subscribeToRakeHistory,
  subscribeToCustomerAccounts,
  updateCustomerAccount,
  createCustomerAccount,
  resetPlayerStatistics,
  subscribeToPointHistory,
  cancelPlayerAccount,
  updatePlayer,
} from "@/lib/firestore"
import { getDb } from "@/lib/firebase"
import type { Player, DailyRanking, MonthlyPoints, StoreRankingSettings, RakeHistory, CustomerAccount } from "@/types"
import PlayerDetailedDataModal from "@/components/player-detailed-data-modal"
import {
  calculateRankings,
  getWinRateRankings,
  getMaxWinRankings,
  getWinStreakRankings,
} from "@/lib/utils/ranking-calculator"
import { formatMonth, getRankIcon } from "@/lib/utils/formatters"
import { PostsList } from "@/components/posts/posts-list"
import { MyPostsList } from "@/components/posts/my-posts-list"
import { PostDetail } from "@/components/posts/post-detail"
import { AIPlayersInfo } from "@/components/ai-players-info"
import { ChatRoomDualMode } from "@/components/chat/chat-room-dual-mode"

export default function CustomerView() {
  const { customerAccount, setCustomerAccount, signOut } = useAuth()
  const router = useRouter()

  const [viewMode, setViewMode] = useState<"main" | "posts" | "my-posts" | "post-detail" | "ai-players" | "chat">("main")
  const [selectedPostId, setSelectedPostId] = useState<string | null>(null)

  // forceResetパラメータでゲームをリセット（一時的な機能）
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search)
    if (urlParams.get("forceReset") === "true" && customerAccount?.storeId) {
      const storageKey = `pokerGameId_${customerAccount.storeId}`
      localStorage.removeItem(storageKey)
      // パラメータを削除してリロード
      urlParams.delete("forceReset")
      const newUrl = window.location.pathname + (urlParams.toString() ? "?" + urlParams.toString() : "")
      window.location.href = newUrl
    }
  }, [customerAccount?.storeId])

  // localStorageとURLパラメータからviewModeを読み取る
  useEffect(() => {
    // まずlocalStorageから復元
    const saved = localStorage.getItem("customerViewMode")
    if (saved === "chat" || saved === "posts" || saved === "my-posts" || saved === "ai-players") {
      setViewMode(saved as any)
    }
    
    // URLパラメータがあればそちらを優先
    const urlParams = new URLSearchParams(window.location.search)
    const viewModeParam = urlParams.get("viewMode")
    if (viewModeParam === "chat" || viewModeParam === "posts" || viewModeParam === "my-posts" || viewModeParam === "ai-players") {
      setViewMode(viewModeParam as any)
    }
  }, [])

  // viewModeが変更されたらローカルストレージに保存
  useEffect(() => {
    if (viewMode !== "post-detail") {
      localStorage.setItem("customerViewMode", viewMode)
    }
  }, [viewMode])

  const [isDetailedDataModalOpen, setIsDetailedDataModalOpen] = useState(false)
  const [selectedPlayerForDetailedData, setSelectedPlayerForDetailedData] = useState<{
    playerId: string
    playerName: string
    player?: Player
  } | null>(null)
  const [players, setPlayers] = useState<Player[]>([])
  const [dailyRankings, setDailyRankings] = useState<DailyRanking[]>([])
  const [monthlyPoints, setMonthlyPoints] = useState<MonthlyPoints[]>([])
  const [storeSettings, setStoreSettings] = useState<StoreRankingSettings | null>(null)
  const [selectedTab, setSelectedTab] = useState<string>("today")
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [playerIdInput, setPlayerIdInput] = useState("")
  const [isLinking, setIsLinking] = useState(false)
  const [linkingError, setLinkingError] = useState("")
  const [skipLinking, setSkipLinking] = useState(false)

  const [showLinkingSuccessModal, setShowLinkingSuccessModal] = useState(false)
  const [skipLinkingAfterSuccess, setSkipLinkingAfterSuccess] = useState(false)

  const [showConfirmation, setShowConfirmation] = useState(false)
  const [selectedPlayer, setSelectedPlayer] = useState<any>(null)

  const [rakeHistory, setRakeHistory] = useState<RakeHistory[]>([])
  const [selectedPlayerForChart, setSelectedPlayerForChart] = useState<string | null>(null)
  const [isChartModalOpen, setIsChartModalOpen] = useState(false)
  const [activeTab, setActiveTab] = useState("today")

  const [pointHistory, setPointHistory] = useState<any[]>([])
  const [currentRewardRate, setCurrentRewardRate] = useState<number>(5) // Track current reward rate

  const [isLoading, setIsLoading] = useState(true)
  const [customerAccounts, setCustomerAccounts] = useState<CustomerAccount[]>([])

  const [dataLoaded, setDataLoaded] = useState({
    customers: false,
    players: false,
    dailyRankings: false,
    monthlyPoints: false,
    storeSettings: false,
  })

  const currentCustomer = customerAccount

  const currentDate = new Date()
  const currentYear = currentDate.getFullYear()
  const currentMonth = currentDate.getMonth() + 1
  const currentMonthStr = currentDate.toISOString().slice(0, 7) // YYYY-MM
  const today = new Date().toISOString().split("T")[0]

  const [showPlayerIdForm, setShowPlayerIdForm] = useState(false)

  const [originalPlayerData, setOriginalPlayerData] = useState<{ playerId: string; playerName: string } | null>(null)

  const [isResetConfirmOpen, setIsResetConfirmOpen] = useState(false)
  const [isResetting, setIsResetting] = useState(false)
  const [isCancelConfirmOpen, setIsCancelConfirmOpen] = useState(false)
  const [isCancelling, setIsCancelling] = useState(false)

  const [showPlayerLinkModal, setShowPlayerLinkModal] = useState(false)

  useEffect(() => {
    const skipSuccess = localStorage.getItem("skipPlayerLinkingSuccess")
    if (skipSuccess === "true") {
      setSkipLinkingAfterSuccess(true)
    }
  }, [])

  const getDisplayName = (player: Player) => {
    return player.pokerName || player.name || `プレイヤー${player.id}`
  }

  const getPlayerName = (player: any): string => {
    if (typeof player === "string") return player
    if (typeof player === "object" && player?.name) return player.name
    return "プレイヤー"
  }

  // linkedPlayerを早期に定義（useMemoで最適化）
  const linkedPlayer = useMemo(() => {
    return players.find((player) => {
      if (!customerAccount?.playerId) return false

      const matchConditions = [
        // 1. uniqueIdで照合（数値IDが生成されている場合）
        player.uniqueId && String(player.uniqueId) === String(customerAccount?.playerId),

        // 2. Firestore IDで照合
        player.id === customerAccount?.playerId,

        // 3. 名前で照合（フォールバック）
        player.name === customerAccount?.playerName,
        player.pokerName === customerAccount?.playerName,
      ]

      return matchConditions.some((condition) => condition)
    })
  }, [players, customerAccount?.playerId, customerAccount?.playerName])

  // linkedPlayerが見つかった時にstoreIdを自動更新
  useEffect(() => {
    const updateStoreIdIfNeeded = async () => {
      if (linkedPlayer && customerAccount) {
        // storeIdまたはplayerNameが未設定または不正な場合に更新
        const hasInvalidPlayerName = customerAccount.playerName?.startsWith("プレイヤー") || !customerAccount.playerName
        const needsUpdate = !customerAccount.storeId || hasInvalidPlayerName
        
        if (needsUpdate && linkedPlayer.storeId) {
          try {
            const playerName = linkedPlayer.name || linkedPlayer.pokerName || `プレイヤー${linkedPlayer.uniqueId}`
            await updateCustomerAccount(customerAccount.id, {
              storeId: linkedPlayer.storeId,
              storeName: linkedPlayer.storeName || "未設定",
              playerName: playerName,
            })
            // Update local customerAccount state
            setCustomerAccount({
              ...customerAccount,
              storeId: linkedPlayer.storeId,
              storeName: linkedPlayer.storeName || "未設定",
              playerName: playerName,
            })
          } catch (error) {
            console.error("[v0] Error updating customerAccount:", error)
          }
        }
      }
    }
    updateStoreIdIfNeeded()
  }, [linkedPlayer, customerAccount, setCustomerAccount])

  const handlePlayerIdLink = async () => {
    if (!playerIdInput.trim()) return

    setIsLinking(true)
    setLinkingError("")

    try {
      const input = playerIdInput.trim()
      const foundPlayer = players.find(
        (p) =>
          String(p.uniqueId) === input ||
          p.id === input ||
          p.name === input ||
          p.pokerName === input
      )

      if (foundPlayer) {
        setSelectedPlayer(foundPlayer)
        setShowConfirmation(true)
      } else {
        setLinkingError("プレイヤーが見つかりませんでした。IDまたは名前を確認してください。")
      }
    } catch (error) {
      console.error("[v0] プレイヤー検索エラー:", error)
      setLinkingError("検索中にエラーが発生しました。")
    } finally {
      setIsLinking(false)
    }
  }

  const confirmPlayerLink = async () => {
    if (!selectedPlayer || !customerAccount) return

    setIsLinking(true)
    try {
      const playerName = selectedPlayer.name || selectedPlayer.pokerName || `プレイヤー${selectedPlayer.uniqueId}`
      await updateCustomerAccount(customerAccount.id, {
        playerId: selectedPlayer.uniqueId || selectedPlayer.id,
        playerName: playerName,
        storeId: selectedPlayer.storeId || "",
        storeName: selectedPlayer.storeName || "未設定",
      })

      setCustomerAccount({
        ...customerAccount,
        playerId: selectedPlayer.uniqueId || selectedPlayer.id,
        playerName: playerName,
        storeId: selectedPlayer.storeId || "",
        storeName: selectedPlayer.storeName || "未設定",
      })

      setShowConfirmation(false)
      setShowPlayerLinkModal(false)
      if (!skipLinkingAfterSuccess) {
        setShowLinkingSuccessModal(true)
      }
    } catch (error) {
      console.error("[v0] 紐づけエラー:", error)
      setLinkingError("紐づけに失敗しました。もう一度お試しください。")
    } finally {
      setIsLinking(false)
    }
  }

  const handlePlayerIdChange = () => {
    if (!customerAccount) return
    setOriginalPlayerData({
      playerId: customerAccount.playerId || "",
      playerName: customerAccount.playerName || "",
    })
    setShowPlayerLinkModal(true)
  }

  const handlePlayerLinkClick = () => {
    setShowPlayerLinkModal(true)
  }

  const handleSkipLinkingAfterSuccessChange = (checked: boolean) => {
    setSkipLinkingAfterSuccess(checked)
    localStorage.setItem("skipPlayerLinkingSuccess", String(checked))
  }

  const handleStatisticsReset = async () => {
    if (!linkedPlayer) return

    setIsResetting(true)
    try {
      await resetPlayerStatistics(linkedPlayer.id, getDisplayName(linkedPlayer))
      setIsResetConfirmOpen(false)
      alert("統計データをリセットしました。貯スタックは保持されています。")
      setTimeout(() => {
        window.location.reload()
      }, 1000)
    } catch (error) {
      console.error("[v0] 統計リセットエラー:", error)
      alert("統計リセットに失敗しました。もう一度お試しください。")
    } finally {
      setIsResetting(false)
    }
  }

  useEffect(() => {
    const unsubscribeCustomers = subscribeToCustomerAccounts((customers) => {
      if (customers.length > 0) {
        const currentUserEmail = sessionStorage.getItem("currentUserEmail")
        let targetCustomer = customers[0]

        if (currentUserEmail) {
          const foundCustomer = customers.find((customer) => customer.email === currentUserEmail)
          if (foundCustomer) {
            targetCustomer = foundCustomer
          }
        }

        const tempCustomer = {
          ...targetCustomer,
          subscriptionStatus: "active" as const,
        }

        setCustomerAccount((prevCustomer: any) => {
          if (!prevCustomer || prevCustomer.id !== tempCustomer.id) {
            return tempCustomer
          }
          return prevCustomer
        })

        setCustomerAccounts(customers)
      } else {
        setCustomerAccounts(customers)
        setCustomerAccount(null)
      }
      setDataLoaded((prev) => ({ ...prev, customers: true }))
    })

    const storeId = localStorage.getItem("storeId") || undefined
    const unsubscribePlayers = subscribeToPlayers((players) => {
      setPlayers(players)
      setDataLoaded((prev) => ({ ...prev, players: true }))
    }, undefined, storeId)

    const unsubscribeDailyRankings = subscribeToDailyRankings((rankings) => {
      setDailyRankings(rankings)
      setDataLoaded((prev) => ({ ...prev, dailyRankings: true }))
    }, storeId)

    const unsubscribeMonthlyPoints = subscribeToMonthlyPoints(currentYear, currentMonth, (points) => {
        setMonthlyPoints(points)
        setDataLoaded((prev) => ({ ...prev, monthlyPoints: true }))
      })

    const unsubscribeStoreSettings = subscribeToStoreRankingSettings((settings) => {
      setStoreSettings(settings)
      if (settings) {
        const cpRate = settings.cashbackPointsSettings?.rate || 5
        setCurrentRewardRate(cpRate)
      }
      setDataLoaded((prev) => ({ ...prev, storeSettings: true }))
    })

    const unsubscribeRakeHistory = subscribeToRakeHistory((history) => {
      setRakeHistory(history)
    })

    let unsubscribePointHistory: (() => void) | null = null
    if (linkedPlayer?.id) {
      unsubscribePointHistory = subscribeToPointHistory(linkedPlayer.id, (history) => {
        setPointHistory(history)
      })
    }

    return () => {
      unsubscribeCustomers()
      unsubscribePlayers()
      unsubscribeDailyRankings()
      unsubscribeMonthlyPoints()
      unsubscribeStoreSettings()
      unsubscribeRakeHistory()
      if (unsubscribePointHistory) {
        unsubscribePointHistory()
      }
    }
  }, [currentYear, currentMonth, linkedPlayer?.id, setCustomerAccount])

  useEffect(() => {
    const allDataLoaded = Object.values(dataLoaded).every((loaded) => loaded)
    if (allDataLoaded) {
      setIsLoading(false)
    }
  }, [dataLoaded])

  const handleDetailedDataClick = () => {
    if (customerAccount?.playerId && linkedPlayer) {
      try {
        const displayName = getDisplayName(linkedPlayer)
        setSelectedPlayerForDetailedData({
          playerId: String(customerAccount.playerId),
          playerName: displayName,
          player: linkedPlayer,
        })
        setIsDetailedDataModalOpen(true)
      } catch (error) {
        console.error("[v0] Error in handleDetailedDataClick:", error)
      }
    }
  }

  const monthlyGames = useMemo(() => {
    return rakeHistory.filter((game) => {
      const gameDate = game.createdAt instanceof Date ? game.createdAt : (game.createdAt as any).toDate()
      const gameMonth = new Date(gameDate.toISOString().slice(0, 7))
      return gameMonth.getFullYear() === currentDate.getFullYear() && gameMonth.getMonth() === currentDate.getMonth()
    })
  }, [rakeHistory, currentDate])

  const monthlyRankings = useMemo(() => calculateRankings(monthlyGames), [monthlyGames])
  const allTimeRankings = useMemo(() => calculateRankings(rakeHistory), [rakeHistory])

  const getPlayerChartData = (playerId: string) => {
    const playerGames = rakeHistory
      .filter((game) => game.playerId === playerId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())

    const dailyProfits: Record<string, number> = {}
    playerGames.forEach((game) => {
      const dateStr = game.createdAt.toISOString().split("T")[0]
      const profit = game.finalStack - (game.buyIn + game.additionalStack)
      dailyProfits[dateStr] = (dailyProfits[dateStr] || 0) + profit
    })

    const recentDays = Object.entries(dailyProfits)
      .sort(([a], [b]) => b.localeCompare(a))
      .slice(0, 5)
      .reverse()

    return recentDays.map(([date, profit]) => ({
      date: new Date(date).toLocaleDateString("ja-JP"),
      profit,
    }))
  }

  const handlePlayerClick = (playerId: string, playerName: string) => {
    const player = players.find((p) => p.id === playerId)
    setSelectedPlayerForDetailedData({
      playerId,
      playerName,
      player,
    })
    setIsDetailedDataModalOpen(true)
  }

  const sortedTodayRankings = useMemo(() => {
    return dailyRankings
      .filter((r) => r.date === today)
      .sort((a, b) => b.points - a.points)
  }, [dailyRankings, today])

  const monthlyRanking = useMemo(() => {
    return monthlyPoints.sort((a, b) => b.totalPoints - a.totalPoints)
  }, [monthlyPoints])

  const isDoublePointDay = useMemo(() => {
    if (!storeSettings?.doublePointDays) return false
    const dayOfWeek = new Date().getDay()
    return storeSettings.doublePointDays.includes(dayOfWeek)
  }, [storeSettings])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <RefreshCw className="h-12 w-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600 font-medium">データを読み込み中...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <div className="bg-white border-b sticky top-0 z-30 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-2">
              <div className="bg-blue-600 p-1.5 rounded-lg">
                <Trophy className="h-6 w-6 text-white" />
              </div>
              <h1 className="text-xl font-bold text-gray-900 hidden sm:block">Stack Man Kai</h1>
              <span className="text-xs text-gray-500 ml-2 hidden lg:block">Player Dashboard</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-bold text-gray-900">{customerAccount?.playerName || "ゲスト"}</p>
                <p className="text-xs text-gray-500">ログイン中</p>
              </div>
              <Sheet open={isMenuOpen} onOpenChange={setIsMenuOpen}>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon" className="relative">
                    <Menu className="h-6 w-6" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="right" className="w-80 sm:w-96">
                  <SheetHeader className="mb-6">
                    <SheetTitle className="text-left flex items-center gap-2">
                      <User className="h-5 w-5 text-blue-600" />
                      メニュー
                    </SheetTitle>
                  </SheetHeader>
                  <div className="space-y-6">
                    <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center">
                          <User className="h-6 w-6 text-blue-600" />
                        </div>
                        <div>
                          <p className="font-bold text-gray-900">{customerAccount?.playerName || "ゲスト"}</p>
                          <p className="text-xs text-gray-500">{customerAccount?.email}</p>
                        </div>
                      </div>
                      {linkedPlayer ? (
                        <div className="space-y-2">
                          <Button
                            variant="outline"
                            className="w-full justify-start text-base py-3 bg-white"
                            onClick={() => {
                              handleDetailedDataClick()
                              setIsMenuOpen(false)
                            }}
                          >
                            <BarChart3 className="h-5 w-5 mr-3 text-blue-600" />
                            詳細分析データ
                          </Button>
                          <Button
                            variant="ghost"
                            className="w-full justify-start text-base py-3"
                            onClick={() => {
                              setViewMode("main")
                              const rankingSection = document.querySelector("[data-ranking-section]")
                              if (rankingSection) {
                                rankingSection.scrollIntoView({ behavior: "smooth", block: "start" })
                              }
                              setIsMenuOpen(false)
                            }}
                          >
                            <Trophy className="h-5 w-5 mr-3 text-yellow-500" />
                            ポーカーランキング
                          </Button>
                          <Button
                            variant="ghost"
                            className="w-full justify-start text-base py-3"
                            onClick={() => {
                              setViewMode("posts")
                              setIsMenuOpen(false)
                            }}
                          >
                            <FileText className="h-5 w-5 mr-3 text-green-600" />
                            ハンド記録を見る
                          </Button>
                          <Button
                            variant="ghost"
                            className="w-full justify-start text-base py-3"
                            onClick={() => {
                              setViewMode("my-posts")
                              setIsMenuOpen(false)
                            }}
                          >
                            <History className="h-5 w-5 mr-3 text-purple-600" />
                            自分の投稿履歴
                          </Button>
                          <Button
                            variant="ghost"
                            className="w-full justify-start text-base py-3"
                            onClick={() => {
                              setViewMode("ai-players")
                              setIsMenuOpen(false)
                            }}
                          >
                            <Bot className="h-5 w-5 mr-3 text-indigo-600" />
                            AIプレイヤー紹介
                          </Button>
                          <Separator className="my-2" />
                          <Button
                            variant="ghost"
                            className="w-full justify-start text-base py-3 text-orange-600 hover:text-orange-700 hover:bg-orange-50"
                            onClick={() => {
                              setIsResetConfirmOpen(true)
                              setIsMenuOpen(false)
                            }}
                          >
                            <RefreshCw className="h-5 w-5 mr-3" />
                            統計データをリセット
                          </Button>
                          <Button
                            variant="ghost"
                            className="w-full justify-start text-base py-3"
                            onClick={() => {
                              handlePlayerIdChange()
                              setIsMenuOpen(false)
                            }}
                          >
                            <RefreshCw className="h-5 w-5 mr-3" />
                            プレイヤーID変更
                          </Button>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          <Alert className="border-orange-200 bg-orange-50">
                            <AlertCircle className="h-4 w-4 text-orange-600" />
                            <AlertDescription className="text-orange-800 text-sm">
                              プレイヤー情報が紐づけられていません。
                            </AlertDescription>
                          </Alert>
                          <Button
                            variant="outline"
                            className="w-full justify-start text-base py-3 bg-white"
                            onClick={() => {
                              handlePlayerLinkClick()
                              setIsMenuOpen(false)
                            }}
                          >
                            <User className="h-5 w-5 mr-3 text-blue-600" />
                            プレイヤー情報を紐づける
                          </Button>
                        </div>
                      )}
                    </div>

                    <Separator />
                    
                    <Button
                      variant="ghost"
                      className="w-full justify-start text-base py-3"
                      onClick={() => {
                        setViewMode("chat")
                        setIsMenuOpen(false)
                      }}
                    >
                      <MessageCircle className="h-5 w-5 mr-3 text-blue-500" />
                      チャット
                    </Button>
                    
                    <Button
                      variant="ghost"
                      className="w-full justify-start text-base py-3"
                      onClick={() => {
                        router.push('/stack-man-hand/purchase')
                        setIsMenuOpen(false)
                      }}
                    >
                      <Gift className="h-5 w-5 mr-3 text-pink-500" />
                      Stack Man Hand購入
                    </Button>
                    
                    <Separator />

                    <div className="space-y-2">
                      <Button
                        variant="outline"
                        className="w-full justify-start text-orange-600 hover:text-orange-700 hover:bg-orange-50 border-orange-200"
                        onClick={() => {
                          setIsCancelConfirmOpen(true)
                          setIsMenuOpen(false)
                        }}
                      >
                        <AlertTriangle className="mr-2 h-4 w-4" />
                        スタックマン解約
                      </Button>

                      <Button
                        variant="outline"
                        className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
                        onClick={() => {
                          setCustomerAccount(null)
                          signOut()
                          setIsMenuOpen(false)
                          window.location.href = "/"
                        }}
                      >
                        <LogOut className="mr-2 h-4 w-4" />
                        ログアウト
                      </Button>
                    </div>
                  </div>
                </SheetContent>
              </Sheet>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {customerAccount?.playerId && linkedPlayer && viewMode !== "chat" && (
          <>
            {/* プレイヤー情報カード */}
            <Card className="border-blue-200 bg-gradient-to-br from-blue-50 to-white shadow-md overflow-hidden">
              <div className="h-2 bg-blue-600 w-full" />
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <CardTitle className="flex items-center gap-2 text-blue-800 text-xl">
                    <User className="h-6 w-6" />
                    {getDisplayName(linkedPlayer)}
                  </CardTitle>
                  <Badge variant="outline" className="bg-blue-100 text-blue-700 border-blue-200">
                    {linkedPlayer.membershipRank?.toUpperCase() || "BRONZE"}
                  </Badge>
                </div>
                <p className="text-sm text-gray-500 flex items-center gap-1">
                  <Star className="h-3 w-3" />
                  ホーム店舗: {linkedPlayer.storeName || "未設定"}
                </p>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-2">
                  <div className="bg-white p-3 rounded-xl border border-gray-100 shadow-sm">
                    <p className="text-xs text-gray-500 mb-1">店舗貯スタック</p>
                    <p className="text-xl font-bold text-blue-600">
                      {linkedPlayer.systemBalance?.toLocaleString() || 0}
                      <span className="text-xs ml-1 text-gray-400">©</span>
                    </p>
                  </div>
                  <div 
                    className="bg-white p-3 rounded-xl border border-green-100 shadow-sm cursor-pointer hover:border-green-300 transition-all"
                    onClick={() => router.push('/stack-man-hand/purchase')}
                  >
                    <p className="text-xs text-gray-500 mb-1">スタポカ貯スタック</p>
                    <p className="text-xl font-bold text-green-600">
                      {linkedPlayer.systemBalance?.toLocaleString() || 0}
                      <span className="text-xs ml-1 text-gray-400">©</span>
                    </p>
                    <p className="text-[10px] text-green-500 mt-1">チャージ・購入</p>
                  </div>
                  <div className="bg-white p-3 rounded-xl border border-gray-100 shadow-sm">
                    <p className="text-xs text-gray-500 mb-1">保有 CP</p>
                    <p className="text-xl font-bold text-purple-600">
                      {linkedPlayer.rewardPoints?.toLocaleString() || 0}
                      <span className="text-xs ml-1 text-gray-400">pts</span>
                    </p>
                  </div>
                  <div className="bg-white p-3 rounded-xl border border-gray-100 shadow-sm">
                    <p className="text-xs text-gray-500 mb-1">会員ランク</p>
                    <p className="text-xl font-bold text-gray-700">
                      {linkedPlayer.membershipRank === "platinum" ? "プラチナ" : 
                       linkedPlayer.membershipRank === "gold" ? "ゴールド" : 
                       linkedPlayer.membershipRank === "silver" ? "シルバー" : "一般"}
                    </p>
                  </div>
                </div>
                
                <div className="mt-6 flex flex-wrap gap-2">
                  <Button 
                    size="sm" 
                    className="bg-blue-600 hover:bg-blue-700"
                    onClick={handleDetailedDataClick}
                  >
                    <BarChart3 className="h-4 w-4 mr-2" />
                    詳細分析
                  </Button>
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => setViewMode("chat")}
                  >
                    <MessageCircle className="h-4 w-4 mr-2" />
                    チャット
                  </Button>
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => {
                      const rankingSection = document.querySelector("[data-ranking-section]")
                      if (rankingSection) {
                        rankingSection.scrollIntoView({ behavior: "smooth", block: "start" })
                      }
                    }}
                  >
                    <Trophy className="h-4 w-4 mr-2" />
                    ランキング
                  </Button>
                </div>
              </CardContent>
            </Card>
          </>
        )}

        {/* View Modes */}
        {viewMode === "main" && (
          <div className="space-y-6">
            {/* 今日のRPランキング */}
            <Card className="shadow-md border-none">
              <CardHeader className="bg-white border-b pb-4">
                <div className="flex justify-between items-center">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Trophy className="h-5 w-5 text-yellow-500" />
                    今日のRPランキング
                  </CardTitle>
                  {isDoublePointDay && <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">RP2倍デー</Badge>}
                </div>
              </CardHeader>
              <CardContent className="pt-6">
                {sortedTodayRankings.length > 0 ? (
                  <div className="space-y-3">
                    {sortedTodayRankings.map((ranking, index) => (
                      <div key={ranking.playerId} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl border border-gray-100">
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${
                            index === 0 ? "bg-yellow-100 text-yellow-700" : 
                            index === 1 ? "bg-gray-200 text-gray-700" : 
                            index === 2 ? "bg-orange-100 text-orange-700" : "bg-white text-gray-400"
                          }`}>
                            {index + 1}
                          </div>
                          <span className="font-bold">{ranking.playerName}</span>
                        </div>
                        <div className="text-right">
                          <span className="text-blue-600 font-bold">{isDoublePointDay ? ranking.points * 2 : ranking.points} RP</span>
                          <p className="text-[10px] text-gray-400">{ranking.profit > 0 ? "+" : ""}{ranking.profit.toLocaleString()}©</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-10 text-gray-400">
                    <Trophy className="h-10 w-10 mx-auto mb-2 opacity-20" />
                    <p>本日のランキングはまだありません</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* 月間ランキング */}
            <Card className="shadow-md border-none">
              <CardHeader className="bg-white border-b pb-4">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <TrendingUp className="h-5 w-5 text-blue-500" />
                  {currentMonth}月の総合ランキング
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                {monthlyRanking.length > 0 ? (
                  <div className="space-y-3">
                    {monthlyRanking.slice(0, 5).map((points, index) => (
                      <div key={points.playerId} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl border border-gray-100">
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${
                            index === 0 ? "bg-yellow-100 text-yellow-700" : "bg-white text-gray-400"
                          }`}>
                            {index + 1}
                          </div>
                          <span className="font-bold">{points.playerName}</span>
                        </div>
                        <span className="text-blue-600 font-bold">{points.totalPoints} RP</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-10 text-gray-400">
                    <p>月間データ収集中...</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* 最近のCP履歴 */}
            <Card className="shadow-md border-none">
              <CardHeader className="bg-white border-b pb-4">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <History className="h-5 w-5 text-purple-500" />
                  最近のCP履歴
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                {pointHistory.length > 0 ? (
                  <div className="space-y-3">
                    {pointHistory.slice(0, 5).map((history, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl border border-gray-100">
                        <div>
                          <p className="text-sm font-bold">{history.reason || "ゲーム参加"}</p>
                          <p className="text-[10px] text-gray-400">{new Date(history.createdAt?.toDate?.() || history.createdAt).toLocaleDateString()}</p>
                        </div>
                        <span className="text-purple-600 font-bold">+{history.points} CP</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-10 text-gray-400">
                    <p>履歴はまだありません</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {viewMode === "posts" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <FileText className="h-5 w-5 text-green-600" />
                ハンド記録
              </h2>
              <Button variant="ghost" size="sm" onClick={() => setViewMode("main")}>戻る</Button>
            </div>
            <PostsList onSelectPost={(id) => {
              setSelectedPostId(id)
              setViewMode("post-detail")
            }} />
          </div>
        )}

        {viewMode === "my-posts" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <History className="h-5 w-5 text-purple-600" />
                自分の投稿
              </h2>
              <Button variant="ghost" size="sm" onClick={() => setViewMode("main")}>戻る</Button>
            </div>
            <MyPostsList onSelectPost={(id) => {
              setSelectedPostId(id)
              setViewMode("post-detail")
            }} />
          </div>
        )}

        {viewMode === "post-detail" && selectedPostId && (
          <div className="space-y-4">
            <Button variant="ghost" size="sm" onClick={() => setViewMode("posts")}>一覧に戻る</Button>
            <PostDetail postId={selectedPostId} />
          </div>
        )}

        {viewMode === "ai-players" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <Bot className="h-5 w-5 text-indigo-600" />
                AIプレイヤー
              </h2>
              <Button variant="ghost" size="sm" onClick={() => setViewMode("main")}>戻る</Button>
            </div>
            <AIPlayersInfo />
          </div>
        )}

        {viewMode === "chat" && (
          <div className="space-y-4 h-[calc(100vh-180px)]">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <MessageCircle className="h-5 w-5 text-blue-600" />
                チャットルーム
              </h2>
              <Button variant="ghost" size="sm" onClick={() => setViewMode("main")}>戻る</Button>
            </div>
            <ChatRoomDualMode />
          </div>
        )}
      </div>

      {/* Bottom Navigation (Mobile) */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t flex justify-around items-center h-16 px-2 z-40 sm:hidden">
        <Button 
          variant="ghost" 
          className={`flex flex-col items-center gap-1 h-full w-full rounded-none ${viewMode === "main" ? "text-blue-600" : "text-gray-400"}`}
          onClick={() => setViewMode("main")}
        >
          <Star className="h-5 w-5" />
          <span className="text-[10px]">ホーム</span>
        </Button>
        <Button 
          variant="ghost" 
          className={`flex flex-col items-center gap-1 h-full w-full rounded-none ${viewMode === "main" ? "text-blue-600" : "text-gray-400"}`}
          onClick={() => {
            setViewMode("main")
            setIsMenuOpen(true)
          }}
        >
          <User className="h-5 w-5" />
          <span className="text-[10px]">マイページ</span>
        </Button>
        <Button 
          variant="ghost" 
          className="flex flex-col items-center gap-1 h-full w-full rounded-none text-gray-400"
          onClick={() => {
            setViewMode("main")
            const rankingSection = document.querySelector("[data-ranking-section]")
            if (rankingSection) {
              rankingSection.scrollIntoView({ behavior: "smooth", block: "start" })
            }
          }}
        >
          <Trophy className="h-5 w-5" />
          <span className="text-[10px]">ランキング</span>
        </Button>
        <Button 
          variant="ghost" 
          className={`flex flex-col items-center gap-1 h-full w-full rounded-none ${viewMode === "chat" ? "text-blue-600" : "text-gray-400"}`}
          onClick={() => setViewMode("chat")}
        >
          <MessageCircle className="h-5 w-5" />
          <span className="text-[10px]">チャット</span>
        </Button>
      </div>

      {/* Modals */}
      {isDetailedDataModalOpen && selectedPlayerForDetailedData && (
        <PlayerDetailedDataModal
          isOpen={isDetailedDataModalOpen}
          onClose={() => {
            setIsDetailedDataModalOpen(false)
            setSelectedPlayerForDetailedData(null)
          }}
          playerId={selectedPlayerForDetailedData.playerId}
          playerName={selectedPlayerForDetailedData.playerName}
          player={selectedPlayerForDetailedData.player}
        />
      )}

      <Sheet open={isResetConfirmOpen} onOpenChange={setIsResetConfirmOpen}>
        <SheetContent side="right" className="w-96">
          <SheetHeader>
            <SheetTitle className="text-lg text-orange-600">統計データリセット</SheetTitle>
          </SheetHeader>
          <div className="mt-6 space-y-4">
            <Alert className="border-red-200 bg-red-50">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription className="text-red-800">
                <div className="space-y-3">
                  <p className="font-bold">⚠️ 重要な注意事項</p>
                  <div className="space-y-2 text-sm">
                    <p>• <strong>復元できません</strong> - 一度削除したデータは元に戻せません</p>
                    <p>• <strong>ランキングに影響しません</strong> - 全体のランキングは変更されません</p>
                    <p>• <strong>貯スタックは保持</strong> - 現在の貯スタックは削除されません</p>
                  </div>
                </div>
              </AlertDescription>
            </Alert>
            <div className="space-y-3">
              <Button
                onClick={handleStatisticsReset}
                disabled={isResetting}
                className="w-full bg-red-600 hover:bg-red-700 text-white"
              >
                {isResetting ? "リセット中..." : "統計データをリセットする"}
              </Button>
              <Button
                onClick={() => setIsResetConfirmOpen(false)}
                variant="outline"
                className="w-full"
                disabled={isResetting}
              >
                キャンセル
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>

      <Sheet open={showPlayerLinkModal} onOpenChange={setShowPlayerLinkModal}>
        <SheetContent side="right" className="w-96">
          <SheetHeader>
            <SheetTitle className="text-lg">プレイヤー情報を紐づける</SheetTitle>
          </SheetHeader>
          <div className="mt-6 space-y-4">
            <div className="space-y-3">
              <label className="text-sm font-medium text-gray-700">プレイヤーIDまたは名前</label>
              <input
                type="text"
                value={playerIdInput}
                onChange={(e) => setPlayerIdInput(e.target.value)}
                placeholder="例: 123456 または プレイヤー名"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              {linkingError && <p className="text-sm text-red-600">{linkingError}</p>}
            </div>
            <div className="space-y-3">
              <Button
                onClick={handlePlayerIdLink}
                disabled={isLinking || !playerIdInput.trim()}
                className="w-full bg-blue-600 hover:bg-blue-700"
              >
                {isLinking ? "確認中..." : "プレイヤーを検索"}
              </Button>
              <Button
                onClick={() => {
                  setShowPlayerLinkModal(false)
                  setPlayerIdInput("")
                  setLinkingError("")
                }}
                variant="outline"
                className="w-full"
                disabled={isLinking}
              >
                キャンセル
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>

      <Sheet open={showConfirmation} onOpenChange={setShowConfirmation}>
        <SheetContent side="right" className="w-96">
          <SheetHeader>
            <SheetTitle className="text-lg">プレイヤー情報の確認</SheetTitle>
          </SheetHeader>
          <div className="mt-6 space-y-4">
            {selectedPlayer && (
              <>
                <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                  <div>
                    <p className="text-sm text-gray-600">プレイヤー名</p>
                    <p className="font-semibold">{selectedPlayer.name}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">プレイヤーID</p>
                    <p className="font-mono text-sm">{selectedPlayer.uniqueId || selectedPlayer.id}</p>
                  </div>
                </div>
                <div className="space-y-3">
                  <Button
                    onClick={confirmPlayerLink}
                    disabled={isLinking}
                    className="w-full bg-green-600 hover:bg-green-700"
                  >
                    {isLinking ? "紐づけ中..." : "この情報で紐づける"}
                  </Button>
                  <Button
                    onClick={() => {
                      setShowConfirmation(false)
                      setSelectedPlayer(null)
                    }}
                    variant="outline"
                    className="w-full"
                    disabled={isLinking}
                  >
                    キャンセル
                  </Button>
                </div>
              </>
            )}
          </div>
        </SheetContent>
      </Sheet>

      <Sheet open={showLinkingSuccessModal} onOpenChange={setShowLinkingSuccessModal}>
        <SheetContent side="right" className="w-96">
          <SheetHeader>
            <SheetTitle className="text-lg text-green-600">紐づけ完了</SheetTitle>
          </SheetHeader>
          <div className="mt-6 space-y-4">
            <div className="text-center">
              <p className="text-sm text-gray-600 mb-4">
                プレイヤーID: {customerAccount?.playerId} と紐づけされました。
              </p>
              <Button
                onClick={() => setShowLinkingSuccessModal(false)}
                className="w-full bg-green-600 hover:bg-green-700"
              >
                閉じる
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  )
}
