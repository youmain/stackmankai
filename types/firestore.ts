import type { Timestamp } from "firebase/firestore"

/**
 * Firestoreに保存される際の型定義
 * serverTimestamp()はTimestamp型になる
 */
export interface FirestorePlayer {
  name: string
  uniqueId: string
  pokerName?: string
  furigana?: string
  systemBalance: number
  rewardPoints?: number
  currentGameId?: string
  isPlaying: boolean
  isSpecial?: boolean
  isDeduction?: boolean
  createdAt: Timestamp
  updatedAt: Timestamp
}

export interface FirestoreReceipt {
  playerId: string
  playerName: string
  gameId?: string | null
  status: "active" | "completed" | "cancelled" | "settled"
  totalAmount: number
  totalTaxableAmount: number
  totalTax: number
  createdAt: Timestamp
  updatedAt: Timestamp
  createdBy: string
  settledAt?: Timestamp
  settledBy?: string
}

export interface FirestoreTransaction {
  playerId: string
  gameId?: string
  type: "deposit" | "withdrawal" | "game_buy_in" | "game_additional" | "game_cashout"
  amount: number
  balanceBefore: number
  balanceAfter: number
  description: string
  createdAt: Timestamp
  createdBy: string
}

export interface FirestoreGame {
  name: string
  isActive: boolean
  createdAt: Timestamp
  updatedAt: Timestamp
  participants: FirestoreGameParticipant[]
  status?: string
  endedAt?: Timestamp
  finalStacks?: Array<{ playerId: string; finalStack: number }>
}

export interface FirestoreGameParticipant {
  playerId: string
  playerName: string
  buyInAmount: number
  currentStack: number
  additionalBuyIns: number
  joinedAt: Date | Timestamp
  systemBalanceAtJoin?: number
}
