"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { doc, getDoc, collection, query, where, getDocs, setDoc, writeBatch } from "firebase/firestore"
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
      if (authLoading || !customerAccount) {
        return
      }

      try {
        const storeSettings = await getStackManHandSettings(customerAccount.storeId)
        if (!storeSettings || !storeSettings.enabled) {
          alert("Stack Man Hand機能が無効です")
          router.push("/customer-view")
          return
        }
        setSettings(storeSettings)

        const db = getDb()!
        const storeDocSnap = await getDoc(doc(db, "stores", customerAccount.storeId))
        if (storeDocSnap.exists()) {
          const rawStoreData = storeDocSnap.data()
          const storeData = {
            ...rawStoreData,
            createdAt: rawStoreData.createdAt?.toDate().toISOString() || null,
            updatedAt: rawStoreData.updatedAt?.toDate().toISOString() || null,
          }
          const storeData = {
            ...rawStoreData,
            createdAt: rawStoreData.createdAt?.toDate().toISOString() || null,
            updatedAt: rawStoreData.updatedAt?.toDate().toISOString() || null,
          }
          console.log("[Purchase] Store data loaded (initial check):", storeData)
          setStoreName(storeData.storeName || storeData.name || "")
          setMinimumStack(storeData.stackResetSettings?.minimumStack || 10000)

          if (storeData.pokerOperationHours && typeof storeData.pokerOperationHours === 'object') {
            const isOperating = isWithinOperationHours(storeData.pokerOperationHours)
            const isPurchasing = isWithinPurchaseWindow(storeData.pokerOperationHours)
            if (!isOperating && !isPurchasing) {
              const { open, close } = storeData.pokerOperationHours
              setPageError(`現在は購入時間外です。購入可能時間: ${open || '不明'} - ${close || '不明'} (終了後1時間まで)`);
              return
            }
          }
        }

        const playersCollectionRef = collection(db, "players", `store_${customerAccount.storeId}`, "players");
        const q = query(playersCollectionRef, where("uniqueId", "==", Number(customerAccount.playerId)));
        const querySnapshot = await getDocs(q);

        let playerDocSnap = querySnapshot.docs[0];
        if (!playerDocSnap) {
          setPageError(`プレイヤー情報が見つかりません。プレイヤーID: ${customerAccount.playerId}`);
          return
        }

        const playerData = playerDocSnap.data();
        const stack = playerData.stapokaBalance ?? playerData.systemBalance ?? 0
        setCurrentStack(stack)
        setPlayerName(playerData.name || customerAccount.playerName || "")

        const { cleanupStackManHands } = await import("@/lib/stack-man-hand")
        await cleanupStackManHands(customerAccount.storeId)

        const hands = await getTodayStackManHands(customerAccount.storeId, String(customerAccount.playerId))
        const processedHands = hands.map(hand => ({
          ...hand,
          purchasedAt: hand.purchasedAt?.toDate().toISOString() || null,
          validUntil: hand.validUntil?.toDate().toISOString() || null,
        }))
        setTodayHands(processedHands)

        const purchaseInfo = await calculateRemainingPurchases(customerAccount.storeId, String(customerAccount.playerId), stack)
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
      const result = await purchaseStackManHand(customerAccount.storeId, String(customerAccount.playerId), settings.purchasePrice)
      if (result.success) {
        alert(`Stack Man Handを${settings.purchasePrice}💰で購入しました！残り${result.newStack}💰`)
        setCurrentStack(result.newStack)
        setPurchasedToday(prev => prev + 1)
        setRemainingPurchases(prev => prev - 1)
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
      </div>
    )
  }

  const isPurchaseButtonDisabled = purchasing || remainingPurchases <= 0 || currentStack < (settings?.purchasePrice || 0)

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Stack Man Hand 購入</h1>
      <p className="mb-2">店舗: {storeName}</p>
      <p className="mb-2">プレイヤー: {playerName}</p>
      <p className="mb-2">現在のスタック: {currentStack}💰</p>
      <p className="mb-2">購入可能回数: {remainingPurchases}回 (本日${purchasedToday}回購入済み)</p>
      <p className="mb-4">購入価格: ${settings?.purchasePrice}💰</p>

      <button
        onClick={handlePurchase}
        disabled={isPurchaseButtonDisabled}
        className={`bg-blue-500 text-white px-4 py-2 rounded ${isPurchaseButtonDisabled ? 'opacity-50 cursor-not-allowed' : ''}`}
      >
        Stack Man Handを購入
      </button>

      <h2 className="text-xl font-bold mt-8 mb-4">本日のStack Man Hand履歴</h2>
      {todayHands.length === 0 ? (
        <p>本日の購入履歴はありません。</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {todayHands.map((hand) => (
            <div key={hand.id} className="border p-4 rounded shadow">
              <p>購入日時: {hand.purchasedAt ? new Date(hand.purchasedAt).toLocaleString() : '不明'}</p>
              <p>有効期限: {hand.validUntil ? new Date(hand.validUntil).toLocaleString() : '不明'}</p>
              <p>カード:</p>
              <div className="flex space-x-2">
                {hand.cards.map((card, index) => (
                  <PlayingCard key={index} suit={card.suit} rank={card.rank} />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
