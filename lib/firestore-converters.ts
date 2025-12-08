import type { Player, Receipt, Transaction, Game } from "@/types"
import type { FirestorePlayer, FirestoreReceipt, FirestoreTransaction, FirestoreGame } from "@/types/firestore"
import { toSafeDate } from "./type-guards"

/**
 * FirestorePlayerをPlayer型に変換
 */
export function convertFirestorePlayer(id: string, data: FirestorePlayer): Player {
  return {
    id,
    uniqueId: data.uniqueId,
    name: data.name,
    pokerName: data.pokerName,
    furigana: data.furigana,
    systemBalance: data.systemBalance,
    rewardPoints: data.rewardPoints || 0,
    currentGameId: data.currentGameId,
    isPlaying: data.isPlaying,
    isSpecial: data.isSpecial || false,
    isDeduction: data.isDeduction || false,
    createdAt: toSafeDate(data.createdAt),
    updatedAt: toSafeDate(data.updatedAt),
  }
}

/**
 * FirestoreReceiptをReceipt型に変換
 */
export function convertFirestoreReceipt(id: string, data: FirestoreReceipt): Receipt {
  return {
    id,
    playerId: data.playerId,
    playerName: data.playerName,
    gameId: data.gameId || undefined,
    status: data.status,
    totalAmount: data.totalAmount,
    totalTaxableAmount: data.totalTaxableAmount,
    totalTax: data.totalTax,
    createdAt: toSafeDate(data.createdAt),
    updatedAt: toSafeDate(data.updatedAt),
    createdBy: data.createdBy,
    settledAt: data.settledAt ? toSafeDate(data.settledAt) : undefined,
    settledBy: data.settledBy,
  }
}

/**
 * FirestoreTransactionをTransaction型に変換
 */
export function convertFirestoreTransaction(id: string, data: FirestoreTransaction): Transaction {
  return {
    id,
    playerId: data.playerId,
    gameId: data.gameId,
    type: data.type,
    amount: data.amount,
    balanceBefore: data.balanceBefore,
    balanceAfter: data.balanceAfter,
    description: data.description,
    createdAt: toSafeDate(data.createdAt),
    createdBy: data.createdBy,
  }
}

/**
 * FirestoreGameをGame型に変換
 */
export function convertFirestoreGame(id: string, data: FirestoreGame): Game {
  return {
    id,
    name: data.name,
    isActive: data.isActive,
    createdAt: toSafeDate(data.createdAt),
    updatedAt: toSafeDate(data.updatedAt),
    participants: data.participants.map((p) => ({
      ...p,
      joinedAt: toSafeDate(p.joinedAt),
    })),
  }
}
