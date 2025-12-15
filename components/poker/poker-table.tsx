"use client"

import { useState, useEffect } from "react"
import "./animations.css"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import type { PokerGameState, PokerPlayer, Card as PokerCard } from "@/types/poker"
import { TimeoutIndicator } from "./timeout-indicator"

interface PokerTableProps {
  game: PokerGameState | null
  currentUserId: string
  onAction: (action: string, amount?: number) => void
  onJoinSeat: (seatIndex: number) => void
  onStartGame: () => void
  onResetGame?: () => void
}

// カードのスートを絵文字で表示
const getSuitSymbol = (suit: string) => {
  switch (suit) {
    case "hearts": return "♥"
    case "diamonds": return "♦"
    case "clubs": return "♣"
    case "spades": return "♠"
    default: return ""
  }
}

// カードのスートの色
const getSuitColor = (suit: string) => {
  return suit === "hearts" || suit === "diamonds" ? "text-red-600" : "text-gray-900"
}

// カードコンポーネント
const CardDisplay = ({ card, isHidden, size = "normal", animate = false, delay = 0 }: { 
  card: PokerCard; 
  isHidden?: boolean; 
  size?: "small" | "normal" | "large";
  animate?: boolean;
  delay?: number;
}) => {
  const sizeClasses = {
    small: "w-8 h-11",
    normal: "w-12 h-16",
    large: "w-16 h-22"
  }
  
  const rankSizeClasses = {
    small: "text-xs",
    normal: "text-base",
    large: "text-xl"
  }
  
  const suitSizeClasses = {
    small: "text-base",
    normal: "text-2xl",
    large: "text-3xl"
  }
  
  const animationClass = animate ? `card-deal ${delay > 0 ? `card-deal-delay-${delay}` : ''}` : ''
  
  if (isHidden) {
    return (
      <div 
        className={`${sizeClasses[size]} rounded shadow-md ${animationClass}`}
        style={{
          backgroundImage: "url('/card-back.png')",
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      />
    )
  }
  
  return (
    <div className={`${sizeClasses[size]} bg-white border-2 border-gray-300 rounded flex flex-col items-center justify-center shadow-md ${animationClass}`}>
      <span className={`${rankSizeClasses[size]} font-bold ${getSuitColor(card.suit)}`}>
        {card.rank}
      </span>
      <span className={`${suitSizeClasses[size]} ${getSuitColor(card.suit)}`}>
        {getSuitSymbol(card.suit)}
      </span>
    </div>
  )
}

// プレイヤー座席コンポーネント（縦長レイアウト用）
const PlayerSeatVertical = ({
  player,
  seatIndex,
  isCurrentPlayer,
  isDealer,
  isSB,
  isBB,
  currentUserId,
  onJoinSeat,
}: {
  player?: PokerPlayer
  seatIndex: number
  isCurrentPlayer: boolean
  isDealer: boolean
  isSB: boolean
  isBB: boolean
  currentUserId: string
  onJoinSeat: (seatIndex: number) => void
}) => {
  if (!player) {
    return (
      <div className="bg-gray-800/50 rounded p-1.5 border border-dashed border-gray-600 flex items-center justify-between">
        <div className="text-gray-400 text-xs">座席 {seatIndex + 1}</div>
        <Button
          onClick={() => onJoinSeat(seatIndex)}
          variant="outline"
          size="sm"
          className="h-6 text-xs px-2"
        >
          座る
        </Button>
      </div>
    )
  }
  
  const isCurrentUser = player.userId === currentUserId
  
  return (
    <div className={`rounded p-1.5 border flex items-center gap-2 ${
      isCurrentPlayer ? "bg-green-600 border-green-400 pulse-green" : "bg-gray-800 border-gray-600"
    } ${player.isFolded ? "opacity-50" : ""}`}>
      {/* D/SB/BBバッジ */}
      <div className="flex gap-0.5">
        {isDealer && (
          <div className="w-4 h-4 bg-white border border-gray-800 rounded-full flex items-center justify-center text-[8px] font-bold">
            D
          </div>
        )}
        {isSB && (
          <div className="w-4 h-4 bg-yellow-400 border border-yellow-600 rounded-full flex items-center justify-center text-[8px] font-bold">
            SB
          </div>
        )}
        {isBB && (
          <div className="w-4 h-4 bg-orange-400 border border-orange-600 rounded-full flex items-center justify-center text-[8px] font-bold">
            BB
          </div>
        )}
      </div>
      
      {/* 名前 */}
      <div className="text-white text-xs font-bold truncate min-w-[60px]">
        {player.userName}
      </div>
      
      {/* スタック */}
      <div className="text-yellow-400 text-sm font-bold min-w-[50px]">
        {player.stack.toLocaleString()}
      </div>
      
      {/* アクション（ベット額または最後のアクション） */}
      <div className="min-w-[40px]">
        {player.currentBet > 0 ? (
          <div className="text-yellow-300 text-[10px] bg-yellow-500/20 px-1.5 py-0.5 rounded text-center">
            {player.currentBet.toLocaleString()}
          </div>
        ) : player.lastAction ? (
          <div className="text-gray-300 text-[10px] bg-gray-700/50 px-1.5 py-0.5 rounded text-center">
            {player.lastAction}
          </div>
        ) : (
          <div className="text-gray-500 text-[10px] text-center">-</div>
        )}
      </div>
      
      {/* ハンド（カード） */}
      <div className="flex gap-0.5">
        {(player.cards.length > 0 ? player.cards : [
          { suit: "hearts" as const, rank: "A" as const },
          { suit: "spades" as const, rank: "K" as const }
        ] as PokerCard[]).map((card, idx) => (
          <CardDisplay
            key={idx}
            card={card}
            isHidden={!isCurrentUser && !player.isFolded}
            size="small"
          />
        ))}
      </div>
    </div>
  )
}

export function PokerTable({
  game,
  currentUserId,
  onAction,
  onJoinSeat,
  onStartGame,
  onResetGame,
}: PokerTableProps) {
  const [betAmount, setBetAmount] = useState("")
  
  if (!game) {
    return (
      <Card className="w-full">
        <CardContent className="p-6">
          <div className="text-center text-muted-foreground">
            ゲームが見つかりません
          </div>
        </CardContent>
      </Card>
    )
  }
  
  const currentPlayer = game.players.find(p => p.userId === currentUserId)
  const isMyTurn = currentPlayer && game.players[game.currentPlayerIndex]?.userId === currentUserId
  
  // 自分以外のプレイヤー
  const otherPlayers = Array.from({ length: 10 }, (_, idx) => {
    const player = game.players.find(p => p.seatIndex === idx)
    return { player, seatIndex: idx }
  }).filter(({ player }) => !player || player.userId !== currentUserId)
  
  return (
    <div className="flex flex-col h-full bg-gray-900">
      {/* ポット表示（最上部固定） */}
      <div className="bg-yellow-500 text-gray-900 px-3 py-1.5 flex items-center justify-center gap-3 shadow-lg">
        <div className="text-base font-bold">
          POT: {game.pot.toLocaleString()}
        </div>
        <div className="bg-white px-2 py-0.5 rounded text-xs font-semibold uppercase">
          {game.phase}
        </div>
      </div>
      
      {/* 他のプレイヤー（スクロール可能） */}
      <div className="flex-1 overflow-y-auto p-2 space-y-1">
        {otherPlayers.map(({ player, seatIndex }) => {
          const isCurrentPlayerTurn = game.players[game.currentPlayerIndex]?.seatIndex === seatIndex
          return (
            <PlayerSeatVertical
              key={seatIndex}
              player={player}
              seatIndex={seatIndex}
              isCurrentPlayer={isCurrentPlayerTurn}
              isDealer={game.dealerIndex === seatIndex}
              isSB={game.smallBlindIndex === seatIndex}
              isBB={game.bigBlindIndex === seatIndex}
              currentUserId={currentUserId}
              onJoinSeat={onJoinSeat}
            />
          )
        })}
      </div>
      
      {/* コミュニティカード（中央固定） */}
      <div className="bg-green-700 p-2">
        <div className="flex gap-1 items-center justify-center flex-wrap">
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
      
      {/* 自分の情報（最下部固定） */}
      {currentPlayer && (
        <div className="bg-gray-800 border-t-2 border-blue-500 p-2">
          <div className="flex items-center gap-2 mb-2">
            {/* ディーラーボタン、SB、BB */}
            <div className="flex gap-0.5">
              {game.dealerIndex === currentPlayer.seatIndex && (
                <div className="w-5 h-5 bg-white border border-gray-800 rounded-full flex items-center justify-center text-[10px] font-bold">
                  D
                </div>
              )}
              {game.smallBlindIndex === currentPlayer.seatIndex && (
                <div className="w-5 h-5 bg-yellow-400 border border-yellow-600 rounded-full flex items-center justify-center text-[10px] font-bold">
                  SB
                </div>
              )}
              {game.bigBlindIndex === currentPlayer.seatIndex && (
                <div className="w-5 h-5 bg-orange-400 border border-orange-600 rounded-full flex items-center justify-center text-[10px] font-bold">
                  BB
                </div>
              )}
            </div>
            
            {/* プレイヤー名とスタック */}
            <div className="flex-1">
              <div className="text-white text-sm font-bold">
                {currentPlayer.userName}
              </div>
              <div className="text-yellow-400 text-base font-bold">
                {currentPlayer.stack.toLocaleString()}
              </div>
            </div>
          </div>
          
          {/* 自分のカード */}
          <div className="flex gap-1 justify-center mb-2">
            {(currentPlayer.cards.length > 0 ? currentPlayer.cards : [
              { suit: "hearts" as const, rank: "A" as const },
              { suit: "spades" as const, rank: "K" as const }
            ] as PokerCard[]).map((card, idx) => (
              <CardDisplay key={idx} card={card} size="large" />
            ))}
          </div>
          
          {/* タイムアウトインジケーター */}
          <TimeoutIndicator game={game} currentUserId={currentUserId} />
          
          {/* アクションボタン */}
          {isMyTurn && !currentPlayer.isFolded && (
            <div className="flex flex-col gap-1.5">
              <div className="flex gap-1.5">
                <Button onClick={() => onAction("fold")} variant="destructive" className="flex-1 h-8 text-xs">
                  フォールド
                </Button>
                
                {currentPlayer.currentBet >= game.currentBet ? (
                  <Button onClick={() => onAction("check")} variant="secondary" className="flex-1 h-8 text-xs">
                    チェック
                  </Button>
                ) : (
                  <Button onClick={() => onAction("call")} variant="default" className="flex-1 h-8 text-xs">
                    コール ({(game.currentBet - currentPlayer.currentBet).toLocaleString()})
                  </Button>
                )}
              </div>
              
              <div className="flex gap-1.5">
                <Input
                  type="number"
                  value={betAmount}
                  onChange={(e) => setBetAmount(e.target.value)}
                  placeholder="ベット額"
                  className="flex-1 h-8 text-xs"
                />
                <Button
                  onClick={() => {
                    const amount = parseInt(betAmount)
                    if (amount > 0) {
                      onAction(currentPlayer.currentBet === 0 ? "bet" : "raise", amount)
                      setBetAmount("")
                    }
                  }}
                  variant="default"
                  className="h-8 text-xs"
                >
                  {currentPlayer.currentBet === 0 ? "ベット" : "レイズ"}
                </Button>
              </div>
              
              <Button onClick={() => onAction("allin")} variant="outline" className="w-full h-8 text-xs">
               オールイン ({currentPlayer.stack.toLocaleString()})
              </Button>
            </div>
          )}
          
          {/* ゲーム開始ボタン */}
          {game.phase === "waiting" && game.players.length >= 2 && (
            <div className="flex gap-1 mt-1">
              <Button onClick={onStartGame} className="flex-1 h-8 text-xs">
                ゲーム開始
              </Button>
              {onResetGame && (
                <Button onClick={onResetGame} variant="destructive" className="h-8 text-xs px-2">
                  リセット
                </Button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
