/**
 * Stack Man Hand system helper functions
 */

import { collection, doc, getDoc, addDoc, updateDoc, query, where, getDocs, Timestamp, serverTimestamp } from "firebase/firestore"
import { getDb } from "./firebase"
import type { Card, Suit, Rank } from "@/types/poker"
import type { StackManHand, StackManHandSettings } from "@/types/stack-man-hand"

/**
 * Generate a random poker hand (2 cards)
 */
export const generateRandomHand = (): Card[] => {
  const suits: Suit[] = ["hearts", "diamonds", "clubs", "spades"]
  const ranks: Rank[] = ["2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K", "A"]
  
  const deck: Card[] = []
  for (const suit of suits) {
    for (const rank of ranks) {
      deck.push({ suit, rank })
    }
  }
  
  // Shuffle deck
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]]
  }
  
  // Return first 2 cards
  return [deck[0], deck[1]]
}

/**
 * Get rank value for comparison
 */
const getRankValue = (rank: Rank): number => {
  const rankValues: Record<Rank, number> = {
    "2": 2, "3": 3, "4": 4, "5": 5, "6": 6, "7": 7, "8": 8, "9": 9,
    "10": 10, "J": 11, "Q": 12, "K": 13, "A": 14
  }
  return rankValues[rank]
}

/**
 * Evaluate hand strength rank (S/A/B/C)
 */
export const evaluateHandStrengthRank = (cards: Card[]): "S" | "A" | "B" | "C" => {
  if (cards.length !== 2) return "C"
  
  const [card1, card2] = cards
  const rank1 = getRankValue(card1.rank)
  const rank2 = getRankValue(card2.rank)
  const suited = card1.suit === card2.suit
  const isPair = card1.rank === card2.rank
  
  // Sort ranks (high to low)
  const [high, low] = rank1 > rank2 ? [rank1, rank2] : [rank2, rank1]
  
  // S Rank: Premium hands
  if (isPair && high >= 12) return "S" // QQ, KK, AA
  if (high === 14 && low === 13 && suited) return "S" // AKs
  
  // A Rank: Strong hands
  if (isPair && high >= 10) return "A" // TT, JJ
  if (high === 14 && low === 13) return "A" // AKo
  if (high === 14 && low === 12 && suited) return "A" // AQs
  
  // B Rank: Decent hands
  if (isPair && high >= 7) return "B" // 77-99
  if (high === 14 && low >= 11 && suited) return "B" // AJs, ATs (suited)
  if (high === 13 && low === 12 && suited) return "B" // KQs
  if (high === 14 && low === 12) return "B" // AQo
  
  // C Rank: Weak hands
  return "C"
}

/**
 * Evaluate hand rank (simplified)
 */
export const evaluateHandRank = (cards: Card[]): string => {
  if (cards.length !== 2) return "不明"
  
  const [card1, card2] = cards
  const ranks = [card1.rank, card2.rank]
  const suits = [card1.suit, card2.suit]
  
  // Pair
  if (ranks[0] === ranks[1]) {
    return `ポケットペア (${ranks[0]})`
  }
  
  // Suited
  if (suits[0] === suits[1]) {
    return `スーテッド (${ranks[0]}-${ranks[1]})`
  }
  
  // Offsuit
  return `オフスート (${ranks[0]}-${ranks[1]})`
}

/**
 * Get Stack Man Hand settings for a store
 */
export const getStackManHandSettings = async (storeId: string): Promise<(StackManHandSettings & { minimumStack: number }) | null> => {
  const db = getDb()
  if (!db) throw new Error("Firestore is not initialized")
  
  const storeDoc = await getDoc(doc(db, "stores", storeId))
  if (!storeDoc.exists()) return null
  
  const storeData = storeDoc.data()
  const settings = storeData.stackManHandSettings || null
  if (!settings) return null
  
  // minimumStack を settings に追加して返す
  return {
    ...settings,
    minimumStack: storeData.stackResetSettings?.minimumStack || 10000
  }
}

/**
 * Purchase Stack Man Hand
 */export const purchaseStackManHand = async (
  storeId: string,
  playerId: string,
  playerName: string,
  customerAccountId: string // customerAccountのIDを追加
): Promise<{ success: boolean; message: string; updatedPlayer?: any }> => {
  const db = getDb()
  if (!db) throw new Error("Firestore is not initialized")
  
  try {
    // Get store settings
    const settings = await getStackManHandSettings(storeId)
    if (!settings || !settings.enabled) {
      return { success: false, message: "Stack Man Hand機能が無効です" }
    }
    
    // 顧客アカウントのドキュメント参照を取得
    const customerAccountRef = doc(db, "customerAccounts", customerAccountId);
    const customerAccountSnap = await getDoc(customerAccountRef);
    if (!customerAccountSnap.exists()) {
      return { success: false, message: "顧客アカウントが見つかりません" };
    }
    const customerAccountData = customerAccountSnap.data();

    // プレイヤーのドキュメント参照を取得
    let playerDocRef = doc(db, "players", playerId);
    let playerDocSnap = await getDoc(playerDocRef);
    
    if (!playerDocSnap.exists()) {
      playerDocRef = doc(db, "players", `store_${storeId}`, "players", playerId);
      playerDocSnap = await getDoc(playerDocRef);
    }
    
    if (!playerDocSnap.exists()) {
      return { success: false, message: "プレイヤーが見つかりません" };
    }
    const playerData = playerDocSnap.data();

    // stapokaBalanceが未定義、または0の場合、playerDataから取得し、customerAccountsを更新
    let currentStapokaBalance = customerAccountData.stapokaBalance ?? 0;
    const playerStapokaBalance = playerData.stapokaBalance ?? 0;

    if (currentStapokaBalance === 0 && playerStapokaBalance > 0) {
      currentStapokaBalance = playerStapokaBalance;
      await updateDoc(customerAccountRef, {
        stapokaBalance: currentStapokaBalance,
        updatedAt: serverTimestamp(),
      });
    } else if (currentStapokaBalance === undefined) {
      // 初回ロード時など、stapokaBalanceがcustomerAccountsに存在しない場合
      // 注意: systemBalance（貯スタック）を使用してはいけない。
      // stapokaBalance（スタポカ貯スタック）は、チャットのポーカーゲーム内で獲得したチップであり、
      // systemBalance（貯スタック）は、店舗が管理するスタックであり、異なるものである。
      currentStapokaBalance = 0; // 初期値は0とする
      await updateDoc(customerAccountRef, {
        stapokaBalance: currentStapokaBalance,
        updatedAt: serverTimestamp(),
      });
    }

    console.log("[Purchase] Balance check (stapokaBalance):", {
      currentStapokaBalance,
      customerStapoka: customerAccountData.stapokaBalance,
      playerStapoka: playerData.stapokaBalance,
      customerSystemBalance: customerAccountData.systemBalance
    });
    console.log("[Purchase] Initial checks passed.");

    // 購入に必要なスタポカ貯スタック (stapokaBalance) があるかチェック
    if (currentStapokaBalance < settings.purchasePrice) {
      return { success: false, message: `スタポカ貯スタックが不足しています。（${settings.purchasePrice.toLocaleString()}💰必要）` };
    }
    
    // Get minimum stack from settings (already fetched)
    const minimumStack = settings.minimumStack
    
    // Generate random hand
    const cards = generateRandomHand()
    const handRank = evaluateHandRank(cards)
    const rank = evaluateHandStrengthRank(cards)
    
    // Generate random multiplier (10-20)
    const multiplier = Math.floor(Math.random() * 11) + 10
    
    // Calculate rewards
    const baseReward = settings.rewardBaseAmount
    const finalReward = baseReward * multiplier
    
  // Calculate valid until (end of today)
  const validUntil = new Date()
  validUntil.setHours(23, 59, 59, 999)
  
  // Create Stack Man Hand
  const handsRef = collection(getDb()!, "stores", storeId, "stackManHands")
  const handData: Omit<StackManHand, "id"> = {
    userId: customerAccountId,
    userName: playerName,
    storeId,
    cards,
    handRank: "",
    rank,
    purchasePrice: settings.purchasePrice,
    multiplier,
    baseReward,
    finalReward,
    purchasedAt: Timestamp.now(),
    validUntil: Timestamp.fromDate(validUntil),
    // ステータス管理は不要になったため、activeで固定
    status: "active", 
  }
    
    console.log("[Purchase] Attempting to add new Stack Man Hand to Firestore.");
    let handDocRef;
    try {
      handDocRef = await addDoc(handsRef, handData);
      console.log("[Purchase] Stack Man Hand added successfully with ID:", handDocRef.id);
    } catch (addError: any) {
      console.error("[Purchase] Error adding Stack Man Hand:", addError);
      console.error("[Purchase] Error code:", addError?.code);
      // addDocが失敗した場合、ここで即座にエラーを返す
      if (addError?.code === 'resource-exhausted') {
        console.log("[Purchase] Returning resource-exhausted error response");
        return { 
          success: false, 
          message: "Firestoreの読み取り制限に達しました。\n\n午前9時（日本時間）にリセットされます。\nしばらく待ってから再度お試しください。" 
        };
      }
      // 他のエラーもエラーレスポンスを返す（throw しない）
      console.log("[Purchase] Returning generic error response");
      return {
        success: false,
        message: `Stack Man Handの作成に失敗しました。\n\nエラー: ${addError?.message || String(addError)}`
      };
    }
    
    // スタポカ貯スタック (stapokaBalance) を減算
    const newStapokaBalance = currentStapokaBalance - settings.purchasePrice;

    // 1. プレイヤーのドキュメントを更新 (stapokaBalance)
    // 2. 顧客アカウントのドキュメントを更新 (stapokaBalance)
    // これらの更新を並列実行し、両方の完了を待つ
    const updatePromises = [
      updateDoc(playerDocRef, {
        stapokaBalance: newStapokaBalance,
        updatedAt: serverTimestamp(),
      }).catch((updateError: any) => {
        console.error("[Purchase] Error updating player document:", updateError);
        // エラーを記録しても続行
      }),
      updateDoc(customerAccountRef, {
        stapokaBalance: newStapokaBalance,
        updatedAt: serverTimestamp(),
      }).catch((updateError: any) => {
        console.error("[Purchase] Error updating customer account document:", updateError);
        // エラーを記録しても続行
      })
    ];

    // 両方の更新を待機してから成功を返す（タイムアウト付き）
    try {
      await Promise.race([
        Promise.all(updatePromises),
        new Promise((_, reject) => setTimeout(() => reject(new Error('Update timeout')), 20000))
      ]);
    } catch (error) {
      console.warn("[Purchase] Update timeout or error, but continuing:", error);
      // タイムアウトまたはエラーが発生した場合も続行
    }

    // プレイ用スタック (systemBalance) には影響を与えない
    console.log("[Purchase] All balance updates completed. Returning success.");
    const successResult = {
      success: true,
      message: "Stack Man Handを購入しました",
      handId: handDocRef.id,
      updatedPlayer: { stapokaBalance: newStapokaBalance, systemBalance: playerData.systemBalance } // updatedPlayerを返す
    };
    console.log("[Purchase] Returning success result:", successResult);
    return successResult;
    } catch (error: any) {
    console.error("Error purchasing Stack Man Hand:", error)
    
    // Check if it's a Firestore error
    if (error?.code) {
      switch (error.code) {
        case 'resource-exhausted':
          return { 
            success: false, 
            message: "Firestoreの読み取り制限に達しました。\n\n午前9時（日本時間）にリセットされます。\nしばらく待ってから再度お試しください。" 
          }
        case 'permission-denied':
          return { 
            success: false, 
            message: "アクセス権限がありません。\n\n再度ログインしてください。" 
          }
        case 'unavailable':
          return { 
            success: false, 
            message: "Firestoreに接続できません。\n\nネットワーク接続を確認してください。" 
          }
        default:
          return { 
            success: false, 
            message: `購入に失敗しました\n\nエラーコード: ${error.code}` 
          }
      }
    }
    
    const errorMessage = error instanceof Error ? error.message : String(error)
    return { success: false, message: `購入に失敗しました\n\n${errorMessage}` }
  }
}

/**
 * Get player's active Stack Man Hands
 */
export const getActiveStackManHands = async (
  storeId: string,
  userId: string
): Promise<StackManHand[]> => {
  const db = getDb()
  if (!db) throw new Error("Firestore is not initialized")
  
  const handsRef = collection(getDb()!, "stores", storeId, "stackManHands")
  const handsQuery = query(
    handsRef,
    where("userId", "==", userId),
  )
  
  const snapshot = await getDocs(handsQuery)
  const hands = snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
  })) as StackManHand[]

  // クライアント側で status === "active" のフィルタリングと purchasedAt の降順にソート
  return hands.filter(hand => hand.status === "active").sort((a, b) => b.purchasedAt.toMillis() - a.purchasedAt.toMillis())
}

/**
 * Get player's Stack Man Hands purchased today
 * Now returns hands purchased within the last 3 days.
 */
export const getTodayStackManHands = async (
  storeId: string,
  userId: string
): Promise<StackManHand[]> => {
  try {
    const db = getDb()
    if (!db) throw new Error("Firestore is not initialized")
    
    // 本日の開始と終了時刻を計算
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const todayStart = Timestamp.fromDate(today)
    
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)
    const todayEnd = Timestamp.fromDate(tomorrow)
    
    // Firestore クエリで本日のハンドのみを取得
    const handsRef = collection(getDb()!, "stores", storeId, "stackManHands")
    const handsQuery = query(
      handsRef,
      where("userId", "==", userId),
      where("purchasedAt", ">=", todayStart),
      where("purchasedAt", "<", todayEnd)
    )
    
    const snapshot = await getDocs(handsQuery)
    const hands = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    })) as StackManHand[]

    return hands.sort((a, b) => b.purchasedAt.toMillis() - a.purchasedAt.toMillis())
  } catch (error) {
    console.error("Error getting today's Stack Man Hands:", error)
    return [] // エラー時は空配列を返す
  }
}

/**
 * Calculate remaining purchases for today
 */
export const calculateRemainingPurchases = async (
  storeId: string,
  userId: string,
  maxPurchases: number
): Promise<number> => {
  try {
    const todayHands = await getTodayStackManHands(storeId, userId)
    return Math.max(0, maxPurchases - todayHands.length)
  } catch (error) {
    console.error("Error calculating remaining purchases:", error)
    return maxPurchases // エラー時は最大値を返す
  }
}

/**
 * Cleanup old Stack Man Hands
 */
export const cleanupStackManHands = async (storeId: string): Promise<void> => {
  try {
    const db = getDb()
    if (!db) throw new Error("Firestore is not initialized")
    
    const handsRef = collection(getDb()!, "stores", storeId, "stackManHands")
    const snapshot = await getDocs(handsRef)
    
    const now = new Date()
    const deletePromises = snapshot.docs
      .filter(doc => {
        const hand = doc.data() as StackManHand
        return hand.validUntil.toDate() < now
      })
      .map(doc => doc.ref.delete())
    
    await Promise.all(deletePromises)
  } catch (error) {
    console.error("Error cleaning up Stack Man Hands:", error)
    // エラーが発生しても続行
  }
}

/**
 * Fetch today's hands for a player
 */
export const fetchTodayHands = async (storeId: string, userId: string): Promise<StackManHand[]> => {
  try {
    return await getTodayStackManHands(storeId, userId)
  } catch (error) {
    console.error("Error fetching today's hands:", error)
    return []
  }
}
