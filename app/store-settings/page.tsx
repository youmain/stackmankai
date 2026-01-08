"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { AuthGuard } from "@/components/auth-guard"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import { doc, getDoc, updateDoc } from "firebase/firestore"
import { getDb } from "@/lib/firebase"
import type { Store } from "@/types/store"
import type { StackManHandSettings, RakeSettings, StackResetSettings, PokerOperationHours } from "@/types/stack-man-hand"

export default function StoreSettingsPage() {
  const { storeId: authStoreId, storeName: authStoreName, isStoreOwner, loading } = useAuth()
  const storeId = authStoreId
  const storeName = authStoreName
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [pageError, setPageError] = useState<string | null>(null)

  // Stack Man Hand Settings
  const [stackManHandEnabled, setStackManHandEnabled] = useState(false)
  const [purchasePrice, setPurchasePrice] = useState(1000)
  const [rewardBaseAmount, setRewardBaseAmount] = useState(1000)

  // Chat Poker Operation Hours
  const [pokerOpenTime, setPokerOpenTime] = useState("19:00")
  const [pokerCloseTime, setPokerCloseTime] = useState("24:00")

  useEffect(() => {
    const loadStoreSettings = async () => {
      if (!storeId) return

      try {
        const db = getDb()
        if (!db) throw new Error("Firestore is not initialized")

        const storeDoc = await getDoc(doc(db, "stores", storeId))
        if (storeDoc.exists()) {
          const storeData = storeDoc.data() as Store & {
            stackManHandSettings?: StackManHandSettings
            pokerOperationHours?: PokerOperationHours
          }

          if (storeData.stackManHandSettings) {
            setStackManHandEnabled(storeData.stackManHandSettings.enabled)
            setPurchasePrice(storeData.stackManHandSettings.purchasePrice)
            setRewardBaseAmount(storeData.stackManHandSettings.rewardBaseAmount)
          }

          if (storeData.pokerOperationHours) {
            setPokerOpenTime(storeData.pokerOperationHours.open)
            setPokerCloseTime(storeData.pokerOperationHours.close)
          }
        }
      } catch (error) {
        console.error("Error loading store settings:", error)
      }
    }

    if (!loading && storeId) {
      loadStoreSettings()
    }
  }, [loading, storeId])

  const calculateDuration = (open: string, close: string) => {
    const [openH, openM] = open.split(":").map(Number)
    const [closeH, closeM] = close.split(":").map(Number)
    
    let durationMin = (closeH * 60 + closeM) - (openH * 60 + openM)
    if (durationMin < 0) {
      durationMin += 24 * 60 // 日を跨ぐ場合
    }
    return durationMin / 60
  }

  const handleSave = async () => {
    if (!storeId) return
    setPageError(null)

    const duration = calculateDuration(pokerOpenTime, pokerCloseTime)
    if (duration > 5) {
      setPageError("稼働時間は最大5時間まで設定可能です。")
      return
    }

    setSaving(true)
    try {
      const db = getDb()
      if (!db) throw new Error("Firestore is not initialized")

      const storeRef = doc(db, "stores", storeId)
      
      await updateDoc(storeRef, {
        stackManHandSettings: {
          enabled: stackManHandEnabled,
          purchasePrice: Number(purchasePrice),
          rewardBaseAmount: Number(rewardBaseAmount),
        },
        pokerOperationHours: {
          open: pokerOpenTime,
          close: pokerCloseTime,
        },
        updatedAt: new Date(),
      })

      // alert("設定を保存しました") // アラートは不要、成功メッセージは別途検討
    } catch (error) {
      console.error("Error saving settings:", error)
      const errorMessage = error instanceof Error ? error.message : String(error);
        setPageError(`設定の保存に失敗しました。エラー: ${errorMessage}`);
    } finally {
      setSaving(false)
    }
  }

  return (
    <AuthGuard>
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4">
          <div className="mb-6">
            <button
              onClick={() => router.push("/admin")}
              className="text-blue-600 hover:text-blue-800"
            >
              ← 管理画面に戻る
            </button>
          </div>

          <h1 className="text-3xl font-bold text-gray-900 mb-2">店舗設定</h1>
          <p className="text-gray-600 mb-8">{storeName}</p>

          {pageError && (
            <Alert variant="destructive" className="mb-6">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>エラー</AlertTitle>
              <AlertDescription>{pageError}</AlertDescription>
            </Alert>
          )}

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
                      </label>
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
                        報酬ベース額（店舗チップ）
                      </label>
                      <input
                        type="number"
                        value={rewardBaseAmount}
                        onChange={(e) => setRewardBaseAmount(Number(e.target.value))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md"
                        min="0"
                      />
                    </div>
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
                <p className="font-medium mb-1">稼働ルール</p>
                <ul className="list-disc list-inside space-y-1">
                  <li>稼働時間は**最大5時間**まで設定可能です。</li>
                  <li>稼働終了後、**1時間は購入専用タイム**となり、SMHの購入のみ可能です。</li>
                  <li>購入専用タイム終了後、スタックは自動的にリセット（1万回復 or 20%レーキ）されます。</li>
                </ul>
              </div>
            </div>

            <div className="flex justify-end pt-4">
              <button
                onClick={handleSave}
                disabled={saving}
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-8 rounded-lg shadow-lg transition duration-200 disabled:opacity-50"
              >
                {saving ? "保存中..." : "設定を保存する"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </AuthGuard>
  )
}
