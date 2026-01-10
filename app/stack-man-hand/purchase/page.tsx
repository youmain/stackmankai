"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { doc, getDoc, collection, query, where, getDocs, writeBatch } from "firebase/firestore"
import { getDb } from "@/lib/firebase"
import { useAuth } from "@/contexts/auth-context"
import { getStackManHandSettings, purchaseStackManHand, getTodayStackManHands, calculateRemainingPurchases } from "@/lib/stack-man-hand"
import { isWithinOperationHours, isWithinPurchaseWindow } from "@/lib/utils"
import type { StackManHandSettings, StackManHand } from "@/types/stack-man-hand"
import { PlayingCard } from "@/components/poker-table/playing-card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";

export default function StackManHandPurchasePage() {
  const router = useRouter()
  const { user, customerAccount, loading: authLoading, error: authError } = useAuth();
  const [loading, setLoading] = useState(true)
  const [purchasing, setPurchasing] = useState(false)
  const [pageError, setPageError] = useState<string | null>(null)
  const [settings, setSettings] = useState<StackManHandSettings | null>(null)
  const [todayHands, setTodayHands] = useState<StackManHand[]>([])
  const [currentStack, setCurrentStack] = useState(0)
  const [remainingPurchases, setRemainingPurchases] = useState(0)
  const [maxPurchases, setMaxPurchases] = useState(0)
  const [purchasedToday, setPurchasedToday] = useState(0)
  const [minimumStack, setMinimumStack] = useState(10000)
  const [playerName, setPlayerName] = useState("")
  const [storeName, setStoreName] = useState("")

  useEffect(() => {
    const loadData = async () => {
      if (authLoading) {
        return
      }

      if (!customerAccount) {
        console.log("[Purchase] No customerAccount found")
        return
      }

      try {
        console.log("[Purchase] Loading data for customerAccount:", customerAccount)
        
        const storeId = customerAccount.storeId
        const playerId = customerAccount.playerId
        
        if (!storeId || !playerId) {
          setPageError("店舗IDまたはプレイヤーIDが見つかりません。")
          return
        }

        const storeSettings = await getStackManHandSettings(storeId)
        if (!storeSettings || !storeSettings.enabled) {
          alert("Stack Man Hand機能が無効です")
          router.push("/customer-view")
          return
        }
        setSettings(storeSettings)

        const db = getDb()!
        const storeDocSnap = await getDoc(doc(db, "stores", storeId))
        if (storeDocSnap.exists()) {
          const rawStoreData = storeDocSnap.data();
          const storeData = {
            ...rawStoreData,
            createdAt: rawStoreData.createdAt && typeof rawStoreData.createdAt === 'object' && '_seconds' in rawStoreData.createdAt ? new Date(rawStoreData.createdAt._seconds * 1000).toISOString() : rawStoreData.createdAt,
            updatedAt: rawStoreData.updatedAt && typeof rawStoreData.updatedAt === 'object' && '_seconds' in rawStoreData.updatedAt ? new Date(rawStoreData.updatedAt._seconds * 1000).toISOString() : rawStoreData.updatedAt,
          };
          console.log("[Purchase] Store data loaded:", storeData)

          setStoreName(storeData.storeName || storeData.name || "")
          setMinimumStack(storeData.stackResetSettings?.minimumStack || 10000)

          if (storeData.pokerOperationHours && typeof storeData.pokerOperationHours === 'object') {
            const processedPokerOperationHours = {
              open: String(storeData.pokerOperationHours.open),
              close: String(storeData.pokerOperationHours.close),
            };
            const isOperating = isWithinOperationHours(processedPokerOperationHours);
            const isPurchasing = isWithinPurchaseWindow(processedPokerOperationHours);
            if (!isOperating && !isPurchasing) {
              const { open, close } = storeData.pokerOperationHours
              setPageError(`現在は購入時間外です。購入可能時間: ${open || '不明'} - ${close || '不明'} (終了後1時間まで)`);
              return
            }
          }
        }

        // プレイヤー情報の取得
        let playerDocRef = doc(db, "players", `store_${storeId}`, "players", playerId);
        let playerDocSnap = await getDoc(playerDocRef);
        
        if (!playerDocSnap.exists()) {
          console.log("[Purchase] Player not found by Doc ID, searching by uniqueId:", playerId)
          const playersCollectionRef = collection(db, "players", `store_${storeId}`, "players");
          const q = query(playersCollectionRef, where("uniqueId", "==", isNaN(Number(playerId)) ? playerId : Number(playerId)));
          const querySnapshot = await getDocs(q);
          if (!querySnapshot.empty) {
            playerDocSnap = querySnapshot.docs[0];
          }
        }

        if (!playerDocSnap.exists()) {
          setPageError(`プレイヤー情報が見つかりません。プレイヤーID: ${playerId}`);
          return
        }

        const playerData = playerDocSnap.data();
        const actualPlayerDocId = playerDocSnap.id;
        console.log("[Purchase] Player data loaded:", playerData, "Actual Doc ID:", actualPlayerDocId)

        const stack = playerData.stapokaBalance ?? playerData.systemBalance ?? 0
        setCurrentStack(stack)
        setPlayerName(playerData.name || customerAccount.playerName || "")

        const { cleanupStackManHands } = await import("@/lib/stack-man-hand")
        await cleanupStackManHands(storeId)

        const hands = await getTodayStackManHands(storeId, actualPlayerDocId)
        const processedHands = hands.map(hand => ({
          ...hand,
          purchasedAt: (hand.purchasedAt as any)?.toDate?.()?.toISOString() || (hand.purchasedAt as any),
          validUntil: (hand.validUntil as any)?.toDate?.()?.toISOString() || (hand.validUntil as any),
        }))
        setTodayHands(processedHands)

        const purchaseInfo = await calculateRemainingPurchases(storeId, actualPlayerDocId, stack)
        setMaxPurchases(purchaseInfo.maxPurchases)
        setPurchasedToday(purchaseInfo.purchasesToday)
        setRemainingPurchases(purchaseInfo.remaining)

      } catch (error) {
        console.error("Error loading data:", error)
        setPageError(`データの読み込みに失敗しました。エラー: ${error instanceof Error ? error.message : String(error)}`)
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [authLoading, customerAccount, router])

  const handlePurchase = async () => {
    if (!settings || !customerAccount || purchasing) return

    setPurchasing(true)
    setPageError(null)

    try {
      const result = await purchaseStackManHand(customerAccount.storeId, customerAccount.playerId, customerAccount.playerName || playerName)
      if (result.success) {
        alert(`Stack Man Handを${settings.purchasePrice}💰で購入しました！`)
        window.location.reload()
      } else {
        setPageError(result.message)
      }
    } catch (error) {
      console.error("Error purchasing Stack Man Hand:", error)
      setPageError(`購入処理中にエラーが発生しました: ${error instanceof Error ? error.message : String(error)}`)
    } finally {
      setPurchasing(false)
    }
  }

  if (authLoading || loading) {
    return <div className="container mx-auto p-4">読み込み中...</div>
  }

  if (authError) {
    return <div className="container mx-auto p-4 text-red-500">認証エラー: {authError.message}</div>
  }

  if (!customerAccount) {
    return <div className="container mx-auto p-4 text-red-500">顧客アカウント情報が見つかりません。</div>
  }

  if (pageError) {
    return (
      <div className="container mx-auto p-4">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>エラー</AlertTitle>
          <AlertDescription>{pageError}</AlertDescription>
        </Alert>
        <button 
          onClick={() => window.location.reload()} 
          className="mt-4 bg-gray-500 text-white px-4 py-2 rounded"
        >
          再試行
        </button>
      </div>
    )
  }

  const isPurchaseButtonDisabled = purchasing || remainingPurchases <= 0 || (currentStack - minimumStack) < (settings?.purchasePrice || 0)

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Stack Man Hand 購入</h1>
      <div className="bg-white shadow rounded-lg p-6 mb-6">
        <p className="mb-2"><strong>店舗:</strong> {storeName}</p>
        <p className="mb-2"><strong>プレイヤー:</strong> {playerName}</p>
        <p className="mb-2"><strong>現在のスタック:</strong> {currentStack.toLocaleString()}💰</p>
        <p className="mb-2"><strong>最低保証額:</strong> {minimumStack.toLocaleString()}💰</p>
        <p className="mb-2"><strong>購入可能回数:</strong> {remainingPurchases}回 / 最大{maxPurchases}回 (本日{purchasedToday}回購入済み)</p>
        <p className="mb-4"><strong>購入価格:</strong> {settings?.purchasePrice.toLocaleString()}💰</p>

        <button
          onClick={handlePurchase}
          disabled={isPurchaseButtonDisabled}
          className={`w-full py-3 rounded-lg font-bold text-white transition-colors ${
            isPurchaseButtonDisabled 
              ? 'bg-gray-400 cursor-not-allowed' 
              : 'bg-blue-600 hover:bg-blue-700'
          }`}
        >
          {purchasing ? '処理中...' : 'Stack Man Handを購入'}
        </button>
        
        {currentStack - minimumStack < (settings?.purchasePrice || 0) && (
          <p className="text-red-500 text-sm mt-2">
            ※最低保証額を差し引いた残高が不足しているため購入できません。
          </p>
        )}
      </div>

      <h2 className="text-xl font-bold mt-8 mb-4">本日のStack Man Hand履歴</h2>
      {todayHands.length === 0 ? (
        <p className="text-gray-500">本日の購入履歴はありません。</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {todayHands.map((hand) => (
            <div key={hand.id} className="bg-white border p-4 rounded-lg shadow-sm">
              <div className="flex justify-between items-start mb-2">
                <span className={`px-2 py-1 rounded text-xs font-bold ${
                  hand.rank === 'S' ? 'bg-yellow-100 text-yellow-800' :
                  hand.rank === 'A' ? 'bg-red-100 text-red-800' :
                  hand.rank === 'B' ? 'bg-blue-100 text-blue-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  ランク {hand.rank}
                </span>
                <span className="text-xs text-gray-500">
                  {hand.purchasedAt ? new Date(hand.purchasedAt).toLocaleTimeString() : '不明'}
                </span>
              </div>


              <div className="flex space-x-2 mb-3">
                {hand.cards.map((card, index) => (
                  <PlayingCard key={index} card={card as any} faceDown={false} />
                ))}
              </div>
              <div className="border-t pt-2 mt-2 text-sm">
                <p>倍率: x{hand.multiplier}</p>
                <p className="font-bold text-blue-600">獲得報酬: {hand.finalReward.toLocaleString()}💰</p>
              </div>
            </div>
          ))}
        </div>
      )}
      
      <div className="mt-8">
        <button 
          onClick={() => router.push('/customer-view')}
          className="text-blue-600 hover:underline"
        >
          ← 戻る
        </button>
      </div>
    </div>
  )
}
