"use client"

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import type { PlayingCard } from "@/components/poker-table/playing-card"

interface Props {
  value: PlayingCard | null
  onChange: (value: PlayingCard | null) => void
  placeholder: string
}

const suitMap: Record<string, "hearts" | "diamonds" | "clubs" | "spades"> = {
  "♥": "hearts",
  "♦": "diamonds",
  "♣": "clubs",
  "♠": "spades",
}

const suitSymbolMap: Record<"hearts" | "diamonds" | "clubs" | "spades", string> = {
  hearts: "♥",
  diamonds: "♦",
  clubs: "♣",
  spades: "♠",
}

export function CardSelector({ value, onChange, placeholder }: Props) {
  const suits = ["♠", "♥", "♦", "♣"]
  const ranks: Array<"A" | "2" | "3" | "4" | "5" | "6" | "7" | "8" | "9" | "10" | "J" | "Q" | "K"> = [
    "A", "K", "Q", "J", "10", "9", "8", "7", "6", "5", "4", "3", "2"
  ]

  const cards = suits.flatMap((suit) => ranks.map((rank) => `${rank}${suit}`))

  const getCardColor = (card: string) => {
    if (card.includes("♥") || card.includes("♦")) {
      return "text-red-600"
    }
    return "text-black"
  }

  const cardToString = (card: PlayingCard | null): string => {
    if (!card) return ""
    const suitSymbol = suitSymbolMap[card.suit]
    return `${card.rank}${suitSymbol}`
  }

  const stringToCard = (str: string): PlayingCard | null => {
    if (!str) return null
    const suitSymbol = str.slice(-1)
    const rank = str.slice(0, -1) as PlayingCard["rank"]
    const suit = suitMap[suitSymbol]
    if (!suit) return null
    return { suit, rank }
  }

  const handleChange = (str: string) => {
    onChange(stringToCard(str))
  }

  return (
    <Select value={cardToString(value)} onValueChange={handleChange}>
      <SelectTrigger className="w-24">
        <SelectValue placeholder={placeholder}>
          {value && <span className={getCardColor(cardToString(value))}>{cardToString(value)}</span>}
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        {cards.map((card) => (
          <SelectItem key={card} value={card}>
            <span className={getCardColor(card)}>{card}</span>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
