import { doc, getDoc, updateDoc, serverTimestamp, arrayUnion, collection } from "firebase/firestore"
import { getDb } from "./firebase"
import { PokerGameState } from "@/types/poker"
import { removeUndefined } from "./poker-logic/firestore-utils"
import { startNextHand } from "./poker-game-advanced"

/**
 * Get poker game collection reference for a store
 */
const getPokerGameCollection = (storeId: string) => {
  const db = getDb()
  if (!db) throw new Error("Firestore is not initialized")
  return collection(db, "pokerGames", `store_${storeId}`, "games")
}

/**
 * Mark player as ready for next hand
 */
export const markPlayerReady = async (
  storeId: string,
  gameId: string,
  userId: string
): Promise<void> => {
  const gameDoc = doc(getPokerGameCollection(storeId), gameId)
  const gameSnap = await getDoc(gameDoc)
  
  if (!gameSnap.exists()) {
    throw new Error("Game not found")
  }
  
  const gameData = gameSnap.data() as PokerGameState
  
  // Check if game is in showdown phase
  if (gameData.phase !== "showdown") {
    throw new Error("Game is not in showdown phase")
  }
  
  // Check if player is already ready
  const readyPlayers = gameData.nextHandReadyPlayers || []
  if (readyPlayers.includes(userId)) {
    console.log(`[markPlayerReady] Player ${userId} is already ready`)
    return
  }
  
  // Add player to ready list
  await updateDoc(gameDoc, removeUndefined({
    nextHandReadyPlayers: arrayUnion(userId),
    updatedAt: serverTimestamp(),
  }))
  
  console.log(`[markPlayerReady] Player ${userId} marked as ready`)
  
  // Check if all active players are ready
  await checkAndStartNextHand(storeId, gameId)
}

/**
 * Check if all players are ready or timeout has passed, then start next hand
 */
export const checkAndStartNextHand = async (
  storeId: string,
  gameId: string
): Promise<void> => {
  const gameDoc = doc(getPokerGameCollection(storeId), gameId)
  const gameSnap = await getDoc(gameDoc)
  
  if (!gameSnap.exists()) {
    throw new Error("Game not found")
  }
  
  const gameData = gameSnap.data() as PokerGameState
  
  // Check if game is in showdown phase
  if (gameData.phase !== "showdown") {
    console.log(`[checkAndStartNextHand] Game is not in showdown phase: ${gameData.phase}`)
    return
  }
  
  // Get active players (not folded, has chips)
  const activePlayers = gameData.players.filter(p => p.isActive && p.stack > 0)
  const activePlayerIds = activePlayers.map(p => p.userId)
  
  console.log(`[checkAndStartNextHand] Active players: ${activePlayerIds.length}`)
  
  // Get ready players
  const readyPlayers = gameData.nextHandReadyPlayers || []
  
  console.log(`[checkAndStartNextHand] Ready players: ${readyPlayers.length}/${activePlayerIds.length}`)
  
  // Check if all active players are ready
  const allReady = activePlayerIds.every(id => readyPlayers.includes(id))
  
  // Check if timeout has passed
  const now = new Date()
  const startTime = gameData.nextHandStartTime
  const timeoutPassed = startTime && now >= startTime
  
  console.log(`[checkAndStartNextHand] All ready: ${allReady}, Timeout passed: ${timeoutPassed}`)
  
  if (allReady || timeoutPassed) {
    console.log(`[checkAndStartNextHand] Starting next hand...`)
    await startNextHand(storeId, gameId)
  }
}
