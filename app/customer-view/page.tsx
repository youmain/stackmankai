"use client"

import { useState, useEffect, useMemo, useCallback } from "react"
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
} from "@/lib/firestore"
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
import { ChatRoom } from "@/components/chat/chat-room"

// interface RankingData { // lint/suspicious/noRedeclare: This type declaration shadows the imported type 'RankingData'.
//   playerId: string
//   playerName: string
//   totalProfit: number
//   totalGames: number
//   winRate: number
//   lastGameDate: Date | null
//   averageProfit: number
//   maxWin: number
//   maxWinStreak: number
//   currentStreak: number
// }

export default function CustomerView() {
  const { customerAccount, setCustomerAccount, signOut } = useAuth()

  const [viewMode, setViewMode] = useState<"main" | "posts" | "my-posts" | "post-detail" | "ai-players" | "chat">("main")
  const [selectedPostId, setSelectedPostId] = useState<string | null>(null)

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

  // const [showDetailedData, setShowDetailedData] = useState(false)
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

      console.log("[v0] プレイヤー照合チェック:", {
        customerPlayerId: customerAccount?.playerId,
        playerUniqueId: player.uniqueId,
        playerId: player.id,
        playerName: player.name,
        pokerName: player.pokerName,
      })

      const matchConditions = [
        // 1. uniqueIdで照合（数値IDが生成されている場合）
        player.uniqueId && player.uniqueId === customerAccount?.playerId,

        // 2. Firestore IDで照合
        player.id === customerAccount?.playerId,

        // 3. 名前で照合（フォールバック）
        player.name === customerAccount?.playerName,
        player.pokerName === customerAccount?.playerName,
      ]

      const isMatch = matchConditions.some((condition) => condition)

      if (isMatch) {
        console.log("[v0] プレイヤー照合成功:", {
          playerId: player.id,
          playerName: player.name,
          pokerName: player.pokerName,
        })
      }

      return isMatch
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
          console.log("[v0] Updating customerAccount with player info:", {
            storeId: linkedPlayer.storeId,
            playerName: linkedPlayer.name || linkedPlayer.pokerName,
          })
          try {
            const playerName = linkedPlayer.name || linkedPlayer.pokerName || `プレイヤー${linkedPlayer.uniqueId}`
            await updateCustomerAccount(customerAccount.id, {
              storeId: linkedPlayer.storeId,
              storeName: linkedPlayer.storeName || "店舗",
              playerName: playerName,
            })
            // Update local customerAccount state
            setCustomerAccount({
              ...customerAccount,
              storeId: linkedPlayer.storeId,
              storeName: linkedPlayer.storeName || "店舗",
              playerName: playerName,
            })
            console.log("[v0] CustomerAccount updated successfully")
          } catch (error) {
            console.error("[v0] Error updating customerAccount:", error)
          }
        }
      }
    }
    updateStoreIdIfNeeded()
  }, [linkedPlayer, customerAccount])

  useEffect(() => {
    const handlePaymentCompletion = async () => {
      const urlParams = new URLSearchParams(window.location.search)
      const sessionId = urlParams.get("session_id")

      if (sessionId) {
        console.log("[v0] Payment completion detected with session ID:", sessionId)

        // Get pending registration data from sessionStorage
        const pendingRegistration = sessionStorage.getItem("pendingRegistration")
        if (pendingRegistration) {
          try {
            const { email, password } = JSON.parse(pendingRegistration)
            console.log("[v0] Creating customer account after payment completion")

            // Create customer account in Firestore
            const customerId = await createCustomerAccount(email, sessionId, sessionId)

            // Set current customer
            const newCustomer = {
              id: customerId,
              email: email,
              stripeCustomerId: sessionId,
              subscriptionId: sessionId,
              subscriptionStatus: "active" as const,
              createdAt: new Date(),
            }

            // setCustomerAccountを使用
            setCustomerAccount(newCustomer)

            // Clear pending registration data
            sessionStorage.removeItem("pendingRegistration")

            // Clean up URL
            window.history.replaceState({}, document.title, "/customer-view")

            console.log("[v0] Customer account created successfully after payment")
          } catch (error) {
            console.error("[v0] Error creating customer account after payment:", error)
          }
        }
      }
    }

    handlePaymentCompletion()
  }, [])

  useEffect(() => {
    console.log("[v0] Customer View Page - Current Customer State:", currentCustomer)
    console.log("[v0] Customer View Page - Skip Linking State:", skipLinking)
    console.log(
      "[v0] Customer View Page - Should show linking form:",
      currentCustomer && !currentCustomer.playerId && !skipLinking,
    )

    if (customerAccount) {
      sessionStorage.setItem("currentCustomerAccount", JSON.stringify(customerAccount))
      console.log("[v0] customerAccount saved to sessionStorage:", customerAccount)
    }
  }, [currentCustomer, skipLinking, customerAccount])

  const handlePlayerIdLink = async () => {
    if (!playerIdInput.trim()) {
      setLinkingError("プレイヤーIDまたは名前を入力してください")
      return
    }

    console.log("[v0] プレイヤー検索開始:", playerIdInput.trim())
    console.log("[v0] 利用可能なプレイヤー数:", players.length)

    const searchTerm = playerIdInput.trim().toLowerCase()

    const targetPlayer = players.find((player) => {
      const checks = [
        // 1. 完全一致検索
        player.uniqueId === playerIdInput.trim(),
        player.id === playerIdInput.trim(),
        player.name === playerIdInput.trim(),
        player.pokerName === playerIdInput.trim(),

        // 2. 大文字小文字を無視した検索
        player.name?.toLowerCase() === searchTerm,
        player.pokerName?.toLowerCase() === searchTerm,
        player.uniqueId?.toLowerCase() === searchTerm,

        // 3. 部分一致検索（より柔軟）
        player.name
          ?.toLowerCase()
          .includes(searchTerm),
        player.pokerName?.toLowerCase().includes(searchTerm),

        // 4. ひらがな・カタカナの変換を考慮した検索
        player.name?.includes(playerIdInput.trim()),
        player.pokerName?.includes(playerIdInput.trim()),

        // 5. 数値IDの検索（uniqueIdが数値の場合）
        player.uniqueId && playerIdInput.trim().match(/^\d+$/) && player.uniqueId.includes(playerIdInput.trim()),
      ]

      const matchFound = checks.some((check) => check)

      if (matchFound) {
        console.log("[v0] プレイヤー検索成功:", {
          searchTerm: playerIdInput.trim(),
          foundPlayer: {
            id: player.id,
            uniqueId: player.uniqueId,
            name: player.name,
            pokerName: player.pokerName,
          },
        })
      }

      return matchFound
    })

    if (!targetPlayer) {
      console.log("[v0] プレイヤー検索失敗 - 利用可能なプレイヤー例:")
      const availableExamples = players.slice(0, 10).map((player, index) => {
        const info = `${index + 1}. 名前: ${player.name || "未設定"}, ポーカーネーム: ${player.pokerName || "未設定"}, ID: ${player.uniqueId || player.id}`
        console.log(`[v0] ${info}`)
        return info
      })

      setLinkingError(`プレイヤー「${playerIdInput.trim()}」が見つかりません。

以下を確認してください：
• プレイヤー名の正確な入力（例: りゅうさん、あかねちゃん）
• ポーカーネームでの検索
• プレイヤーIDでの検索

利用可能なプレイヤー例：
${availableExamples.slice(0, 5).join("\n")}

※ 他にも多数のプレイヤーが登録されています。正確な名前を店舗で確認してください。`)
      return
    }

    setSelectedPlayer(targetPlayer)
    setShowConfirmation(true)
    setLinkingError("")
  }

  const confirmPlayerLink = async () => {
    if (!selectedPlayer) return

    setIsLinking(true)
    setLinkingError("")

    try {
      const playerIdToSave = selectedPlayer.uniqueId || selectedPlayer.id

      await updateCustomerAccount(customerAccount.id, {
        playerId: playerIdToSave,
        playerName: selectedPlayer.pokerName || selectedPlayer.name,
        linkedAt: new Date(),
      })

      // Update local state
      // customerAccountを更新
      setCustomerAccount({
        ...customerAccount,
        playerId: playerIdToSave,
        playerName: selectedPlayer.pokerName || selectedPlayer.name,
        linkedAt: new Date(),
      })

      setPlayerIdInput("")
      setShowConfirmation(false)
      setSelectedPlayer(null)
      setShowPlayerLinkModal(false)

      if (!skipLinkingAfterSuccess) {
        setShowLinkingSuccessModal(true)
      }
    } catch (error) {
      console.error("[v0] プレイヤーID紐づけエラー:", error)
      setLinkingError("紐づけに失敗しました。もう一度お試しください。")
    } finally {
      setIsLinking(false)
    }
  }

  const handleStatisticsReset = async () => {
    if (!customerAccount?.playerId || !linkedPlayer) return

    setIsResetting(true)
    try {
      await resetPlayerStatistics(linkedPlayer.id, getDisplayName(linkedPlayer))
      setIsResetConfirmOpen(false)

      console.log("[v0] 統計リセット完了 - データ更新中")

      // 成功メッセージを表示
      alert("統計データをリセットしました。貯スタックは保持されています。")

      // データの再読み込みを促すため、少し待ってからページをリフレッシュ
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
    console.log("[v0] 🎯 お客さん専用ランキングページ初期化開始")

    // 認証状態の安定化
    const initializeAuth = () => {
      const currentUserEmail = sessionStorage.getItem("currentUserEmail")
      console.log("[v0] 認証初期化 - 保存されたメール:", currentUserEmail)

      if (currentUserEmail) {
        // メールアドレスが保存されている場合、そのユーザーを優先的に設定
        console.log("[v0] 保存されたメールアドレスでユーザー検索:", currentUserEmail)
      }
    }

    initializeAuth()

    const unsubscribeCustomers = subscribeToCustomerAccounts((customers) => {
      console.log("[v0] 👥 お客さんアカウント同期受信:", customers.length, "件")

      if (customers.length > 0) {
        const currentUserEmail = sessionStorage.getItem("currentUserEmail")
        let targetCustomer = customers[0] // デフォルトは最初の顧客

        // メールアドレスが保存されている場合、該当する顧客を検索
        if (currentUserEmail) {
          const foundCustomer = customers.find((customer) => customer.email === currentUserEmail)
          if (foundCustomer) {
            targetCustomer = foundCustomer
            console.log("[v0] 👤 セッションに基づく顧客選択:", {
              email: currentUserEmail,
              customerId: foundCustomer.id,
            })
          }
        }

        const tempCustomer = {
          ...targetCustomer,
          subscriptionStatus: "active" as const,
        }

        // 現在の顧客と異なる場合のみ更新
        // customerAccountとsetCustomerAccountを使用
        setCustomerAccount((prevCustomer) => {
          if (!prevCustomer || prevCustomer.id !== tempCustomer.id) {
            console.log("[v0] Customer状態更新:", tempCustomer)
            return tempCustomer
          }
          return prevCustomer
        })

        setCustomerAccounts(customers)
      } else {
        setCustomerAccounts(customers)
        // customerAccountをnullに設定
        setCustomerAccount(null)
        console.log("[v0] Customer状態クリア")
      }
      setDataLoaded((prev) => ({ ...prev, customers: true }))
    })

    const storeId = localStorage.getItem("storeId")
    const unsubscribePlayers = subscribeToPlayers((players) => {
      console.log("[v0] 👥 プレイヤー同期受信:", players.length, "人")
      setPlayers(players)
      setDataLoaded((prev) => ({ ...prev, players: true }))
    }, undefined, storeId)

    const unsubscribeDailyRankings = subscribeToDailyRankings((rankings) => {
      console.log("[v0] 📊 日別ランキング同期受信:", rankings.length, "件")
      setDailyRankings(rankings)
      setDataLoaded((prev) => ({ ...prev, dailyRankings: true }))
    }, storeId)

    const unsubscribeMonthlyPoints = subscribeToMonthlyPoints(currentYear, currentMonth, (points) => {
        console.log("[v0] 📈 月間RP同期受信:", points.length, "件")
        setMonthlyPoints(points)
        setDataLoaded((prev) => ({ ...prev, monthlyPoints: true }))
      })

    const unsubscribeStoreSettings = subscribeToStoreRankingSettings((settings) => {
      console.log("[v0] ⚙️ 店舗ランキング設定同期受信:", settings ? "1 件" : "0 件")
      setStoreSettings(settings)
      
      if (settings) {
        // CP率はcashbackPointsSettings.rateのみを使用（RP2倍デーとは獨立）
        const cpRate = settings.cashbackPointsSettings?.rate || 5
        setCurrentRewardRate(cpRate)
      }
      
      setDataLoaded((prev) => ({ ...prev, storeSettings: true }))
    })

    const unsubscribeRakeHistory = subscribeToRakeHistory((history) => {
      console.log("[v0] 📊 レーキ履歴同期受信:", history.length, "件")
      setRakeHistory(history)
    })

    let unsubscribePointHistory: (() => void) | null = null
    if (linkedPlayer?.id) {
      console.log("[v0] ポイント履歴リスナー設定:", linkedPlayer.id)
      unsubscribePointHistory = subscribeToPointHistory(linkedPlayer.id, (history) => {
        console.log("[v0] ポイント履歴受信:", history.length, "件")
        setPointHistory(history)
      })
    } else {
      console.log("[v0] linkedPlayerが未定義のためポイント履歴リスナーをスキップ")
    }


    return () => {
      console.log("[v0] 🔄 リスナークリーンアップ実行")
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
  }, [currentYear, currentMonth, linkedPlayer?.id]) // Add linkedPlayer dependency

  useEffect(() => {
    const allDataLoaded = Object.values(dataLoaded).every((loaded) => loaded)
    if (allDataLoaded && !isLoading) {
      console.log("[v0] ✅ 全データ同期完了 - ローディング終了")
    } else if (allDataLoaded && isLoading) {
      console.log("[v0] ✅ 全データ同期完了 - ローディング終了")
      setIsLoading(false)
    }
  }, [dataLoaded, isLoading])

  // linkedPlayerは上部（136行目）でuseMemoを使って定義済み

  useEffect(() => {
    console.log("[v0] Menu Debug - customerAccount?.playerId:", customerAccount?.playerId)
    console.log("[v0] Menu Debug - customerAccount?.playerName:", customerAccount?.playerName)
    console.log("[v0] Menu Debug - players count:", players.length)
    console.log("[v0] Menu Debug - linkedPlayer found:", !!linkedPlayer)

    if (customerAccount?.playerId && !linkedPlayer) {
      console.log("[v0] プレイヤー照合失敗 - 詳細情報:")
      console.log("- 検索対象ID:", customerAccount.playerId)
      console.log("- 検索対象名前:", customerAccount.playerName)
      console.log("- 利用可能なプレイヤー（最初の5人）:")
      players.slice(0, 5).forEach((player, index) => {
        console.log(
          `[v0] ${index + 1}. ID: ${player.id}, uniqueId: ${player.uniqueId}, name: ${player.name}, pokerName: ${player.pokerName}`,
        )
      })
    }

    if (players.length > 0) {
      console.log("[v0] Menu Debug - first player uniqueId:", players[0].uniqueId)
      console.log("[v0] Menu Debug - sample player data:", {
        id: players[0].id,
        uniqueId: players[0].uniqueId,
        name: players[0].name,
        pokerName: players[0].pokerName,
      })
    }
  }, [customerAccount, players, linkedPlayer])

  const handleDetailedDataClick = () => {
    console.log("[v0] handleDetailedDataClick called")
    console.log("[v0] customerAccount?.playerId:", customerAccount?.playerId)
    console.log("[v0] linkedPlayer:", linkedPlayer)

    if (customerAccount?.playerId && linkedPlayer) {
      console.log("[v0] Conditions met, setting modal data")
      try {
        const displayName = getDisplayName(linkedPlayer)
        console.log("[v0] Display name:", displayName)

        setSelectedPlayerForDetailedData({
          playerId: customerAccount.playerId,
          playerName: displayName,
          player: linkedPlayer,
        })
        console.log("[v0] Modal data set, opening modal")
        setIsDetailedDataModalOpen(true)
        console.log("[v0] Modal opened successfully")
      } catch (error) {
        console.error("[v0] Error in handleDetailedDataClick:", error)
      }
    } else {
      console.log("[v0] Conditions not met - playerId:", customerAccount?.playerId, "linkedPlayer:", !!linkedPlayer)
    }
  }

  const renderSubscriptionStatus = () => {
    if (customerAccount?.playerId && linkedPlayer) {
      const displayName = getDisplayName(linkedPlayer)

      return (
        <div className="mb-4">
          <Alert className="border-green-200 bg-green-50">
            <Trophy className="h-4 w-4" />
            <AlertDescription className="text-green-800">
              <strong>プレイヤー紐づけ完了</strong> - {displayName}として参加中
            </AlertDescription>
          </Alert>
        </div>
      )
    }
    return null
  }

  // 削除: const calculateRankings = ...

  const monthlyGames = useMemo(() => {
    return rakeHistory.filter((game) => {
      const gameDate = game.createdAt instanceof Date ? game.createdAt : game.createdAt.toDate()
      const gameMonth = new Date(gameDate.toISOString().slice(0, 7))
      return gameMonth.getFullYear() === currentDate.getFullYear() && gameMonth.getMonth() === currentDate.getMonth()
    })
  }, [rakeHistory, currentDate])

  const monthlyRankings = useMemo(() => calculateRankings(monthlyGames), [monthlyGames])
  const allTimeRankings = useMemo(() => calculateRankings(rakeHistory), [rakeHistory])

  // getMaxWinRankings, getWinRateRankings, getWinStreakRankings are now imported from "@/lib/utils/ranking-calculator"
  // const getMaxWinRankings = (rankings: RankingData[]) => {
  //   return [...rankings]
  //     .filter((player) => player.maxWin >= 30000) // 3万©以上のみ
  //     .sort((a, b) => b.maxWin - a.maxWin)
  //     .slice(0, 10) // 10位まで
  // }

  // const getWinRateRankings = (rankings: RankingData[]) => {
  //   return [...rankings].filter((player) => player.totalGames >= 3).sort((a, b) => b.winRate - a.winRate)
  // }

  // const getAverageRankings = (rankings: RankingData[]) => {
  //   return [...rankings].filter((player) => player.averageProfit > 0).sort((a, b) => b.averageProfit - a.averageProfit)
  // }

  // const getWinStreakRankings = (rankings: RankingData[]) => {
  //   return [...rankings]
  //     .filter((player) => player.maxWinStreak >= 3) // 3連勝以上のみ
  //     .sort((a, b) => b.maxWinStreak - a.maxWinStreak)
  //     .slice(0, 10) // 10位まで
  // }

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
      gamesCount: playerGames.filter((game) => game.createdAt.toISOString().split("T")[0] === date).length,
    }))
  }

  const handlePlayerClick = (playerId: string, playerName: string) => {
    setSelectedPlayerForChart(playerId)
    setIsChartModalOpen(true)
  }

  // formatMonth and getRankIcon are now imported from "@/lib/utils/formatters"
  // const formatMonth = (monthStr: string) => {
  //   const [year, month] = monthStr.split("-")
  //   return `${year}年${Number.parseInt(month)}月`
  // }

  // const getRankIcon = (index: number) => {
  //   switch (index) {
  //     case 0:
  //       return "🥇"
  //     case 1:
  //       return "🥈"
  //     case 2:
  //       return "🥉"
  //     default:
  //       return `${index + 1}位`
  //   }
  // }

  // プレイ中のプレイヤー
  const playingPlayers = players.filter((player) => player.isPlaying)

  const isDoublePointDay =
    storeSettings?.doublePointDays.some((date) => new Date(date).toISOString().split("T")[0] === today) || false

  // 特別還元率の日判定
  const hasSpecialRate = useMemo(() => {
    if (!storeSettings?.cashbackPointsSettings?.dailyRates) return false
    const todayRate = storeSettings.cashbackPointsSettings.dailyRates[today]
    const baseRate = storeSettings.cashbackPointsSettings.baseRate || 5
    return todayRate !== undefined && todayRate > baseRate
  }, [storeSettings, today])

  const getDoublePointDates = useCallback((): Date[] => {
    if (!storeSettings?.doublePointDays) return []
    return storeSettings.doublePointDays.map((dateStr) => new Date(dateStr))
  }, [storeSettings?.doublePointDays])

  // 今日のランキング取得
  const todayRanking = dailyRankings.find((ranking) => {
    const rankingDate = new Date(ranking.date)
    const today = new Date()
    return rankingDate.toDateString() === today.toDateString()
  })

  const sortedTodayRankings = useMemo(() => {
    if (!todayRanking?.rankings) return []
    
    // 収支（profit）で降順ソート
    return [...todayRanking.rankings].sort((a, b) => b.profit - a.profit)
  }, [todayRanking])

  const monthlyRanking = useMemo(
    () => [...monthlyPoints].sort((a, b) => b.totalPoints - a.totalPoints).slice(0, 10),
    [monthlyPoints],
  )

  // const menuItems = [
  //   { value: "today", label: "今日", icon: Target },
  //   { value: "monthly", label: "月間", icon: TrendingUp },
  //   { value: "winrate", label: "勝率", icon: Percent },
  //   { value: "maxwin", label: "最大勝利", icon: Trophy },
  //   { value: "streak", label: "連勝記録", icon: Zap },
  //   { value: "champions", label: "チャンピオン", icon: Medal },
  // ]

  // const handleTabChange = (value: string) => {
  //   setActiveTab(value)
  // }

  // New function to handle player ID change
  const handlePlayerIdChange = () => {
    setOriginalPlayerData({
      playerId: customerAccount.playerId,
      playerName: customerAccount.playerName,
    })
    setCustomerAccount({ ...customerAccount, playerId: undefined, playerName: undefined })
  }

  const handlePlayerLinkClick = () => {
    console.log("[v0] プレイヤー紐づけボタンクリック")
    setShowPlayerLinkModal(true)
    setSkipLinking(false)
  }

  const playerStats = useMemo(() => {
    if (!customerAccount?.playerId || !linkedPlayer || !rakeHistory.length) return null

    const playerGames = rakeHistory.filter((game) => game.playerId === linkedPlayer.id)
    if (playerGames.length === 0) return null

    const totalProfit = playerGames.reduce((sum, game) => {
      return sum + (game.finalStack - (game.buyIn + game.additionalStack))
    }, 0)

    const wins = playerGames.filter((game) => game.finalStack - (game.buyIn + game.additionalStack) > 0).length
    const winRate = playerGames.length > 0 ? (wins / playerGames.length) * 100 : 0

    const today = new Date().toISOString().split("T")[0]
    const todayGames = playerGames.filter((game) => {
      const gameDate = game.createdAt instanceof Date ? game.createdAt : game.createdAt.toDate()
      return gameDate.toISOString().split("T")[0] === today
    })

    const todayProfit = todayGames.reduce((sum, game) => {
      return sum + (game.finalStack - (game.buyIn + game.additionalStack))
    }, 0)

    return {
      totalGames: playerGames.length,
      totalProfit,
      winRate,
      todayGames: todayGames.length,
      todayProfit,
      averageProfit: playerGames.length > 0 ? totalProfit / playerGames.length : 0,
    }
  }, [customerAccount?.playerId, linkedPlayer, rakeHistory])

  const handleSkipLinkingAfterSuccessChange = (checked: boolean) => {
    setSkipLinkingAfterSuccess(checked)
    if (checked) {
      localStorage.setItem("skipPlayerLinkingSuccess", "true")
    } else {
      localStorage.removeItem("skipPlayerLinkingSuccess")
    }
  }

  const handlePostClick = (postId: string) => {
    setSelectedPostId(postId)
    setViewMode("post-detail")
  }

  const handleBackFromPostDetail = () => {
    setSelectedPostId(null)
    setViewMode("posts")
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <User className="h-8 w-8 text-purple-600" />
                <h1 className="text-xl sm:text-2xl font-bold text-gray-900">
                  {/* currentCustomerの代わりにcustomerAccountを使用 */}
                  {customerAccount?.playerId && linkedPlayer
                    ? `${getDisplayName(linkedPlayer)}さんのデータ`
                    : "マイページ"}
                </h1>
              </div>
            </div>

            {/* Menu Button */}
            <div className="relative">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="flex items-center space-x-2"
              >
                <Menu className="h-4 w-4" />
                <span className="hidden sm:inline">メニュー</span>
              </Button>

              {/* Menu (Sheet) */}
              <Sheet open={isMenuOpen} onOpenChange={setIsMenuOpen}>
                <SheetContent side="right" className="w-80">
                  <SheetHeader>
                    <SheetTitle className="text-lg">メニュー</SheetTitle>
                  </SheetHeader>
                  <div className="mt-6 space-y-3">
                    {/* currentCustomerの代わりにcustomerAccountを使用 */}
                    {customerAccount && (
                      <div className="border-b pb-4 mb-4">
                        <h3 className="text-sm font-medium text-gray-500 mb-3">プレイヤー情報</h3>

                        <div className="mb-3 p-2 bg-gray-50 rounded text-xs">
                          {/* currentCustomerの代わりにcustomerAccountを使用 */}
                          <p>顧客ID: {customerAccount.id}</p>
                          {/* currentCustomerの代わりにcustomerAccountを使用 */}
                          <p>プレイヤーID: {customerAccount.playerId || "未設定"}</p>
                          {/* currentCustomerの代わりにcustomerAccountを使用 */}
                          <p>プレイヤー名: {customerAccount.playerName || "未設定"}</p>
                          <p>紐づけ状態: {linkedPlayer ? "成功" : "失敗"}</p>
                          {linkedPlayer && <p>紐づけプレイヤー: {getDisplayName(linkedPlayer)}</p>}
                        </div>

                        <div className="space-y-2">
                          {/* currentCustomerの代わりにcustomerAccountを使用 */}
                          {customerAccount?.playerId && linkedPlayer ? (
                            <>
                              <Button
                                variant="ghost"
                                className="w-full justify-start text-base py-3"
                                onClick={() => {
                                  handleDetailedDataClick()
                                  setIsMenuOpen(false)
                                }}
                              >
                                <BarChart3 className="h-5 w-5 mr-3" />
                                詳細データを見る
                              </Button>
                              <Button
                                variant="ghost"
                                className="w-full justify-start text-base py-3"
                                onClick={() => {
                                  setViewMode("main")
                                  // ページ内のランキングセクションにスクロール
                                  const rankingSection = document.querySelector("[data-ranking-section]")
                                  if (rankingSection) {
                                    rankingSection.scrollIntoView({ behavior: "smooth", block: "start" })
                                  }
                                  setIsMenuOpen(false)
                                }}
                              >
                                <Trophy className="h-5 w-5 mr-3" />
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
                                <FileText className="h-5 w-5 mr-3" />
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
                                <History className="h-5 w-5 mr-3" />
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
                                <Bot className="h-5 w-5 mr-3" />
                                AIポーカープレイヤー紹介
                              </Button>
                              <Button
                                variant="ghost"
                                className="w-full justify-start text-base py-3"
                                onClick={() => {
                                  setViewMode("chat")
                                  setIsMenuOpen(false)
                                }}
                              >
                                <MessageCircle className="h-5 w-5 mr-3" />
                                チャット
                              </Button>
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
                            </>
                          ) : (
                            <div className="space-y-2">
                              <Alert className="border-orange-200 bg-orange-50">
                                <AlertCircle className="h-4 w-4" />
                                <AlertDescription className="text-orange-800 text-sm">
                                  プレイヤー情報が紐づけられていません。
                                  {/* currentCustomerの代わりにcustomerAccountを使用 */}
                                  {customerAccount?.playerId && "プレイヤーが見つからない可能性があります。"}
                                </AlertDescription>
                              </Alert>
                              {/* プレイヤー紐づけモーダルを表示 */}
                              <Button
                                variant="outline"
                                className="w-full justify-start text-base py-3 bg-transparent"
                                onClick={() => {
                                  handlePlayerLinkClick()
                                  setIsMenuOpen(false)
                                }}
                              >
                                <User className="h-5 w-5 mr-3" />
                                プレイヤー情報を紐づける
                              </Button>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                  <Separator />

                  <Button
                    variant="outline"
                    className="w-full justify-start text-orange-600 hover:text-orange-700 hover:bg-orange-50 bg-transparent"
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
                    className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50 bg-transparent"
                    onClick={() => {
                      // Clear customer data and redirect to landing page
                      // customerAccountをnullに設定し、signOut関数を呼び出す
                      setCustomerAccount(null)
                      signOut()
                      setIsMenuOpen(false)
                      window.location.href = "/"
                    }}
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    ログアウト
                  </Button>
                </SheetContent>
              </Sheet>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* currentCustomerの代わりにcustomerAccountを使用 */}
        {customerAccount?.playerId && linkedPlayer && (
          <>
            {/* プレイヤー情報カード */}
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
                    <p className="text-sm text-gray-600">貯スタック</p>
                    <p className="text-lg font-semibold text-blue-600">
                      {linkedPlayer.systemBalance?.toLocaleString() || 0}©
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">CP (Cashback Points)</p>
                    <p className="text-lg font-semibold text-purple-600">
                      {linkedPlayer.rewardPoints?.toLocaleString() || 0}CP
                    </p>
                    <p className="text-xs text-gray-500">今日のCP率: {currentRewardRate}%</p>
                  </div>
                  {storeSettings?.membershipRankSettings?.enabled && (
                    <div>
                      <p className="text-sm text-gray-600">会員ランク</p>
                      <div className="flex items-center gap-2">
                        {linkedPlayer.membershipRank === "platinum" && (
                          <Badge className="bg-purple-600 text-white">プラチナ</Badge>
                        )}
                        {linkedPlayer.membershipRank === "gold" && (
                          <Badge className="bg-yellow-500 text-white">ゴールド</Badge>
                        )}
                        {linkedPlayer.membershipRank === "silver" && (
                          <Badge className="bg-gray-400 text-white">シルバー</Badge>
                        )}
                        {(!linkedPlayer.membershipRank || linkedPlayer.membershipRank === "none") && (
                          <Badge variant="outline">一般</Badge>
                        )}
                      </div>
                      {linkedPlayer.membershipRank && linkedPlayer.membershipRank !== "none" && linkedPlayer.membershipRank !== "platinum" && (
                        <p className="text-xs text-gray-500 mt-1">
                          次のランクまで: {(() => {
                            const currentRank = linkedPlayer.membershipRank
                            const totalCP = linkedPlayer.totalCPEarned || 0
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
                      {(!linkedPlayer.membershipRank || linkedPlayer.membershipRank === "none") && (
                        <p className="text-xs text-gray-500 mt-1">
                          シルバーまで: {(() => {
                            const totalCP = linkedPlayer.totalCPEarned || 0
                            const required = storeSettings.membershipRankSettings.ranks.silver.requiredCP
                            return `${(required - totalCP).toLocaleString()}CP`
                          })()}
                        </p>
                      )}
                    </div>
                  )}
                  {linkedPlayer.pokerName && (
                    <div>
                      <p className="text-sm text-gray-600">ポーカーネーム</p>
                      <p className="text-lg font-semibold text-purple-600">{linkedPlayer.pokerName}</p>
                    </div>
                  )}
                  <div>
                    <p className="text-sm text-gray-600">ステータス</p>
                    <Badge variant={linkedPlayer.isPlaying ? "default" : "secondary"}>
                      {linkedPlayer.isPlaying ? "プレイ中" : "待機中"}
                    </Badge>
                  </div>
                </div>
                <Button onClick={handleDetailedDataClick} className="w-full bg-blue-600 hover:bg-blue-700">
                  <BarChart3 className="h-4 w-4 mr-2" />
                  詳細データを見る
                </Button>
              </CardContent>
            </Card>

            {pointHistory.length > 0 && (
              <Card className="shadow-md">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
                    <Star className="h-5 w-5 text-purple-500" />
                    CP履歴
                  </CardTitle>
                  <p className="text-sm text-gray-600">
                    現在の保有CP: <span className="font-bold text-purple-600">{linkedPlayer.rewardPoints?.toLocaleString() || 0}CP</span>
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
            )}

            {/* 戦績サマリー */}
            {playerStats && (
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
            )}
          </>
        )}

        {/* プレイ中表示 */}
        <Card className="border-green-200 bg-green-50 shadow-md">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-green-700 text-lg sm:text-xl">
              <Zap className="h-5 w-5" />🎮 現在プレイ中 🎮
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            {playingPlayers.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {playingPlayers.map((player) => (
                  <Badge
                    key={player.id}
                    variant="secondary"
                    className="bg-green-100 text-green-800 px-3 py-2 text-sm sm:text-base"
                  >
                    {player.pokerName || player.name}
                  </Badge>
                ))}
              </div>
            ) : (
              <p className="text-center text-gray-600 py-2">現在プレイ中のプレイヤーはいません</p>
            )}
          </CardContent>
        </Card>

        {viewMode === "main" && (
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
              linkedPlayer.membershipRank &&
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
                      <div className="flex flex-wrap justify-center gap-2 text-sm">
                        {(() => {
                          const rank = linkedPlayer.membershipRank as "silver" | "gold" | "platinum"
                          const benefits = storeSettings.membershipRankSettings.ranks[rank].benefits
                          const items = []
                          if (benefits.cpBoostPercentage > 0) {
                            items.push(
                              <Badge key="cp" className="bg-purple-600 text-white">
                                CP+{benefits.cpBoostPercentage}%
                              </Badge>
                            )
                          }
                          if (benefits.freeDrink) {
                            items.push(
                              <Badge key="drink" className="bg-blue-600 text-white">
                                ワンドリンク無料
                              </Badge>
                            )
                          }
                          if (benefits.freeCharge) {
                            items.push(
                              <Badge key="charge" className="bg-orange-600 text-white">
                                チャージ無料
                              </Badge>
                            )
                          }
                          return items
                        })()}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}



            {/* ランキング表示 */}
            <div data-ranking-section className="space-y-6">
              {/* 今日のランキング */}
                  <Card className="shadow-md">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
                    <Trophy className="h-5 w-5 text-yellow-500" />🏆 今日のRPランキング 🏆
                    {isDoublePointDay && <Badge className="bg-yellow-100 text-yellow-800">2倍デー</Badge>}
                  </CardTitle>
                  <p className="text-sm sm:text-base text-gray-600">
                    売上確定時に確定されます（1位8RP、2位5RP、3位3RP、4位・5位1RP）
                    {isDoublePointDay && <span className="text-yellow-600 font-bold"> ※本日は全RP2倍！</span>}
                  </p>
                </CardHeader>
                <CardContent>
                  {sortedTodayRankings.length > 0 ? (
                    <div className="space-y-3">
                      {sortedTodayRankings.map((ranking, index) => {
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
                                {index === 0 && <Trophy className="h-5 w-5 text-yellow-500" />}
                                {index === 1 && <Medal className="h-5 w-5 text-gray-500" />}
                                {index === 2 && <Award className="h-5 w-5 text-orange-500" />}
                                {index > 2 && <span className="text-sm font-medium">{index + 1}</span>}
                              </div>
                              <span className="font-medium text-lg sm:text-xl">{ranking.playerName}</span>
                            </div>
                            <div className="text-right">
                              <div className="font-bold text-xl sm:text-2xl text-blue-600">{actualPoints}RP</div>
                              {isDoublePointDay && (
                                <div className="text-xs text-yellow-600">(通常{ranking.points}RP × 2)</div>
                              )}
                              <div className={`text-sm sm:text-base font-semibold ${ranking.profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                {ranking.profit >= 0 ? "+" : ""}
                                {ranking.profit.toLocaleString()}©
                              </div>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <Trophy className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                      <p className="text-lg font-medium">今日のランキングはまだ確定していません</p>
                      <p className="text-sm">売上確定時に表示されます</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* 月間ランキング */}
              <Card className="shadow-md">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
                    <TrendingUp className="h-5 w-5 text-blue-500" />📅 {formatMonth(currentMonthStr)}
                    のRPランキング 📅
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {monthlyRanking.length > 0 ? (
                    <div className="space-y-3">
                      {monthlyRanking.map((points, index) => (
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
                              {index === 0 && <Trophy className="h-5 w-5 text-yellow-500" />}
                              {index === 1 && <Medal className="h-5 w-5 text-gray-500" />}
                              {index === 2 && <Award className="h-5 w-5 text-orange-500" />}
                              {index > 2 && <span className="text-sm font-medium">{index + 1}</span>}
                            </div>
                            <span className="font-medium text-lg sm:text-xl">{points.playerName}</span>
                          </div>
                          <div className="text-right">
                            <div className="font-bold text-xl sm:text-2xl text-blue-600">{points.totalPoints}RP</div>
                            {index < 3 && storeSettings && (
                              <div className="text-xs sm:text-sm text-green-600 font-bold">
                                プライズ:{" "}
                                {index === 0
                                  ? storeSettings.monthlyPrizes.first
                                  : index === 1
                                    ? storeSettings.monthlyPrizes.second
                                    : storeSettings.monthlyPrizes.third}
                                ©
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500">月間ランキングデータがありません</div>
                  )}
                </CardContent>
              </Card>

              {/* 勝率ランキング */}
              <Card className="shadow-md">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
                    <Percent className="h-5 w-5 text-green-500" />🎯 勝率ランキング 🎯
                  </CardTitle>
                  <p className="text-sm sm:text-base text-gray-600">※3ゲーム以上参加したプレイヤーのみ表示</p>
                </CardHeader>
                <CardContent>
                  {monthlyRankings.length > 0 ? (
                    <div className="space-y-3">
                      {getWinRateRankings(monthlyRankings).map((player, index) => (
                        <div
                          key={player.playerId}
                          className="flex items-center justify-between p-4 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors shadow-sm"
                          onClick={() => handlePlayerClick(player.playerId, player.playerName)}
                        >
                          <div className="flex items-center gap-3">
                            <span className="text-lg sm:text-xl font-bold w-8">{getRankIcon(index)}</span>
                            <div>
                              <p className="font-medium text-blue-600 hover:underline text-lg sm:text-xl">
                                {player.playerName}
                              </p>
                              <p className="text-sm sm:text-base text-gray-500">{player.totalGames}ゲーム参加</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-lg sm:text-xl font-bold text-green-600">
                              {player.winRate.toFixed(1)}%
                            </div>
                            <div className="text-sm sm:text-base text-gray-500">
                              勝利{Math.round((player.winRate / 100) * player.totalGames)}回
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500">データがありません</div>
                  )}
                </CardContent>
              </Card>

              {/* 最大勝利ランキング */}
              <div className="bg-gradient-to-r from-purple-50 to-pink-50 p-4 rounded-lg border border-purple-200">
                <h2 className="text-lg font-bold text-purple-800 mb-2 flex items-center">
                  <Trophy className="h-5 w-5 mr-2" />🏆 歴代記録 🏆
                </h2>
                <p className="text-sm text-purple-600">全期間を通じた最高記録</p>
              </div>

              <Card className="border-purple-200 shadow-md">
                <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50">
                  <CardTitle className="flex items-center text-purple-800 gap-2 text-lg sm:text-xl">
                    <Target className="h-5 w-5 text-green-500" />💰 1ゲームでの最大勝利©ランキング 💰
                  </CardTitle>
                  <p className="text-sm text-purple-600 mt-2">※ 10位まで、3万©以上の記録のみ表示</p>
                </CardHeader>
                <CardContent>
                  {rakeHistory.length > 0 ? (
                    <div className="space-y-3">
                      {getMaxWinRankings(allTimeRankings).map((player, index) => (
                        <div
                          key={player.playerId}
                          className="flex items-center justify-between p-4 bg-gradient-to-r from-purple-25 to-pink-25 rounded-lg cursor-pointer hover:bg-gradient-to-r hover:from-purple-50 hover:to-pink-50 transition-colors border border-purple-100 shadow-sm"
                          onClick={() => handlePlayerClick(player.playerId, player.playerName)}
                        >
                          <div className="flex items-center gap-3">
                            <span className="text-lg sm:text-xl font-bold w-8 text-purple-700">
                              {getRankIcon(index)}
                            </span>
                            <div>
                              <p className="font-medium text-blue-600 hover:underline text-lg sm:text-xl">
                                {player.playerName}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-lg sm:text-xl font-bold text-green-600">
                              +{player.maxWin.toLocaleString()}©
                            </div>
                            <div className="text-xs sm:text-sm text-purple-600">歴代最高記録</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500">データがありません</div>
                  )}
                </CardContent>
              </Card>

              {/* 連勝記録ランキング */}
              <Card className="border-purple-200 shadow-md">
                <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50">
                  <CardTitle className="flex items-center text-purple-800 gap-2 text-lg sm:text-xl">
                    <Zap className="h-5 w-5 text-orange-500" />🔥 最大連勝ランキング 🔥
                  </CardTitle>
                  <p className="text-sm text-purple-600 mt-1">※ 10位まで、3連勝以上の記録のみ表示</p>
                </CardHeader>
                <CardContent>
                  {rakeHistory.length > 0 ? (
                    <div className="space-y-3">
                      {getWinStreakRankings(allTimeRankings).map((player, index) => (
                        <div
                          key={player.playerId}
                          className="flex items-center justify-between p-4 bg-gradient-to-r from-purple-25 to-pink-25 rounded-lg cursor-pointer hover:bg-gradient-to-r hover:from-purple-50 hover:to-pink-50 transition-colors border border-purple-100 shadow-sm"
                          onClick={() => handlePlayerClick(player.playerId, player.playerName)}
                        >
                          <div className="flex items-center gap-3">
                            <span className="text-lg sm:text-xl font-bold w-8 text-purple-700">
                              {getRankIcon(index)}
                            </span>
                            <div>
                              <p className="font-medium text-blue-600 hover:underline text-lg sm:text-xl">
                                {player.playerName}
                              </p>
                              <p className="text-sm sm:text-base text-gray-500">
                                現在の連勝: {player.currentStreak}ゲーム
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-lg sm:text-xl font-bold text-orange-600">
                              {player.maxWinStreak}連勝
                            </div>
                            <div className="text-xs sm:text-sm text-purple-600">歴代最高記録</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500">データがありません</div>
                  )}
                </CardContent>
              </Card>

              {/* チャンピオン履歴 */}
              <Card className="border-purple-200 shadow-md">
                <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50">
                  <CardTitle className="text-lg sm:text-xl text-purple-800">
                    👑 月間チャンピオン履歴（1位〜3位）👑
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {monthlyPoints.length > 0 ? (
                    <div className="space-y-6">
                      {Array.from(
                        new Set(monthlyPoints.filter((points) => points.month !== currentMonthStr).map((p) => p.month)),
                      )
                        .sort((a, b) => b.localeCompare(a))
                        .map((month) => {
                          const monthData = monthlyPoints
                            .filter((points) => points.month === month)
                            .sort((a, b) => b.totalPoints - a.totalPoints)
                            .slice(0, 3)

                          return (
                            <div key={month} className="space-y-3">
                              <h3 className="font-bold text-lg sm:text-xl text-purple-800 border-b border-purple-200 pb-2">
                                {formatMonth(month)}
                              </h3>
                              {monthData.map((champion, index) => {
                                const player = players.find((p) => p.id === champion.playerId)
                                const rankColors = [
                                  "from-yellow-50 to-orange-50 border-yellow-200",
                                  "from-gray-50 to-slate-50 border-gray-200",
                                  "from-orange-50 to-amber-50 border-orange-200",
                                ]
                                const rankIcons = ["🥇", "🥈", "🥉"]
                                const rankLabels = ["1位", "2位", "3位"]

                                return (
                                  <div
                                    key={champion.playerId}
                                    className={`flex items-center justify-between p-4 bg-gradient-to-r ${rankColors[index]} rounded-lg border shadow-sm`}
                                  >
                                    <div className="flex items-center gap-3">
                                      <span className="text-2xl">{rankIcons[index]}</span>
                                      <div>
                                        <p className="font-bold text-lg sm:text-xl">{rankLabels[index]}</p>
                                        <p className="text-sm sm:text-base text-gray-500">
                                          {champion.gamesPlayed}日参加
                                        </p>
                                      </div>
                                    </div>
                                    <div className="text-right">
                                      <p className="font-bold text-lg sm:text-xl">
                                        {player?.name || champion.playerName}
                                      </p>
                                      <p className="text-lg sm:text-xl font-medium text-blue-600">
                                        {champion.totalPoints}pt
                                      </p>
                                    </div>
                                  </div>
                                )
                              })}
                            </div>
                          )
                        })}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500">月間チャンピオン履歴がありません</div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* ポイント2倍カレンダー */}
            {(() => {
              // getDoublePointDates is now useCallback and imported
              // const getDoublePointDates = (): Date[] => {
              //   if (!storeSettings?.doublePointDays) return []
              //   return storeSettings.doublePointDays.map((dateStr) => new Date(dateStr))
              // }

              return (
                storeSettings &&
                storeSettings.doublePointDays.length > 0 && (
                  <Card className="bg-gradient-to-r from-yellow-50 via-orange-50 to-red-50 border-yellow-300 shadow-lg">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-orange-800 text-lg sm:text-xl">
                        <Star className="h-5 w-5 sm:h-6 sm:w-6" />⚡ RP2倍デー カレンダー ⚡
                      </CardTitle>
                      <p className="text-orange-700 font-medium text-sm sm:text-base">
                        この日はRPが2倍もらえます！
                      </p>
                    </CardHeader>
                    <CardContent>
                      <div className="flex justify-center">
                        <Calendar
                          mode="multiple"
                          selected={getDoublePointDates()}
                          className="rounded-md border border-yellow-200 bg-white"
                          modifiers={{
                            doublePoint: getDoublePointDates(),
                          }}
                          modifiersStyles={{
                            doublePoint: {
                              backgroundColor: "#fef3c7",
                              color: "#92400e",
                              fontWeight: "bold",
                              border: "2px solid #f59e0b",
                            },
                          }}
                        />
                      </div>
                      <div className="text-center mt-4">
                        <p className="text-orange-800 font-bold text-base sm:text-lg">
                          🌟 黄色の日がRP2倍デー！ 🌟
                        </p>
                        <p className="text-orange-600 text-sm sm:text-base">
                          この日に参加すると通常の2倍のRPがもらえます
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                )
              )
            })()}

            {/* プレイヤー紐づけ完了メッセージ */}
            {/* currentCustomerの代わりにcustomerAccountを使用 */}
            {customerAccount?.playerId && linkedPlayer && (
              <Alert className="border-green-200 bg-green-50">
                <Trophy className="h-4 w-4" />
                <AlertDescription className="text-green-800">
                  <strong>プレイヤー紐づけ完了</strong> - {getDisplayName(linkedPlayer)}として参加中
                </AlertDescription>
              </Alert>
            )}

            {/* プレイヤー紐づけがない場合のメッセージ */}
            {/* currentCustomerの代わりにcustomerAccountを使用 */}
            {(!customerAccount?.playerId || !linkedPlayer) && skipLinking && (
              <Alert className="border-orange-200 bg-orange-50">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription className="text-orange-800">
                  {customerAccount?.playerId && !linkedPlayer ? (
                    <>
                      <strong>プレイヤー情報が見つかりません</strong>
                      <br />
                      プレイヤー情報「{customerAccount.playerId}
                      」が登録されていないか、まだ数値IDが生成されていません。店舗で正しい情報を確認してください。
                      <Button
                        variant="link"
                        className="p-0 h-auto text-orange-600 underline ml-2"
                        onClick={() => setSkipLinking(false)}
                      >
                        情報を再入力する
                      </Button>
                    </>
                  ) : (
                    <>
                      プレイヤー情報を紐づけると、個人の詳細データを確認できます。
                      <Button
                        variant="link"
                        className="p-0 h-auto text-orange-600 underline ml-2"
                        onClick={() => setSkipLinking(false)}
                      >
                        今すぐ紐づける
                      </Button>
                    </>
                  )}
                </AlertDescription>
              </Alert>
            )}
          </>
        )}

        {viewMode === "posts" && (
          <Card className="shadow-md">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-2xl font-bold">ハンド記録</CardTitle>
                <Button variant="outline" onClick={() => setViewMode("main")}>
                  戻る
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <PostsList onPostClick={handlePostClick} />
            </CardContent>
          </Card>
        )}

        {viewMode === "my-posts" && <MyPostsList onPostClick={handlePostClick} />}

        {viewMode === "post-detail" && selectedPostId && (
          <PostDetail postId={selectedPostId} onBack={handleBackFromPostDetail} isMemberContext={true} />
        )}
        {viewMode === "ai-players" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-purple-800">AIポーカープレイヤー紹介</h2>
              <Button variant="outline" onClick={() => setViewMode("main")}>
                戻る
              </Button>
            </div>
            <AIPlayersInfo />
          </div>
        )}
        {viewMode === "chat" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-purple-800">チャット</h2>
              <Button variant="outline" onClick={() => setViewMode("main")}>
                戻る
              </Button>
            </div>
            <ChatRoom />
          </div>
        )}
      </div>

      {/* PlayerDetailedDataModal */}
      {isDetailedDataModalOpen && selectedPlayerForDetailedData && (
        <PlayerDetailedDataModal
          isOpen={isDetailedDataModalOpen}
          onClose={() => {
            console.log("[v0] Closing detailed data modal")
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
                    <p>
                      • <strong>復元できません</strong> - 一度削除したデータは元に戻せません
                    </p>
                    <p>
                      • <strong>ランキングに影響しません</strong> - 全体のランキングは変更されません
                    </p>
                    <p>
                      • <strong>貯スタックは保持</strong> - 現在の貯スタック（
                      {linkedPlayer?.systemBalance?.toLocaleString() || 0}©）は削除されません
                    </p>
                  </div>
                </div>
              </AlertDescription>
            </Alert>

            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-semibold text-gray-800 mb-2">削除される統計データ:</h3>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• 購入履歴（バイイン記録）</li>
                <li>• ゲーム履歴（勝敗記録）</li>
                <li>• 個人ランキング履歴</li>
                <li>• 月間ポイント履歴</li>
                <li>• 詳細データの統計情報</li>
              </ul>
            </div>

            <div className="bg-blue-50 p-4 rounded-lg">
              <h3 className="font-semibold text-blue-800 mb-2">保持されるデータ:</h3>
              <ul className="text-sm text-blue-600 space-y-1">
                <li>• 貯スタック（現在: {linkedPlayer?.systemBalance?.toLocaleString() || 0}©）</li>
                <li>• プレイヤー基本情報</li>
                <li>• アカウント紐づけ情報</li>
              </ul>
            </div>

            <div className="space-y-3">
              <Button
                onClick={handleStatisticsReset}
                disabled={isResetting}
                className="w-full bg-red-600 hover:bg-red-700 text-white"
              >
                {isResetting ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    リセット中...
                  </>
                ) : (
                  <>
                    <AlertTriangle className="h-4 w-4 mr-2" />
                    統計データをリセットする
                  </>
                )}
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

            <div className="text-xs text-gray-500 text-center">
              この操作は取り消すことができません。
              <br />
              よく確認してから実行してください。
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
            <Alert className="border-blue-200 bg-blue-50">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="text-blue-800">
                <div className="space-y-2">
                  <p className="font-bold">プレイヤー情報の紐づけ</p>
                  <p className="text-sm">店舗で確認できるプレイヤーIDまたはプレイヤー名を入力してください。</p>
                </div>
              </AlertDescription>
            </Alert>

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
                {isLinking ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    確認中...
                  </>
                ) : (
                  <>
                    <User className="h-4 w-4 mr-2" />
                    プレイヤーを検索
                  </>
                )}
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

            <div className="text-xs text-gray-500">
              <p>※ プレイヤー情報が見つからない場合は、店舗スタッフに確認してください。</p>
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
                <Alert className="border-green-200 bg-green-50">
                  <Trophy className="h-4 w-4" />
                  <AlertDescription className="text-green-800">
                    <div className="space-y-2">
                      <p className="font-bold">プレイヤーが見つかりました</p>
                      <p className="text-sm">以下の情報で紐づけを行います。</p>
                    </div>
                  </AlertDescription>
                </Alert>

                <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                  <div>
                    <p className="text-sm text-gray-600">プレイヤー名</p>
                    <p className="font-semibold">{selectedPlayer.name}</p>
                  </div>
                  {selectedPlayer.pokerName && (
                    <div>
                      <p className="text-sm text-gray-600">ポーカーネーム</p>
                      <p className="font-semibold text-purple-600">{selectedPlayer.pokerName}</p>
                    </div>
                  )}
                  <div>
                    <p className="text-sm text-gray-600">プレイヤーID</p>
                    <p className="font-mono text-sm">{selectedPlayer.uniqueId || selectedPlayer.id}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">貯スタック</p>
                    <p className="font-semibold text-blue-600">
                      {selectedPlayer.systemBalance?.toLocaleString() || 0}©
                    </p>
                  </div>
                </div>

                <div className="space-y-3">
                  <Button
                    onClick={confirmPlayerLink}
                    disabled={isLinking}
                    className="w-full bg-green-600 hover:bg-green-700"
                  >
                    {isLinking ? (
                      <>
                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                        紐づけ中...
                      </>
                    ) : (
                      <>
                        <Trophy className="h-4 w-4 mr-2" />
                        この情報で紐づける
                      </>
                    )}
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
            <Alert className="border-green-200 bg-green-50">
              <Trophy className="h-4 w-4" />
              <AlertDescription className="text-green-800">
                <div className="space-y-2">
                  {/* currentCustomerの代わりにcustomerAccountを使用 */}
                  <p className="font-bold">プレイヤーID: {customerAccount?.playerId}</p>
                  <p className="text-sm">と紐づけされました</p>
                </div>
              </AlertDescription>
            </Alert>

            <div className="text-center">
              <p className="text-sm text-gray-600 mb-4">
                ランキングページにアクセスして、あなたの戦績を確認しましょう！
              </p>
            </div>

            <div className="space-y-3">
              <Button
                onClick={() => setShowLinkingSuccessModal(false)}
                className="w-full bg-green-600 hover:bg-green-700"
              >
                ランキングページへ
              </Button>

              <div className="flex items-center space-x-2 justify-center">
                <input
                  type="checkbox"
                  id="skip-linking-success"
                  checked={skipLinkingAfterSuccess}
                  onChange={(e) => handleSkipLinkingAfterSuccessChange(e.target.checked)}
                  className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <label htmlFor="skip-linking-success" className="text-sm text-gray-600 cursor-pointer">
                  次回から表示しない
                </label>
              </div>
              <p className="text-xs text-gray-500 text-center">
                チェックすると、今後は紐づけ完了後に直接ランキングページに移動します
              </p>
            </div>
          </div>
        </SheetContent>
      </Sheet>

      {/* アカウント削除確認ダイアログ */}
      <Sheet open={isCancelConfirmOpen} onOpenChange={setIsCancelConfirmOpen}>
        <SheetContent side="bottom" className="h-auto">
          <SheetHeader>
            <SheetTitle className="text-red-600 flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              スタックマン解約の確認
            </SheetTitle>
          </SheetHeader>
          <div className="py-6 space-y-4">
            <Alert className="border-red-200 bg-red-50">
              <AlertTriangle className="h-4 w-4 text-red-600" />
              <AlertDescription className="text-red-800">
                <p className="font-bold mb-2">解約すると以下のデータが削除されます：</p>
                <ul className="list-disc list-inside space-y-1">
                  <li>CP残高：{linkedPlayer?.rewardPoints?.toLocaleString() || 0}CP</li>
                  <li>獲得CP総額：{linkedPlayer?.totalCPEarned?.toLocaleString() || 0}CP</li>
                  <li>会員ランク：
                    {linkedPlayer?.membershipRank === "platinum" && "プラチナ"}
                    {linkedPlayer?.membershipRank === "gold" && "ゴールド"}
                    {linkedPlayer?.membershipRank === "silver" && "シルバー"}
                    {(!linkedPlayer?.membershipRank || linkedPlayer?.membershipRank === "none") && "一般"}
                  </li>
                </ul>
                <p className="font-bold mt-3 text-red-900">ゲーム履歴やプレイヤー情報は保持されますが、CP関連データは失われます。</p>
                <p className="font-bold mt-1 text-red-900">この操作は取り消せません。</p>
              </AlertDescription>
            </Alert>

            <div className="flex gap-3">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setIsCancelConfirmOpen(false)}
                disabled={isCancelling}
              >
                キャンセル
              </Button>
              <Button
                variant="destructive"
                className="flex-1"
                onClick={async () => {
                  if (!linkedPlayer?.id) return
                  setIsCancelling(true)
                  try {
                    await cancelPlayerAccount(linkedPlayer.id)
                    alert("スタックマンを解約しました。CP関連データが削除されました。")
                    setCustomerAccount(null)
                    signOut()
                    window.location.href = "/"
                  } catch (error) {
                    console.error("Account cancellation error:", error)
                    alert("解約処理に失敗しました。")
                  } finally {
                    setIsCancelling(false)
                    setIsCancelConfirmOpen(false)
                  }
                }}
                disabled={isCancelling}
              >
                {isCancelling ? "削除中..." : "削除する"}
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  )
}
