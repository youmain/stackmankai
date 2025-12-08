import type { PlayingCard } from "@/components/poker-table/playing-card"

export interface Player {
  id: string
  name: string
  position: number
  stack: number
  bet: number
  action?: "fold" | "call" | "raise" | "check" | "all-in"
  cards?: [PlayingCard, PlayingCard]
  isActive?: boolean
  isDealer?: boolean
}

export interface SituationData {
  gameType: string
  blinds: string
  position: string
  stackSize: string
  description: string
}

export interface PlayerAction {
  playerId: string
  playerName: string
  position: string
  action: "fold" | "call" | "raise" | "check" | "all-in"
  amount?: string
  description?: string
}

export interface StageData {
  situation: string
  players: Player[]
  communityCards: PlayingCard[]
  pot: number
  currentBet: number
  heroPosition: number
  action: string
  result?: string
  playerActions?: PlayerAction[]
}

export interface PreflopData {
  holeCards?: [PlayingCard | null, PlayingCard | null]
  action: string
  betAmount?: string
  description?: string
  situation?: string
  players?: Player[]
  communityCards?: PlayingCard[]
  pot?: number
  currentBet?: number
  heroPosition?: number
  result?: string
  playerActions?: PlayerAction[]
}

export interface FlopData {
  communityCards: [PlayingCard | null, PlayingCard | null, PlayingCard | null]
  action: string
  betAmount?: string
  description?: string
  situation?: string
  players?: Player[]
  pot?: number
  currentBet?: number
  heroPosition?: number
  result?: string
  playerActions?: PlayerAction[]
}

export interface TurnData {
  communityCard?: PlayingCard | null
  action: string
  betAmount?: string
  description?: string
  situation?: string
  players?: Player[]
  communityCards?: PlayingCard[]
  pot?: number
  currentBet?: number
  heroPosition?: number
  result?: string
  playerActions?: PlayerAction[]
}

export interface RiverData {
  communityCard?: PlayingCard | null
  action: string
  betAmount?: string
  description?: string
  situation?: string
  players?: Player[]
  communityCards?: PlayingCard[]
  pot?: number
  currentBet?: number
  heroPosition?: number
  result?: string
  playerActions?: PlayerAction[]
}

export interface ReflectionData {
  result: string
  thoughts: string
  seekingAdvice: boolean
  postCategory: string
  visibility: "public" | "store" | "friends" | "private"
}

export interface PostData {
  id: string
  title: string
  situation: string | SituationData
  visibility: "public" | "store" | "friends" | "private"
  seekingAdvice: boolean
  authorId: string
  authorName: string
  storeId?: string
  storeName?: string
  createdAt: Date
  likes?: number
  comments?: number
  views?: number
  preflop?: PreflopData
  flop?: FlopData
  turn?: TurnData
  river?: RiverData
  reflection?: ReflectionData
}

export interface Comment {
  id: string
  authorId: string
  authorName: string
  content: string
  createdAt: Date
}

export interface PokerPost extends Omit<PostData, "comments"> {
  updatedAt: Date
  comments: Comment[]
}
