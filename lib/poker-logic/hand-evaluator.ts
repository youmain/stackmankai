import { Card, HandRank, HandRankType } from "./types"
import { getRankValue, compareCards, isSameRank, isSameSuit } from "./card"

export class HandEvaluator {
  // 7枚のカード（手札2枚+コミュニティ5枚）から最高の役を評価
  evaluateHand(cards: Card[]): HandRank {
    if (cards.length < 5) {
      throw new Error("最低5枚のカードが必要です")
    }

    // カードをランクでソート（降順）
    const sortedCards = [...cards].sort((a, b) => getRankValue(b.rank) - getRankValue(a.rank))

    // 各役をチェック（強い順）
    const flush = this.checkFlush(sortedCards)
    const straight = this.checkStraight(sortedCards)
    
    if (flush && straight) {
      const isRoyal = straight.cards[0].rank === "A"
      return {
        type: isRoyal ? HandRankType.ROYAL_FLUSH : HandRankType.STRAIGHT_FLUSH,
        cards: straight.cards,
        value: this.calculateValue(isRoyal ? HandRankType.ROYAL_FLUSH : HandRankType.STRAIGHT_FLUSH, straight.cards),
      }
    }

    const fourOfAKind = this.checkFourOfAKind(sortedCards)
    if (fourOfAKind) return fourOfAKind

    const fullHouse = this.checkFullHouse(sortedCards)
    if (fullHouse) return fullHouse

    if (flush) return flush
    if (straight) return straight

    const threeOfAKind = this.checkThreeOfAKind(sortedCards)
    if (threeOfAKind) return threeOfAKind

    const twoPair = this.checkTwoPair(sortedCards)
    if (twoPair) return twoPair

    const onePair = this.checkOnePair(sortedCards)
    if (onePair) return onePair

    // ハイカード
    return {
      type: HandRankType.HIGH_CARD,
      cards: sortedCards.slice(0, 5),
      value: this.calculateValue(HandRankType.HIGH_CARD, sortedCards.slice(0, 5)),
    }
  }

  // ワンペアをチェック
  private checkOnePair(cards: Card[]): HandRank | null {
    const rankCounts = this.countRanks(cards)
    
    for (const [rank, count] of Object.entries(rankCounts)) {
      if (count >= 2) {
        const pairCards = cards.filter((c) => c.rank === rank).slice(0, 2)
        const kickers = cards.filter((c) => c.rank !== rank).slice(0, 3)
        const handCards = [...pairCards, ...kickers]
        
        return {
          type: HandRankType.ONE_PAIR,
          cards: handCards,
          value: this.calculateValue(HandRankType.ONE_PAIR, handCards),
        }
      }
    }
    
    return null
  }

  // ツーペアをチェック
  private checkTwoPair(cards: Card[]): HandRank | null {
    const rankCounts = this.countRanks(cards)
    const pairs: string[] = []
    
    for (const [rank, count] of Object.entries(rankCounts)) {
      if (count >= 2) {
        pairs.push(rank)
      }
    }
    
    if (pairs.length >= 2) {
      // 最も強い2つのペアを選択
      pairs.sort((a, b) => getRankValue(b as any) - getRankValue(a as any))
      const pair1Cards = cards.filter((c) => c.rank === pairs[0]).slice(0, 2)
      const pair2Cards = cards.filter((c) => c.rank === pairs[1]).slice(0, 2)
      const kicker = cards.filter((c) => c.rank !== pairs[0] && c.rank !== pairs[1])[0]
      const handCards = [...pair1Cards, ...pair2Cards, kicker]
      
      return {
        type: HandRankType.TWO_PAIR,
        cards: handCards,
        value: this.calculateValue(HandRankType.TWO_PAIR, handCards),
      }
    }
    
    return null
  }

  // スリーカードをチェック
  private checkThreeOfAKind(cards: Card[]): HandRank | null {
    const rankCounts = this.countRanks(cards)
    
    for (const [rank, count] of Object.entries(rankCounts)) {
      if (count >= 3) {
        const threeCards = cards.filter((c) => c.rank === rank).slice(0, 3)
        const kickers = cards.filter((c) => c.rank !== rank).slice(0, 2)
        const handCards = [...threeCards, ...kickers]
        
        return {
          type: HandRankType.THREE_OF_A_KIND,
          cards: handCards,
          value: this.calculateValue(HandRankType.THREE_OF_A_KIND, handCards),
        }
      }
    }
    
    return null
  }

  // ストレートをチェック
  private checkStraight(cards: Card[]): HandRank | null {
    const uniqueRanks = Array.from(new Set(cards.map((c) => c.rank)))
    const values = uniqueRanks.map((r) => getRankValue(r as any)).sort((a, b) => b - a)
    
    // 通常のストレート
    for (let i = 0; i <= values.length - 5; i++) {
      if (values[i] - values[i + 4] === 4) {
        const straightCards = cards.filter((c) => {
          const v = getRankValue(c.rank)
          return v >= values[i + 4] && v <= values[i]
        }).slice(0, 5)
        
        return {
          type: HandRankType.STRAIGHT,
          cards: straightCards,
          value: this.calculateValue(HandRankType.STRAIGHT, straightCards),
        }
      }
    }
    
    // A-2-3-4-5のストレート（ホイール）
    if (values.includes(14) && values.includes(2) && values.includes(3) && values.includes(4) && values.includes(5)) {
      const wheelCards = cards.filter((c) => ["A", "2", "3", "4", "5"].includes(c.rank)).slice(0, 5)
      return {
        type: HandRankType.STRAIGHT,
        cards: wheelCards,
        value: this.calculateValue(HandRankType.STRAIGHT, wheelCards),
      }
    }
    
    return null
  }

  // フラッシュをチェック
  private checkFlush(cards: Card[]): HandRank | null {
    const suitCounts: Record<string, Card[]> = {}
    
    for (const card of cards) {
      if (!suitCounts[card.suit]) {
        suitCounts[card.suit] = []
      }
      suitCounts[card.suit].push(card)
    }
    
    for (const suitCards of Object.values(suitCounts)) {
      if (suitCards.length >= 5) {
        const flushCards = suitCards.slice(0, 5)
        return {
          type: HandRankType.FLUSH,
          cards: flushCards,
          value: this.calculateValue(HandRankType.FLUSH, flushCards),
        }
      }
    }
    
    return null
  }

  // フルハウスをチェック
  private checkFullHouse(cards: Card[]): HandRank | null {
    const rankCounts = this.countRanks(cards)
    let threeRank: string | null = null
    let pairRank: string | null = null
    
    // スリーカードを探す
    for (const [rank, count] of Object.entries(rankCounts)) {
      if (count >= 3) {
        threeRank = rank
        break
      }
    }
    
    // ペアを探す
    if (threeRank) {
      for (const [rank, count] of Object.entries(rankCounts)) {
        if (rank !== threeRank && count >= 2) {
          pairRank = rank
          break
        }
      }
    }
    
    if (threeRank && pairRank) {
      const threeCards = cards.filter((c) => c.rank === threeRank).slice(0, 3)
      const pairCards = cards.filter((c) => c.rank === pairRank).slice(0, 2)
      const handCards = [...threeCards, ...pairCards]
      
      return {
        type: HandRankType.FULL_HOUSE,
        cards: handCards,
        value: this.calculateValue(HandRankType.FULL_HOUSE, handCards),
      }
    }
    
    return null
  }

  // フォーカードをチェック
  private checkFourOfAKind(cards: Card[]): HandRank | null {
    const rankCounts = this.countRanks(cards)
    
    for (const [rank, count] of Object.entries(rankCounts)) {
      if (count >= 4) {
        const fourCards = cards.filter((c) => c.rank === rank).slice(0, 4)
        const kicker = cards.filter((c) => c.rank !== rank)[0]
        const handCards = [...fourCards, kicker]
        
        return {
          type: HandRankType.FOUR_OF_A_KIND,
          cards: handCards,
          value: this.calculateValue(HandRankType.FOUR_OF_A_KIND, handCards),
        }
      }
    }
    
    return null
  }

  // ランクの出現回数をカウント
  private countRanks(cards: Card[]): Record<string, number> {
    const counts: Record<string, number> = {}
    for (const card of cards) {
      counts[card.rank] = (counts[card.rank] || 0) + 1
    }
    return counts
  }

  // ハンドの値を計算（比較用）
  private calculateValue(type: HandRankType, cards: Card[]): number {
    let value = type * 10000000000 // 役の種類を最上位に
    
    // カードのランクを値に追加
    for (let i = 0; i < Math.min(cards.length, 5); i++) {
      value += getRankValue(cards[i].rank) * Math.pow(100, 4 - i)
    }
    
    return value
  }

  // 2つのハンドを比較（1: hand1が強い, -1: hand2が強い, 0: 引き分け）
  compareHands(hand1: HandRank, hand2: HandRank): number {
    if (hand1.value > hand2.value) return 1
    if (hand1.value < hand2.value) return -1
    return 0
  }
}
