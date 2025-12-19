import { Card, Rank, Suit } from "./types"

export class Deck {
  private cards: Card[] = []

  constructor() {
    this.reset()
  }

  // デッキをリセット（52枚のカードを作成）
  reset(): void {
    this.cards = []
    const suits: Suit[] = ["hearts", "diamonds", "clubs", "spades"]
    const ranks: Rank[] = ["2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K", "A"]

    for (const suit of suits) {
      for (const rank of ranks) {
        this.cards.push({ suit, rank })
      }
    }
  }

  // デッキをシャッフル（Fisher-Yatesアルゴリズム）
  shuffle(): void {
    for (let i = this.cards.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[this.cards[i], this.cards[j]] = [this.cards[j], this.cards[i]]
    }
  }

  // カードを1枚引く
  deal(): Card | null {
    return this.cards.pop() || null
  }

  // 複数枚のカードを引く
  dealMultiple(count: number): Card[] {
    const cards: Card[] = []
    for (let i = 0; i < count; i++) {
      const card = this.deal()
      if (card) {
        cards.push(card)
      }
    }
    return cards
  }

  // 残りのカード枚数
  remaining(): number {
    return this.cards.length
  }

  // デッキから特定のカードを除外
  removeCards(cardsToRemove: Card[]): void {
    this.cards = this.cards.filter(card =>
      !cardsToRemove.some(removed =>
        removed.suit === card.suit && removed.rank === card.rank
      )
    )
  }
}
