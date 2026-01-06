import type { Timestamp } from "firebase/firestore"
import type { Card } from "./poker"

/**
 * Stack Man Hand Settings (Store configuration)
 */
export interface PokerOperationHours {
  open: string  // "HH:MM" format
  close: string // "HH:MM" format
}

/**
 * Stack Man Hand Settings (Store configuration)
 */
export interface StackManHandSettings {
  enabled: boolean
  purchasePrice: number
  rewardBaseAmount: number

}

/**
 * Rake Settings (Store configuration)
 */
export interface RakeSettings {
  enabled: boolean
  rakePercentage: number  // 0-100
  collectionTime: string  // "HH:MM" format
}

/**
 * Stack Reset Settings (Store configuration)
 */
export interface StackResetSettings {
  enabled: boolean
  resetTime: string       // "HH:MM" format
  minimumStack: number    // Default: 10000
}

/**
 * Stack Man Hand
 */
export interface StackManHand {
  id: string
  userId: string
  userName: string
  storeId: string
  
  // Hand information
  cards: Card[]
  handRank: string
  rank: "S" | "A" | "B" | "C"  // Hand strength rank
  
  // Purchase information
  purchasePrice: number
  multiplier: number              // Random multiplier (10-20)
  baseReward: number              // Base reward amount from store settings
  finalReward: number             // baseReward × multiplier
  purchasedAt: Timestamp
  validUntil: Timestamp
  
  // Status
  status: "active" | "used" | "expired" | "replaced"
  usedAt?: Timestamp
  replacedAt?: Timestamp
  result?: "win" | "lose"
}

/**
 * Rake Collection Record
 */
export interface RakeCollection {
  id: string
  storeId: string
  collectedAt: Timestamp
  totalAmount: number
  playerRakes: PlayerRake[]
}

export interface PlayerRake {
  userId: string
  userName: string
  amount: number
  stackBefore: number
  stackAfter: number
}

/**
 * Stack Reset Record
 */
export interface StackReset {
  id: string
  storeId: string
  resetAt: Timestamp
  playerResets: PlayerReset[]
}

export interface PlayerReset {
  userId: string
  userName: string
  stackBefore: number
  stackAfter: number
  wasReset: boolean
}

/**
 * Extended Store type with new settings
 */
export interface StoreWithStackManHand {
  pokerOperationHours?: PokerOperationHours
  stackManHandSettings?: StackManHandSettings
  rakeSettings?: RakeSettings
  stackResetSettings?: StackResetSettings
}

/**
 * Extended PokerPlayer type with store chips
 */
export interface PokerPlayerWithStoreChips {
  storeChips?: number
  lastStackReset?: Timestamp
  totalRakeCollected?: number
}
