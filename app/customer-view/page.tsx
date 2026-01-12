"use client"

import { useState, useEffect, useMemo, useCallback, useRef } from "react"
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
  updateCustomerAccount,
  createCustomerAccount,
  resetPlayerStatistics,
  subscribeToPointHistory,
  cancelPlayerAccount,
  updatePlayer,
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
import { ChatRoomDualMode } from "@/components/chat/chat-room-dual-mode"

export default function CustomerView() {
  const { customerAccount, setCustomerAccount, signOut, loading: authLoading, refreshCustomerAccount } = useAuth()
  const router = useRouter()

  const [viewMode, setViewMode] = useState<"main" | "posts" | "my-posts" | "post-detail" | "ai-players" | "chat">("main")
  const [selectedPostId, setSelectedPostId] = useState<string | null>(null)

  const isMounted = useRef(true);

  useEffect(() => {
    return () => {
      isMounted.current = false;
    };
  }, []);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search)
    if (urlParams.get("forceReset") === "true" && customerAccount?.storeId) {
      const storageKey = `pokerGameId_${customerAccount.storeId}`
      localStorage.removeItem(storageKey)
      urlParams.delete("forceReset")
      const newUrl = window.location.pathname + (urlParams.toString() ? "?" + urlParams.toString() : "")
      window.location.href = newUrl
    }
  }, [customerAccount?.storeId])

  useEffect(() => {
    const saved = localStorage.getItem("customerViewMode")
    if (saved === "chat" || saved === "posts" || saved === "my-posts" || saved === "ai-players") {
      setViewMode(saved)
    }
    
    const urlParams = new URLSearchParams(window.location.search)
    const viewModeParam = urlParams.get("viewMode")
    if (viewModeParam === "chat" || viewModeParam === "posts" || viewModeParam === "my-posts" || viewModeParam === "ai-players") {
      setViewMode(viewModeParam)
    }
  }, [])

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
  const [currentRewardRate, setCurrentRewardRate] = useState<number>(5)

  const [isLoading, setIsLoading] = useState(true)

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
  const currentMonthStr = currentDate.toISOString().slice(0, 7)
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

  const linkedPlayer = useMemo(() => {
    if (!customerAccount?.playerId) return undefined;
    return players.find((player) => {
      const matchConditions = [
        player.uniqueId && player.uniqueId === customerAccount?.playerId,
        player.id === customerAccount?.playerId,
        player.name === customerAccount?.playerName,
        player.pokerName === customerAccount?.playerName,
      ];
      return matchConditions.some((condition) => condition);
    });
  }, [players, customerAccount]);

  useEffect(() => {
    const updateStoreIdIfNeeded = async () => {
      if (linkedPlayer && customerAccount?.id) {
        const hasInvalidPlayerName = customerAccount.playerName?.startsWith("プレイヤー") || !customerAccount.playerName
        const needsUpdate = !customerAccount.storeId || hasInvalidPlayerName
        
        if (needsUpdate && linkedPlayer.storeId) {
          try {
            const playerName = linkedPlayer.name || linkedPlayer.pokerName || `プレイヤー${linkedPlayer.uniqueId}`
            const storeName = linkedPlayer.storeName || "未設定"
            
            await updateCustomerAccount(customerAccount.id, {
              storeId: linkedPlayer.storeId,
              storeName: storeName,
              playerName: playerName,
            })
            if (isMounted.current) {
              setCustomerAccount(prev => prev ? { ...prev, storeId: linkedPlayer.storeId, storeName: storeName, playerName: playerName } : null)
            }
          } catch (error) {
            console.error("[v0] Error updating customerAccount:", error)
          }
        }
      }
    }
    updateStoreIdIfNeeded()
  }, [linkedPlayer, customerAccount, setCustomerAccount])

  useEffect(() => {
    const handlePaymentCompletion = async () => {
      const urlParams = new URLSearchParams(window.location.search)
      const sessionId = urlParams.get("session_id")

      if (sessionId) {
        const pendingRegistration = sessionStorage.getItem("pendingRegistration")
        if (pendingRegistration) {
          try {
            const { email, password } = JSON.parse(pendingRegistration)
            const customerId = await createCustomerAccount(email, sessionId, sessionId)
            const newCustomer = {
              id: customerId,
              email: email,
              stripeCustomerId: sessionId,
              subscriptionId: sessionId,
              subscriptionStatus: "active" as const,
              createdAt: new Date(),
              updatedAt: new Date(),
              lastLogin: new Date(),
              stapokaBalance: 0,
              systemBalance: 0,
            }
            if (isMounted.current) {
              setCustomerAccount(newCustomer)
            }
            sessionStorage.removeItem("pendingRegistration")
            router.replace("/customer-view")
          } catch (error) {
            console.error("[v0] Error creating customer account after payment:", error)
          }
        }
      }
    }
    handlePaymentCompletion()
  }, [router, setCustomerAccount])

  useEffect(() => {
    if (authLoading) return
    if (!customerAccount) {
      router.push("/login")
      return
    }

    const currentCustomer = customerAccount; // ローカル変数にコピーして参照の安定性を確保

    const unsubscribes: (() => void)[] = []

    if (currentCustomer.storeId !== undefined) {
      unsubscribes.push(subscribeToPlayers(currentCustomer.storeId, setPlayers))
      unsubscribes.push(subscribeToDailyRankings(currentCustomer.storeId, setDailyRankings))
      // unsubscribes.push(subscribeToMonthlyPoints(currentCustomer.storeId, setMonthlyPoints)) // FirebaseError の原因となるため一時的にコメントアウト
      unsubscribes.push(subscribeToStoreRankingSettings(currentCustomer.storeId, setStoreSettings))
      unsubscribes.push(subscribeToRakeHistory(currentCustomer.storeId, setRakeHistory))
    }

    if (currentCustomer.id !== undefined) { // ローカル変数を使用
      unsubscribes.push(subscribeToPointHistory(currentCustomer.id, setPointHistory))
    }

    return () => {
      unsubscribes.forEach(unsub => typeof unsub === 'function' && unsub())
    }
  }, [authLoading, customerAccount, router])

  const handleLinkPlayer = async () => {
    if (!playerIdInput.trim()) {
      setLinkingError("プレイヤーIDを入力してください。")
      return
    }
    if (!customerAccount?.id) {
      setLinkingError("ログイン情報が見つかりません。再ログインしてください。")
      return
    }

    setIsLinking(true)
    setLinkingError("")

    const targetPlayer = players.find(
      (p) => p.id === playerIdInput.trim() || p.uniqueId === playerIdInput.trim()
    )

    if (targetPlayer) {
      try {
        await updateCustomerAccount(customerAccount.id, {
          playerId: targetPlayer.uniqueId,
          playerName: targetPlayer.name || targetPlayer.pokerName,
          storeId: targetPlayer.storeId,
          storeName: targetPlayer.storeName,
        })
        if (isMounted.current) {
          setCustomerAccount(prev => prev ? { 
            ...prev, 
            playerId: targetPlayer.uniqueId, 
            playerName: targetPlayer.name || targetPlayer.pokerName, 
            storeId: targetPlayer.storeId, 
            storeName: targetPlayer.storeName 
          } : null)
        }
        setShowLinkingSuccessModal(true)
      } catch (error) {
        setLinkingError("連携処理中にエラーが発生しました。")
      }
    } else {
      setLinkingError("指定されたIDのプレイヤーが見つかりません。")
    }
    setIsLinking(false)
  }

  const handleSkipLinking = () => {
    setSkipLinking(true)
    setShowPlayerIdForm(false)
  }

  const handleLogout = async () => {
    await signOut()
    router.push("/login")
  }

  const handleResetStats = async () => {
    if (linkedPlayer) {
      setIsResetting(true)
      await resetPlayerStatistics(linkedPlayer.id)
      setIsResetting(false)
      setIsResetConfirmOpen(false)
    }
  }

  const handleCancelAccount = async () => {
    if (customerAccount?.id) {
      setIsCancelling(true)
      await cancelPlayerAccount(customerAccount.id)
      setIsCancelling(false)
      setIsCancelConfirmOpen(false)
      await signOut()
      router.push("/login")
    }
  }

  const handlePlayerNameChange = async (newName: string) => {
    if (linkedPlayer) {
      await updatePlayer(linkedPlayer.id, { pokerName: newName })
      if (customerAccount?.id) {
        await updateCustomerAccount(customerAccount.id, { playerName: newName })
        if (isMounted.current) {
          setCustomerAccount(prev => prev ? { ...prev, playerName: newName } : null)
        }
      }
    }
  }

  const memoizedRankings = useMemo(() => {
    return calculateRankings(players)
  }, [players])

  const memoizedWinRateRankings = useMemo(() => {
    return getWinRateRankings(players)
  }, [players])

  const memoizedMaxWinRankings = useMemo(() => {
    return getMaxWinRankings(players)
  }, [players])

  const memoizedWinStreakRankings = useMemo(() => {
    return getWinStreakRankings(players)
  }, [players])

  const currentRanking = useMemo(() => {
    if (!linkedPlayer) return null
    const rankData = memoizedRankings.find((r) => r.playerId === linkedPlayer.uniqueId)
    return rankData ? { ...rankData, rank: memoizedRankings.indexOf(rankData) + 1 } : null
  }, [memoizedRankings, linkedPlayer])

  const currentWinRateRanking = useMemo(() => {
    if (!linkedPlayer) return null
    const rankData = memoizedWinRateRankings.find((r) => r.playerId === linkedPlayer.uniqueId)
    return rankData ? { ...rankData, rank: memoizedWinRateRankings.indexOf(rankData) + 1 } : null
  }, [memoizedWinRateRankings, linkedPlayer])

  const currentMaxWinRanking = useMemo(() => {
    if (!linkedPlayer) return null
    const rankData = memoizedMaxWinRankings.find((r) => r.playerId === linkedPlayer.uniqueId)
    return rankData ? { ...rankData, rank: memoizedMaxWinRankings.indexOf(rankData) + 1 } : null
  }, [memoizedMaxWinRankings, linkedPlayer])

  const currentWinStreakRanking = useMemo(() => {
    if (!linkedPlayer) return null
    const rankData = memoizedWinStreakRankings.find((r) => r.playerId === linkedPlayer.uniqueId)
    return rankData ? { ...rankData, rank: memoizedWinStreakRankings.indexOf(rankData) + 1 } : null
  }, [memoizedWinStreakRankings, linkedPlayer])

  const currentMonthPoints = useMemo(() => {
    if (!linkedPlayer) return null
    return monthlyPoints.find((p) => p.playerId === linkedPlayer.uniqueId)
  }, [monthlyPoints, linkedPlayer])

  const sortedDailyRankings = useMemo(() => {
    return [...dailyRankings].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
  }, [dailyRankings])

  const handleDateChange = (date: Date | undefined) => {
    if (date) {
      const dateString = date.toISOString().split("T")[0]
      const ranking = dailyRankings.find((r) => r.date === dateString)
      if (ranking) {
        // Show ranking details
      }
    }
  }

  const renderRankingList = (rankings: any[], title: string, keyPrefix: string) => (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <ol className="space-y-2">
          {rankings.slice(0, 10).map((player, index) => (
            <li key={`${keyPrefix}-${player.playerId}`} className="flex items-center justify-between">
              <span className="flex items-center">
                <span className="w-6 text-center">{getRankIcon(index + 1)}</span>
                {player.playerName}
              </span>
              <span>{player.value}</span>
            </li>
          ))}
        </ol>
      </CardContent>
    </Card>
  )

  if (authLoading || isLoading) {
    return <div className="flex h-screen items-center justify-center">読み込み中...</div>
  }

  if (!customerAccount) {
    return null // or a loading spinner
  }

  if (!customerAccount.playerId && !skipLinking) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-100">
        <Card className="w-full max-w-md p-6">
          <CardHeader>
            <CardTitle className="text-center">プレイヤー情報連携</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="mb-4 text-center text-sm text-gray-600">
              あなたのプレイヤー情報を連携してください。店舗で伝えられたプレイヤーIDを入力してください。
            </p>
            <input
              type="text"
              value={playerIdInput}
              onChange={(e) => setPlayerIdInput(e.target.value)}
              placeholder="プレイヤーID"
              className="w-full rounded-md border p-2"
            />
            {linkingError && <p className="mt-2 text-center text-sm text-red-500">{linkingError}</p>}
            <Button onClick={handleLinkPlayer} disabled={isLinking} className="mt-4 w-full">
              {isLinking ? "連携中..." : "連携する"}
            </Button>
            <Button variant="link" onClick={handleSkipLinking} className="mt-2 w-full">
              今は連携しない
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="sticky top-0 z-40 bg-white shadow-sm">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <div className="flex items-center">
            <Button variant="ghost" size="icon" onClick={() => setIsMenuOpen(true)}>
              <Menu className="h-6 w-6" />
            </Button>
            <h1 className="ml-4 text-xl font-bold">{customerAccount.storeName || "プレイヤー情報"}</h1>
          </div>
          <div className="flex items-center space-x-4">
            <span className="font-semibold">{customerAccount.playerName || "ゲスト"}</span>
            <User className="h-6 w-6" />
          </div>
        </div>
      </header>

      <Sheet open={isMenuOpen} onOpenChange={setIsMenuOpen}>
        <SheetContent side="left">
          <SheetHeader>
            <SheetTitle>メニュー</SheetTitle>
          </SheetHeader>
          <div className="mt-4 flex flex-col space-y-2">
            <Button variant={viewMode === 'main' ? 'secondary' : 'ghost'} onClick={() => { setViewMode('main'); setIsMenuOpen(false); }}>
              <User className="mr-2 h-4 w-4" /> マイページ
            </Button>
            <Button variant={viewMode === 'posts' ? 'secondary' : 'ghost'} onClick={() => { setViewMode('posts'); setIsMenuOpen(false); }}>
              <FileText className="mr-2 h-4 w-4" /> みんなの投稿
            </Button>
            <Button variant={viewMode === 'my-posts' ? 'secondary' : 'ghost'} onClick={() => { setViewMode('my-posts'); setIsMenuOpen(false); }}>
              <History className="mr-2 h-4 w-4" /> 自分の投稿
            </Button>
            <Button variant={viewMode === 'ai-players' ? 'secondary' : 'ghost'} onClick={() => { setViewMode('ai-players'); setIsMenuOpen(false); }}>
              <Bot className="mr-2 h-4 w-4" /> AIプレイヤー
            </Button>
            <Button variant={viewMode === 'chat' ? 'secondary' : 'ghost'} onClick={() => { setViewMode('chat'); setIsMenuOpen(false); }}>
              <MessageCircle className="mr-2 h-4 w-4" /> チャット＆ポーカー
            </Button>
            <Button variant="ghost" onClick={() => router.push('/stack-man-hand/purchase')}>
              <Gift className="mr-2 h-4 w-4" /> スタックマンハンド購入
            </Button>
            <Separator />
            <Button variant="ghost" onClick={handleLogout}>
              <LogOut className="mr-2 h-4 w-4" /> ログアウト
            </Button>
          </div>
        </SheetContent>
      </Sheet>

      <main className="container mx-auto p-4">
        {viewMode === "main" && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>あなたの情報</span>
                  <RefreshCw className="h-5 w-5 cursor-pointer text-gray-500" onClick={refreshCustomerAccount} />
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="font-medium">プレイヤー名</span>
                  <span className="font-semibold">{customerAccount.playerName || "ゲスト"}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-medium">スタポカ貯スタック</span>
                  <span className="font-semibold">{customerAccount?.stapokaBalance?.toLocaleString() || 0}💰</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-medium">顧客ID</span>
                  <span className="text-sm text-gray-500">{customerAccount?.id || "N/A"}</span> {/* Guard added here */}
                </div>
              </CardContent>
            </Card>

            {linkedPlayer && (
              <>
                <Card>
                  <CardHeader>
                    <CardTitle>今日の成績</CardTitle>
                  </CardHeader>
                  <CardContent className="grid grid-cols-2 gap-4">
                    <div className="flex flex-col items-center rounded-lg bg-gray-100 p-4">
                      <span className="text-sm font-medium text-gray-600">収支</span>
                      <span className={`text-2xl font-bold ${currentRanking?.totalProfit ?? 0 >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {currentRanking?.totalProfit?.toLocaleString() || 0}
                      </span>
                    </div>
                    <div className="flex flex-col items-center rounded-lg bg-gray-100 p-4">
                      <span className="text-sm font-medium text-gray-600">ゲーム数</span>
                      <span className="text-2xl font-bold">{currentRanking?.totalGames || 0}</span>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>ランキング</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">総合ランキング</span>
                      <Badge variant="secondary">{currentRanking ? `${currentRanking.rank}位` : "ランク外"}</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="font-medium">勝率ランキング</span>
                      <Badge variant="secondary">{currentWinRateRanking ? `${currentWinRateRanking.rank}位` : "ランク外"}</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="font-medium">最大獲得ランキング</span>
                      <Badge variant="secondary">{currentMaxWinRanking ? `${currentMaxWinRanking.rank}位` : "ランク外"}</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="font-medium">連勝記録ランキング</span>
                      <Badge variant="secondary">{currentWinStreakRanking ? `${currentWinStreakRanking.rank}位` : "ランク外"}</Badge>
                    </div>
                  </CardContent>
                </Card>
              </>
            )}

            <Card>
              <CardHeader>
                <CardTitle>デイリーランキング</CardTitle>
              </CardHeader>
              <CardContent>
                <Calendar
                  mode="single"
                  selected={new Date()}
                  onSelect={handleDateChange}
                  className="rounded-md border"
                  modifiers={{
                    ranked: dailyRankings.map(r => new Date(r.date))
                  }}
                  modifiersClassNames={{
                    ranked: 'bg-blue-100'
                  }}
                />
              </CardContent>
            </Card>
          </div>
        )}

        {viewMode === "posts" && <PostsList onPostSelect={setSelectedPostId} setViewMode={setViewMode} />}
        {viewMode === "my-posts" && <MyPostsList onPostSelect={setSelectedPostId} setViewMode={setViewMode} />}
        {viewMode === "post-detail" && selectedPostId && <PostDetail postId={selectedPostId} onBack={() => setViewMode('posts')} />}
        {viewMode === "ai-players" && <AIPlayersInfo />}
        {viewMode === "chat" && <ChatRoomDualMode />}

      </main>

      {showLinkingSuccessModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>連携成功！</CardTitle>
            </CardHeader>
            <CardContent>
              <p>プレイヤー情報との連携が完了しました。</p>
              <div className="mt-4 flex items-center">
                <input
                  type="checkbox"
                  id="skip-success"
                  checked={skipLinkingAfterSuccess}
                  onChange={(e) => {
                    setSkipLinkingAfterSuccess(e.target.checked)
                    localStorage.setItem("skipPlayerLinkingSuccess", e.target.checked.toString())
                  }}
                  className="mr-2"
                />
                <label htmlFor="skip-success">次回からこの画面を表示しない</label>
              </div>
              <Button onClick={() => setShowLinkingSuccessModal(false)} className="mt-4 w-full">
                閉じる
              </Button>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
