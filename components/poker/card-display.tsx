"use client"

import React from "react"
import type { Card } from "@/types/poker"

interface CardDisplayProps {
  card: Card
  size?: "small" | "normal" | "large"
  animate?: boolean
}

export function CardDisplay({ card, size = "normal", animate = false }: CardDisplayProps) {
  const isRed = card.suit === "hearts" || card.suit === "diamonds"
  
  const sizeClasses = {
    small: "w-6 h-8 text-[10px] rounded-sm",
    normal: "w-12 h-16 text-sm rounded-md",
    large: "w-16 h-24 text-xl rounded-lg"
  }

  const suitSymbols = {
    spades: "♠",
    hearts: "♥",
    diamonds: "♦",
    clubs: "♣"
  }

  return (
    <div className={`${sizeClasses[size]} bg-white border border-gray-300 flex flex-col items-center justify-center font-bold shadow-sm ${isRed ? 'text-red-600' : 'text-gray-900'} ${animate ? 'animate-in zoom-in-50 duration-300' : ''}`}>
      <div className="leading-none">{card.rank}</div>
      <div className="text-[1.2em] leading-none">{suitSymbols[card.suit]}</div>
    </div>
  )
}
