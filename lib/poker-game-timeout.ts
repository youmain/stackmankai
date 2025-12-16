/**
 * Timeout handling for poker games
 */

import {
  doc,
  getDoc,
  updateDoc,
  serverTimestamp,
} from "firebase/firestore"
import { getDb } from "./firebase"
import { collection } from "firebase/firestore"
import type { PokerGameState } from "@/types/poker"
import { DEFAULT_TIMEOUT_SECONDS } from "./poker-logic/timeout"

/**
 * Get poker game collection reference for a store
 */
const getPokerGameCollection = (storeId: string) => {
  const db = getDb()
  if (!db) throw new Error("Firestore is not initialized")
  return collection(db, "pokerGames", `store_${storeId}`, "games")
}

/**
 * Handle timeout for current player (auto-fold)
 */
export const handlePlayerTimeout = async (
  storeId: string,
  gameId: string
): Promise<void> => {
  const gameDoc = doc(getPokerGameCollection(storeId), gameId)
  const gameSnap = await getDoc(gameDoc)
  
  if (!gameSnap.exists()) {
    return
  }
  
  const gameData = gameSnap.data() as PokerGameState
  
  // Check if game is in playable state
  if (gameData.phase === "waiting" || gameData.phase === "showdown") {
    return
  }
  
  // Check if timeout is enabled
  if (!gameData.turnStartTime || !gameData.timeoutSeconds) {
    return
  }
  
  // Check if timeout has occurred
  const now = new Date()
  const turnStartTime = gameData.turnStartTime instanceof Date 
    ? gameData.turnStartTime 
    : (gameData.turnStartTime as any).toDate()
  
  const elapsedSeconds = (now.getTime() - turnStartTime.getTime()) / 1000
  
  if (elapsedSeconds < gameData.timeoutSeconds) {
    return // Not timed out yet
  }
  
  // Auto-fold the current player
  const currentPlayer = gameData.players[gameData.currentPlayerIndex]
  if (!currentPlayer || currentPlayer.isFolded || currentPlayer.isAllIn) {
    return
  }
  
  currentPlayer.isFolded = true
  currentPlayer.lastAction = "fold"
  
  // Move to next player
  let nextPlayerIndex = (gameData.currentPlayerIndex + 1) % gameData.players.length
  while (gameData.players[nextPlayerIndex].isFolded || gameData.players[nextPlayerIndex].isAllIn) {
    nextPlayerIndex = (nextPlayerIndex + 1) % gameData.players.length
  }
  
  await updateDoc(gameDoc, {
    players: gameData.players,
    currentPlayerIndex: nextPlayerIndex,
    turnStartTime: new Date(),
    updatedAt: serverTimestamp(),
  })
  
  // Check if phase should advance
  const { checkAndAdvancePhase } = await import("./poker-game-advanced")
  await checkAndAdvancePhase(storeId, gameId)
}

/**
 * Update turn start time when moving to next player
 */
export const updateTurnStartTime = async (
  storeId: string,
  gameId: string
): Promise<void> => {
  const gameDoc = doc(getPokerGameCollection(storeId), gameId)
  
  await updateDoc(gameDoc, {
    turnStartTime: new Date(),
    updatedAt: serverTimestamp(),
  })
}

/**
 * Enable timeout for a game
 */
export const enableTimeout = async (
  storeId: string,
  gameId: string,
  timeoutSeconds: number = DEFAULT_TIMEOUT_SECONDS
): Promise<void> => {
  const gameDoc = doc(getPokerGameCollection(storeId), gameId)
  
  await updateDoc(gameDoc, {
    timeoutSeconds,
    turnStartTime: new Date(),
    updatedAt: serverTimestamp(),
  })
}

/**
 * Disable timeout for a game
 */
export const disableTimeout = async (
  storeId: string,
  gameId: string
): Promise<void> => {
  const gameDoc = doc(getPokerGameCollection(storeId), gameId)
  
  await updateDoc(gameDoc, {
    timeoutSeconds: null,
    turnStartTime: null,
    updatedAt: serverTimestamp(),
  })
}
