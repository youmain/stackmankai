"use client"
import { useState, useEffect, useMemo } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { subscribeToPlayers, subscribeToCustomerAccounts } from "@/lib/firestore"
import type { Player, CustomerAccount } from "@/types"

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
        {linkedPlayer ? (
          <div className="bg-white rounded-lg shadow-md p-6 mb-8">
            <h2 className="text-xl font-semibold mb-4">プレイヤー情報</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-sm text-gray-600">プレイヤー名</p>
                <p className="text-lg font-semibold">{linkedPlayer.name || linkedPlayer.pokerName || "未設定"}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">ホーム店舗</p>
                <p className="text-lg font-semibold">{linkedPlayer.homeStore || "未設定"}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">貯スタック</p>
                <p className="text-lg font-semibold text-blue-600">
                  {(linkedPlayer.systemBalance || 0).toLocaleString()}💰
                </p>
              </div>
              <div
                className="cursor-pointer hover:bg-green-50 p-2 rounded-lg transition-colors"
                onClick={() => router.push("/stack-man-hand/purchase")}
              >
                <p className="text-sm text-gray-600">スタポカ貯スタック</p>
                <p className="text-lg font-semibold text-green-600">
                  {(linkedPlayer.systemBalance || 0).toLocaleString()}💰
                </p>
                <p className="text-xs text-green-500 mt-1">クリックで購入</p>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-md p-6 mb-8">
            <p className="text-gray-600">プレイヤー情報が紐づけられていません。</p>
            <button
              onClick={() => router.push("/customer-auth")}
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              プレイヤー情報を紐づける
            </button>
          </div>
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
