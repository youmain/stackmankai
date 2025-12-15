import { Card, Rank, Suit } from "./types"

// カードのランクを数値に変換
export function getRankValue(rank: Rank): number {
  const rankValues: Record<Rank, number> = {
    "2": 2,
    "3": 3,
    "4": 4,
    "5": 5,
    "6": 6,
    "7": 7,
    "8": 8,
    "9": 9,
    "10": 10,
    "J": 11,
    "Q": 12,
    "K": 13,
    "A": 14,
  }
  return rankValues[rank]
}

// カードを文字列に変換
export function cardToString(card: Card): string {
  const suitSymbols: Record<Suit, string> = {
    hearts: "♥",
    diamonds: "♦",
    clubs: "♣",
    spades: "♠",
  }
  return `${card.rank}${suitSymbols[card.suit]}`
}

// カードを比較（ソート用）
export function compareCards(a: Card, b: Card): number {
  return getRankValue(a.rank) - getRankValue(b.rank)
}

// カードが同じランクかチェック
export function isSameRank(a: Card, b: Card): boolean {
  return a.rank === b.rank
}

// カードが同じスートかチェック
export function isSameSuit(a: Card, b: Card): boolean {
  return a.suit === b.suit
}
