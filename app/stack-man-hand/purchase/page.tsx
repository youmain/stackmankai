"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { doc, getDoc } from "firebase/firestore"
import { getDb } from "@/lib/firebase"
import { useAuth } from "@/contexts/auth-context"
import { getStackManHandSettings, purchaseStackManHand, getTodayStackManHands, calculateRemainingPurchases } from "@/lib/stack-man-hand"
import type { StackManHandSettings, StackManHand } from "@/types/stack-man-hand"

export default function StackManHandPurchasePage() {
  const router = useRouter()
  const { customerAccount } = useAuth()
  const [loading, setLoading] = useState(true)
  const [purchasing, setPurchasing] = useState(false)
  const [settings, setSettings] = useState<StackManHandSettings | null>(null)
  const [todayHands, setTodayHands] = useState<StackManHand[]>([])
  const [currentStack, setCurrentStack] = useState(0)
  const [remainingPurchases, setRemainingPurchases] = useState(0)
  const [maxPurchases, setMaxPurchases] = useState(0)
  const [purchasedToday, setPurchasedToday] = useState(0)
  const [minimumStack, setMinimumStack] = useState(10000)

  useEffect(() => {
    const loadData = async () => {
      // Check authentication
      if (!customerAccount?.storeId || !customerAccount?.playerId) {
        alert("ログインしてください")
        router.push("/customer-auth")
        return
      }

      try {
        // Load settings
        const storeSettings = await getStackManHandSettings(customerAccount.storeId)
        if (!storeSettings || !storeSettings.enabled) {
          alert("Stack Man Hand機能が無効です")
          router.push("/customer-view")
          return
        }
        setSettings(storeSettings)

        // Get current stack from Firestore
        const playerDoc = await getDoc(doc(getDb()!, "players", customerAccount.playerId))
        if (!playerDoc.exists()) {
          alert("プレイヤー情報が見つかりません")
          router.push("/customer-view")
          return
        }
        
        const playerData = playerDoc.data()
        const stack = playerData.systemBalance || 0
        setCurrentStack(stack)

        // Load today's hands
        const hands = await getTodayStackManHands(customerAccount.storeId, customerAccount.playerId)
        setTodayHands(hands)

        // Calculate remaining purchases
        const purchaseInfo = await calculateRemainingPurchases(customerAccount.storeId, customerAccount.playerId, stack)
        setMaxPurchases(purchaseInfo.maxPurchases)
        setPurchasedToday(purchaseInfo.purchasedToday)
        setRemainingPurchases(purchaseInfo.remaining)
        
        // Get minimum stack from store
        const storeDoc = await getDoc(doc(getDb()!, "stores", customerAccount.storeId))
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
  }, [router, customerAccount])

  const handlePurchase = async () => {
    if (!settings || !customerAccount?.storeId || !customerAccount?.playerId) return

    if (remainingPurchases <= 0) {
      alert("これ以上購入できません。ポーカーで勝ってチップを増やしてください！")
      return
    }

    setPurchasing(true)
    try {
      const result = await purchaseStackManHand(
        customerAccount.storeId, 
        customerAccount.playerId, 
        customerAccount.playerName || ""
      )
      
      if (result.success) {
        alert(result.message)
        // Redirect to display page
        router.push(`/stack-man-hand/display/${result.handId}`)
      } else {
        alert(result.message)
      }
    } catch (error) {
      console.error("Error purchasing Stack Man Hand:", error)
      alert("購入に失敗しました")
    } finally {
      setPurchasing(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">読み込み中...</p>
        </div>
      </div>
    )
  }

  if (!settings) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600">Stack Man Hand機能が無効です</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-purple-800 mb-2">Stack Man Hand 購入</h1>
          <p className="text-gray-600">ランダムなポーカーハンドを購入して、店舗で報酬を獲得しよう！</p>
        </div>

        {/* Settings Info */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4">店舗設定</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-600">購入価格</p>
              <p className="text-2xl font-bold text-blue-600">{settings.purchasePrice.toLocaleString()}💰</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">基礎報酬</p>
              <p className="text-2xl font-bold text-green-600">{settings.rewardAmount.toLocaleString()}💰</p>
            </div>
            <div className="col-span-2">
              <p className="text-sm text-gray-600">営業時間</p>
              <p className="text-lg font-semibold text-gray-800">
                {settings.businessHours.open} - {settings.businessHours.close}
              </p>
            </div>
          </div>
        </div>

        {/* Current Stack */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4">現在の状況</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-600">現在のスタック</p>
              <p className="text-2xl font-bold text-blue-600">{currentStack.toLocaleString()}💰</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">最低保証額</p>
              <p className="text-2xl font-bold text-gray-600">{minimumStack.toLocaleString()}💰</p>
            </div>
          </div>
        </div>

        {/* Purchase Status */}
        <div className="bg-gradient-to-r from-purple-100 to-pink-100 rounded-lg shadow-lg p-6 mb-6">
          <h2 className="text-xl font-bold text-purple-800 mb-4">本日の購入状況</h2>
          <div className="text-center mb-4">
            <p className="text-4xl font-bold text-purple-600 mb-2">
              あと{remainingPurchases}回購入できます
            </p>
            <p className="text-gray-600">
              購入済み: {purchasedToday}回 / 購入可能: {maxPurchases}回
            </p>
          </div>
          
          {remainingPurchases > 0 ? (
            <button
              onClick={handlePurchase}
              disabled={purchasing}
              className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold py-4 px-6 rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {purchasing ? "購入中..." : `Stack Man Handを購入（${settings.purchasePrice.toLocaleString()}💰）`}
            </button>
          ) : (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <p className="text-yellow-800 text-center">
                これ以上購入できません。<br />
                ポーカーで勝ってチップを増やしてください！
              </p>
            </div>
          )}
        </div>

        {/* Today's Hands */}
        {todayHands.length > 0 && (
          <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-800">本日購入したハンド</h2>
              <button
                onClick={() => router.push("/stack-man-hand/my-hands")}
                className="text-purple-600 hover:text-purple-700 font-semibold"
              >
                一覧を見る →
              </button>
            </div>
            <div className="grid grid-cols-1 gap-3">
              {todayHands.slice(0, 3).map((hand) => (
                <div
                  key={hand.id}
                  onClick={() => router.push(`/stack-man-hand/display/${hand.id}`)}
                  className="border border-gray-200 rounded-lg p-4 cursor-pointer hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-gray-800">
                        {hand.cards.map(c => `${c.rank}${c.suit}`).join(" ")}
                      </p>
                      <p className="text-sm text-gray-600">{hand.handRank}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-purple-600">{hand.multiplier}x</p>
                      <p className="text-sm text-gray-600">{hand.finalReward.toLocaleString()}💰</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Back Button */}
        <button
          onClick={() => router.push("/customer-view")}
          className="w-full bg-gray-200 text-gray-700 font-semibold py-3 px-6 rounded-lg hover:bg-gray-300 transition-colors"
        >
          戻る
        </button>
      </div>
    </div>
  )
}
