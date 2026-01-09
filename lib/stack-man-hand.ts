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
 * Get store's Stack Man Hand settings
 */
export const getStackManHandSettings = async (storeId: string): Promise<StackManHandSettings | null> => {
  const db = getDb()
  if (!db) throw new Error("Firestore is not initialized")
  
  const storeDoc = await getDoc(doc(db, "stores", storeId))
  if (!storeDoc.exists()) return null
  
  const storeData = storeDoc.data()
  return storeData.stackManHandSettings || null
}

/**
 * Purchase Stack Man Hand
 */
export const purchaseStackManHand = async (
  storeId: string,
  userId: string,
  userName: string
): Promise<{ success: boolean; message: string; handId?: string }> => {
  const db = getDb()
  if (!db) throw new Error("Firestore is not initialized")
  
  try {
    // Get store settings
    const settings = await getStackManHandSettings(storeId)
    if (!settings || !settings.enabled) {
      return { success: false, message: "Stack Man Hand機能が無効です" }
    }
    
    // Get player's current stack
    console.log("[Purchase] Searching for player:", {
      storeId,
      userId,
      type: typeof userId
    })
    
    // 店舗分離構造に対応: players/store_{storeId}/players/{playerId}
    let playerDoc = null
    let playerData = null
    
    try {
      console.log("[Purchase] Getting player from store-isolated structure...")
      const playerDocRef = doc(db, "players", `store_${storeId}`, "players", userId)
      const playerDocSnap = await getDoc(playerDocRef)
      
      if (playerDocSnap.exists()) {
        console.log("[Purchase] Player found in store-isolated structure")
        playerDoc = playerDocSnap
        playerData = playerDocSnap.data()
      } else {
        console.log("[Purchase] Player not found in store-isolated structure")
      }
    } catch (error) {
      console.error("[Purchase] Error getting player:", error)
    }
    
    // If still not found, return error
    if (!playerDoc || !playerData) {
      console.error("[Purchase] Player not found:", {
        userId,
        storeId
      })
      return { success: false, message: "プレイヤーが見つかりません" }
    }
    
    console.log("[Purchase] Player data loaded (raw):")
    console.dir(playerData, { depth: null })
    console.log("[Purchase] Player data loaded (parsed):")
    console.log({
      id: playerDoc.id,
      name: playerData.name,
      storeId: playerData.storeId,
      systemBalance: playerData.systemBalance,
      stapokaBalance: playerData.stapokaBalance
    })
    // スタポカバランスがない場合はsystemBalanceを使用（既存プレイヤー対応）
    const currentStack = playerData.stapokaBalance ?? playerData.systemBalance ?? 0
    
    // Get minimum stack from store settings
    const storeDoc = await getDoc(doc(db, "stores", storeId))
    if (!storeDoc.exists()) {
      return { success: false, message: "店舗が見つかりません" }
    }
    const storeData = storeDoc.data()
    const minimumStack = storeData.stackResetSettings?.minimumStack || 10000
    
    // Check if player has enough chips above minimum stack
    const availableChips = currentStack - minimumStack
    if (availableChips < settings.purchasePrice) {
      return { 
        success: false, 
        message: `購入には最低保証額（${minimumStack.toLocaleString()}）以上のチップが必要です` 
      }
    }
    
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
    userId,
    userName,
    storeId,
    cards,
    handRank,
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
    
    const handDocRef = await addDoc(handsRef, handData)
    
    // Deduct chips from player's stapoka balance
    const updateData: any = {
      updatedAt: serverTimestamp(),
    }
    
    // スタポカバランスが存在する場合はそれを更新、ない場合は新規作成
    if (playerData.stapokaBalance !== undefined) {
      updateData.stapokaBalance = currentStack - settings.purchasePrice
    } else {
      // 既存プレイヤーの場合: systemBalanceをstapokaBalanceにコピーしてから減算
      updateData.stapokaBalance = currentStack - settings.purchasePrice
    }
    
    await updateDoc(playerDoc.ref, updateData)
    
    // Purchase succeeded - return success even if subsequent operations fail
    return {
      success: true,
      message: "Stack Man Handを購入しました",
      handId: handDocRef.id,
    }
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
    where("status", "==", "active")
  )
  
  const snapshot = await getDocs(handsQuery)
  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
  })) as StackManHand[]
}

/**
 * Get player's Stack Man Hands purchased today
 * Now returns hands purchased within the last 3 days.
 */
export const getTodayStackManHands = async (
  storeId: string,
  userId: string
): Promise<StackManHand[]> => {
  const db = getDb()
  if (!db) throw new Error("Firestore is not initialized")
  
  // 3日前の0時0分0秒を取得
  const threeDaysAgo = new Date()
  threeDaysAgo.setDate(threeDaysAgo.getDate() - 3)
  threeDaysAgo.setHours(0, 0, 0, 0)
  
  const handsRef = collection(getDb()!, "stores", storeId, "stackManHands")
  const handsQuery = query(
    handsRef,
    where("userId", "==", userId),
    where("purchasedAt", ">=", Timestamp.fromDate(threeDaysAgo))
  )
  
  const snapshot = await getDocs(handsQuery)
  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
  })) as StackManHand[]
}

/**
 * Clean up Stack Man Hands older than 3 days (4th day deletion)
 */
export const cleanupStackManHands = async (storeId: string): Promise<number> => {
  const db = getDb()
  if (!db) throw new Error("Firestore is not initialized")
  
  // 4日前の0時0分0秒を取得
  const fourDaysAgo = new Date()
  fourDaysAgo.setDate(fourDaysAgo.getDate() - 4)
  fourDaysAgo.setHours(0, 0, 0, 0)
  
  const handsRef = collection(getDb()!, "stores", storeId, "stackManHands")
  const handsQuery = query(
    handsRef,
    where("purchasedAt", "<", Timestamp.fromDate(fourDaysAgo))
  )
  
  const snapshot = await getDocs(handsQuery)
  const { writeBatch } = await import("firebase/firestore")
  const batch = writeBatch(db)
  let deletedCount = 0
  
  snapshot.docs.forEach((doc) => {
    batch.delete(doc.ref)
    deletedCount++
  })
  
  if (deletedCount > 0) {
    await batch.commit()
    console.log(`[Cleanup] Deleted ${deletedCount} old Stack Man Hands for store ${storeId}`)
  }
  
  return deletedCount
}

/**
 * Calculate how many more hands can be purchased today
 */
export const calculateRemainingPurchases = async (
  storeId: string,
  userId: string,
  currentStack: number
): Promise<{ maxPurchases: number; purchasedToday: number; remaining: number }> => {
  const db = getDb()
  if (!db) throw new Error("Firestore is not initialized")
  
  // Get store settings
  const storeDoc = await getDoc(doc(db, "stores", storeId))
  if (!storeDoc.exists()) {
    return { maxPurchases: 0, purchasedToday: 0, remaining: 0 }
  }
  
  const storeData = storeDoc.data()
  const settings = storeData.stackManHandSettings
  const minimumStack = storeData.stackResetSettings?.minimumStack || 10000
  
  if (!settings || !settings.enabled) {
    return { maxPurchases: 0, purchasedToday: 0, remaining: 0 }
  }
  
  // Get today's purchases first
  const todayHands = await getTodayStackManHands(storeId, userId)
  const purchasedToday = todayHands.length
  
  // Calculate already spent chips
  const alreadySpent = purchasedToday * settings.purchasePrice
  
  // Restore initial stack (before any purchases today)
  const initialStack = currentStack + alreadySpent
  
  // Calculate max purchases based on available chips from initial stack
  const availableChips = initialStack - minimumStack
  const maxPurchases = Math.floor(availableChips / settings.purchasePrice)
  
  // Debug logging
  console.log('calculateRemainingPurchases:', {
    currentStack,
    minimumStack,
    purchasedToday,
    alreadySpent,
    initialStack,
    availableChips,
    purchasePrice: settings.purchasePrice,
    maxPurchases
  })
  
  // Calculate remaining
  const remaining = Math.max(0, maxPurchases - purchasedToday)
  
  return { maxPurchases, purchasedToday, remaining }
}

/**
 * Use Stack Man Hand (mark as used)
 */
export const useStackManHand = async (
  storeId: string,
  handId: string,
  result: "win" | "lose"
): Promise<{ success: boolean; message: string }> => {
  const db = getDb()
  if (!db) throw new Error("Firestore is not initialized")
  
  try {
    const handRef = doc(db, "stores", storeId, "stackManHands", handId)
    const handDoc = await getDoc(handRef)
    
    if (!handDoc.exists()) {
      return { success: false, message: "ハンドが見つかりません" }
    }
    
    const handData = handDoc.data() as StackManHand
    
    if (handData.status !== "active") {
      return { success: false, message: "このハンドは既に使用済みまたは期限切れです" }
    }
    
    // Update hand status
    await updateDoc(handRef, {
      status: "used",
      usedAt: Timestamp.now(),
      result,
    })
    
    // If win, add store chips to player
    if (result === "win") {
      const playersRef = collection(getDb()!, "players", `store_${storeId}`, "players")
      const playerQuery = query(playersRef, where("uniqueId", "==", handData.userId))
      const playerSnapshot = await getDocs(playerQuery)
      
      if (!playerSnapshot.empty) {
        const playerDoc = playerSnapshot.docs[0]
        const playerData = playerDoc.data()
        const currentStoreChips = playerData.storeChips || 0
        
        await updateDoc(playerDoc.ref, {
          storeChips: currentStoreChips + handData.rewardAmount,
          updatedAt: serverTimestamp(),
        })
      }
    }
    
    return { success: true, message: result === "win" ? "勝利！店舗チップを獲得しました" : "残念、負けました" }
  } catch (error) {
    console.error("Error using Stack Man Hand:", error)
    return { success: false, message: "使用に失敗しました" }
  }
}

/**
 * Expire old Stack Man Hands (run daily)
 */
export const expireOldStackManHands = async (storeId: string): Promise<number> => {
  const db = getDb()
  if (!db) throw new Error("Firestore is not initialized")
  
  const handsRef = collection(getDb()!, "stores", storeId, "stackManHands")
  const now = Timestamp.now()
  
  const expiredQuery = query(
    handsRef,
    where("status", "==", "active"),
    where("validUntil", "<", now)
  )
  
  const snapshot = await getDocs(expiredQuery)
  
  let count = 0
  for (const doc of snapshot.docs) {
    await updateDoc(doc.ref, { status: "expired" })
    count++
  }
  
  return count
}
