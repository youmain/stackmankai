"use client"

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface Props {
  value: string
  onChange: (value: string) => void
  placeholder: string
}

export function CardSelector({ value, onChange, placeholder }: Props) {
  const suits = ["♠", "♥", "♦", "♣"]
  const ranks = ["A", "K", "Q", "J", "T", "9", "8", "7", "6", "5", "4", "3", "2"]

  const cards = suits.flatMap((suit) => ranks.map((rank) => `${rank}${suit}`))

  const getCardColor = (card: string) => {
    if (card.includes("♥") || card.includes("♦")) {
      return "text-red-600"
    }
    return "text-black"
  }

  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className="w-24">
        <SelectValue placeholder={placeholder}>
          {value && <span className={getCardColor(value)}>{value}</span>}
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
