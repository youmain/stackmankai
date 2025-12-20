"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { doc, getDoc } from "firebase/firestore"
import { getDb } from "@/lib/firebase"
import { getStackManHandSettings, purchaseStackManHand, getTodayStackManHands, calculateRemainingPurchases } from "@/lib/stack-man-hand"
import type { StackManHandSettings, StackManHand } from "@/types/stack-man-hand"

export default function StackManHandPurchasePage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [purchasing, setPurchasing] = useState(false)
  const [storeId, setStoreId] = useState("")
  const [userId, setUserId] = useState("")
  const [userName, setUserName] = useState("")
  const [settings, setSettings] = useState<StackManHandSettings | null>(null)
  const [todayHands, setTodayHands] = useState<StackManHand[]>([])
  const [currentStack, setCurrentStack] = useState(0)
  const [remainingPurchases, setRemainingPurchases] = useState(0)
  const [maxPurchases, setMaxPurchases] = useState(0)
  const [purchasedToday, setPurchasedToday] = useState(0)
  const [minimumStack, setMinimumStack] = useState(10000)

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

        // Get current stack (from localStorage or fetch from Firestore)
        const stackFromStorage = localStorage.getItem("currentStack")
        const stack = stackFromStorage ? Number(stackFromStorage) : 0
        setCurrentStack(stack)

        // Load today's hands
        const hands = await getTodayStackManHands(storeIdFromStorage, userIdFromStorage)
        setTodayHands(hands)

        // Calculate remaining purchases
        const purchaseInfo = await calculateRemainingPurchases(storeIdFromStorage, userIdFromStorage, stack)
        setMaxPurchases(purchaseInfo.maxPurchases)
        setPurchasedToday(purchaseInfo.purchasedToday)
        setRemainingPurchases(purchaseInfo.remaining)
        
        // Get minimum stack from store
        const storeDoc = await getDoc(doc(getDb()!, "stores", storeIdFromStorage))
        if (storeDoc.exists()) {
          const storeData = storeDoc.data()
          setMinimumStack(storeData.stackResetSettings?.minimumStack || 10000)
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

    if (remainingPurchases <= 0) {
      alert("これ以上購入できません。ポーカーで勝ってチップを増やしてください！")
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

          {/* Stack info */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="bg-gray-50 rounded-xl p-4">
              <div className="text-sm text-gray-600 mb-1">現在のスタック</div>
              <div className="text-2xl font-bold text-gray-900">
                {currentStack.toLocaleString()}
              </div>
            </div>
            <div className="bg-blue-50 rounded-xl p-4">
              <div className="text-sm text-blue-600 mb-1">最低保証額</div>
              <div className="text-2xl font-bold text-blue-900">
                {minimumStack.toLocaleString()}
              </div>
            </div>
          </div>

          {/* Purchase info */}
          <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-6 mb-6">
            <div className="text-center mb-4">
              <div className="text-sm text-purple-600 mb-2">本日の購入状況</div>
              <div className="text-5xl font-bold text-purple-900 mb-2">
                {remainingPurchases}
              </div>
              <div className="text-sm text-purple-600">
                あと{remainingPurchases}回購入できます
              </div>
            </div>
            <div className="flex justify-between text-sm text-purple-700 border-t border-purple-200 pt-3">
              <span>購入済み: {purchasedToday}回</span>
              <span>購入可能: {maxPurchases}回</span>
            </div>
          </div>

          {/* Today's hands */}
          {todayHands.length > 0 && (
            <div className="bg-white border border-gray-200 rounded-xl p-4 mb-6">
              <h3 className="font-bold text-gray-900 mb-3">本日購入したハンド</h3>
              <div className="space-y-2">
                {todayHands.map((hand) => (
                  <button
                    key={hand.id}
                    onClick={() => router.push(`/stack-man-hand/display/${hand.id}`)}
                    className="w-full flex items-center justify-between p-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <div className="text-left">
                      <div className="font-mono text-sm font-bold text-gray-900">{hand.handRank}</div>
                      <div className="text-xs text-gray-600">
                        {hand.purchasedAt.toDate().toLocaleTimeString("ja-JP")}
                      </div>
                    </div>
                    <div className="text-right">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold ${
                        hand.status === "active" ? "bg-green-100 text-green-800" :
                        hand.status === "used" ? "bg-gray-100 text-gray-800" :
                        "bg-red-100 text-red-800"
                      }`}>
                        {hand.status === "active" ? "有効" :
                         hand.status === "used" ? "使用済み" :
                         "期限切れ"}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Purchase button */}
          <button
            onClick={handlePurchase}
            disabled={remainingPurchases <= 0 || purchasing}
            className="w-full py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-bold text-lg hover:from-purple-700 hover:to-pink-700 disabled:from-gray-400 disabled:to-gray-400 disabled:cursor-not-allowed transition-all shadow-lg"
          >
            {purchasing ? "購入中..." : remainingPurchases > 0 ? "Stack Man Handを購入" : "購入できません"}
          </button>

          {remainingPurchases <= 0 && (
            <div className="mt-4 bg-orange-50 border border-orange-200 rounded-xl p-4">
              <p className="text-center text-sm text-orange-800">
                <span className="font-bold">購入するにはポーカーで勝ってチップを増やしてください！</span>
                <br />
                最低保証額（{minimumStack.toLocaleString()}）以上のチップが必要です。
              </p>
            </div>
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
