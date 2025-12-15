// ポーカーハンド判定ライブラリ
import type { Card, Rank, Suit } from "@/types/poker"

export type HandRank =
  | "royal_flush"
  | "straight_flush"
  | "four_of_a_kind"
  | "full_house"
  | "flush"
  | "straight"
  | "three_of_a_kind"
  | "two_pair"
  | "one_pair"
  | "high_card"

export interface HandEvaluation {
  rank: HandRank
  rankValue: number
  description: string
  cards: Card[]
}

const RANK_VALUES: Record<Rank, number> = {
  "2": 2, "3": 3, "4": 4, "5": 5, "6": 6, "7": 7, "8": 8, "9": 9,
  "10": 10, "J": 11, "Q": 12, "K": 13, "A": 14
}

const HAND_RANK_VALUES: Record<HandRank, number> = {
  high_card: 1,
  one_pair: 2,
  two_pair: 3,
  three_of_a_kind: 4,
  straight: 5,
  flush: 6,
  full_house: 7,
  four_of_a_kind: 8,
  straight_flush: 9,
  royal_flush: 10
}

const HAND_DESCRIPTIONS: Record<HandRank, string> = {
  royal_flush: "ロイヤルフラッシュ",
  straight_flush: "ストレートフラッシュ",
  four_of_a_kind: "フォーカード",
  full_house: "フルハウス",
  flush: "フラッシュ",
  straight: "ストレート",
  three_of_a_kind: "スリーカード",
  two_pair: "ツーペア",
  one_pair: "ワンペア",
  high_card: "ハイカード"
}

function getRankValue(rank: Rank): number {
  return RANK_VALUES[rank]
}

function countRanks(cards: Card[]): Map<number, Card[]> {
  const counts = new Map<number, Card[]>()
  for (const card of cards) {
    const value = getRankValue(card.rank)
    if (!counts.has(value)) {
      counts.set(value, [])
    }
    counts.get(value)!.push(card)
  }
  return counts
}

function isFlush(cards: Card[]): boolean {
  if (cards.length < 5) return false
  const suitCounts = new Map<Suit, number>()
  for (const card of cards) {
    suitCounts.set(card.suit, (suitCounts.get(card.suit) || 0) + 1)
  }
  return Array.from(suitCounts.values()).some(count => count >= 5)
}

function isStraight(cards: Card[]): boolean {
  if (cards.length < 5) return false
  const values = Array.from(new Set(cards.map(c => getRankValue(c.rank)))).sort((a, b) => b - a)
  
  // 通常のストレート
  for (let i = 0; i <= values.length - 5; i++) {
    if (values[i] - values[i + 4] === 4) return true
  }
  
  // A-2-3-4-5 (ホイール)
  if (values.includes(14) && values.includes(2) && values.includes(3) && 
      values.includes(4) && values.includes(5)) {
    return true
  }
  
  return false
}

export function evaluateHand(holeCards: Card[], communityCards: Card[]): HandEvaluation {
  const allCards = [...holeCards, ...communityCards]
  if (allCards.length < 5) {
    return {
      rank: "high_card",
      rankValue: HAND_RANK_VALUES.high_card,
      description: HAND_DESCRIPTIONS.high_card,
      cards: allCards
    }
  }

  const rankCounts = countRanks(allCards)
  const sortedCounts = Array.from(rankCounts.entries()).sort((a, b) => {
    if (a[1].length !== b[1].length) return b[1].length - a[1].length
    return b[0] - a[0]
  })

  const hasFlush = isFlush(allCards)
  const hasStraight = isStraight(allCards)

  // ロイヤルフラッシュ
  if (hasFlush && hasStraight) {
    const values = allCards.map(c => getRankValue(c.rank))
    if (values.includes(14) && values.includes(13) && values.includes(12) && 
        values.includes(11) && values.includes(10)) {
      return {
        rank: "royal_flush",
        rankValue: HAND_RANK_VALUES.royal_flush,
        description: HAND_DESCRIPTIONS.royal_flush,
        cards: allCards
      }
    }
    return {
      rank: "straight_flush",
      rankValue: HAND_RANK_VALUES.straight_flush,
      description: HAND_DESCRIPTIONS.straight_flush,
      cards: allCards
    }
  }

  // フォーカード
  if (sortedCounts[0][1].length === 4) {
    return {
      rank: "four_of_a_kind",
      rankValue: HAND_RANK_VALUES.four_of_a_kind,
      description: HAND_DESCRIPTIONS.four_of_a_kind,
      cards: sortedCounts[0][1]
    }
  }

  // フルハウス
  if (sortedCounts[0][1].length === 3 && sortedCounts[1][1].length >= 2) {
    return {
      rank: "full_house",
      rankValue: HAND_RANK_VALUES.full_house,
      description: HAND_DESCRIPTIONS.full_house,
      cards: [...sortedCounts[0][1], ...sortedCounts[1][1].slice(0, 2)]
    }
  }

  // フラッシュ
  if (hasFlush) {
    return {
      rank: "flush",
      rankValue: HAND_RANK_VALUES.flush,
      description: HAND_DESCRIPTIONS.flush,
      cards: allCards
    }
  }

  // ストレート
  if (hasStraight) {
    return {
      rank: "straight",
      rankValue: HAND_RANK_VALUES.straight,
      description: HAND_DESCRIPTIONS.straight,
      cards: allCards
    }
  }

  // スリーカード
  if (sortedCounts[0][1].length === 3) {
    return {
      rank: "three_of_a_kind",
      rankValue: HAND_RANK_VALUES.three_of_a_kind,
      description: HAND_DESCRIPTIONS.three_of_a_kind,
      cards: sortedCounts[0][1]
    }
  }

  // ツーペア
  if (sortedCounts[0][1].length === 2 && sortedCounts[1][1].length === 2) {
    return {
      rank: "two_pair",
      rankValue: HAND_RANK_VALUES.two_pair,
      description: HAND_DESCRIPTIONS.two_pair,
      cards: [...sortedCounts[0][1], ...sortedCounts[1][1]]
    }
  }

  // ワンペア
  if (sortedCounts[0][1].length === 2) {
    return {
      rank: "one_pair",
      rankValue: HAND_RANK_VALUES.one_pair,
      description: HAND_DESCRIPTIONS.one_pair,
      cards: sortedCounts[0][1]
    }
  }

  // ハイカード
  return {
    rank: "high_card",
    rankValue: HAND_RANK_VALUES.high_card,
    description: HAND_DESCRIPTIONS.high_card,
    cards: [allCards.sort((a, b) => getRankValue(b.rank) - getRankValue(a.rank))[0]]
  }
}
