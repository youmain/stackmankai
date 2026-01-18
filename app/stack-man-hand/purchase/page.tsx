"use client"

import { useEffect, useState, useRef } from "react"
import { useRouter } from "next/navigation"
import { doc, getDoc } from "firebase/firestore"
import { getDb } from "@/lib/firebase"
import { useAuth } from "@/contexts/auth-context"
import { getStackManHandSettings, purchaseStackManHand, getTodayStackManHands } from "@/lib/stack-man-hand"
import { isWithinOperationHours, isWithinPurchaseWindow } from "@/lib/utils"
import type { StackManHandSettings, StackManHand } from "@/types/stack-man-hand"
import { PlayingCard } from "@/components/poker-table/playing-card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";

export default function StackManHandPurchasePage() {
  const router = useRouter()
  const { user, customerAccount, setCustomerAccount, loading: authLoading, error: authError } = useAuth();
  const [loading, setLoading] = useState(true)
  const [purchasing, setPurchasing] = useState(false)
  const [pageError, setPageError] = useState<string | null>(null)
  const [handsError, setHandsError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [settings, setSettings] = useState<StackManHandSettings | null>(null)
  const [todayHands, setTodayHands] = useState<StackManHand[]>([])
  const [currentStack, setCurrentStack] = useState(0)
  const [remainingPurchases, setRemainingPurchases] = useState(0)
  const [maxPurchases, setMaxPurchases] = useState(25) // 初期値を 25 に設定
  const [purchasedToday, setPurchasedToday] = useState(0)
  const [minimumStack, setMinimumStack] = useState(10000)
  const [playerName, setPlayerName] = useState("")
  const [storeName, setStoreName] = useState("")


  // Stack Man Hand履歴をフェッチする関数
  const fetchTodayHands = async (storeId: string, customerAccountId: string) => {
    try {
      setHandsError(null);
      const hands = await getTodayStackManHands(storeId, customerAccountId);
      setTodayHands(hands.map(hand => ({
        ...hand,
        purchasedAt: (hand.purchasedAt as any)?.toDate?.()?.toISOString() || (hand.purchasedAt as any),
        validUntil: (hand.validUntil as any)?.toDate?.()?.toISOString() || (hand.validUntil as any),
      })));
      // 本日の購入回数を更新
      setPurchasedToday(hands.length);
      setRemainingPurchases(Math.max(0, 25 - hands.length));
    } catch (error) {
      console.error("Error fetching today's Stack Man Hands:", error);
      // ページ全体のエラーではなく、履歴読み込みのエラーとして扱う
      setHandsError(`履歴の読み込みに失敗しました。`);
    }
  };

  useEffect(() => {
    const loadData = async () => {
      if (authLoading) return;
      if (!customerAccount) return;

      try {
        const storeId = customerAccount.storeId;
        const playerId = customerAccount.playerId;
        if (!storeId || !playerId) {
          setPageError("店舗IDまたはプレイヤーIDが見つかりません。");
          return;
        }

        const storeSettings = await getStackManHandSettings(storeId);
        if (!storeSettings || !storeSettings.enabled) {
          router.push("/customer-view");
          return;
        }
        setSettings(storeSettings);

        const db = getDb()!;
        const storeDocSnap = await getDoc(doc(db, "stores", storeId));
        if (storeDocSnap.exists()) {
          const storeData = storeDocSnap.data();
          setStoreName(storeData.storeName || storeData.name || "");
          setMinimumStack(storeData.stackResetSettings?.minimumStack || 10000);
        }

        // プレイヤー情報を初期読み込み時のみ取得（onSnapshot は使用しない）
        const playerDocRef = doc(db, "players", playerId);
        const playerDocSnap = await getDoc(playerDocRef);
        if (playerDocSnap.exists()) {
          const playerData = playerDocSnap.data();
          const stack = playerData.stapokaBalance ?? 0;

          setCustomerAccount(prev => {
            if (!prev) return null;
            return {
              ...prev,
              stapokaBalance: stack,
              systemBalance: playerData.systemBalance,
            };
          });
          setCurrentStack(stack);
          setPlayerName(playerData.name || customerAccount.playerName || "");
        }

        // 本日のハンド履歴を取得
        await fetchTodayHands(storeId, customerAccount.id);

        const { cleanupStackManHands } = await import("@/lib/stack-man-hand");
        await cleanupStackManHands(storeId);

      } catch (error) {
        console.error("Error loading data:", error);
        setPageError(`データの読み込みに失敗しました。`);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [authLoading, customerAccount, router, setCustomerAccount]);

  const handlePurchase = async () => {
    if (!settings || !customerAccount || purchasing) return

    setPurchasing(true)
    setPageError(null)
    setSuccessMessage(null)

    try {
      // purchaseStackManHand を実行
      console.log("[handlePurchase] Starting purchase...");
      const result = await purchaseStackManHand(customerAccount.storeId, customerAccount.playerId, customerAccount.playerName || playerName, customerAccount.id) as any
      console.log("[handlePurchase] Purchase result:", result);
      if (!result) {
        setPageError("購入処理の結果が取得できませんでした");
      } else if (result.success) {
        // 購入成功時はメッセージを表示（alert は使用しない）
        setSuccessMessage(`Stack Man Handを${settings.purchasePrice}💰で購入しました！`);
        
        // プレイヤー情報を更新
        if (result.updatedPlayer) {
          setCustomerAccount(prev => {
            if (!prev) return null;
            return {
              ...prev,
              stapokaBalance: result.updatedPlayer.stapokaBalance,
              systemBalance: result.updatedPlayer.systemBalance,
            };
          });
          setCurrentStack(result.updatedPlayer.stapokaBalance);
        }
        
        // 注記: 履歴の更新は、ページをリロードした時に自動的に読み込まれます
      } else {
        // エラーメッセージを表示
        setPageError(result.message || "購入に失敗しました");
      }
    } catch (error) {
      console.error("Purchase error:", error);
      setPageError(`購入処理中にエラーが発生しました: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      // finally ブロックで必ず setPurchasing(false) を実行
      console.log("[handlePurchase] Finally block - setting purchasing to false");
      setPurchasing(false);
      console.log("[handlePurchase] Purchasing state updated to false");
    }
  }

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
        <div className="max-w-2xl mx-auto">
          <div className="text-center">
            <p className="text-gray-600">読み込み中...</p>
          </div>
        </div>
      </div>
    )
  }

  if (pageError) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
        <div className="max-w-2xl mx-auto">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>エラー</AlertTitle>
            <AlertDescription>{pageError}</AlertDescription>
          </Alert>
        </div>
      </div>
    )
  }

  if (!settings || !customerAccount) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
        <div className="max-w-2xl mx-auto">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>エラー</AlertTitle>
            <AlertDescription>設定またはアカウント情報が見つかりません</AlertDescription>
          </Alert>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-8 text-gray-800">Stack Man Hand 購入</h1>

        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <div className="space-y-3 mb-6">
            <div className="flex justify-between">
              <span className="text-gray-600">店舗:</span>
              <span className="font-semibold">{storeName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">プレイヤー:</span>
              <span className="font-semibold">{playerName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">スタポカ貯スタック:</span>
              <span className="font-semibold text-blue-600">{currentStack.toLocaleString()}💰</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">最低保証額:</span>
              <span className="font-semibold">{minimumStack.toLocaleString()}💰</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">購入可能回数:</span>
              <span className="font-semibold">{remainingPurchases}回 / 最大{maxPurchases}回 (本日{purchasedToday}回購入済み)</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">購入価格:</span>
              <span className="font-semibold text-red-600">{settings.purchasePrice.toLocaleString()}💰</span>
            </div>
          </div>

          <button
            onClick={handlePurchase}
            disabled={purchasing || currentStack < settings.purchasePrice}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-bold py-3 px-4 rounded-lg transition duration-200"
          >
            {purchasing ? "処理中..." : "Stack Man Handを購入"}
          </button>

          {successMessage && (
            <div className="mt-4 p-4 bg-green-100 border border-green-400 text-green-700 rounded">
              {successMessage}
            </div>
          )}

          {pageError && (
            <div className="mt-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
              {pageError}
            </div>
          )}
        </div>

        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-bold mb-4 text-gray-800">本日のStack Man Hand履歴</h2>

          {handsError && (
            <div className="p-4 bg-yellow-100 border border-yellow-400 text-yellow-700 rounded mb-4">
              {handsError}
            </div>
          )}

          {todayHands.length === 0 ? (
            <p className="text-center text-gray-500">本日の購入履歴はありません。</p>
          ) : (
            <div className="space-y-4">
              {todayHands.map((hand, index) => (
                <div key={index} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm text-gray-600">
                      {new Date(hand.purchasedAt).toLocaleString("ja-JP")}
                    </span>
                  </div>
                  <div className="flex justify-center gap-2 mb-2">
                    {hand.cards.map((card, i) => (
                      <PlayingCard key={i} suit={card.suit} rank={card.rank} />
                    ))}
                  </div>
                  <div className="flex justify-between">
                    <span>倍率: x{hand.multiplier}</span>
                    <span className="font-semibold">獲得報酬: {hand.finalReward.toLocaleString()}💰</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
