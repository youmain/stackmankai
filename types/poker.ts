// ポーカーゲームの型定義

export type ViewMode = 'poker' | 'chat' | 'spectate'

export type Suit = "hearts" | "diamonds" | "clubs" | "spades"
export type Rank = "2" | "3" | "4" | "5" | "6" | "7" | "8" | "9" | "10" | "J" | "Q" | "K" | "A"

export interface Card {
  suit: Suit
  rank: Rank
}

export type PlayerAction = "fold" | "check" | "call" | "bet" | "raise" | "allin"

export type GamePhase = "waiting" | "preflop" | "flop" | "turn" | "river" | "showdown" | "ended"

export interface PokerPlayer {
  userId: string
  userName: string
  seatIndex: number // 0-9
  stack: number
  currentBet: number
  cards: Card[] // 2枚のホールカード
  isFolded: boolean
  isAllIn: boolean
  isActive: boolean // ゲームに参加中
  lastAction?: PlayerAction
  consecutiveTimeouts?: number // 連続タイムアウト回数
}

export interface ActionHistoryEntry {
  playerName: string
  action: PlayerAction
  amount?: number
  phase: GamePhase
  timestamp: Date
}

export interface PokerGameState {
  id: string
  storeId: string
  phase: GamePhase
  pot: number
  communityCards: Card[] // 最大5枚
  currentBet: number
  minRaise: number
  dealerIndex: number // ディーラーボタンの位置
  smallBlindIndex: number
  bigBlindIndex: number
  currentPlayerIndex: number // 現在アクション中のプレイヤー
  players: PokerPlayer[]
  smallBlind: number
  bigBlind: number
  actionHistory?: ActionHistoryEntry[] // アクション履歴
  winners?: string[] // 勝者のuserIdリスト（showdown時）
  winnerHands?: any[] // 勝者のハンド情報
  createdAt: Date
  updatedAt: Date
  turnStartTime?: Date // 現在のターンの開始時刻
  timeoutSeconds?: number // タイムアウトまでの秒数
}

export interface PokerAction {
  gameId: string
  userId: string
  action: PlayerAction
  amount?: number // ベット・レイズ額
  timestamp: Date
}
