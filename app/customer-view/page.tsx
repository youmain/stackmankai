"use client"

import { useState, useEffect, useMemo } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/contexts/auth-context"
import { 
  Trophy, Medal, Award, TrendingUp, Target, Zap, BarChart3, 
  Percent, Star, Menu, AlertCircle, RefreshCw, LogOut, 
  User, FileText, History, Gift, MessageCircle, Calendar, Wallet
} from 'lucide-react'
import {
  subscribeToPlayers,
  subscribeToDailyRankings,
  subscribeToMonthlyPoints,
  subscribeToPointHistory,
  subscribeToRakeHistory
} from "@/lib/firestore"
import { getDb } from "@/lib/firebase"
import { doc, getDoc } from "firebase/firestore"
import type { Player, DailyRanking, MonthlyPoints, StoreRankingSettings, RakeHistory, PointHistory } from "@/types"
import PlayerDetailedDataModal from "@/components/player-detailed-data-modal"
import { formatMonth, getRankIcon } from "@/lib/utils/formatters"

export default function CustomerView() {
  const { customerAccount, signOut, loading, user } = useAuth()
  const router = useRouter()

  // 状態管理
  const [players, setPlayers] = useState<Player[]>([])
  const [dailyRankings, setDailyRankings] = useState<DailyRanking[]>([])
  const [monthlyPoints, setMonthlyPoints] = useState<MonthlyPoints[]>([])
  const [storeSettings, setStoreSettings] = useState<StoreRankingSettings | null>(null)
  const [rakeHistory, setRakeHistory] = useState<RakeHistory[]>([])
  const [pointHistory, setPointHistory] = useState<PointHistory[]>([])
  const [isDetailedDataModalOpen, setIsDetailedDataModalOpen] = useState(false)
  const [isLoadingData, setIsLoadingData] = useState(true)

  const currentDate = new Date()
  const currentYear = currentDate.getFullYear()
  const currentMonth = currentDate.getMonth() + 1
  const todayStr = currentDate.toISOString().split("T")[0]

  // プレイヤー紐づけロジック
  const linkedPlayer = useMemo(() => {
    if (!players || players.length === 0) return null
    
    if (customerAccount?.playerId) {
      const targetId = String(customerAccount.playerId).trim()
      const found = players.find(p => 
        String(p.id || "").trim() === targetId || 
        String(p.uniqueId || "").trim() === targetId
      )
      if (found) return found
    }

    const searchNames = [
      customerAccount?.playerName,
      (customerAccount as any)?.displayName,
      user?.displayName,
      (user as any)?.playerName
    ].filter(Boolean).map(n => String(n).trim())

    if (searchNames.length > 0) {
      const found = players.find(p => 
        searchNames.includes(String(p.name || "").trim()) || 
        searchNames.includes(String(p.pokerName || "").trim())
      )
      if (found) return found
    }

    return null
  }, [players, customerAccount, user])

  // データ購読
  useEffect(() => {
    const storeId = customerAccount?.storeId || "king-high-store"
    
    const unsubscribePlayers = subscribeToPlayers((data) => {
      setPlayers(data)
    })

    const unsubscribeDailyRankings = subscribeToDailyRankings((data) => {
      setDailyRankings(data)
    }, storeId)

    const unsubscribeMonthlyPoints = subscribeToMonthlyPoints(currentYear, currentMonth, (data) => {
      setMonthlyPoints(data)
    })

    const fetchStoreSettings = async () => {
      try {
        const db = getDb()
        if (!db) return
        const settingsDoc = await getDoc(doc(db, "storeRankingSettings", "default"))
        if (settingsDoc.exists()) {
          setStoreSettings(settingsDoc.data() as StoreRankingSettings)
        }
      } catch (error) {
        console.error("Error fetching store settings:", error)
      }
    }
    fetchStoreSettings()

    const unsubscribeRakeHistory = subscribeToRakeHistory((data) => {
      setRakeHistory(data)
    })

    setIsLoadingData(false)

    return () => {
      unsubscribePlayers?.()
      unsubscribeDailyRankings?.()
      unsubscribeMonthlyPoints?.()
      unsubscribeRakeHistory?.()
    }
  }, [customerAccount?.storeId, currentYear, currentMonth])

  // ポイント履歴の購読（linkedPlayer確定後）
  useEffect(() => {
    if (linkedPlayer?.id) {
      const unsubscribePointHistory = subscribeToPointHistory(linkedPlayer.id, (data) => {
        setPointHistory(data as PointHistory[])
      })
      return () => unsubscribePointHistory?.()
    }
  }, [linkedPlayer?.id])

  // 今日のランキング計算
  const sortedTodayRankings = useMemo(() => {
    const todayRanking = dailyRankings.find(r => r.date === todayStr)
    if (!todayRanking) return []
    return [...todayRanking.rankings].sort((a, b) => b.profit - a.profit).slice(0, 5)
  }, [dailyRankings, todayStr])

  // 月間ランキング計算
  const sortedMonthlyRankings = useMemo(() => {
    return [...monthlyPoints].sort((a, b) => b.totalPoints - a.totalPoints).slice(0, 10)
  }, [monthlyPoints])

  // 2倍デー判定
  const isDoublePointDay = useMemo(() => {
    return storeSettings?.doublePointDays?.includes(todayStr) || false
  }, [storeSettings, todayStr])

  const handleSignOut = async () => {
    try {
      await signOut()
      router.push("/customer-auth")
    } catch (error) {
      console.error("Sign out error:", error)
    }
  }

  if (loading || isLoadingData) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-gray-50">
        <RefreshCw className="h-8 w-8 text-blue-600 animate-spin mb-4" />
        <p className="text-gray-600 font-medium">データを読み込み中...</p>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50 p-4">
        <Card className="w-full max-w-md shadow-xl border-none">
          <CardHeader className="text-center pb-2">
            <CardTitle className="text-2xl font-bold text-gray-800">ログインが必要です</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center gap-6 pt-4">
            <div className="bg-blue-50 p-4 rounded-full">
              <User className="h-12 w-12 text-blue-600" />
            </div>
            <p className="text-gray-600 text-center leading-relaxed">
              プレイヤーダッシュボードを表示するには、<br/>アカウントにログインしてください。
            </p>
            <Button
              onClick={() => router.push("/customer-auth")}
              className="w-full py-6 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-lg shadow-lg transition-all"
            >
              ログインページへ
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* ヘッダー */}
      <header className="bg-white border-b sticky top-0 z-30 px-4 py-4 shadow-sm">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="bg-blue-600 p-1.5 rounded-lg">
              <Trophy className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-gray-900 leading-none">Stack Man Kai</h1>
              <p className="text-[10px] text-gray-500 mt-1 font-medium">Player Dashboard</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right hidden sm:block">
              <p className="text-xs font-bold text-gray-800">{linkedPlayer?.name || user.email}</p>
              <p className="text-[10px] text-gray-500">ログイン中</p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleSignOut}
              className="text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-full"
            >
              <LogOut className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto p-4 space-y-6">
        {/* プレイヤー情報メインカード */}
        <Card className="overflow-hidden border-none shadow-xl bg-white rounded-3xl">
          <div className="bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-700 p-6 text-white relative overflow-hidden">
            <div className="absolute top-0 right-0 -mt-4 -mr-4 w-32 h-32 bg-white/10 rounded-full blur-3xl"></div>
            <div className="absolute bottom-0 left-0 -mb-8 -ml-8 w-40 h-40 bg-purple-500/20 rounded-full blur-3xl"></div>
            
            <div className="flex justify-between items-start relative z-10">
              <div className="flex items-center gap-4">
                <div className="bg-white/20 backdrop-blur-md p-3 rounded-2xl border border-white/30 shadow-inner">
                  <User className="h-8 w-8 text-white" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-2xl font-black tracking-tight">
                      {linkedPlayer?.name || linkedPlayer?.pokerName || user.displayName || "ゲスト"}
                    </h2>
                    {linkedPlayer?.membershipRank && linkedPlayer.membershipRank !== "none" && (
                      <Badge className="bg-yellow-400 text-yellow-900 border-none font-bold text-[10px] px-2 py-0.5">
                        {linkedPlayer.membershipRank.toUpperCase()}
                      </Badge>
                    )}
                  </div>
                  <p className="text-blue-100 text-xs font-medium mt-1 flex items-center gap-1">
                    <Star className="h-3 w-3 fill-blue-200" />
                    {linkedPlayer?.storeName || "ホーム店舗未設定"}
                  </p>
                </div>
              </div>
              <Button 
                variant="ghost" 
                size="sm" 
                className="bg-white/10 hover:bg-white/20 text-white border-none rounded-xl text-xs font-bold"
                onClick={() => setIsDetailedDataModalOpen(true)}
              >
                <BarChart3 className="h-4 w-4 mr-1" />
                詳細分析
              </Button>
            </div>
          </div>
          
          <CardContent className="p-0">
            <div className="grid grid-cols-2 divide-x divide-gray-100">
              <div className="p-6 text-center">
                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-1">店舗貯スタック</p>
                <div className="flex items-baseline justify-center gap-1">
                  <span className="text-3xl font-black text-gray-900">
                    {linkedPlayer?.totalBuyin?.toLocaleString() || 0}
                  </span>
                  <span className="text-sm font-bold text-gray-400">©</span>
                </div>
              </div>
              <div className="p-6 text-center bg-green-50/40">
                <p className="text-[10px] text-green-600 font-bold uppercase tracking-wider mb-1">スタポカ貯スタック</p>
                <button 
                  onClick={() => router.push("/purchase")}
                  className="group transition-all active:scale-95"
                >
                  <div className="flex items-baseline justify-center gap-1">
                    <span className="text-3xl font-black text-green-700 group-hover:text-green-600">
                      {customerAccount?.stapokaBalance?.toLocaleString() || 0}
                    </span>
                    <span className="text-sm font-bold text-green-600">©</span>
                  </div>
                  <p className="text-[10px] text-green-500 mt-1 font-bold underline decoration-green-300 underline-offset-2">チャージ・購入</p>
                </button>
              </div>
            </div>
            
            <div className="px-6 py-4 bg-gray-50/80 flex justify-between items-center border-t border-gray-100">
              <div className="flex items-center gap-3">
                <div className="bg-orange-100 p-2 rounded-xl">
                  <Wallet className="h-4 w-4 text-orange-600" />
                </div>
                <div>
                  <p className="text-[10px] text-gray-400 font-bold leading-none mb-1">保有 CP</p>
                  <p className="text-sm font-black text-gray-800">{linkedPlayer?.rewardPoints?.toLocaleString() || 0} <span className="text-[10px] font-bold">pts</span></p>
                </div>
              </div>
              <div className="h-8 w-px bg-gray-200" />
              <div className="flex items-center gap-3">
                <div className="bg-purple-100 p-2 rounded-xl">
                  <Zap className="h-4 w-4 text-purple-600" />
                </div>
                <div>
                  <p className="text-[10px] text-gray-400 font-bold leading-none mb-1">会員ランク</p>
                  <p className="text-sm font-black text-gray-800">{linkedPlayer?.membershipRank === "platinum" ? "プラチナ" : linkedPlayer?.membershipRank === "gold" ? "ゴールド" : linkedPlayer?.membershipRank === "silver" ? "シルバー" : "一般"}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* クイックアクション */}
        <div className="grid grid-cols-4 gap-3">
          {[
            { icon: MessageCircle, label: "チャット", color: "text-blue-600", bg: "bg-blue-50", path: "/chat" },
            { icon: Trophy, label: "ランキング", color: "text-yellow-600", bg: "bg-yellow-50", path: "/rankings" },
            { icon: History, label: "履歴", color: "text-purple-600", bg: "bg-purple-50", path: "/history" },
            { icon: Gift, label: "特典", color: "text-green-600", bg: "bg-green-50", path: "/benefits" },
          ].map((item, i) => (
            <button 
              key={i}
              onClick={() => router.push(item.path)}
              className="flex flex-col items-center justify-center p-3 bg-white rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-all active:scale-95"
            >
              <div className={`${item.bg} p-2.5 rounded-xl mb-2`}>
                <item.icon className={`h-5 w-5 ${item.color}`} />
              </div>
              <span className="text-[10px] font-black text-gray-600">{item.label}</span>
            </button>
          ))}
        </div>

        {/* 特別なお知らせ */}
        {isDoublePointDay && (
          <Card className="border-none bg-gradient-to-r from-yellow-400 to-orange-500 shadow-lg overflow-hidden">
            <CardContent className="p-4 flex items-center justify-between text-white">
              <div className="flex items-center gap-3">
                <div className="bg-white/20 p-2 rounded-full animate-pulse">
                  <Zap className="h-5 w-5 text-white fill-white" />
                </div>
                <div>
                  <p className="text-xs font-black uppercase tracking-widest opacity-80">Special Event</p>
                  <p className="text-lg font-black">本日は RP 2倍デー！</p>
                </div>
              </div>
              <Badge className="bg-white text-orange-600 font-black border-none">HOT</Badge>
            </CardContent>
          </Card>
        )}

        {/* 戦績サマリー (RechartsはModal内にあるため、ここでは簡易表示) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* 今日のランキング */}
          <Card className="border-none shadow-lg rounded-3xl overflow-hidden">
            <CardHeader className="bg-white border-b border-gray-50 pb-4">
              <CardTitle className="text-sm font-black flex items-center gap-2 text-gray-800">
                <Trophy className="h-4 w-4 text-yellow-500" />
                今日のRPランキング
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {sortedTodayRankings.length > 0 ? (
                <div className="divide-y divide-gray-50">
                  {sortedTodayRankings.map((ranking, index) => (
                    <div key={index} className={`flex items-center justify-between p-4 ${ranking.playerId === linkedPlayer?.id ? 'bg-blue-50/50' : ''}`}>
                      <div className="flex items-center gap-3">
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black ${
                          index === 0 ? 'bg-yellow-400 text-white' : 
                          index === 1 ? 'bg-gray-300 text-white' : 
                          index === 2 ? 'bg-orange-400 text-white' : 'bg-gray-100 text-gray-400'
                        }`}>
                          {index + 1}
                        </div>
                        <span className="text-sm font-bold text-gray-700">{ranking.playerName}</span>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-black text-blue-600">{isDoublePointDay ? ranking.points * 2 : ranking.points} RP</p>
                        <p className={`text-[10px] font-bold ${ranking.profit >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                          {ranking.profit >= 0 ? '+' : ''}{ranking.profit.toLocaleString()}©
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-10 text-center">
                  <Trophy className="h-10 w-10 text-gray-200 mx-auto mb-2" />
                  <p className="text-xs text-gray-400 font-bold">本日のランキングはまだありません</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* 月間ランキング */}
          <Card className="border-none shadow-lg rounded-3xl overflow-hidden">
            <CardHeader className="bg-white border-b border-gray-50 pb-4">
              <CardTitle className="text-sm font-black flex items-center gap-2 text-gray-800">
                <TrendingUp className="h-4 w-4 text-blue-500" />
                {currentMonth}月の総合ランキング
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {sortedMonthlyRankings.length > 0 ? (
                <div className="divide-y divide-gray-50">
                  {sortedMonthlyRankings.map((ranking, index) => (
                    <div key={index} className={`flex items-center justify-between p-4 ${ranking.playerId === linkedPlayer?.id ? 'bg-blue-50/50' : ''}`}>
                      <div className="flex items-center gap-3">
                        <span className="text-xs font-black text-gray-300 w-4">{index + 1}</span>
                        <span className="text-sm font-bold text-gray-700">{ranking.playerName}</span>
                      </div>
                      <span className="text-sm font-black text-gray-900">{ranking.totalPoints} <span className="text-[10px] text-gray-400">RP</span></span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-10 text-center">
                  <TrendingUp className="h-10 w-10 text-gray-200 mx-auto mb-2" />
                  <p className="text-xs text-gray-400 font-bold">月間データ収集中...</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* CP履歴 (簡易版) */}
        <Card className="border-none shadow-lg rounded-3xl overflow-hidden">
          <CardHeader className="bg-white border-b border-gray-50 pb-4">
            <CardTitle className="text-sm font-black flex items-center gap-2 text-gray-800">
              <History className="h-4 w-4 text-purple-500" />
              最近のCP履歴
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {pointHistory.length > 0 ? (
              <div className="divide-y divide-gray-50">
                {pointHistory.slice(0, 5).map((history, i) => (
                  <div key={i} className="p-4 flex justify-between items-center">
                    <div>
                      <p className="text-xs font-bold text-gray-800">{history.description || (history.type === 'earn' ? 'ポイント獲得' : 'ポイント利用')}</p>
                      <p className="text-[10px] text-gray-400 font-medium">
                        {history.createdAt instanceof Date ? history.createdAt.toLocaleDateString() : '不明な日付'}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className={`text-sm font-black ${history.type === 'earn' ? 'text-green-600' : 'text-red-600'}`}>
                        {history.type === 'earn' ? '+' : '-'}{history.points.toLocaleString()} CP
                      </p>
                      <p className="text-[10px] text-gray-400 font-bold">残高: {history.balanceAfter?.toLocaleString()} CP</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-10 text-center">
                <History className="h-10 w-10 text-gray-200 mx-auto mb-2" />
                <p className="text-xs text-gray-400 font-bold">履歴はまだありません</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* 紐づけ警告 */}
        {!linkedPlayer && !isLoadingData && (
          <Card className="border-none bg-red-50 shadow-inner rounded-3xl">
            <CardContent className="p-6 flex items-start gap-4">
              <div className="bg-red-100 p-3 rounded-2xl">
                <AlertCircle className="h-6 w-6 text-red-600" />
              </div>
              <div>
                <p className="text-sm font-black text-red-800">プレイヤー情報が未紐づけです</p>
                <p className="text-xs text-red-600 mt-1 font-medium leading-relaxed">
                  店舗のプレイヤーデータと紐づけることで、戦績やランキングが反映されます。スタッフにお声がけいただくか、設定から紐づけを行ってください。
                </p>
                <Button 
                  variant="link" 
                  className="p-0 h-auto text-xs font-black text-red-700 underline mt-2"
                  onClick={() => router.push("/rankings")}
                >
                  紐づけ設定を行う
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </main>

      {/* ボトムナビゲーション */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-lg border-t border-gray-100 flex justify-around items-center py-3 px-6 z-40 shadow-[0_-5px_20px_rgba(0,0,0,0.05)]">
        {[
          { icon: Star, label: "ホーム", path: "/" },
          { icon: User, label: "マイページ", path: "/customer-view", active: true },
          { icon: Trophy, label: "ランキング", path: "/rankings" },
          { icon: MessageCircle, label: "チャット", path: "/chat" },
        ].map((item, i) => (
          <button 
            key={i}
            onClick={() => router.push(item.path)}
            className="flex flex-col items-center gap-1 transition-all active:scale-90"
          >
            <div className={`p-1.5 rounded-xl ${item.active ? 'bg-blue-600 text-white shadow-md shadow-blue-200' : 'text-gray-400'}`}>
              <item.icon className="h-5 w-5" />
            </div>
            <span className={`text-[9px] font-black ${item.active ? 'text-blue-600' : 'text-gray-400'}`}>{item.label}</span>
          </button>
        ))}
      </nav>

      {/* 詳細データモーダル */}
      {linkedPlayer && (
        <PlayerDetailedDataModal
          isOpen={isDetailedDataModalOpen}
          onClose={() => setIsDetailedDataModalOpen(false)}
          playerId={linkedPlayer.id}
          playerName={linkedPlayer.name || linkedPlayer.pokerName || ""}
          player={linkedPlayer}
        />
      )}
    </div>
  )
}
