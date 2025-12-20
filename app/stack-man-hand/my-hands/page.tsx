"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { getTodayStackManHands } from "@/lib/stack-man-hand"
import type { StackManHand } from "@/types/stack-man-hand"

export default function MyStackManHandsPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [hands, setHands] = useState<StackManHand[]>([])
  const [storeId, setStoreId] = useState("")
  const [userId, setUserId] = useState("")

  useEffect(() => {
    const loadHands = async () => {
      const storeIdFromStorage = localStorage.getItem("storeId")
      const userIdFromStorage = localStorage.getItem("userId")

      if (!storeIdFromStorage || !userIdFromStorage) {
        alert("ログインしてください")
        router.push("/customer-auth")
        return
      }

      setStoreId(storeIdFromStorage)
      setUserId(userIdFromStorage)

      try {
        const todayHands = await getTodayStackManHands(storeIdFromStorage, userIdFromStorage)
        // Sort by multiplier (descending)
        todayHands.sort((a, b) => b.multiplier - a.multiplier)
        setHands(todayHands)
      } catch (error) {
        console.error("Error loading hands:", error)
        alert("ハンドの読み込みに失敗しました")
      } finally {
        setLoading(false)
      }
    }

    loadHands()
  }, [router])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-600">読み込み中...</div>
      </div>
    )
  }

  const rankColors = {
    S: "from-yellow-400 to-orange-500",
    A: "from-purple-400 to-pink-500",
    B: "from-blue-400 to-cyan-500",
    C: "from-gray-400 to-gray-500",
  }

  const rankEmojis = {
    S: "✨",
    A: "⭐",
    B: "⚡",
    C: "◆",
  }

  const statusColors = {
    active: "bg-green-100 text-green-800",
    used: "bg-gray-100 text-gray-800",
    expired: "bg-red-100 text-red-800",
    replaced: "bg-orange-100 text-orange-800",
  }

  const statusLabels = {
    active: "有効",
    used: "使用済み",
    expired: "期限切れ",
    replaced: "置き換え済み",
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="mb-6">
          <button
            onClick={() => router.push("/stack-man-hand/purchase")}
            className="text-blue-600 hover:text-blue-800"
          >
            ← 購入ページに戻る
          </button>
        </div>

        <h1 className="text-3xl font-bold text-gray-900 mb-2">本日のStack Man Hand</h1>
        <p className="text-gray-600 mb-8">
          {new Date().toLocaleDateString("ja-JP", { year: "numeric", month: "long", day: "numeric" })}
        </p>

        {hands.length === 0 ? (
          <div className="bg-white rounded-xl shadow p-12 text-center">
            <div className="text-6xl mb-4">🎴</div>
            <p className="text-gray-600 mb-6">まだハンドを購入していません</p>
            <button
              onClick={() => router.push("/stack-man-hand/purchase")}
              className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg font-bold hover:from-purple-700 hover:to-pink-700"
            >
              ハンドを購入する
            </button>
          </div>
        ) : (
          <>
            {/* Summary */}
            <div className="grid grid-cols-3 gap-4 mb-8">
              <div className="bg-white rounded-xl shadow p-4 text-center">
                <div className="text-sm text-gray-600 mb-1">購入数</div>
                <div className="text-3xl font-bold text-gray-900">{hands.length}</div>
              </div>
              <div className="bg-white rounded-xl shadow p-4 text-center">
                <div className="text-sm text-gray-600 mb-1">最高倍率</div>
                <div className="text-3xl font-bold text-purple-600">
                  {Math.max(...hands.map(h => h.multiplier))}x
                </div>
              </div>
              <div className="bg-white rounded-xl shadow p-4 text-center">
                <div className="text-sm text-gray-600 mb-1">最高報酬</div>
                <div className="text-3xl font-bold text-orange-600">
                  {Math.max(...hands.map(h => h.finalReward)).toLocaleString()}
                </div>
              </div>
            </div>

            {/* Hands Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {hands.map((hand) => (
                <button
                  key={hand.id}
                  onClick={() => router.push(`/stack-man-hand/display/${hand.id}`)}
                  className="bg-white rounded-2xl shadow-lg p-6 hover:shadow-2xl transition-all transform hover:scale-105"
                >
                  {/* Rank Badge */}
                  <div className={`bg-gradient-to-r ${rankColors[hand.rank]} text-white rounded-xl p-4 mb-4 text-center`}>
                    <div className="text-3xl mb-1">{rankEmojis[hand.rank]}</div>
                    <div className="text-xl font-bold">{hand.rank} RANK</div>
                  </div>

                  {/* Multiplier */}
                  <div className="text-center mb-4">
                    <div className="inline-block bg-gradient-to-r from-pink-500 to-purple-600 text-white rounded-xl px-6 py-3">
                      <div className="text-4xl font-bold">{hand.multiplier}x</div>
                    </div>
                  </div>

                  {/* Hand Rank */}
                  <div className="text-center mb-4">
                    <div className="font-mono text-lg font-bold text-gray-900">{hand.handRank}</div>
                  </div>

                  {/* Reward */}
                  <div className="bg-gradient-to-r from-yellow-50 to-orange-50 rounded-xl p-4 mb-4">
                    <div className="text-center">
                      <div className="text-sm text-gray-600 mb-1">獲得可能報酬</div>
                      <div className="text-3xl font-bold text-orange-600">
                        {hand.finalReward.toLocaleString()}
                      </div>
                      <div className="text-xs text-gray-600">
                        ({hand.baseReward.toLocaleString()} × {hand.multiplier}倍)
                      </div>
                    </div>
                  </div>

                  {/* Status */}
                  <div className="flex justify-between items-center">
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold ${statusColors[hand.status]}`}>
                      {statusLabels[hand.status]}
                    </span>
                    <div className="text-xs text-gray-600">
                      {hand.purchasedAt.toDate().toLocaleTimeString("ja-JP")}
                    </div>
                  </div>
                </button>
              ))}
            </div>

            {/* Purchase More Button */}
            <div className="mt-8">
              <button
                onClick={() => router.push("/stack-man-hand/purchase")}
                className="w-full py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-bold text-lg hover:from-purple-700 hover:to-pink-700 transition-all shadow-lg"
              >
                さらに購入する
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
