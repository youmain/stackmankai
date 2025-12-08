"use client"

import { cn } from "@/lib/utils"

export interface PlayingCard {
  suit: "hearts" | "diamonds" | "clubs" | "spades"
  rank: "A" | "2" | "3" | "4" | "5" | "6" | "7" | "8" | "9" | "10" | "J" | "Q" | "K"
}

interface PlayingCardProps {
  card?: PlayingCard
  faceDown?: boolean
  size?: "xs" | "sm" | "md" | "lg"
  className?: string
}

const suitSymbols = {
  hearts: "♥",
  diamonds: "♦",
  clubs: "♣",
  spades: "♠",
}

const suitColors = {
  hearts: "text-red-500",
  diamonds: "text-red-500",
  clubs: "text-gray-800",
  spades: "text-gray-800",
}

const cardSizes = {
  xs: "w-6 h-9 text-[0.5rem]",
  sm: "w-8 h-12 text-xs",
  md: "w-12 h-16 text-sm",
  lg: "w-16 h-24 text-base",
}

export function PlayingCard({ card, faceDown = false, size = "md", className }: PlayingCardProps) {
  if (faceDown || !card) {
    return (
      <div
        className={cn(
          "bg-blue-600 border border-gray-300 rounded-lg flex items-center justify-center shadow-sm",
          cardSizes[size],
          className,
        )}
      >
        <div className="w-full h-full bg-gradient-to-br from-blue-500 to-blue-700 rounded-lg flex items-center justify-center">
          <div className="text-white text-xs font-bold opacity-50">♠♥♦♣</div>
        </div>
      </div>
    )
  }

  return (
    <div
      className={cn(
        "bg-white border border-gray-300 rounded-lg shadow-sm flex flex-col justify-between p-1",
        cardSizes[size],
        className,
      )}
    >
      <div className={cn("font-bold leading-none", suitColors[card.suit])}>
        <div className="text-left">{card.rank}</div>
        <div className="text-left">{suitSymbols[card.suit]}</div>
      </div>
      <div className={cn("font-bold leading-none rotate-180 self-end", suitColors[card.suit])}>
        <div className="text-left">{card.rank}</div>
        <div className="text-left">{suitSymbols[card.suit]}</div>
      </div>
    </div>
  )
}
