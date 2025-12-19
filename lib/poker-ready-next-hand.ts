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
  const readyPlayers = Array.isArray(gameData.nextHandReadyPlayers) ? gameData.nextHandReadyPlayers : []
  if (readyPlayers.includes(userId)) {
    console.log(`[markPlayerReady] Player ${userId} is already ready`)
    return
  }
  
  // Add player to ready list
  await updateDoc(gameDoc, {
    nextHandReadyPlayers: arrayUnion(userId),
    updatedAt: serverTimestamp(),
  })
  
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
  
  // Get active players (seated players with chips)
  // In showdown phase, include folded players as they need to ready up for next hand
  const activePlayers = gameData.players.filter(p => p.seatNumber !== null && p.stack > 0)
  const activePlayerIds = activePlayers.map(p => p.userId)
  
  console.log(`[checkAndStartNextHand] Active players: ${activePlayerIds.length}`)
  
  // Need at least 2 players to start next hand
  if (activePlayers.length < 2) {
    console.log(`[checkAndStartNextHand] Not enough players to start next hand: ${activePlayers.length}`)
    return
  }
  
  // Get ready players
  const readyPlayers = Array.isArray(gameData.nextHandReadyPlayers) ? gameData.nextHandReadyPlayers : []
  
  console.log(`[checkAndStartNextHand] Ready players: ${readyPlayers.length}/${activePlayerIds.length}`)
  
  // Check if all active players are ready
  const allReady = activePlayerIds.every(id => readyPlayers.includes(id))
  
  // Check if at least one player is ready (for faster game flow)
  const anyReady = readyPlayers.length > 0
  
  // Check if timeout has passed
  const now = new Date()
  const startTime = gameData.nextHandStartTime
  let timeoutPassed = false
  if (startTime) {
    try {
      // Convert Firestore Timestamp to Date if needed
      let startDate: Date
      if (startTime instanceof Date) {
        startDate = startTime
      } else if (startTime.toDate && typeof startTime.toDate === 'function') {
        startDate = startTime.toDate()
      } else if (typeof startTime === 'number') {
        startDate = new Date(startTime)
      } else if ((startTime as any).seconds !== undefined) {
        startDate = new Date((startTime as any).seconds * 1000 + ((startTime as any).nanoseconds || 0) / 1000000)
      } else {
        throw new Error('Unknown startTime format')
      }
      
      if (!isNaN(startDate.getTime())) {
        timeoutPassed = now >= startDate
        console.log(`[checkAndStartNextHand] Now: ${now.toISOString()}, Start time: ${startDate.toISOString()}, Timeout passed: ${timeoutPassed}`)
      } else {
        console.error('[checkAndStartNextHand] Invalid startDate:', startDate)
      }
    } catch (err) {
      console.error('[checkAndStartNextHand] Error converting nextHandStartTime:', err, startTime)
    }
  }
  
  console.log(`[checkAndStartNextHand] All ready: ${allReady}, Any ready: ${anyReady}, Timeout passed: ${timeoutPassed}`)
  
  // Start next hand if all ready, any ready, or timeout passed
  if (allReady || anyReady || timeoutPassed) {
    console.log(`[checkAndStartNextHand] Starting next hand...`)
    await startNextHand(storeId, gameId)
  }
}
