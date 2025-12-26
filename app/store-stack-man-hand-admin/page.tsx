"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { collection, query, where, getDocs, orderBy, limit } from "firebase/firestore"
import { getDb } from "@/lib/firebase"
import { collectRake, resetStacks } from "@/lib/scheduled-tasks"
import { useStackManHand } from "@/lib/stack-man-hand"
import type { StackManHand, RakeCollection, StackReset } from "@/types/stack-man-hand"

export default function StoreStackManHandAdminPage() {
  const { user, storeId, storeName, userName, isStoreOwner, loading } = useAuth()
  const router = useRouter()
  const [processing, setProcessing] = useState(false)
  
  // Recent data
  const [recentHands, setRecentHands] = useState<StackManHand[]>([])
  const [lastRakeCollection, setLastRakeCollection] = useState<RakeCollection | null>(null)
  const [lastStackReset, setLastStackReset] = useState<StackReset | null>(null)

  useEffect(() => {
    const loadData = async () => {
      if (!storeId || !isStoreOwner) {
        alert("権限がありません")
        router.push("/store-dashboard")
        return
      }

      try {
        const db = getDb()
        if (!db) throw new Error("Firestore is not initialized")

        // Load recent Stack Man Hands
        const handsRef = collection(db, "stores", storeId, "stackManHands")
        const handsQuery = query(handsRef, orderBy("purchasedAt", "desc"), limit(10))
        const handsSnapshot = await getDocs(handsQuery)
        const hands = handsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as StackManHand[]
        setRecentHands(hands)

        // Load last rake collection
        const rakeRef = collection(db, "stores", storeId, "rakeCollections")
        const rakeQuery = query(rakeRef, orderBy("collectedAt", "desc"), limit(1))
        const rakeSnapshot = await getDocs(rakeQuery)
        if (!rakeSnapshot.empty) {
          setLastRakeCollection({ id: rakeSnapshot.docs[0].id, ...rakeSnapshot.docs[0].data() } as RakeCollection)
        }

        // Load last stack reset
        const resetRef = collection(db, "stores", storeId, "stackResets")
        const resetQuery = query(resetRef, orderBy("resetAt", "desc"), limit(1))
        const resetSnapshot = await getDocs(resetQuery)
        if (!resetSnapshot.empty) {
          setLastStackReset({ id: resetSnapshot.docs[0].id, ...resetSnapshot.docs[0].data() } as StackReset)
        }
      } catch (error) {
        console.error("Error loading data:", error)
        alert("データの読み込みに失敗しました")
      }
    }

    loadData()
  }, [router])

  const handleCollectRake = async () => {
    if (!storeId) return
    
    if (!confirm("レーキを回収しますか？")) return

    setProcessing(true)
    try {
      const result = await collectRake(storeId)
      alert(result.message)
      
      if (result.success) {
        // Reload data
        window.location.reload()
      }
    } catch (error) {
      console.error("Error:", error)
      alert("レーキ回収に失敗しました")
    } finally {
      setProcessing(false)
    }
  }

  const handleResetStacks = async () => {
    if (!storeId) return
    
    if (!confirm("スタックをリセットしますか？")) return

    setProcessing(true)
    try {
      const result = await resetStacks(storeId)
      alert(result.message)
      
      if (result.success) {
        // Reload data
        window.location.reload()
      }
    } catch (error) {
      console.error("Error:", error)
      alert("スタックリセットに失敗しました")
    } finally {
      setProcessing(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-600">読み込み中...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        <div className="mb-6">
          <button
            onClick={() => router.push("/store-dashboard")}
            className="text-blue-600 hover:text-blue-800"
          >
            ← ダッシュボードに戻る
          </button>
        </div>

        <h1 className="text-3xl font-bold text-gray-900 mb-2">Stack Man Hand 管理</h1>
        <p className="text-gray-600 mb-8">{storeName}</p>

        {/* Manual Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">レーキ回収</h2>
            <p className="text-gray-600 mb-4 text-sm">
              全プレイヤーのスタックから設定されたレーキ率で回収します。
            </p>
            {lastRakeCollection && (
              <div className="bg-gray-50 rounded p-3 mb-4 text-sm">
                <div className="text-gray-600">最終回収</div>
                <div className="font-bold text-gray-900">
                  {lastRakeCollection.collectedAt.toDate().toLocaleString("ja-JP")}
                </div>
                <div className="text-gray-600 mt-1">
                  回収額: {lastRakeCollection.totalAmount.toLocaleString()}チップ
                </div>
              </div>
            )}
            <button
              onClick={handleCollectRake}
              disabled={processing}
              className="w-full px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 disabled:bg-gray-400"
            >
              {processing ? "処理中..." : "レーキを回収"}
            </button>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">スタックリセット</h2>
            <p className="text-gray-600 mb-4 text-sm">
              最低保証額未満のプレイヤーのスタックをリセットします。
            </p>
            {lastStackReset && (
              <div className="bg-gray-50 rounded p-3 mb-4 text-sm">
                <div className="text-gray-600">最終リセット</div>
                <div className="font-bold text-gray-900">
                  {lastStackReset.resetAt.toDate().toLocaleString("ja-JP")}
                </div>
                <div className="text-gray-600 mt-1">
                  リセット人数: {lastStackReset.playerResets.filter(p => p.wasReset).length}人
                </div>
              </div>
            )}
            <button
              onClick={handleResetStacks}
              disabled={processing}
              className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400"
            >
              {processing ? "処理中..." : "スタックをリセット"}
            </button>
          </div>
        </div>

        {/* Recent Stack Man Hands */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">最近のStack Man Hand</h2>
          
          {recentHands.length === 0 ? (
            <p className="text-gray-600 text-center py-8">まだ購入されていません</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2 px-3 text-sm font-semibold text-gray-700">プレイヤー</th>
                    <th className="text-left py-2 px-3 text-sm font-semibold text-gray-700">ハンド</th>
                    <th className="text-left py-2 px-3 text-sm font-semibold text-gray-700">購入日時</th>
                    <th className="text-left py-2 px-3 text-sm font-semibold text-gray-700">ステータス</th>
                    <th className="text-left py-2 px-3 text-sm font-semibold text-gray-700">結果</th>
                  </tr>
                </thead>
                <tbody>
                  {recentHands.map((hand) => (
                    <tr key={hand.id} className="border-b hover:bg-gray-50">
                      <td className="py-3 px-3 text-sm">{hand.userName}</td>
                      <td className="py-3 px-3 text-sm font-mono">{hand.handRank}</td>
                      <td className="py-3 px-3 text-sm">
                        {hand.purchasedAt.toDate().toLocaleString("ja-JP")}
                      </td>
                      <td className="py-3 px-3 text-sm">
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold ${
                          hand.status === "active" ? "bg-green-100 text-green-800" :
                          hand.status === "used" ? "bg-gray-100 text-gray-800" :
                          "bg-red-100 text-red-800"
                        }`}>
                          {hand.status === "active" ? "有効" :
                           hand.status === "used" ? "使用済み" :
                           "期限切れ"}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-sm">
                        {hand.result === "win" ? "🎉 勝利" :
                         hand.result === "lose" ? "敗北" :
                         "-"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
