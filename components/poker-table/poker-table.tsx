"use client"

import { cn } from "@/lib/utils"
import { PlayingCard, type PlayingCard as PlayingCardType } from "./playing-card"
import { Badge } from "@/components/ui/badge"

export interface Player {
  id: string
  name: string
  position: number
  stack: number
  bet: number
  action?: "fold" | "call" | "raise" | "check" | "all-in"
  cards?: [PlayingCardType, PlayingCardType]
  isActive?: boolean
  isDealer?: boolean
}

interface PokerTableProps {
  players: Player[]
  communityCards: PlayingCardType[]
  pot: number
  currentBet: number
  showPlayerCards?: boolean
  showHeroCards?: boolean
  className?: string
}

const positionCoordinates = [
  { x: 50, y: 88 }, // Position 0 (bottom center) - 下に移動
  { x: 18, y: 72 }, // Position 1 (bottom left) - 左に移動
  { x: 3, y: 50 }, // Position 2 (left) - 左に移動
  { x: 3, y: 28 }, // Position 3 (top left) - 左に移動
  { x: 18, y: 12 }, // Position 4 (top left center) - 左に移動
  { x: 50, y: 5 }, // Position 5 (top center) - 上に移動
  { x: 82, y: 12 }, // Position 6 (top right center) - 右に移動
  { x: 97, y: 28 }, // Position 7 (top right) - 右に移動
  { x: 97, y: 50 }, // Position 8 (right) - 右に移動
  { x: 82, y: 72 }, // Position 9 (bottom right) - 右に移動
]

export function PokerTable({
  players,
  communityCards,
  pot,
  currentBet,
  showPlayerCards = false,
  showHeroCards = false,
  className,
}: PokerTableProps) {
  return (
    <div className={cn("relative w-full max-w-4xl mx-auto", className)}>
      {/* テーブル */}
      <div className="relative w-full aspect-[3/4] sm:aspect-[4/3] bg-gradient-to-br from-green-600 to-green-800 rounded-full border-8 border-amber-600 shadow-2xl">
        {/* 内側のテーブル面 */}
        <div className="absolute inset-4 bg-gradient-to-br from-green-500 to-green-700 rounded-full border-4 border-amber-500">
          {/* コミュニティカード */}
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 flex gap-1 sm:gap-2">
            {communityCards.map((card, index) => (
              <PlayingCard key={index} card={card} size="xs" className="sm:w-10 sm:h-14 md:w-12 md:h-16" />
            ))}
            {/* 空のカードスロット */}
            {Array.from({ length: 5 - communityCards.length }).map((_, index) => (
              <div
                key={`empty-${index}`}
                className="w-6 h-9 sm:w-10 sm:h-14 md:w-12 md:h-16 border-2 border-dashed border-white/30 rounded-lg"
              />
            ))}
          </div>

          {/* ポット情報 */}
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 translate-y-10 sm:translate-y-12 bg-amber-100 px-2 py-1 sm:px-4 sm:py-2 rounded-full shadow-lg">
            <div className="text-center">
              <div className="text-xs sm:text-sm font-semibold text-amber-800">ポット</div>
              <div className="text-sm sm:text-lg font-bold text-amber-900">©{pot.toLocaleString()}</div>
            </div>
          </div>
        </div>

        {/* プレイヤー */}
        {players.map((player) => {
          const position = positionCoordinates[player.position] || positionCoordinates[0]
          const isHero = player.name.includes("Hero") || player.id === "hero"
          const shouldShowCards = showPlayerCards || (showHeroCards && isHero)

          return (
            <div
              key={player.id}
              className="absolute transform -translate-x-1/2 -translate-y-1/2"
              style={{
                left: `${position.x}%`,
                top: `${position.y}%`,
              }}
            >
              {/* プレイヤー情報 */}
              <div
                className={cn(
                  "bg-white rounded-lg shadow-lg p-1.5 sm:p-3 min-w-20 sm:min-w-24 text-center border-2",
                  player.isActive ? "border-yellow-400 bg-yellow-50" : "border-gray-300",
                )}
              >
                {/* ディーラーボタン */}
                {player.isDealer && (
                  <div className="absolute -top-1 -right-1 sm:-top-2 sm:-right-2 w-5 h-5 sm:w-6 sm:h-6 bg-red-500 text-white rounded-full flex items-center justify-center text-[0.6rem] sm:text-xs font-bold">
                    D
                  </div>
                )}

                {/* プレイヤー名 */}
                <div className="font-semibold text-[0.65rem] sm:text-sm truncate mb-0.5 sm:mb-1">{player.name}</div>

                {/* スタック */}
                <div className="text-[0.6rem] sm:text-xs text-gray-600 mb-0.5 sm:mb-1">
                  ©{player.stack.toLocaleString()}
                </div>

                {/* アクション */}
                {player.action && (
                  <Badge
                    variant={player.action === "fold" ? "secondary" : "default"}
                    className="text-[0.6rem] sm:text-xs mb-0.5 sm:mb-1 px-1 py-0"
                  >
                    {player.action}
                  </Badge>
                )}

                {/* ベット額 */}
                {player.bet > 0 && (
                  <div className="text-[0.6rem] sm:text-xs font-semibold text-blue-600">
                    ベット: ©{player.bet.toLocaleString()}
                  </div>
                )}
              </div>

              {/* プレイヤーのカード */}
              {player.cards && (
                <div className="flex gap-0.5 sm:gap-1 mt-1 sm:mt-2 justify-center">
                  <PlayingCard
                    card={shouldShowCards ? player.cards[0] : undefined}
                    faceDown={!shouldShowCards}
                    size="xs"
                    className="sm:w-8 sm:h-12"
                  />
                  <PlayingCard
                    card={shouldShowCards ? player.cards[1] : undefined}
                    faceDown={!shouldShowCards}
                    size="xs"
                    className="sm:w-8 sm:h-12"
                  />
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
