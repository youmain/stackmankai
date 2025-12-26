"use client"

import { useEffect, useState } from "react"
import { useRouter, useParams } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { doc, getDoc } from "firebase/firestore"
import { getDb } from "@/lib/firebase"
import type { StackManHand } from "@/types/stack-man-hand"
import type { Card } from "@/types/poker"

// Card component
function PlayingCard({ card }: { card: Card }) {
  const suitSymbols = {
    hearts: "♥",
    diamonds: "♦",
    clubs: "♣",
    spades: "♠",
  }

  const suitColors = {
    hearts: "text-red-600",
    diamonds: "text-red-600",
    clubs: "text-gray-900",
    spades: "text-gray-900",
  }

  return (
    <div className="bg-white rounded-2xl shadow-2xl p-8 border-4 border-gray-200 w-40 h-56 flex flex-col justify-between">
      <div className="text-left">
        <div className={`text-4xl font-bold ${suitColors[card.suit]}`}>
          {card.rank}
        </div>
        <div className={`text-5xl ${suitColors[card.suit]}`}>
          {suitSymbols[card.suit]}
        </div>
      </div>
      <div className="text-right rotate-180">
        <div className={`text-4xl font-bold ${suitColors[card.suit]}`}>
          {card.rank}
        </div>
        <div className={`text-5xl ${suitColors[card.suit]}`}>
          {suitSymbols[card.suit]}
        </div>
      </div>
    </div>
  )
}

// Rank badge component
function RankBadge({ rank }: { rank: "S" | "A" | "B" | "C" }) {
  const rankConfig = {
    S: {
      bg: "bg-gradient-to-r from-yellow-400 via-yellow-500 to-orange-500",
      text: "text-white",
      emoji: "✨",
      label: "S RANK",
      shadow: "shadow-yellow-500/50",
    },
    A: {
      bg: "bg-gradient-to-r from-purple-400 via-purple-500 to-pink-500",
      text: "text-white",
      emoji: "⭐",
      label: "A RANK",
      shadow: "shadow-purple-500/50",
    },
    B: {
      bg: "bg-gradient-to-r from-blue-400 via-blue-500 to-cyan-500",
      text: "text-white",
      emoji: "⚡",
      label: "B RANK",
      shadow: "shadow-blue-500/50",
    },
    C: {
      bg: "bg-gradient-to-r from-gray-400 via-gray-500 to-gray-600",
      text: "text-white",
      emoji: "◆",
      label: "C RANK",
      shadow: "shadow-gray-500/50",
    },
  }

  const config = rankConfig[rank]

  return (
    <div className={`${config.bg} ${config.text} ${config.shadow} rounded-2xl p-6 shadow-2xl text-center`}>
      <div className="text-5xl mb-2">{config.emoji}</div>
      <div className="text-3xl font-bold tracking-wider">{config.label}</div>
    </div>
  )
}

export default function StackManHandDisplayPage() {
  const { user, storeId, storeName, userName, isStoreOwner, loading } = useAuth()
  const router = useRouter()
  const params = useParams()
  const handId = params.handId as string

  const [loading, setLoading] = useState(true)
  const [hand, setHand] = useState<StackManHand | null>(null)
  const [currentTime, setCurrentTime] = useState(new Date())
  const [storeId, setStoreId] = useState("")

  useEffect(() => {
    const loadHand = async () => {
      const storeIdFromStorage = localStorage.getItem("storeId")
      const userIdFromStorage = localStorage.getItem("userId")

      if (!storeIdFromStorage || !userIdFromStorage) {
        setLoading(false)
        return
      }

      setStoreId(storeIdFromStorage)

      try {
        const db = getDb()
        if (!db) throw new Error("Firestore is not initialized")

        const handDoc = await getDoc(doc(db, "stores", storeIdFromStorage, "stackManHands", handId))
        
        if (!handDoc.exists()) {
          alert("ハンドが見つかりません")
          router.push("/stack-man-hand/purchase")
          return
        }

        const handData = { id: handDoc.id, ...handDoc.data() } as StackManHand

        // Check if this hand belongs to the current user
        if (handData.userId !== userIdFromStorage) {
          alert("このハンドにアクセスする権限がありません")
          router.push("/stack-man-hand/purchase")
          return
        }

        setHand(handData)
      } catch (error) {
        console.error("Error loading hand:", error)
        alert("ハンドの読み込みに失敗しました")
      } finally {
        setLoading(false)
      }
    }

    loadHand()
  }, [router, handId])

  // Update time every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date())
    }, 1000)

    return () => clearInterval(timer)
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-600">読み込み中...</div>
      </div>
    )
  }

  if (!storeId) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 mb-4">ログインが必要です</p>
          <button
            onClick={() => router.push("/customer-auth")}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            ログインページへ
          </button>
        </div>
      </div>
    )
  }

  if (!hand) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-600">ハンドが見つかりません</div>
      </div>
    )
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
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">Stack Man Hand</h1>
          <div className="text-2xl font-mono text-yellow-400">
            {currentTime.toLocaleString("ja-JP")}
          </div>
        </div>

        {/* Main Card */}
        <div className="bg-white rounded-3xl shadow-2xl p-8 mb-6">
          {/* Rank Badge */}
          <div className="mb-8">
            <RankBadge rank={hand.rank} />
          </div>

          {/* Multiplier Display */}
          <div className="text-center mb-8">
            <div className="inline-block bg-gradient-to-r from-pink-500 to-purple-600 text-white rounded-2xl px-8 py-4 shadow-lg">
              <div className="text-sm font-semibold mb-1">倍率</div>
              <div className="text-6xl font-bold">{hand.multiplier}x</div>
            </div>
          </div>

          {/* Cards */}
          <div className="flex justify-center gap-6 mb-8">
            {hand.cards.map((card, index) => (
              <PlayingCard key={index} card={card} />
            ))}
          </div>

          {/* Hand Info */}
          <div className="text-center mb-6">
            <div className="text-2xl font-bold text-gray-900 mb-2">{hand.handRank}</div>
          </div>

          {/* Reward Info */}
          <div className="bg-gradient-to-r from-yellow-50 to-orange-50 rounded-2xl p-6 mb-6">
            <div className="text-center">
              <div className="text-sm text-gray-600 mb-2">獲得可能報酬</div>
              <div className="text-5xl font-bold text-orange-600 mb-2">
                {hand.finalReward.toLocaleString()}
              </div>
              <div className="text-sm text-gray-600">
                店舗チップ ({hand.baseReward.toLocaleString()} × {hand.multiplier}倍)
              </div>
            </div>
          </div>

          {/* Status */}
          <div className="flex justify-center mb-6">
            <span className={`inline-flex items-center px-6 py-3 rounded-full text-lg font-semibold ${statusColors[hand.status]}`}>
              {statusLabels[hand.status]}
            </span>
          </div>

          {/* Date Info */}
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="bg-gray-50 rounded-xl p-4">
              <div className="text-gray-600 mb-1">購入日時</div>
              <div className="font-semibold text-gray-900">
                {hand.purchasedAt.toDate().toLocaleString("ja-JP")}
              </div>
            </div>
            <div className="bg-gray-50 rounded-xl p-4">
              <div className="text-gray-600 mb-1">有効期限</div>
              <div className="font-semibold text-gray-900">
                {hand.validUntil.toDate().toLocaleString("ja-JP")}
              </div>
            </div>
          </div>
        </div>

        {/* Instructions */}
        <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 mb-6 text-white">
          <h2 className="text-xl font-bold mb-3">使用方法</h2>
          <ol className="space-y-2 text-sm">
            <li>1. この画面を店舗スタッフに提示してください</li>
            <li>2. スタッフがハンドの勝敗を判定します</li>
            <li>3. 勝利した場合、表示されている報酬額の店舗チップを獲得できます</li>
          </ol>
        </div>

        {/* Buttons */}
        <div className="space-y-3">
          <button
            onClick={() => router.push("/stack-man-hand/purchase")}
            className="w-full py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-bold text-lg hover:from-purple-700 hover:to-pink-700 transition-all shadow-lg"
          >
            新しいハンドを購入
          </button>
          <button
            onClick={() => router.push("/customer-view")}
            className="w-full py-4 bg-white/20 backdrop-blur-sm text-white rounded-xl font-bold text-lg hover:bg-white/30 transition-all"
          >
            ホームに戻る
          </button>
        </div>
      </div>
    </div>
  )
}
