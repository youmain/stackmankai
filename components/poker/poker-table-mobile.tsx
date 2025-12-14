"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { PokerGame, PokerCard, PokerPlayer } from "@/types/poker"

// スートの色を取得
const getSuitColor = (suit: string) => {
  return suit === "hearts" || suit === "diamonds" ? "text-red-600" : "text-gray-900"
}

// スートの記号を取得
const getSuitSymbol = (suit: string) => {
  const symbols = {
    hearts: "♥",
    diamonds: "♦",
    clubs: "♣",
    spades: "♠",
  }
  return symbols[suit as keyof typeof symbols] || ""
}

// カードコンポーネント
const CardDisplay = ({ card, isHidden, size = "normal" }: { card: PokerCard; isHidden?: boolean; size?: "small" | "normal" | "large" }) => {
  const sizeClasses = {
    small: "w-12 h-16 text-sm",
    normal: "w-16 h-22 text-lg",
    large: "w-20 h-28 text-xl"
  }
  
  const cardClass = sizeClasses[size]
  
  if (isHidden) {
    return (
      <div 
        className={`${cardClass} rounded shadow-md`}
        style={{
          backgroundImage: "url('/card-back.png')",
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      />
    )
  }
  
  return (
    <div className={`${cardClass} bg-white border-2 border-gray-300 rounded flex flex-col items-center justify-center shadow-md`}>
      <span className={`font-bold ${getSuitColor(card.suit)}`}>
        {card.rank}
      </span>
      <span className={`text-2xl ${getSuitColor(card.suit)}`}>
        {getSuitSymbol(card.suit)}
      </span>
    </div>
  )
}

interface PokerTableMobileProps {
  game: PokerGame
  currentUserId: string
  onJoinSeat: (seatIndex: number) => void
  onAction: (action: string, amount?: number) => void
  onStartGame: () => void
}

export default function PokerTableMobile({
  game,
  currentUserId,
  onJoinSeat,
  onAction,
  onStartGame,
}: PokerTableMobileProps) {
  const [betAmount, setBetAmount] = useState(0)
  
  const currentPlayer = game.players.find(p => p.userId === currentUserId)
  const isMyTurn = currentPlayer && game.players[game.currentPlayerIndex]?.userId === currentUserId
  const myPlayerIndex = game.players.findIndex(p => p.userId === currentUserId)
  
  // 自分以外のプレイヤーを取得
  const otherPlayers = game.players.filter(p => p.userId !== currentUserId)
  
  // 空席を取得（自分の座席を除く）
  const emptySeats = Array.from({ length: 10 }, (_, i) => i)
    .filter(i => !game.players.some(p => p.seatIndex === i) && (myPlayerIndex === -1 || i !== myPlayerIndex))
  
  return (
    <div className="flex flex-col h-screen bg-gray-900 text-white overflow-hidden">
      {/* ポット表示 */}
      <div className="bg-yellow-500 text-gray-900 px-4 py-2 text-center font-bold text-lg">
        POT: ¥{game.pot.toLocaleString()} | {game.phase.toUpperCase()}
      </div>
      
      {/* 他のプレイヤー表示エリア */}
      <div className="flex-1 overflow-y-auto p-2 space-y-2">
        {otherPlayers.map((player) => {
          const isCurrentPlayerTurn = game.players[game.currentPlayerIndex]?.userId === player.userId
          const isDealer = game.dealerIndex === player.seatIndex
          const isSB = game.smallBlindIndex === player.seatIndex
          const isBB = game.bigBlindIndex === player.seatIndex
          
          return (
            <div
              key={player.userId}
              className={`bg-gray-800 rounded-lg p-3 border-2 ${
                isCurrentPlayerTurn ? "border-green-500" : "border-gray-700"
              } ${player.isFolded ? "opacity-50" : ""}`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-sm">{player.userName}</span>
                  {isDealer && <span className="bg-white text-gray-900 px-2 py-0.5 rounded text-xs font-bold">D</span>}
                  {isSB && <span className="bg-yellow-400 text-gray-900 px-2 py-0.5 rounded text-xs font-bold">SB</span>}
                  {isBB && <span className="bg-orange-400 text-gray-900 px-2 py-0.5 rounded text-xs font-bold">BB</span>}
                </div>
                <span className="text-green-400 font-bold">¥{player.stack.toLocaleString()}</span>
              </div>
              
              {/* カード */}
              <div className="flex gap-2">
                {(player.cards.length > 0 ? player.cards : [
                  { suit: "hearts" as const, rank: "A" as const },
                  { suit: "spades" as const, rank: "K" as const }
                ] as PokerCard[]).map((card, idx) => (
                  <CardDisplay
                    key={idx}
                    card={card}
                    isHidden={!player.isFolded}
                    size="small"
                  />
                ))}
              </div>
              
              {/* ベット額 */}
              {player.currentBet > 0 && (
                <div className="mt-2 bg-yellow-400 text-gray-900 px-2 py-1 rounded text-xs font-bold inline-block">
                  ベット: ¥{player.currentBet.toLocaleString()}
                </div>
              )}
              
              {/* 最後のアクション */}
              {player.lastAction && (
                <div className="mt-1 text-gray-400 text-xs">
                  {player.lastAction}
                </div>
              )}
            </div>
          )
        })}
        
        {/* 空席表示 */}
        {myPlayerIndex === -1 && emptySeats.slice(0, 3).map((seatIndex) => (
          <div key={seatIndex} className="bg-gray-800/50 rounded-lg p-3 border-2 border-dashed border-gray-600">
            <Button
              onClick={() => onJoinSeat(seatIndex)}
              variant="outline"
              className="w-full"
            >
              座席 {seatIndex + 1} に座る
            </Button>
          </div>
        ))}
      </div>
      
      {/* コミュニティカード */}
      <div className="bg-green-800 p-4">
        <div className="flex gap-2 justify-center items-center flex-wrap">
          {(game.communityCards.length > 0 ? game.communityCards : [
            { suit: "diamonds" as const, rank: "Q" as const },
            { suit: "clubs" as const, rank: "J" as const },
            { suit: "hearts" as const, rank: "10" as const },
            { suit: "spades" as const, rank: "9" as const },
            { suit: "diamonds" as const, rank: "8" as const }
          ] as PokerCard[]).map((card, idx) => (
            <CardDisplay key={idx} card={card} size="normal" />
          ))}
        </div>
      </div>
      
      {/* 自分のプレイヤー情報 */}
      {currentPlayer && (
        <div className="bg-gray-800 border-t-4 border-green-500 p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className="font-bold text-lg">{currentPlayer.userName}</span>
              {game.dealerIndex === currentPlayer.seatIndex && (
                <span className="bg-white text-gray-900 px-2 py-1 rounded text-sm font-bold">D</span>
              )}
              {game.smallBlindIndex === currentPlayer.seatIndex && (
                <span className="bg-yellow-400 text-gray-900 px-2 py-1 rounded text-sm font-bold">SB</span>
              )}
              {game.bigBlindIndex === currentPlayer.seatIndex && (
                <span className="bg-orange-400 text-gray-900 px-2 py-1 rounded text-sm font-bold">BB</span>
              )}
            </div>
            <span className="text-green-400 font-bold text-xl">¥{currentPlayer.stack.toLocaleString()}</span>
          </div>
          
          {/* 自分のカード */}
          <div className="flex gap-3 justify-center mb-3">
            {(currentPlayer.cards.length > 0 ? currentPlayer.cards : [
              { suit: "hearts" as const, rank: "A" as const },
              { suit: "spades" as const, rank: "K" as const }
            ] as PokerCard[]).map((card, idx) => (
              <CardDisplay key={idx} card={card} size="large" />
            ))}
          </div>
          
          {/* アクションボタン */}
          {isMyTurn && !currentPlayer.isFolded && (
            <div className="space-y-2">
              <div className="flex gap-2">
                <Button onClick={() => onAction("fold")} variant="destructive" className="flex-1">
                  フォールド
                </Button>
                
                {currentPlayer.currentBet >= game.currentBet && (
                  <Button onClick={() => onAction("check")} variant="outline" className="flex-1">
                    チェック
                  </Button>
                )}
                
                {currentPlayer.currentBet < game.currentBet && (
                  <Button onClick={() => onAction("call")} className="flex-1">
                    コール (¥{(game.currentBet - currentPlayer.currentBet).toLocaleString()})
                  </Button>
                )}
              </div>
              
              <div className="flex gap-2 items-center">
                <input
                  type="number"
                  value={betAmount}
                  onChange={(e) => setBetAmount(Number(e.target.value))}
                  className="flex-1 bg-gray-700 text-white px-3 py-2 rounded"
                  placeholder="ベット額"
                  min={game.currentBet + 1}
                  max={currentPlayer.stack}
                />
                <Button onClick={() => onAction("bet", betAmount)} className="flex-1">
                  ベット/レイズ
                </Button>
              </div>
              
              <Button onClick={() => onAction("allin")} variant="outline" className="w-full">
                オールイン (¥{currentPlayer.stack.toLocaleString()})
              </Button>
            </div>
          )}
          
          {/* ゲーム開始ボタン */}
          {game.phase === "waiting" && game.players.length >= 2 && (
            <Button onClick={onStartGame} size="lg" className="w-full">
              ゲーム開始
            </Button>
          )}
        </div>
      )}
    </div>
  )
}
