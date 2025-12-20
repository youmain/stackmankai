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
    const playersRef = collection(db, "players", `store_${storeId}`, "players")
    const playerQuery = query(playersRef, where("uniqueId", "==", userId))
    const playerSnapshot = await getDocs(playerQuery)
    
    if (playerSnapshot.empty) {
      return { success: false, message: "プレイヤーが見つかりません" }
    }
    
    const playerDoc = playerSnapshot.docs[0]
    const playerData = playerDoc.data()
    const currentStack = playerData.systemBalance || 0
    
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
    
    // Calculate valid until (end of today)
    const validUntil = new Date()
    validUntil.setHours(23, 59, 59, 999)
    
    // Create Stack Man Hand
    const handData: Omit<StackManHand, "id"> = {
      userId,
      userName,
      storeId,
      cards,
      handRank,
      purchasePrice: settings.purchasePrice,
      rewardAmount: settings.rewardAmount,
      purchasedAt: Timestamp.now(),
      validUntil: Timestamp.fromDate(validUntil),
      status: "active",
    }
    
    const handDocRef = await addDoc(handsRef, handData)
    
    // Deduct chips from player
    await updateDoc(playerDoc.ref, {
      systemBalance: currentStack - settings.purchasePrice,
      updatedAt: serverTimestamp(),
    })
    
    return {
      success: true,
      message: "Stack Man Handを購入しました",
      handId: handDocRef.id,
    }
  } catch (error) {
    console.error("Error purchasing Stack Man Hand:", error)
    return { success: false, message: "購入に失敗しました" }
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
  
  const handsRef = collection(db, "stores", storeId, "stackManHands")
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
 */
export const getTodayStackManHands = async (
  storeId: string,
  userId: string
): Promise<StackManHand[]> => {
  const db = getDb()
  if (!db) throw new Error("Firestore is not initialized")
  
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const tomorrow = new Date(today)
  tomorrow.setDate(tomorrow.getDate() + 1)
  
  const handsRef = collection(db, "stores", storeId, "stackManHands")
  const handsQuery = query(
    handsRef,
    where("userId", "==", userId),
    where("purchasedAt", ">=", Timestamp.fromDate(today)),
    where("purchasedAt", "<", Timestamp.fromDate(tomorrow))
  )
  
  const snapshot = await getDocs(handsQuery)
  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
  })) as StackManHand[]
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
  
  // Calculate max purchases based on available chips
  const availableChips = currentStack - minimumStack
  const maxPurchases = Math.floor(availableChips / settings.purchasePrice)
  
  // Get today's purchases
  const todayHands = await getTodayStackManHands(storeId, userId)
  const purchasedToday = todayHands.length
  
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
      const playersRef = collection(db, "players", `store_${storeId}`, "players")
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
  
  const handsRef = collection(db, "stores", storeId, "stackManHands")
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
