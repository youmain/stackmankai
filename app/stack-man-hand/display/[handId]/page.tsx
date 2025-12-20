"use client"

import { useEffect, useState } from "react"
import { useRouter, useParams } from "next/navigation"
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

export default function StackManHandDisplayPage() {
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
        alert("ログインしてください")
        router.push("/customer-auth")
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
  }, [handId, router])

  // Update current time every second
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

  if (!hand) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-600">ハンドが見つかりません</div>
      </div>
    )
  }

  const formatDate = (date: Date) => {
    return date.toLocaleDateString("ja-JP", {
      year: "numeric",
      month: "long",
      day: "numeric",
      weekday: "long",
    })
  }

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString("ja-JP", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    })
  }

  const isExpired = hand.status === "expired" || currentTime > hand.validUntil.toDate()
  const isUsed = hand.status === "used"

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-purple-800 to-pink-900 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="mb-6">
          <button
            onClick={() => router.push("/stack-man-hand/purchase")}
            className="text-white hover:text-purple-200"
          >
            ← 戻る
          </button>
        </div>

        <div className="bg-white/10 backdrop-blur-lg rounded-3xl shadow-2xl p-8 border border-white/20">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-white mb-2">Stack Man Hand</h1>
            <p className="text-purple-200">{hand.userName}</p>
          </div>

          {/* Current Date/Time (Anti-screenshot) */}
          <div className="bg-black/30 rounded-2xl p-6 mb-8 text-center">
            <div className="text-white text-2xl font-bold mb-2">
              {formatDate(currentTime)}
            </div>
            <div className="text-purple-200 text-5xl font-mono font-bold">
              {formatTime(currentTime)}
            </div>
          </div>

          {/* Status */}
          {isUsed && (
            <div className="bg-gray-900/50 border border-gray-700 rounded-2xl p-4 mb-8 text-center">
              <div className="text-gray-300 text-lg font-bold">
                使用済み - {hand.result === "win" ? "勝利 🎉" : "敗北"}
              </div>
            </div>
          )}

          {isExpired && !isUsed && (
            <div className="bg-red-900/50 border border-red-700 rounded-2xl p-4 mb-8 text-center">
              <div className="text-red-300 text-lg font-bold">
                期限切れ
              </div>
            </div>
          )}

          {!isUsed && !isExpired && (
            <div className="bg-green-900/50 border border-green-700 rounded-2xl p-4 mb-8 text-center">
              <div className="text-green-300 text-lg font-bold">
                有効 - 店舗で提示してください
              </div>
            </div>
          )}

          {/* Cards */}
          <div className="flex justify-center gap-6 mb-8">
            {hand.cards.map((card, index) => (
              <PlayingCard key={index} card={card} />
            ))}
          </div>

          {/* Hand Rank */}
          <div className="text-center mb-8">
            <div className="text-purple-200 text-sm mb-1">ハンドランク</div>
            <div className="text-white text-3xl font-bold">{hand.handRank}</div>
          </div>

          {/* Reward Info */}
          <div className="bg-white/10 rounded-2xl p-6 mb-8">
            <div className="grid grid-cols-2 gap-4 text-center">
              <div>
                <div className="text-purple-200 text-sm mb-1">購入価格</div>
                <div className="text-white text-2xl font-bold">
                  {hand.purchasePrice.toLocaleString()}
                </div>
                <div className="text-purple-300 text-sm">アプリチップ</div>
              </div>
              <div>
                <div className="text-pink-200 text-sm mb-1">勝利報酬</div>
                <div className="text-white text-2xl font-bold">
                  {hand.rewardAmount.toLocaleString()}
                </div>
                <div className="text-pink-300 text-sm">店舗チップ</div>
              </div>
            </div>
          </div>

          {/* Valid Until */}
          <div className="text-center text-purple-200 text-sm">
            <p>購入日時: {hand.purchasedAt.toDate().toLocaleString("ja-JP")}</p>
            <p className="mt-1">
              有効期限: {hand.validUntil.toDate().toLocaleString("ja-JP")}
            </p>
          </div>

          {/* Instructions */}
          {!isUsed && !isExpired && (
            <div className="mt-8 bg-yellow-900/30 border border-yellow-700/50 rounded-2xl p-6">
              <h3 className="text-yellow-200 font-bold mb-3 flex items-center">
                <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
                使用方法
              </h3>
              <ol className="text-yellow-100 text-sm space-y-2">
                <li>1. この画面を店舗スタッフに提示してください</li>
                <li>2. スタッフがハンドの勝敗を判定します</li>
                <li>3. 勝利すれば店舗チップを獲得できます！</li>
              </ol>
            </div>
          )}
        </div>

        {/* Screenshot Warning */}
        <div className="mt-6 text-center text-purple-200 text-sm">
          <p>⚠️ スクリーンショットでの再利用を防ぐため、現在時刻が表示されています</p>
        </div>
      </div>
    </div>
  )
}
