/**
 * Scheduled tasks for rake collection and stack reset
 * Client-side implementation with duplicate prevention
 */

import { collection, doc, getDoc, getDocs, updateDoc, addDoc, query, where, Timestamp, serverTimestamp, runTransaction } from "firebase/firestore"
import { getDb, isFirebaseConfigured } from "./firebase"

// Helper to ensure db is available
const checkDb = () => {
  if (!isFirebaseConfigured) throw new Error("Firebase is not configured")
  const db = getDb()
  if (!db) throw new Error("Firestore is not initialized")
  return db
}
import type { RakeCollection, RakeSettings, StackReset, StackResetSettings } from "@/types/stack-man-hand"

/**
 * Check if a task should run based on last execution time
 */
const shouldRunTask = (lastRunKey: string, targetHour: number): boolean => {
  const lastRun = localStorage.getItem(lastRunKey)
  const now = new Date()
  
  // If never run, check if we're past the target hour today
  if (!lastRun) {
    return now.getHours() >= targetHour
  }
  
  const lastRunDate = new Date(lastRun)
  
  // Check if it's a new day and we're past the target hour
  const isNewDay = now.toDateString() !== lastRunDate.toDateString()
  const isPastTargetHour = now.getHours() >= targetHour
  
  return isNewDay && isPastTargetHour
}

/**
 * Get target hour from time string (e.g., "03:00" -> 3)
 */
const getTargetHour = (timeString: string): number => {
  const [hour] = timeString.split(":")
  return parseInt(hour, 10)
}

/**
 * Collect rake from all players
 */
export const collectRake = async (storeId: string): Promise<{ success: boolean; message: string; amount?: number }> => {
  if (!isFirebaseConfigured) return { success: false, message: "Firebase is not configured" }
  const db = getDb()
  if (!db) throw new Error("Firestore is not initialized")
  
  try {
    // Get store settings
    const storeDoc = await getDoc(doc(db, "stores", storeId))
    if (!storeDoc.exists()) {
      return { success: false, message: "店舗が見つかりません" }
    }
    
    const storeData = storeDoc.data()
    const rakeSettings: RakeSettings | undefined = storeData.rakeSettings
    
    if (!rakeSettings || !rakeSettings.enabled) {
      return { success: false, message: "レーキ機能が無効です" }
    }
    
    // Check if already collected today using transaction for duplicate prevention
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)
    
    const collectionsRef = collection(checkDb(), "stores", storeId, "rakeCollections")
    const todayCollectionQuery = query(
      collectionsRef,
      where("collectedAt", ">=", Timestamp.fromDate(today)),
      where("collectedAt", "<", Timestamp.fromDate(tomorrow))
    )
    
    const existingCollection = await getDocs(todayCollectionQuery)
    if (!existingCollection.empty) {
      console.log("[collectRake] Already collected today")
      return { success: false, message: "本日分は既に回収済みです" }
    }
    
    // Get all players
    const playersRef = collection(checkDb(), "players", `store_${storeId}`, "players")
    const playersSnapshot = await getDocs(playersRef)
    
    if (playersSnapshot.empty) {
      return { success: false, message: "プレイヤーが見つかりません" }
    }
    
    // Calculate rake for each player
    const playerRakes: Array<{
      userId: string
      userName: string
      amount: number
      stackBefore: number
      stackAfter: number
    }> = []
    
    let totalAmount = 0
    
    // Use transaction to ensure atomicity
    await runTransaction(db, async (transaction) => {
      // Re-check if already collected (race condition prevention)
      const recheck = await getDocs(todayCollectionQuery)
      if (!recheck.empty) {
        throw new Error("Already collected today")
      }
      
      for (const playerDoc of playersSnapshot.docs) {
        const playerData = playerDoc.data()
        const currentStack = playerData.systemBalance || 0
        
        if (currentStack > 0) {
          const rakeAmount = Math.floor(currentStack * (rakeSettings.rakePercentage / 100))
          const newStack = currentStack - rakeAmount
          
          playerRakes.push({
            userId: playerData.uniqueId,
            userName: playerData.name,
            amount: rakeAmount,
            stackBefore: currentStack,
            stackAfter: newStack,
          })
          
          totalAmount += rakeAmount
          
          // Update player's stack
          transaction.update(playerDoc.ref, {
            systemBalance: newStack,
            totalRakeCollected: (playerData.totalRakeCollected || 0) + rakeAmount,
            updatedAt: serverTimestamp(),
          })
        }
      }
      
      // Create rake collection record
      const collectionData: Omit<RakeCollection, "id"> = {
        storeId,
        collectedAt: Timestamp.now(),
        totalAmount,
        playerRakes,
      }
      
      const collectionRef = doc(collectionsRef)
      transaction.set(collectionRef, collectionData)
    })
    
    console.log(`[collectRake] Collected ${totalAmount} chips from ${playerRakes.length} players`)
    
    // Update last run time
    localStorage.setItem(`lastRakeCollection_${storeId}`, new Date().toISOString())
    
    return {
      success: true,
      message: `レーキを回収しました: ${totalAmount.toLocaleString()}チップ`,
      amount: totalAmount,
    }
  } catch (error: any) {
    if (error.message === "Already collected today") {
      return { success: false, message: "本日分は既に回収済みです" }
    }
    console.error("Error collecting rake:", error)
    return { success: false, message: "レーキ回収に失敗しました" }
  }
}

/**
 * Reset stacks for all players
 */
export const resetStacks = async (storeId: string): Promise<{ success: boolean; message: string; resetCount?: number }> => {
  if (!isFirebaseConfigured) return { success: false, message: "Firebase is not configured" }
  const db = getDb()
  if (!db) throw new Error("Firestore is not initialized")
  
  try {
    // Get store settings
    const storeDoc = await getDoc(doc(db, "stores", storeId))
    if (!storeDoc.exists()) {
      return { success: false, message: "店舗が見つかりません" }
    }
    
    const storeData = storeDoc.data()
    const resetSettings: StackResetSettings | undefined = storeData.stackResetSettings
    
    if (!resetSettings || !resetSettings.enabled) {
      return { success: false, message: "スタックリセット機能が無効です" }
    }
    
    // Check if already reset today using transaction for duplicate prevention
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)
    
    const resetsRef = collection(checkDb(), "stores", storeId, "stackResets")
    const todayResetQuery = query(
      resetsRef,
      where("resetAt", ">=", Timestamp.fromDate(today)),
      where("resetAt", "<", Timestamp.fromDate(tomorrow))
    )
    
    const existingReset = await getDocs(todayResetQuery)
    if (!existingReset.empty) {
      console.log("[resetStacks] Already reset today")
      return { success: false, message: "本日分は既にリセット済みです" }
    }
    
    // Get all players
    const playersRef = collection(checkDb(), "players", `store_${storeId}`, "players")
    const playersSnapshot = await getDocs(playersRef)
    
    if (playersSnapshot.empty) {
      return { success: false, message: "プレイヤーが見つかりません" }
    }
    
    // Reset stacks for players below minimum
    const playerResets: Array<{
      userId: string
      userName: string
      stackBefore: number
      stackAfter: number
      wasReset: boolean
    }> = []
    
    let resetCount = 0
    
    // Use transaction to ensure atomicity
    await runTransaction(db, async (transaction) => {
      // Re-check if already reset (race condition prevention)
      const recheck = await getDocs(todayResetQuery)
      if (!recheck.empty) {
        throw new Error("Already reset today")
      }
      
      for (const playerDoc of playersSnapshot.docs) {
        const playerData = playerDoc.data()
        const currentStack = playerData.systemBalance || 0
        const minimumStack = resetSettings.minimumStack
        
        if (currentStack < minimumStack) {
          playerResets.push({
            userId: playerData.uniqueId,
            userName: playerData.name,
            stackBefore: currentStack,
            stackAfter: minimumStack,
            wasReset: true,
          })
          
          resetCount++
          
          // Update player's stack
          transaction.update(playerDoc.ref, {
            systemBalance: minimumStack,
            lastStackReset: Timestamp.now(),
            updatedAt: serverTimestamp(),
          })
        } else {
          playerResets.push({
            userId: playerData.uniqueId,
            userName: playerData.name,
            stackBefore: currentStack,
            stackAfter: currentStack,
            wasReset: false,
          })
        }
      }
      
      // Create stack reset record
      const resetData: Omit<StackReset, "id"> = {
        storeId,
        resetAt: Timestamp.now(),
        playerResets,
      }
      
      const resetRef = doc(resetsRef)
      transaction.set(resetRef, resetData)
    })
    
    console.log(`[resetStacks] Reset ${resetCount} players to minimum stack`)
    
    // Update last run time
    localStorage.setItem(`lastStackReset_${storeId}`, new Date().toISOString())
    
    return {
      success: true,
      message: `スタックをリセットしました: ${resetCount}人`,
      resetCount,
    }
  } catch (error: any) {
    if (error.message === "Already reset today") {
      return { success: false, message: "本日分は既にリセット済みです" }
    }
    console.error("Error resetting stacks:", error)
    return { success: false, message: "スタックリセットに失敗しました" }
  }
}

/**
 * Check and run scheduled tasks
 * Should be called on app initialization
 */
export const checkAndRunScheduledTasks = async (storeId: string): Promise<void> => {
  if (!storeId || !isFirebaseConfigured) return
  
  try {
    const db = getDb()
    if (!db) return
    
    // Get store settings
    const storeDoc = await getDoc(doc(db, "stores", storeId))
    if (!storeDoc.exists()) return
    
    const storeData = storeDoc.data()
    const rakeSettings: RakeSettings | undefined = storeData.rakeSettings
    const resetSettings: StackResetSettings | undefined = storeData.stackResetSettings
    
    // Check and run rake collection
    if (rakeSettings?.enabled) {
      const rakeHour = getTargetHour(rakeSettings.collectionTime)
      if (shouldRunTask(`lastRakeCollection_${storeId}`, rakeHour)) {
        console.log("[Scheduled Tasks] Running rake collection...")
        const result = await collectRake(storeId)
        if (result.success) {
          console.log(`[Scheduled Tasks] ${result.message}`)
        }
      }
    }
    
    // Check and run stack reset
    if (resetSettings?.enabled) {
      const resetHour = getTargetHour(resetSettings.resetTime)
      if (shouldRunTask(`lastStackReset_${storeId}`, resetHour)) {
        console.log("[Scheduled Tasks] Running stack reset...")
        const result = await resetStacks(storeId)
        if (result.success) {
          console.log(`[Scheduled Tasks] ${result.message}`)
        }
      }
    }
  } catch (error) {
    console.error("[Scheduled Tasks] Error:", error)
  }
}
