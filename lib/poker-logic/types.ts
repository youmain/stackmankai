// ポーカーゲームの型定義

export type Suit = "hearts" | "diamonds" | "clubs" | "spades"
export type Rank = "2" | "3" | "4" | "5" | "6" | "7" | "8" | "9" | "10" | "J" | "Q" | "K" | "A"

export interface Card {
  suit: Suit
  rank: Rank
}

export enum HandRankType {
  HIGH_CARD = 0,
  ONE_PAIR = 1,
  TWO_PAIR = 2,
  THREE_OF_A_KIND = 3,
  STRAIGHT = 4,
  FLUSH = 5,
  FULL_HOUSE = 6,
  FOUR_OF_A_KIND = 7,
  STRAIGHT_FLUSH = 8,
  ROYAL_FLUSH = 9,
}

export interface HandRank {
  type: HandRankType
  cards: Card[]
  value: number // 比較用の数値
}

export interface PlayerHand {
  playerId: string
  cards: Card[]
  handRank?: HandRank
}
