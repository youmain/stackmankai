import {
  doc,
  getDoc,
  updateDoc,
  serverTimestamp,
} from "firebase/firestore"
import { getDb } from "./firebase"
import type { PokerGameState } from "@/types/poker"
import { removeUndefined } from "./poker-logic/firestore-utils"

const TIMEOUT_SECONDS = 30

/**
 * Get poker game collection reference for a store
 */
const getPokerGameCollection = (storeId: string) => {
  const db = getDb()
  if (!db) throw new Error("Firestore is not initialized")
  const { collection } = require("firebase/firestore")
  return collection(db, "pokerGames", `store_${storeId}`, "games")
}

/**
 * Handle player timeout - auto fold
 */
export const handlePlayerTimeout = async (
  storeId: string,
  gameId: string,
  userId: string
): Promise<void> => {
  const gameCollection = getPokerGameCollection(storeId)
  const gameDoc = doc(gameCollection, gameId)
  const gameSnap = await getDoc(gameDoc)
  
  if (!gameSnap.exists()) {
    throw new Error("Game not found")
  }
  
  const gameData = gameSnap.data() as PokerGameState
  
  // 現在のプレイヤーがタイムアウトしたユーザーか確認
  const currentPlayer = gameData.players[gameData.currentPlayerIndex]
  if (currentPlayer?.userId !== userId) {
    console.log("Not current player's turn, ignoring timeout")
    return
  }
  
  // 既にフォールド済みまたはオールインの場合は何もしない
  if (currentPlayer.isFolded || currentPlayer.isAllIn) {
    return
  }
  
  console.log(`Player ${currentPlayer.userName} timed out, auto-folding...`)
  
  // タイムアウト回数を増やす
  const updatedPlayers = gameData.players.map(p => {
    if (p.userId === userId) {
      return {
        ...p,
        isFolded: true,
        lastAction: "fold" as const,
        consecutiveTimeouts: (p.consecutiveTimeouts || 0) + 1
      }
    }
    return p
  })
  
  // アクション履歴に追加
  const newHistoryEntry = {
    playerName: currentPlayer.userName,
    action: "fold" as const,
    phase: gameData.phase,
    timestamp: new Date()
  }
  
  const updatedHistory = [...(gameData.actionHistory || []), newHistoryEntry]
  
  // 次のプレイヤーに進む
  let nextPlayerIndex = (gameData.currentPlayerIndex + 1) % gameData.players.length
  let attempts = 0
  const maxAttempts = gameData.players.length
  
  while (
    attempts < maxAttempts &&
    (updatedPlayers[nextPlayerIndex].isFolded || updatedPlayers[nextPlayerIndex].isAllIn)
  ) {
    nextPlayerIndex = (nextPlayerIndex + 1) % gameData.players.length
    attempts++
  }
  
  // 全員フォールドまたはオールインの場合の処理
  if (attempts >= maxAttempts) {
    console.log("All players folded or all-in, advancing to showdown")
    // showdownに進む処理は poker-game-advanced.ts の checkAndAdvancePhase で処理される
  }
  
  // ゲーム状態を更新
  await updateDoc(gameDoc, removeUndefined({
    players: updatedPlayers,
    currentPlayerIndex: nextPlayerIndex,
    actionHistory: updatedHistory,
    turnStartTime: serverTimestamp(),
    updatedAt: serverTimestamp(),
  }))
  
  // 2回連続タイムアウトの場合、強制退席
  const timedOutPlayer = updatedPlayers.find(p => p.userId === userId)
  if (timedOutPlayer && (timedOutPlayer.consecutiveTimeouts || 0) >= 2) {
    console.log(`Player ${timedOutPlayer.userName} has 2 consecutive timeouts, forcing leave...`)
    
    // プレイヤーを削除
    const playersAfterRemoval = updatedPlayers.filter(p => p.userId !== userId)
    
    await updateDoc(gameDoc, removeUndefined({
      players: playersAfterRemoval,
      updatedAt: serverTimestamp(),
    }))
  }
}

/**
 * Check if current turn has timed out
 */
export const checkTurnTimeout = (
  turnStartTime: Date | undefined,
  timeoutSeconds: number = TIMEOUT_SECONDS
): boolean => {
  if (!turnStartTime) return false
  
  const now = new Date()
  const elapsed = (now.getTime() - turnStartTime.getTime()) / 1000
  
  return elapsed >= timeoutSeconds
}

/**
 * Get remaining time for current turn
 */
export const getRemainingTime = (
  turnStartTime: Date | undefined,
  timeoutSeconds: number = TIMEOUT_SECONDS
): number => {
  if (!turnStartTime) return timeoutSeconds
  
  const now = new Date()
  const elapsed = (now.getTime() - turnStartTime.getTime()) / 1000
  const remaining = timeoutSeconds - elapsed
  
  return Math.max(0, remaining)
}
