"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { getStackManHandSettings, purchaseStackManHand, getActiveStackManHands } from "@/lib/stack-man-hand"
import type { StackManHandSettings, StackManHand } from "@/types/stack-man-hand"

export default function StackManHandPurchasePage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [purchasing, setPurchasing] = useState(false)
  const [storeId, setStoreId] = useState("")
  const [userId, setUserId] = useState("")
  const [userName, setUserName] = useState("")
  const [settings, setSettings] = useState<StackManHandSettings | null>(null)
  const [activeHands, setActiveHands] = useState<StackManHand[]>([])
  const [currentStack, setCurrentStack] = useState(0)

  useEffect(() => {
    const loadData = async () => {
      // Get user info from localStorage
      const storeIdFromStorage = localStorage.getItem("storeId")
      const userIdFromStorage = localStorage.getItem("userId")
      const userNameFromStorage = localStorage.getItem("userName")

      if (!storeIdFromStorage || !userIdFromStorage) {
        alert("ログインしてください")
        router.push("/customer-auth")
        return
      }

      setStoreId(storeIdFromStorage)
      setUserId(userIdFromStorage)
      setUserName(userNameFromStorage || "")

      try {
        // Load settings
        const storeSettings = await getStackManHandSettings(storeIdFromStorage)
        if (!storeSettings || !storeSettings.enabled) {
          alert("Stack Man Hand機能が無効です")
          router.push("/customer-view")
          return
        }
        setSettings(storeSettings)

        // Load active hands
        const hands = await getActiveStackManHands(storeIdFromStorage, userIdFromStorage)
        setActiveHands(hands)

        // Get current stack (from localStorage or fetch from Firestore)
        const stackFromStorage = localStorage.getItem("currentStack")
        if (stackFromStorage) {
          setCurrentStack(Number(stackFromStorage))
        }
      } catch (error) {
        console.error("Error loading data:", error)
        alert("データの読み込みに失敗しました")
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [router])

  const handlePurchase = async () => {
    if (!settings || !storeId || !userId) return

    if (currentStack < settings.purchasePrice) {
      alert("チップが不足しています")
      return
    }

    if (activeHands.length > 0) {
      alert("本日分のStack Man Handは既に購入済みです")
      return
    }

    setPurchasing(true)
    try {
      const result = await purchaseStackManHand(storeId, userId, userName)
      
      if (result.success) {
        alert(result.message)
        // Redirect to display page
        router.push(`/stack-man-hand/display/${result.handId}`)
      } else {
        alert(result.message)
      }
    } catch (error) {
      console.error("Error purchasing:", error)
      alert("購入に失敗しました")
    } finally {
      setPurchasing(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-600">読み込み中...</div>
      </div>
    )
  }

  if (!settings) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-600">Stack Man Hand機能が無効です</div>
      </div>
    )
  }

  const canPurchase = currentStack >= settings.purchasePrice && activeHands.length === 0

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 py-8">
      <div className="max-w-2xl mx-auto px-4">
        <div className="mb-6">
          <button
            onClick={() => router.push("/customer-view")}
            className="text-purple-600 hover:text-purple-800"
          >
            ← 戻る
          </button>
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Stack Man Hand</h1>
          <p className="text-gray-600 mb-8">ランダムなポーカーハンドを購入して、店舗で勝負！</p>

          {/* How it works */}
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 mb-8">
            <h2 className="text-lg font-bold text-blue-900 mb-3">遊び方</h2>
            <ol className="space-y-2 text-sm text-blue-800">
              <li className="flex items-start">
                <span className="font-bold mr-2">1.</span>
                <span>アプリチップでランダムなポーカーハンドを購入</span>
              </li>
              <li className="flex items-start">
                <span className="font-bold mr-2">2.</span>
                <span>店舗で購入したハンドを提示</span>
              </li>
              <li className="flex items-start">
                <span className="font-bold mr-2">3.</span>
                <span>勝利すれば店舗チップを獲得！</span>
              </li>
            </ol>
          </div>

          {/* Pricing info */}
          <div className="grid grid-cols-2 gap-4 mb-8">
            <div className="bg-purple-50 rounded-xl p-6">
              <div className="text-sm text-purple-600 mb-1">購入価格</div>
              <div className="text-3xl font-bold text-purple-900">
                {settings.purchasePrice.toLocaleString()}
              </div>
              <div className="text-sm text-purple-600 mt-1">アプリチップ</div>
            </div>
            <div className="bg-pink-50 rounded-xl p-6">
              <div className="text-sm text-pink-600 mb-1">勝利報酬</div>
              <div className="text-3xl font-bold text-pink-900">
                {settings.rewardAmount.toLocaleString()}
              </div>
              <div className="text-sm text-pink-600 mt-1">店舗チップ</div>
            </div>
          </div>

          {/* Current stack */}
          <div className="bg-gray-50 rounded-xl p-4 mb-6">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">現在のアプリチップ</span>
              <span className="text-2xl font-bold text-gray-900">
                {currentStack.toLocaleString()}
              </span>
            </div>
          </div>

          {/* Active hands */}
          {activeHands.length > 0 && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6 mb-6">
              <div className="flex items-center mb-2">
                <svg className="w-5 h-5 text-yellow-600 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
                <span className="font-bold text-yellow-900">本日分は購入済みです</span>
              </div>
              <p className="text-sm text-yellow-800">
                購入したハンドを表示するには、下のボタンをクリックしてください。
              </p>
              <button
                onClick={() => router.push(`/stack-man-hand/display/${activeHands[0].id}`)}
                className="mt-4 w-full px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700"
              >
                ハンドを表示
              </button>
            </div>
          )}

          {/* Purchase button */}
          {activeHands.length === 0 && (
            <button
              onClick={handlePurchase}
              disabled={!canPurchase || purchasing}
              className="w-full py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-bold text-lg hover:from-purple-700 hover:to-pink-700 disabled:from-gray-400 disabled:to-gray-400 disabled:cursor-not-allowed transition-all shadow-lg"
            >
              {purchasing ? "購入中..." : canPurchase ? "Stack Man Handを購入" : "購入できません"}
            </button>
          )}

          {!canPurchase && activeHands.length === 0 && (
            <p className="text-center text-sm text-red-600 mt-4">
              {currentStack < settings.purchasePrice
                ? "チップが不足しています"
                : "購入できません"}
            </p>
          )}

          {/* Business hours */}
          <div className="mt-8 text-center text-sm text-gray-600">
            <p>営業時間: {settings.businessHours.open} - {settings.businessHours.close}</p>
            <p className="mt-1">※ Stack Man Handは当日のみ有効です</p>
          </div>
        </div>
      </div>
    </div>
  )
}
