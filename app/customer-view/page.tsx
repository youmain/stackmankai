"use client"

import { useState, useEffect, useMemo } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { subscribeToPlayers, subscribeToCustomerAccounts } from "@/lib/firestore"
import type { Player, CustomerAccount } from "@/types"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { User, LogOut, RefreshCw, Wallet, Trophy, Calendar, MessageSquare } from "lucide-react"

export default function CustomerViewPage() {
  const router = useRouter()
  const { customerAccount, signOut, loading, user } = useAuth()
  const [players, setPlayers] = useState<Player[]>([])
  const [isSyncing, setIsSyncing] = useState(false)

  // プレイヤーデータの購読
  useEffect(() => {
    const unsubscribe = subscribeToPlayers((data) => {
      setPlayers(data)
    })
    return () => unsubscribe?.()
  }, [])

  // プレイヤー紐づけロジック（超安定版）
  const linkedPlayer = useMemo(() => {
    if (!players || players.length === 0) return null
    
    // 1. customerAccount.playerId での照合
    if (customerAccount?.playerId) {
      const targetId = String(customerAccount.playerId).trim()
      const found = players.find(p => 
        String(p.id || "").trim() === targetId || 
        String(p.uniqueId || "").trim() === targetId
      )
      if (found) return found
    }

    // 2. 名前での照合（customerAccount.playerName または user.displayName）
    const searchNames = [
      customerAccount?.playerName,
      (customerAccount as any)?.displayName,
      user?.displayName,
      user?.playerName
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

  // ログアウト処理
  const handleSignOut = async () => {
    try {
      await signOut()
      router.push("/customer-auth")
    } catch (error) {
      console.error("Sign out error:", error)
    }
  }

  // 読み込み中
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-gray-50">
        <RefreshCw className="h-8 w-8 text-blue-600 animate-spin mb-4" />
        <p className="text-gray-600">認証情報を確認中...</p>
      </div>
    )
  }

  // 未ログイン
  if (!user) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50 p-4">
        <Card className="w-full max-w-md shadow-lg">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold">ログインが必要です</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center gap-6">
            <p className="text-gray-600 text-center">
              プレイヤーダッシュボードを表示するには、アカウントにログインしてください。
            </p>
            <button
              onClick={() => router.push("/customer-auth")}
              className="w-full py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-colors shadow-md"
            >
              ログインページへ
            </button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* ヘッダー */}
      <header className="bg-white border-b sticky top-0 z-10 px-4 py-4 shadow-sm">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <div>
            <h1 className="text-xl font-bold text-gray-900">マイページ</h1>
            <p className="text-xs text-gray-500">
              {linkedPlayer ? `${linkedPlayer.name || linkedPlayer.pokerName}としてログイン中` : user.email}
            </p>
          </div>
          <button
            onClick={handleSignOut}
            className="p-2 text-gray-500 hover:text-red-600 transition-colors"
            title="ログアウト"
          >
            <LogOut className="h-5 w-5" />
          </button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto p-4 space-y-6">
        {/* プレイヤー情報カード */}
        <Card className="overflow-hidden border-none shadow-md bg-white">
          <div className="bg-gradient-to-r from-blue-600 to-indigo-700 p-4 text-white">
            <div className="flex justify-between items-start">
              <div className="flex items-center gap-3">
                <div className="bg-white/20 p-2 rounded-full">
                  <User className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h2 className="text-lg font-bold">{linkedPlayer?.name || linkedPlayer?.pokerName || user.displayName || "ゲストプレイヤー"}</h2>
                  <Badge variant="secondary" className="bg-white/20 text-white border-none text-[10px]">
                    {linkedPlayer?.membershipRank || "一般会員"}
                  </Badge>
                </div>
              </div>
              <div className="text-right">
                <p className="text-[10px] opacity-80">ホーム店舗</p>
                <p className="text-sm font-medium">{linkedPlayer?.storeName || "未設定"}</p>
              </div>
            </div>
          </div>
          <CardContent className="p-0">
            <div className="grid grid-cols-2 divide-x divide-gray-100">
              <div className="p-4 text-center">
                <p className="text-xs text-gray-500 mb-1">貯スタック</p>
                <p className="text-xl font-bold text-gray-900">
                  {linkedPlayer?.totalBuyin?.toLocaleString() || 0} <span className="text-xs font-normal text-gray-500">💰</span>
                </p>
              </div>
              <div className="p-4 text-center bg-green-50/30">
                <p className="text-xs text-green-600 font-medium mb-1">スタポカ貯スタック</p>
                <button 
                  onClick={() => router.push("/purchase")}
                  className="group"
                >
                  <p className="text-xl font-bold text-green-700 group-hover:scale-110 transition-transform">
                    {customerAccount?.stapokaBalance?.toLocaleString() || 0} <span className="text-xs font-normal text-green-600">💰</span>
                  </p>
                  <p className="text-[9px] text-green-500 mt-1 underline">購入・チャージはこちら</p>
                </button>
              </div>
            </div>
            <div className="p-4 bg-gray-50 flex justify-around items-center">
              <div className="flex items-center gap-2">
                <Wallet className="h-4 w-4 text-orange-500" />
                <span className="text-sm font-medium">{linkedPlayer?.rewardPoints?.toLocaleString() || 0} CP</span>
              </div>
              <div className="h-4 w-px bg-gray-200" />
              <div className="flex items-center gap-2">
                <Trophy className="h-4 w-4 text-yellow-500" />
                <span className="text-sm font-medium">Rank: {linkedPlayer?.membershipRank || "一般"}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* クイックメニュー */}
        <div className="grid grid-cols-2 gap-4">
          <button 
            onClick={() => router.push("/chat")}
            className="flex flex-col items-center justify-center p-4 bg-white rounded-2xl shadow-sm border border-gray-100 hover:bg-blue-50 transition-colors"
          >
            <MessageSquare className="h-6 w-6 text-blue-600 mb-2" />
            <span className="text-sm font-bold text-gray-700">チャット</span>
          </button>
          <button 
            onClick={() => router.push("/rankings")}
            className="flex flex-col items-center justify-center p-4 bg-white rounded-2xl shadow-sm border border-gray-100 hover:bg-yellow-50 transition-colors"
          >
            <Trophy className="h-6 w-6 text-yellow-600 mb-2" />
            <span className="text-sm font-bold text-gray-700">ランキング</span>
          </button>
        </div>

        {/* 紐づけ警告（紐づいていない場合のみ） */}
        {!linkedPlayer && (
          <Card className="border-amber-200 bg-amber-50">
            <CardContent className="p-4 flex items-start gap-3">
              <div className="bg-amber-200 p-1.5 rounded-full mt-0.5">
                <User className="h-4 w-4 text-amber-700" />
              </div>
              <div>
                <p className="text-sm font-bold text-amber-800">プレイヤー情報が未紐づけです</p>
                <p className="text-xs text-amber-700 mt-1">
                  店舗のプレイヤーデータと紐づけることで、戦績やランキングが反映されます。
                </p>
                <button 
                  onClick={() => router.push("/rankings")}
                  className="text-xs font-bold text-amber-900 underline mt-2"
                >
                  紐づけ設定を行う
                </button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* イベントカレンダー（簡易版） */}
        <Card className="shadow-sm border-none">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <Calendar className="h-4 w-4 text-blue-600" />
              RP2倍カレンダー
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="bg-blue-50 rounded-xl p-4 text-center">
              <p className="text-xs text-blue-700">本日のイベント</p>
              <p className="text-sm font-bold text-blue-900 mt-1">毎週水曜：RP2倍デー！</p>
            </div>
          </CardContent>
        </Card>
      </main>

      {/* ボトムナビゲーション（モバイル用） */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t flex justify-around items-center py-3 px-6 shadow-[0_-2px_10px_rgba(0,0,0,0.05)]">
        <button onClick={() => router.push("/")} className="flex flex-col items-center gap-1">
          <div className="h-1 w-1 rounded-full bg-transparent" />
          <span className="text-[10px] text-gray-400">ホーム</span>
        </button>
        <button className="flex flex-col items-center gap-1">
          <div className="h-1 w-1 rounded-full bg-blue-600" />
          <span className="text-[10px] text-blue-600 font-bold">マイページ</span>
        </button>
        <button onClick={() => router.push("/rankings")} className="flex flex-col items-center gap-1">
          <div className="h-1 w-1 rounded-full bg-transparent" />
          <span className="text-[10px] text-gray-400">ランキング</span>
        </button>
      </nav>
    </div>
  )
}
