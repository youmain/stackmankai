import * as firestore from "firebase/firestore"
import { getDb } from "@/lib/firebase"
import {
  createPokerGame,
  joinPokerGame,
  leavePokerGame,
  performAction,
  startNewHand,
  subscribeToPokerGame,
} from "@/lib/poker-game"
import { handlePlayerTimeout, getRemainingTime } from "@/lib/poker-timeout"
import { deletePokerGame } from "@/lib/poker-game-reset"
import type { PokerGameState } from "@/types/poker"
import type { PokerOperationHours } from "@/types/stack-man-hand"

export async function fetchOperationHours(
  storeId: string | undefined,
  setOperationHours: (hours: PokerOperationHours | null) => void,
  setError: (error: string) => void,
): Promise<void> {
  const db = getDb()
  if (!storeId || !db || typeof firestore.doc !== 'function' || typeof firestore.getDoc !== 'function') return

  try {
    const storeRef = firestore.doc(db, "stores", storeId)
    const storeSnap = await firestore.getDoc(storeRef)

    if (storeSnap.exists()) {
      const storeData = storeSnap.data()
      if (storeData?.pokerOperationHours) {
        setOperationHours(storeData.pokerOperationHours as PokerOperationHours)
      }
    }
  } catch (err) {
    console.error("Failed to fetch operation hours:", err)
    setError("営業時間の取得に失敗しました")
  }
}

export async function initGame(
  storeId: string | undefined,
  customerId: string | undefined,
  setPokerGameId: (id: string | null) => void,
  setPokerGame: (game: PokerGameState | null) => void,
  setError: (error: string) => void,
): Promise<void> {
  if (!storeId || !customerId) {
    setError("必要な情報が不足しています")
    return
  }

  try {
    const gameId = await createPokerGame(storeId, customerId)
    setPokerGameId(gameId)
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : "ゲーム作成に失敗しました"
    setError(errorMessage)
    console.error("Failed to create game:", err)
  }
}

export async function handleJoinSeat(
  storeId: string | undefined,
  pokerGameId: string | null,
  seatIndex: number,
  customerId: string | undefined,
  customerName: string | undefined,
  setError: (error: string) => void,
  buyIn: number = 2000,
): Promise<void> {
  if (!storeId || !pokerGameId || !customerId || !customerName) {
    setError("必要な情報が不足しています")
    return
  }

  try {
    await joinPokerGame(storeId, pokerGameId, customerId, customerName, seatIndex, buyIn)
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : "座席への参加に失敗しました"
    setError(errorMessage)
    console.error("Failed to join seat:", err)
  }
}

export async function handleLeaveSeat(
  storeId: string | undefined,
  pokerGameId: string | null,
  customerId: string | undefined,
  setError: (error: string) => void,
): Promise<void> {
  if (!storeId || !pokerGameId || !customerId) {
    setError("必要な情報が不足しています")
    return
  }

  try {
    await leavePokerGame(storeId, pokerGameId, customerId)
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : "座席からの退出に失敗しました"
    setError(errorMessage)
    console.error("Failed to leave seat:", err)
  }
}

export async function handleStartGame(
  storeId: string | undefined,
  pokerGameId: string | null,
  setError: (error: string) => void,
): Promise<void> {
  if (!storeId || !pokerGameId) {
    setError("必要な情報が不足しています")
    return
  }

  try {
    await startNewHand(storeId, pokerGameId)
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : "ゲーム開始に失敗しました"
    setError(errorMessage)
    console.error("Failed to start game:", err)
  }
}

export async function handlePokerAction(
  storeId: string | undefined,
  pokerGameId: string | null,
  userId: string | undefined,
  action: any,
  amount?: number,
  setError?: (error: string) => void,
): Promise<void> {
  if (!storeId || !pokerGameId || !userId) {
    setError?.("必要な情報が不足しています")
    return
  }

  try {
    await performAction(storeId, pokerGameId, userId, action, amount)
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : "アクション実行に失敗しました"
    setError?.(errorMessage)
    console.error("Failed to perform action:", err)
  }
}

export async function handleTimeout(
  pokerGameId: string | null,
  customerId: string | undefined,
  setError: (error: string) => void,
): Promise<void> {
  if (!pokerGameId || !customerId) {
    setError("必要な情報が不足しています")
    return
  }

  try {
    await handlePlayerTimeout(pokerGameId, customerId)
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : "タイムアウト処理に失敗しました"
    setError(errorMessage)
    console.error("Failed to handle timeout:", err)
  }
}

export async function handleReadyNextHand(
  storeId: string | undefined,
  pokerGameId: string | null,
  customerId: string | undefined,
  setError: (error: string) => void,
): Promise<void> {
  if (!storeId || !pokerGameId || !customerId) {
    setError("必要な情報が不足しています")
    return
  }

  try {
    await startNewHand(storeId, pokerGameId)
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : "次のハンド開始に失敗しました"
    setError(errorMessage)
    console.error("Failed to ready next hand:", err)
  }
}

export async function handleDeleteGame(
  pokerGameId: string | null,
  setPokerGameId: (id: string | null) => void,
  setPokerGame: (game: PokerGameState | null) => void,
  setError: (error: string) => void,
): Promise<void> {
  if (!pokerGameId) {
    setError("ゲームIDが不足しています")
    return
  }

  try {
    await deletePokerGame(pokerGameId)
    setPokerGameId(null)
    setPokerGame(null)
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : "ゲーム削除に失敗しました"
    setError(errorMessage)
    console.error("Failed to delete game:", err)
  }
}

export async function handleResetGame(
  pokerGameId: string | null,
  setError: (error: string) => void,
): Promise<void> {
  if (!pokerGameId) {
    setError("ゲームIDが不足しています")
    return
  }

  try {
    await deletePokerGame(pokerGameId)
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : "ゲームリセットに失敗しました"
    setError(errorMessage)
    console.error("Failed to reset game:", err)
  }
}

export function getRemainingTimeForGame(pokerGame: PokerGameState | null): number {
  if (!pokerGame) return 0
  return getRemainingTime(pokerGame)
}
