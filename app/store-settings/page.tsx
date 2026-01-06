"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { doc, getDoc, updateDoc } from "firebase/firestore"
import { getDb } from "@/lib/firebase"
import type { Store } from "@/types/store"
import type { StackManHandSettings, RakeSettings, StackResetSettings, PokerOperationHours } from "@/types/stack-man-hand"

export default function StoreSettingsPage() {
  const { user, storeId, storeName, userName, isStoreOwner, loading } = useAuth()
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  // Stack Man Hand Settings
  const [stackManHandEnabled, setStackManHandEnabled] = useState(false)
  const [purchasePrice, setPurchasePrice] = useState(1000)
  const [rewardAmount, setRewardAmount] = useState(1000)
  // Chat Poker Operation Hours
  const [pokerOpenTime, setPokerOpenTime] = useState("10:00")
  const [pokerCloseTime, setPokerCloseTime] = useState("22:00")
  
  // Rake Settings
  const [rakeEnabled, setRakeEnabled] = useState(false)
  const [rakePercentage, setRakePercentage] = useState(30)
  const [rakeCollectionTime, setRakeCollectionTime] = useState("03:00")
  
  // Stack Reset Settings
  const [stackResetEnabled, setStackResetEnabled] = useState(false)
  const [stackResetTime, setStackResetTime] = useState("04:00")
  const [minimumStack, setMinimumStack] = useState(10000)

  useEffect(() => {
    const loadStoreSettings = async () => {
      if (!storeId || !isStoreOwner) {
        router.push("/store-dashboard")
        return
      }

      try {
        const db = getDb()
        if (!db) throw new Error("Firestore is not initialized")

        const storeDoc = await getDoc(doc(db, "stores", storeId))
        if (storeDoc.exists()) {
          const storeData = storeDoc.data() as Store & {
            stackManHandSettings?: StackManHandSettings
            rakeSettings?: RakeSettings
            stackResetSettings?: StackResetSettings
            pokerOperationHours?: PokerOperationHours
          }

          // Load Stack Man Hand settings
          if (storeData.stackManHandSettings) {
            setStackManHandEnabled(storeData.stackManHandSettings.enabled)
            setPurchasePrice(storeData.stackManHandSettings.purchasePrice)
            setRewardAmount(storeData.stackManHandSettings.rewardAmount)
          }

          // Load Chat Poker Operation Hours
          if (storeData.pokerOperationHours) {
            setPokerOpenTime(storeData.pokerOperationHours.open)
            setPokerCloseTime(storeData.pokerOperationHours.close)
          }

          // Load Rake settings
          if (storeData.rakeSettings) {
            setRakeEnabled(storeData.rakeSettings.enabled)
            setRakePercentage(storeData.rakeSettings.rakePercentage)
            setRakeCollectionTime(storeData.rakeSettings.collectionTime)
          }

          // Load Stack Reset settings
          if (storeData.stackResetSettings) {
            setStackResetEnabled(storeData.stackResetSettings.enabled)
            setStackResetTime(storeData.stackResetSettings.resetTime)
            setMinimumStack(storeData.stackResetSettings.minimumStack)
          }
        }
      } catch (error) {
        console.error("Error loading store settings:", error)
        alert("設定の読み込みに失敗しました")
      }
    }

    loadStoreSettings()
  }, [router])

  const handleSave = async () => {
    if (!storeId) return

    setSaving(true)
    try {
      const db = getDb()
      if (!db) throw new Error("Firestore is not initialized")

      const storeRef = doc(db, "stores", storeId)
      
      await updateDoc(storeRef, {
        stackManHandSettings: {
          enabled: stackManHandEnabled,
          purchasePrice: Number(purchasePrice),
          rewardAmount: Number(rewardAmount),
        },
        pokerOperationHours: {
          open: pokerOpenTime,
          close: pokerCloseTime,
        },
        rakeSettings: {
          enabled: rakeEnabled,
          rakePercentage: Number(rakePercentage),
          collectionTime: rakeCollectionTime,
        },
        stackResetSettings: {
          enabled: stackResetEnabled,
          resetTime: stackResetTime,
          minimumStack: Number(minimumStack),
        },
        updatedAt: new Date(),
      })

      alert("設定を保存しました")
    } catch (error) {
      console.error("Error saving settings:", error)
      alert("設定の保存に失敗しました")
    } finally {
      setSaving(false)
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
      <div className="max-w-4xl mx-auto px-4">
        <div className="mb-6">
          <button
            onClick={() => router.push("/store-dashboard")}
            className="text-blue-600 hover:text-blue-800"
          >
            ← ダッシュボードに戻る
          </button>
        </div>

        <h1 className="text-3xl font-bold text-gray-900 mb-2">店舗設定</h1>
        <p className="text-gray-600 mb-8">{storeName}</p>

        <div className="space-y-8">
          {/* Stack Man Hand Settings */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900">Stack Man Hand 設定</h2>
              <label className="flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={stackManHandEnabled}
                  onChange={(e) => setStackManHandEnabled(e.target.checked)}
                  className="w-5 h-5 text-blue-600 rounded"
                />
                <span className="ml-2 text-gray-700">有効化</span>
              </label>
            </div>

            {stackManHandEnabled && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      購入価格（アプリチップ）
		                <input
                      type="number"
                      value={purchasePrice}
                      onChange={(e) => setPurchasePrice(Number(e.target.value))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                      min="0"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      報酬額（店舗チップ）
                    </label>
                    <input
                      type="number"
                      value={rewardAmount}
                      onChange={(e) => setRewardAmount(Number(e.target.value))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                      min="0"
                    />
                  </div>
                </div>



                <div className="bg-blue-50 border border-blue-200 rounded-md p-4 text-sm text-blue-800">
                  <p className="font-medium mb-1">Stack Man Hand とは？</p>
                  <p>プレイヤーがアプリチップでランダムなポーカーハンドを購入し、店舗で使用できるシステムです。購入したハンドが勝利すれば、店舗チップを獲得できます。</p>
                </div>
              </div>
	            )}
	          </div>

	          {/* Chat Poker Operation Hours */}
		          <div className="bg-white rounded-lg shadow p-6">
		            <h2 className="text-xl font-bold text-gray-900 mb-4">チャットポーカー稼働時間設定</h2>
		            <div className="grid grid-cols-2 gap-4">
		              <div>
		                <label className="block text-sm font-medium text-gray-700 mb-1">
		                  稼働開始時刻
		                </label>
		                <input
		                  type="time"
		                  value={pokerOpenTime}
		                  onChange={(e) => setPokerOpenTime(e.target.value)}
		                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
		                />
		              </div>
		              <div>
		                <label className="block text-sm font-medium text-gray-700 mb-1">
		                  稼働終了時刻
		                </label>
		                <input
		                  type="time"
		                  value={pokerCloseTime}
		                  onChange={(e) => setPokerCloseTime(e.target.value)}
		                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
		                />
		              </div>
		            </div>
		            <div className="bg-indigo-50 border border-indigo-200 rounded-md p-4 text-sm text-indigo-800 mt-4">
		              <p className="font-medium mb-1">設定の目的</p>
		              <p>チャットポーカーが利用可能な時間帯を設定します。時間外はゲームの作成や参加ができなくなります。店舗でのリアルなポーカー体験を促進するために利用してください。</p>
		            </div>
		          </div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  稼働終了時刻
                </label>
                <input
                  type="time"
                  value={pokerCloseTime}
                  onChange={(e) => setPokerCloseTime(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>
            </div>
            <div className="bg-indigo-50 border border-indigo-200 rounded-md p-4 text-sm text-indigo-800 mt-4">
              <p className="font-medium mb-1">設定の目的</p>
              <p>チャットポーカーが利用可能な時間帯を設定します。時間外はゲームの作成や参加ができなくなります。店舗でのリアルなポーカー体験を促進するために利用してください。</p>
            </div>
          </div>

          {/* Rake Settings */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900">レーキ設定</h2>
              <label className="flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={rakeEnabled}
                  onChange={(e) => setRakeEnabled(e.target.checked)}
                  className="w-5 h-5 text-blue-600 rounded"
                />
                <span className="ml-2 text-gray-700">有効化</span>
              </label>
            </div>

            {rakeEnabled && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      レーキ率（%）
                    </label>
                    <input
                      type="number"
                      value={rakePercentage}
                      onChange={(e) => setRakePercentage(Number(e.target.value))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                      min="0"
                      max="100"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      回収時刻
                    </label>
                    <input
                      type="time"
                      value={rakeCollectionTime}
                      onChange={(e) => setRakeCollectionTime(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    />
                  </div>
                </div>

                <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4 text-sm text-yellow-800">
                  <p className="font-medium mb-1">レーキとは？</p>
                  <p>ポーカーゲームの勝利金から一定率を徴収するシステムです。アプリチップの無限増殖を防ぎ、Stack Man Handの購入を促進します。</p>
                </div>
              </div>
            )}
          </div>

          {/* Stack Reset Settings */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900">スタックリセット設定</h2>
              <label className="flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={stackResetEnabled}
                  onChange={(e) => setStackResetEnabled(e.target.checked)}
                  className="w-5 h-5 text-blue-600 rounded"
                />
                <span className="ml-2 text-gray-700">有効化</span>
              </label>
            </div>

            {stackResetEnabled && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      リセット時刻
                    </label>
                    <input
                      type="time"
                      value={stackResetTime}
                      onChange={(e) => setStackResetTime(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      最低保証スタック
                    </label>
                    <input
                      type="number"
                      value={minimumStack}
                      onChange={(e) => setMinimumStack(Number(e.target.value))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                      min="0"
                    />
                  </div>
                </div>

                <div className="bg-green-50 border border-green-200 rounded-md p-4 text-sm text-green-800">
                  <p className="font-medium mb-1">スタックリセットとは？</p>
                  <p>毎日指定時刻にプレイヤーのスタックをリセットし、最低保証額を付与するシステムです。プレイヤーが毎日ゲームを楽しめるようにします。</p>
                </div>
              </div>
            )}
          </div>

          {/* Save Button */}
          <div className="flex justify-end">
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed font-medium"
            >
              {saving ? "保存中..." : "設定を保存"}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
