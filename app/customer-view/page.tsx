"use client"
import { useState, useEffect, useMemo } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { subscribeToPlayers, subscribeToCustomerAccounts } from "@/lib/firestore"
import type { Player, CustomerAccount } from "@/types"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { User } from "lucide-react"

export default function CustomerViewPage() {
  const router = useRouter()
  const { customerAccount, signOut, loading } = useAuth()
  const [players, setPlayers] = useState<Player[]>([])
  const [allCustomerAccounts, setAllCustomerAccounts] = useState<CustomerAccount[]>([])

  // プレイヤーデータの購読
  useEffect(() => {
    const unsubscribe = subscribeToPlayers((data) => {
      setPlayers(data)
    })
    return () => unsubscribe?.()
  }, [])

  // 顧客アカウントデータの購読
  useEffect(() => {
    const unsubscribe = subscribeToCustomerAccounts((data) => {
      setAllCustomerAccounts(data)
    })
    return () => unsubscribe?.()
  }, [])

  // プレイヤー紐づけロジック（安全版）
  const linkedPlayer = useMemo(() => {
    try {
      if (!players || players.length === 0 || !customerAccount) return null

      const pId = customerAccount?.playerId ? String(customerAccount.playerId).trim() : ""
      const pName = customerAccount?.playerName ? String(customerAccount.playerName).trim() : ""
      const dName = (customerAccount as any)?.displayName ? String((customerAccount as any).displayName).trim() : ""

      return players.find(p => 
        (pId && (String(p.uniqueId || "").trim() === pId || String(p.id || "").trim() === pId)) ||
        (pName && (String(p.name || "").trim() === pName || String(p.pokerName || "").trim() === pName)) ||
        (dName && (String(p.name || "").trim() === dName || String(p.pokerName || "").trim() === dName))
      ) || null
    } catch (e) {
      console.error("[v0] Error in linkedPlayer:", e)
      return null
    }
  }, [players, customerAccount])

  // ログイン状態の確認
  if (loading) {
    return <div className="flex items-center justify-center h-screen">読み込み中...</div>
  }

  if (!customerAccount) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <p className="text-lg font-semibold mb-4">ログインしてください</p>
          <button
            onClick={() => router.push("/customer-auth")}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            ログインページへ
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-6xl mx-auto">
        {/* ヘッダー */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">マイページ</h1>
          <p className="text-gray-600">
            {linkedPlayer ? `${linkedPlayer.name || linkedPlayer.pokerName}さんのデータ` : "プレイヤー情報を紐づけてください"}
          </p>
        </div>

        {/* プレイヤー情報カード */}
        {linkedPlayer && customerAccount?.playerId ? (
          <Card className="border-green-200 bg-green-50 shadow-md mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-green-700">
                <User className="h-5 w-5" />
                プレイヤー情報
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">プレイヤー名</p>
                  <p className="text-lg font-semibold">{linkedPlayer.name || linkedPlayer.pokerName || "未設定"}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">ホーム店舗</p>
                  <p className="text-lg font-semibold">{linkedPlayer.storeName || linkedPlayer.homeStore || "未設定"}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">貯スタック</p>
                  <p className="text-lg font-semibold text-blue-600">
                    {(linkedPlayer.systemBalance || 0).toLocaleString()}💰
                  </p>
                </div>
                <div 
                  className="cursor-pointer hover:bg-green-100 p-3 rounded-lg transition-colors border-2 border-green-300"
                  onClick={() => router.push("/stack-man-hand/purchase")}
                >
                  <p className="text-sm text-gray-600">スタポカ貯スタック</p>
                  <p className="text-lg font-semibold text-green-600">
                    {(linkedPlayer.systemBalance || 0).toLocaleString()}💰
                  </p>
                  <p className="text-xs text-green-600 mt-1 font-semibold">→ クリックで購入</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">CP (Cashback Points)</p>
                  <p className="text-lg font-semibold text-purple-600">
                    {(linkedPlayer.rewardPoints || 0).toLocaleString()}CP
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">会員ランク</p>
                  <div className="flex items-center gap-2 mt-1">
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
                </div>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card className="border-yellow-200 bg-yellow-50 shadow-md mb-8">
            <CardContent className="pt-6">
              <p className="text-gray-700 mb-4">プレイヤー情報が紐づけられていません。</p>
              <button
                onClick={() => router.push("/customer-auth")}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                プレイヤー情報を紐づける
              </button>
            </CardContent>
          </Card>
        )}

        {/* ログアウトボタン */}
        <div className="flex justify-end gap-4">
          <button
            onClick={() => signOut()}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
          >
            ログアウト
          </button>
        </div>
      </div>
    </div>
  )
}
