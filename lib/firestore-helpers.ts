import { writeBatch, doc, serverTimestamp } from "firebase/firestore"
import { db } from "./firebase"
import {
  getPlayersCollection,
  getGamesCollection,
  getTransactionsCollection,
  getGameTransactionsCollection,
  getRakeHistoryCollection,
} from "./firestore"
import type { GameParticipant } from "@/types"

/**
 * プレイヤーの残高計算（ゲーム参加時）
 */
export const calculateGameJoinBalance = (
  currentBalance: number,
  gameStack: number,
  isSpecial: boolean,
  isDeduction: boolean,
): { finalBalance: number; purchaseAmount: number } => {
  if (isSpecial || isDeduction) {
    return {
      finalBalance: currentBalance - gameStack,
      purchaseAmount: 0,
    }
  }

  if (currentBalance >= gameStack) {
    return {
      finalBalance: currentBalance - gameStack,
      purchaseAmount: 0,
    }
  }

  return {
    finalBalance: 0,
    purchaseAmount: gameStack - currentBalance,
  }
}

/**
 * プレイヤーの残高計算（追加スタック時）
 */
export const calculateAdditionalStackBalance = (
  currentBalance: number,
  additionalStack: number,
  isSpecial: boolean,
  isDeduction: boolean,
): { finalBalance: number; purchaseAmount: number } => {
  if (isSpecial || isDeduction) {
    return {
      finalBalance: currentBalance - additionalStack,
      purchaseAmount: 0,
    }
  }

  const newBalance = currentBalance - additionalStack
  return {
    finalBalance: Math.max(0, newBalance),
    purchaseAmount: newBalance < 0 ? Math.abs(newBalance) : 0,
  }
}

/**
 * プレイヤーの残高を更新
 */
export const updatePlayerBalance = async (
  playerId: string,
  newBalance: number,
  isPlaying: boolean,
  gameId: string | null,
) => {
  const batch = writeBatch(db)
  const playerRef = doc(getPlayersCollection(), playerId)

  batch.update(playerRef, {
    systemBalance: newBalance,
    isPlaying,
    currentGameId: gameId,
    updatedAt: serverTimestamp(),
  })

  await batch.commit()
}

/**
 * ゲーム参加者を追加
 */
export const addGameParticipant = async (
  gameId: string,
  participant: GameParticipant,
  gameName: string,
  purchaseAmount: number,
  currentBalance: number,
  finalBalance: number,
  createdBy: string,
) => {
  const batch = writeBatch(db)
  const gameRef = doc(getGamesCollection(), gameId)

  // ゲームに参加者を追加
  const gameSnap = await import("firebase/firestore").then((m) => m.getDoc(gameRef))
  const gameData = gameSnap.data()
  const participants = [...(gameData?.participants || []), participant]

  batch.update(gameRef, {
    participants,
    updatedAt: serverTimestamp(),
  })

  // トランザクション記録を作成
  const transactionRef = doc(getTransactionsCollection())
  batch.set(transactionRef, {
    playerId: participant.playerId,
    gameId,
    type: "game_buy_in",
    amount: purchaseAmount > 0 ? -purchaseAmount : 0,
    balanceBefore: currentBalance,
    balanceAfter: finalBalance,
    description:
      purchaseAmount > 0
        ? `ゲーム参加: ${gameName} (バイイン: ${participant.buyInAmount}©, 購入: ${purchaseAmount}©)`
        : `ゲーム参加: ${gameName} (バイイン: ${participant.buyInAmount}©, システム残高から使用)`,
    createdAt: serverTimestamp(),
    createdBy,
  })

  // ゲームトランザクションを作成
  const gameTransactionRef = doc(getGameTransactionsCollection())
  batch.set(gameTransactionRef, {
    gameId,
    playerId: participant.playerId,
    type: "buy_in",
    amount: participant.buyInAmount,
    stackBefore: 0,
    stackAfter: participant.buyInAmount,
    description: `ゲーム参加 - スタック: ${participant.buyInAmount}© (購入: ${purchaseAmount}©)`,
    createdAt: serverTimestamp(),
    createdBy,
  })

  await batch.commit()
}

/**
 * 追加スタックのトランザクションを記録
 */
export const recordAdditionalStackTransaction = async (
  gameId: string,
  playerId: string,
  gameName: string,
  additionalStack: number,
  oldStack: number,
  newStack: number,
  currentBalance: number,
  finalBalance: number,
  purchaseAmount: number,
  createdBy: string,
) => {
  const batch = writeBatch(db)

  // プレイヤートランザクション
  const transactionRef = doc(getTransactionsCollection())
  batch.set(transactionRef, {
    playerId,
    gameId,
    type: "game_additional",
    amount: purchaseAmount > 0 ? -purchaseAmount : 0,
    balanceBefore: currentBalance,
    balanceAfter: finalBalance,
    description:
      purchaseAmount > 0
        ? `追加購入: ${gameName} (${purchaseAmount}©)`
        : `追加スタック: ${gameName} (${additionalStack}©, システム残高から使用)`,
    createdAt: serverTimestamp(),
    createdBy,
  })

  // ゲームトランザクション
  const gameTransactionRef = doc(getGameTransactionsCollection())
  batch.set(gameTransactionRef, {
    gameId,
    playerId,
    type: purchaseAmount > 0 ? "additional_buy_in" : "stack_update",
    amount: additionalStack,
    stackBefore: oldStack,
    stackAfter: newStack,
    description:
      purchaseAmount > 0
        ? `スタック追加 ${additionalStack}© (購入: ${purchaseAmount}©)`
        : `スタック追加 ${additionalStack}© (残高から使用)`,
    createdAt: serverTimestamp(),
    createdBy,
  })

  await batch.commit()
}

/**
 * ゲーム終了時のプレイヤー処理
 */
export const processPlayerGameEnd = async (
  playerId: string,
  playerName: string,
  gameId: string,
  gameName: string,
  finalStack: number,
  currentBalance: number,
  participant: GameParticipant,
  createdBy: string,
) => {
  const batch = writeBatch(db)

  const newBalance = currentBalance + finalStack
  const totalBuyIn = participant.buyInAmount + participant.additionalBuyIns
  const profit = finalStack - totalBuyIn
  const rakeAmount = totalBuyIn - finalStack

  // プレイヤー状態を更新
  batch.update(doc(getPlayersCollection(), playerId), {
    systemBalance: newBalance,
    isPlaying: false,
    currentGameId: null,
    updatedAt: serverTimestamp(),
  })

  // トランザクション記録
  const transactionRef = doc(getTransactionsCollection())
  batch.set(transactionRef, {
    playerId,
    gameId,
    type: "game_cashout",
    amount: finalStack,
    balanceBefore: currentBalance,
    balanceAfter: newBalance,
    description: `ゲーム終了: ${gameName} (最終: ${finalStack}©, 損益: ${profit >= 0 ? "+" : ""}${profit}©)`,
    createdAt: serverTimestamp(),
    createdBy,
  })

  // レーキ履歴
  const rakeHistoryRef = doc(getRakeHistoryCollection())
  batch.set(rakeHistoryRef, {
    playerId,
    playerName,
    gameId,
    buyIn: participant.buyInAmount,
    additionalStack: participant.additionalBuyIns,
    finalStack,
    rake: rakeAmount,
    createdAt: serverTimestamp(),
    createdBy,
  })

  await batch.commit()

  console.log("[v0] ✅ プレイヤーゲーム終了処理完了:", {
    playerId,
    playerName,
    finalStack,
    newBalance,
    profit,
    rakeAmount,
  })
}
