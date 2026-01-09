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
      // Wait for auth to load
      if (authLoading) {
        return // Still loading
      }


      try {
        // Load settings
        try {
          console.log('[Purchase] Loading settings for store:', customerAccount.storeId)
          const storeSettings = await getStackManHandSettings(customerAccount.storeId)
          console.log('[Purchase] Settings loaded:', storeSettings)
          if (!storeSettings || !storeSettings.enabled) {
            alert("Stack Man Hand機能が無効です")
            router.push("/customer-view")
            return
          }
          setSettings(storeSettings)
        } catch (settingsError) {
          console.error('[Purchase] Error loading settings:', settingsError)
          throw new Error(`設定の読み込みに失敗しました: ${settingsError instanceof Error ? settingsError.message : String(settingsError)}`)
        }

        // Check operation hours and purchase window
        // Note: Temporarily disabled to debug indexOf error
        // const db = getDb()!
        // const storeDocSnap = await getDoc(doc(db, "stores", customerAccount.storeId))
        // if (storeDocSnap.exists()) {
        //   const storeData = storeDocSnap.data()
        //   console.log('[Purchase] Store data loaded:', storeData)
        //   console.log('[Purchase] pokerOperationHours:', storeData?.pokerOperationHours)
        //   if (storeData?.pokerOperationHours && typeof storeData.pokerOperationHours === 'object') {
        //     try {
        //       console.log('[Purchase] Checking operation hours...')
        //       const isOperating = isWithinOperationHours(storeData.pokerOperationHours)
        //       console.log('[Purchase] isOperating:', isOperating)
        //       const isPurchasing = isWithinPurchaseWindow(storeData.pokerOperationHours)
        //       console.log('[Purchase] isPurchasing:', isPurchasing)
        //       
        //       if (!isOperating && !isPurchasing) {
        //         const operationHours = storeData.pokerOperationHours
        //         const openTime = typeof operationHours.open === 'string' ? operationHours.open : '不明'
        //         const closeTime = typeof operationHours.close === 'string' ? operationHours.close : '不明'
        //         setPageError(`現在は購入時間外です。購入可能時間: ${openTime} - ${closeTime} (終了後1時間まで)`);
        //         // router.push("/customer-view") // エラー表示のためリダイレクトを一時停止
        //         return
        //       }
        //     } catch (error) {
        //       console.error('[Purchase] Error checking operation hours:', error)
        //       console.error('[Purchase] Error details:', error instanceof Error ? error.message : String(error))
        //       // 営業時間チェックに失敗した場合は続行（24時間営業と見なす）
        //     }
        //   }
        // }

        // Get current stack from Firestore
        console.log("[Purchase] Searching for player:", {
          storeId: customerAccount.storeId,
          playerId: customerAccount.playerId,
          type: typeof customerAccount.playerId
        })
        
        // 店舗分離構造に対応: players/store_{storeId}/players/{playerId}
        let playerDoc = null
        let playerData = null

        // --- プレイヤーデータ検索ロジックの開始 ---
        // customerAccount.playerId は実際には uniqueId である可能性を考慮し、uniqueIdで検索する
        const findPlayerByUniqueId = async (storeId: string, uniqueId: string) => {
          const db = getDb()!;
          const playersCollectionRef = collection(getDb()!, "players", `store_${storeId}`, "players");
          const q = query(playersCollectionRef, where("uniqueId", "==", uniqueId));
          const querySnapshot = await getDocs(q);

          if (!querySnapshot.empty) {
            const docSnap = querySnapshot.docs[0];
            console.log("[Purchase] ✅ Player found by uniqueId in store-isolated structure.");
            return { doc: docSnap, data: docSnap.data() };
          }
          return null;
        };

        // --- 自動修復ロジックの開始 ---
        // 古いパスにデータがあるか確認し、新しいパスにコピーする
        const repairPlayerData = async () => {
          const db = getDb()!;
          const oldPlayerDocRef = doc(db, "players", customerAccount.playerId);
          const oldPlayerDocSnap = await getDoc(oldPlayerDocRef);

          if (oldPlayerDocSnap.exists()) {
            console.log("[Purchase] Player found in old flat structure. Initiating repair...");
            const oldData = oldPlayerDocSnap.data();

            const newPlayerDocRef = doc(
              db,
              "players",
              `store_${customerAccount.storeId}`,
              "players",
              customerAccount.playerId
            );

            const batch = writeBatch(db);
            batch.set(newPlayerDocRef, { ...oldData, storeId: customerAccount.storeId, updatedAt: new Date() }, { merge: true });
            // 古いデータは削除しない（既存機能との互換性のため）
            // batch.delete(oldPlayerDocRef);

            await batch.commit();
            console.log("[Purchase] Player data repaired and copied to new store-isolated structure.");
            return true;
          }
          return false;
        };

        // 自動修復を試みる
        const repaired = await repairPlayerData();
        if (repaired) {
          console.log("[Purchase] Player data repair successful.");
        } else {
          console.log("[Purchase] No player data repair needed or old data not found.");
        }
        // --- 自動修復ロジックの終了 ---
        
        try {
          console.log("[Purchase] Getting player from store-isolated structure by uniqueId...");
          const foundPlayer = await findPlayerByUniqueId(customerAccount.storeId, customerAccount.playerId);
          
          if (foundPlayer) {
            playerDoc = foundPlayer.doc;
            playerData = foundPlayer.data;
          } else {
            console.log("[Purchase] Player not found by uniqueId in store-isolated structure.");
          }
        } catch (error) {
          console.error("[Purchase] Error getting player by uniqueId:", error);
        }
        
        // If still not found, show error
        if (!playerDoc || !playerData) {
          console.error("[Purchase] Player not found:", {
            playerId: customerAccount.playerId,
            storeId: customerAccount.storeId
          })
          setPageError(`プレイヤー情報が見つかりません。プレイヤーID: ${customerAccount.playerId}`);
          // router.push("/customer-view") // エラー表示のためリダイレクトを一時停止
          return
        }
        
        console.log("[Purchase] Player data loaded:", {
          id: playerDoc.id,
          name: playerData.name,
          storeId: playerData.storeId,
          systemBalance: playerData.systemBalance,
          stapokaBalance: playerData.stapokaBalance
        })
        
        // Verify storeId matches (but don't fail if it doesn't)
        if (playerData.storeId !== customerAccount.storeId) {
          console.warn("[Purchase] StoreId mismatch:", {
            expected: customerAccount.storeId,
            actual: playerData.storeId
          })
        }

        // スタポカバランスがない場合はsystemBalanceを使用（既存プレイヤー対応）
        const stack = playerData.stapokaBalance ?? playerData.systemBalance ?? 0
        setCurrentStack(stack)
        setPlayerName(playerData.name || customerAccount.playerName || "")

        // Run cleanup before loading hands
        const { cleanupStackManHands } = await import('@/lib/stack-man-hand')
        await cleanupStackManHands(customerAccount.storeId)

        // Load today's hands (now includes last 3 days)
        try {
          console.log('[Purchase] Loading today hands...')
          const hands = await getTodayStackManHands(customerAccount.storeId, customerAccount.playerId)
          console.log('[Purchase] Today hands loaded:', hands.length)
          setTodayHands(hands)
        } catch (error) {
          console.error('[Purchase] Error loading today hands:', error)
          console.error('[Purchase] Error details:', error instanceof Error ? error.message : String(error))
          throw error
        }

        // Calculate remaining purchases
        try {
          console.log('[Purchase] Calculating remaining purchases...')
          const purchaseInfo = await calculateRemainingPurchases(customerAccount.storeId, customerAccount.playerId, stack)
          console.log('[Purchase] Purchase info:', purchaseInfo)
          setMaxPurchases(purchaseInfo.maxPurchases)
          setPurchasedToday(purchaseInfo.purchasedToday)
          setRemainingPurchases(purchaseInfo.remaining)
        } catch (error) {
          console.error('[Purchase] Error calculating remaining purchases:', error)
          console.error('[Purchase] Error details:', error instanceof Error ? error.message : String(error))
          throw error
        }
        
        // Get minimum stack from store
        const storeDoc = await getDoc(doc(getDb()!, "stores", customerAccount.storeId))
        if (storeDoc.exists()) {
          const storeData = storeDoc.data()
          setMinimumStack(storeData.stackResetSettings?.minimumStack || 10000)
          setStoreName(storeData.storeName || storeData.name || "")
        }
      } catch (error) {
        console.error("Error loading data:", error)
        console.error("Error stack:", error instanceof Error ? error.stack : 'No stack trace')
        console.error("Error type:", typeof error)
        console.error("Error constructor:", error?.constructor?.name)
        const errorMessage = error instanceof Error ? error.message : String(error)
        const errorDetails = error instanceof Error ? error.stack : JSON.stringify(error)
        console.error("Error details:", errorDetails)
        setPageError(`データの読み込みに失敗しました。エラー: ${errorMessage}\n詳細: ${errorDetails}`);
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [user, customerAccount, authLoading, router])

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
        // 購入成功後、自動的にページをリロードして購入したハンドを表示
        window.location.reload()
      } else {
        // Show error message from the purchase function
        setPageError(`購入に失敗しました。${result.message}`);
        setPurchasing(false)
      }
    } catch (error) {
      console.error("Error purchasing Stack Man Hand:", error)
      const errorMessage = error instanceof Error ? error.message : String(error)
      setPageError(`購入に失敗しました。${errorMessage}`);
      setPurchasing(false)
    }
  }

  // 認証情報のロード中、またはプレイヤー情報が不完全な場合はローディング表示
  if (authLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <p>認証情報を読み込み中...</p>
      </div>
    );
  }

  // 認証エラーがある場合
  if (authError) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{authError}</AlertDescription>
        </Alert>
      </div>
    );
  }

  // プレイヤーアカウントではない場合、またはstoreId/playerIdが取得できない場合
  // ここでstoreIdとplayerIdが確実に存在することをチェック
  if (!user || user.role !== "customer" || !user.storeId || !customerAccount?.playerId) {
    // エラーメッセージを表示するか、ログインページにリダイレクト
    // 例: router.push("/customer-auth");
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            プレイヤー情報が見つかりません。再度ログインし、プレイヤーIDが紐付けられているかご確認ください。
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  if (!settings) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>エラー</AlertTitle>
          <AlertDescription>Stack Man Hand機能が無効です。</AlertDescription>
        </Alert>
      </div>
    );
  }

  // ページ固有のエラーメッセージを表示
  if (pageError) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>エラー</AlertTitle>
          <AlertDescription>{pageError}</AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <h1 className="text-xl sm:text-2xl font-bold text-purple-800">Stack Man Hand 購入</h1>
            </div>
            <button
              onClick={() => router.push("/customer-view")}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
            >
              ← マイページに戻る
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="max-w-2xl mx-auto">
        {/* Player Info */}
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg shadow-lg p-6 mb-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4">プレイヤー情報</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <p className="text-sm text-gray-600">プレイヤー名</p>
              <p className="text-lg font-semibold text-gray-800">{playerName}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">店舗名</p>
              <p className="text-lg font-semibold text-gray-800">{storeName}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">プレイヤーID</p>
              <p className="text-lg font-semibold text-gray-800">{customerAccount?.playerId}</p>
            </div>
          </div>
        </div>

	        {/* Description */}
	        <div className="text-center mb-8">
	          <p className="text-gray-600">ランダムなポーカーハンドを購入して、店舗で報酬を獲得しよう！</p>
	          <p className="text-sm text-red-500 font-semibold mt-2">
	            ※購入したハンドは当日の営業終了まで有効です。履歴は3日間保存され、4日目に自動削除されます。
	          </p>
	        </div>

        {/* Settings Info */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4">店舗設定</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-600">購入価格</p>
              <p className="text-2xl font-bold text-blue-600">{settings?.purchasePrice?.toLocaleString() ?? '---'}💰</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">報酬ベース額</p>
              <p className="text-2xl font-bold text-green-600">{settings?.rewardBaseAmount?.toLocaleString() ?? '---'}💰</p>
            </div>
            <div className="col-span-2">
              <p className="text-sm text-gray-600">営業時間</p>
              <p className="text-lg font-semibold text-gray-800">
                {settings?.businessHours?.open ?? '---'} - {settings?.businessHours?.close ?? '---'}
              </p>
            </div>
          </div>
        </div>

        {/* Current Stack */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4">現在の状況</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-600">スタポカ貯スタック</p>
              <p className="text-2xl font-bold text-green-600">{currentStack.toLocaleString()}💰</p>
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
              {purchasing ? "購入中..." : `Stack Man Handを購入（${settings?.purchasePrice?.toLocaleString() ?? '---'}💰）`}
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
            <div className="mb-4">
              <h2 className="text-xl font-bold text-gray-800">本日購入したハンド</h2>
            </div>
            <div className="grid grid-cols-1 gap-3">
              {todayHands.map((hand) => {
                const rankConfig = {
                  S: {
                    bg: "bg-gradient-to-r from-yellow-50 to-orange-50",
                    border: "border-yellow-400",
                    badge: "bg-gradient-to-r from-yellow-400 to-orange-500",
                    emoji: "✨",
                    shadow: "shadow-lg shadow-yellow-500/20"
                  },
                  A: {
                    bg: "bg-gradient-to-r from-purple-50 to-pink-50",
                    border: "border-purple-400",
                    badge: "bg-gradient-to-r from-purple-400 to-pink-500",
                    emoji: "⭐",
                    shadow: "shadow-lg shadow-purple-500/20"
                  },
                  B: {
                    bg: "bg-gradient-to-r from-blue-50 to-cyan-50",
                    border: "border-blue-400",
                    badge: "bg-gradient-to-r from-blue-400 to-cyan-500",
                    emoji: "⚡",
                    shadow: "shadow-md shadow-blue-500/20"
                  },
                  C: {
                    bg: "bg-gray-50",
                    border: "border-gray-300",
                    badge: "bg-gradient-to-r from-gray-400 to-gray-500",
                    emoji: "◆",
                    shadow: "shadow"
                  }
                }
	                const config = rankConfig[hand.rank]
	                
	                // validUntilをDateオブジェクトに変換
	                const validUntilDate = hand.validUntil.toDate()
	                const validUntilString = validUntilDate.toLocaleDateString('ja-JP', {
	                  year: 'numeric',
	                  month: '2-digit',
	                  day: '2-digit',
	                }).replace(/\//g, '/')
	                
	                return (
	                  <div
	                    key={hand.id}
	                    onClick={() => router.push(`/stack-man-hand/display/${hand.id}`)}
	                    className={`border-2 ${config.border} ${config.bg} rounded-xl p-4 cursor-pointer hover:scale-[1.02] transition-all ${config.shadow}`}
	                  >
	                    <div className="flex items-center justify-between mb-3">
	                      <div className={`${config.badge} text-white px-3 py-1 rounded-lg text-sm font-bold flex items-center gap-1`}>
	                        <span>{config.emoji}</span>
	                        <span>{hand.rank} RANK</span>
	                      </div>
	                      <div className="text-right">
		                        <p className="text-xs text-gray-500 mb-1">有効期限: {validUntilString}</p>
	                        <p className="text-2xl font-bold text-purple-600">{hand.multiplier}x</p>
	                      </div>
	                    </div>
	                    <div className="flex items-center justify-between">
	                      <div className="flex items-center gap-3">
	                        <div className="flex gap-2">
	                          {hand.cards.map((card, idx) => (
	                            <PlayingCard
	                              key={idx}
	                              card={{ suit: card.suit, rank: card.rank }}
	                              size="md"
	                            />
	                          ))}
	                        </div>
	                        <p className="text-base font-semibold text-gray-800">{hand.handRank}</p>
	                      </div>
	                      <div className="text-right">
	                        <p className="text-lg font-bold text-orange-600">{hand.finalReward.toLocaleString()}💰</p>
	                      </div>
	                    </div>
	                  </div>
	                )
	              })}
	            </div>
          </div>
        )}

      </div>
      </div>
    </div>
  )
}
