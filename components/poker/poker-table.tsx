"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import type { PokerGameState, PokerPlayer, Card as PokerCard } from "@/types/poker"

interface PokerTableProps {
  game: PokerGameState | null
  currentUserId: string
  onAction: (action: string, amount?: number) => void
  onJoinSeat: (seatIndex: number) => void
  onStartGame: () => void
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
const CardDisplay = ({ card, isHidden }: { card: PokerCard; isHidden?: boolean }) => {
  if (isHidden) {
    return (
      <div 
        className="w-16 h-22 rounded shadow-md"
        style={{
          backgroundImage: "url('/card-back.png')",
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      />
    )
  }
  
  return (
    <div className="w-16 h-22 bg-white border-2 border-gray-300 rounded flex flex-col items-center justify-center shadow-md">
      <span className={`text-xl font-bold ${getSuitColor(card.suit)}`}>
        {card.rank}
      </span>
      <span className={`text-3xl ${getSuitColor(card.suit)}`}>
        {getSuitSymbol(card.suit)}
      </span>
    </div>
  )
}

// プレイヤー座席コンポーネント
const PlayerSeat = ({
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
      <div className="flex flex-col items-center">
        <Button
          onClick={() => onJoinSeat(seatIndex)}
          variant="outline"
          size="sm"
          className="w-12 h-12 rounded-full border-2 border-dashed border-gray-400 text-xs"
        >
          座る
        </Button>
      </div>
    )
  }
  
  const isCurrentUser = player.userId === currentUserId
  
  return (
    <div className="flex flex-col items-center gap-1">
      {/* ディーラーボタン、SB、BB */}
      <div className="flex gap-1 h-5">
        {isDealer && (
          <div className="w-5 h-5 bg-white border-2 border-gray-800 rounded-full flex items-center justify-center text-xs font-bold">
            D
          </div>
        )}
        {isSB && (
          <div className="w-5 h-5 bg-yellow-400 border-2 border-yellow-600 rounded-full flex items-center justify-center text-xs font-bold">
            SB
          </div>
        )}
        {isBB && (
          <div className="w-5 h-5 bg-orange-400 border-2 border-orange-600 rounded-full flex items-center justify-center text-xs font-bold">
            BB
          </div>
        )}
      </div>
      
      {/* カード */}
      {(player.cards.length > 0 || true) && (
        <div className="flex gap-1 mt-1">
          {(player.cards.length > 0 ? player.cards : [
            { suit: "hearts" as const, rank: "A" as const },
            { suit: "spades" as const, rank: "K" as const }
          ] as PokerCard[]).map((card, idx) => (
            <CardDisplay
              key={idx}
              card={card}
              isHidden={!isCurrentUser && !player.isFolded}
            />
          ))}
        </div>
      )}
      
      {/* プレイヤー情報 */}
      <div
        className={`shadow-lg rounded-lg p-2 border-2 flex flex-col items-center min-w-[130px] ${
          isCurrentPlayer ? "bg-green-500 border-4 border-green-700" : "bg-gray-700 border-2 border-gray-600"
        } ${player.isFolded ? "opacity-50" : ""}`}
      >
        <div className="text-white text-xs font-bold truncate max-w-full text-center">
          {player.userName}
        </div>
        <div className="text-yellow-400 text-sm font-bold mt-0.5">
          ¥{player.stack.toLocaleString()}
        </div>
      </div>
      
      {/* 現在のベット額 */}
      {player.currentBet > 0 && (
        <div className="bg-yellow-400 text-gray-900 px-2 py-1 rounded text-xs font-bold">
          ¥{player.currentBet.toLocaleString()}
        </div>
      )}
    </div>
  )
}

export function PokerTable({
  game,
  currentUserId,
  onAction,
  onJoinSeat,
  onStartGame,
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
  
  // 座席配置（10席を楕円形の外周に等間隔で配置）
  const seatPositions = [
    { top: "8%", left: "50%", transform: "translate(-50%, 0)" },      // 0: 上中央
    { top: "12%", left: "70%", transform: "translate(-50%, 0)" },     // 1: 上右
    { top: "30%", left: "85%", transform: "translate(-50%, -50%)" },  // 2: 右上
    { top: "55%", left: "88%", transform: "translate(-50%, -50%)" },  // 3: 右
    { top: "78%", left: "70%", transform: "translate(-50%, -100%)" }, // 4: 右下
    { top: "85%", left: "50%", transform: "translate(-50%, -100%)" }, // 5: 下中央
    { top: "78%", left: "30%", transform: "translate(-50%, -100%)" }, // 6: 左下
    { top: "55%", left: "12%", transform: "translate(-50%, -50%)" },  // 7: 左
    { top: "30%", left: "15%", transform: "translate(-50%, -50%)" },  // 8: 左上
    { top: "12%", left: "30%", transform: "translate(-50%, 0)" },     // 9: 上左
  ]
  
  return (
    <Card className="w-full">
      <CardContent className="p-2 sm:p-4">
        {/* テーブル - アスペクト比を維持 */}
        <div className="relative w-full" style={{ paddingBottom: "60%" }}>
          <div 
            className="absolute inset-0 rounded-3xl shadow-2xl overflow-hidden"
            style={{
              backgroundImage: "url('/poker-table-bg.png')",
              backgroundSize: "cover",
              backgroundPosition: "center",
            }}
          >
          {/* 中央エリア */}
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 flex flex-col items-center gap-3 w-full max-w-md">
            {/* ポットとフェーズ */}
            <div className="flex items-center gap-3">
              <div className="bg-yellow-500 text-gray-900 px-4 py-2 rounded-lg text-lg font-bold shadow-lg">
                POT: ¥{game.pot.toLocaleString()}
              </div>
              <div className="bg-white/90 px-3 py-1 rounded text-xs font-semibold uppercase">
                {game.phase}
              </div>
            </div>
            
            {/* コミュニティカード表示エリア */}
            <div className="bg-green-800/50 rounded-lg p-3 flex gap-2 items-center justify-center flex-wrap">
              {(game.communityCards.length > 0 ? game.communityCards : [
                { suit: "diamonds" as const, rank: "Q" as const },
                { suit: "clubs" as const, rank: "J" as const },
                { suit: "hearts" as const, rank: "10" as const },
                { suit: "spades" as const, rank: "9" as const },
                { suit: "diamonds" as const, rank: "8" as const }
              ] as PokerCard[]).map((card, idx) => (
                <CardDisplay key={idx} card={card} />
              ))}
            </div>
            
            {/* ゲーム開始ボタン */}
            {game.phase === "waiting" && game.players.length >= 2 && currentPlayer && (
              <Button onClick={onStartGame} size="lg" className="mt-4">
                ゲーム開始
              </Button>
            )}
          </div>
          
          {/* プレイヤー座席 */}
          {seatPositions.map((position, idx) => {
            const player = game.players.find(p => p.seatIndex === idx)
            const isCurrentPlayerTurn = game.players[game.currentPlayerIndex]?.seatIndex === idx
            
            return (
              <div
                key={idx}
                className="absolute"
                style={position}
              >
                <PlayerSeat
                  player={player}
                  seatIndex={idx}
                  isCurrentPlayer={isCurrentPlayerTurn}
                  isDealer={game.dealerIndex === idx}
                  isSB={game.smallBlindIndex === idx}
                  isBB={game.bigBlindIndex === idx}
                  currentUserId={currentUserId}
                  onJoinSeat={onJoinSeat}
                />
              </div>
            )
          })}
          </div>
        </div>
        
        {/* アクションボタン */}
        {isMyTurn && currentPlayer && !currentPlayer.isFolded && (
          <div className="mt-4 flex flex-wrap gap-2 items-center justify-center">
            <Button onClick={() => onAction("fold")} variant="destructive">
              フォールド
            </Button>
            
            {currentPlayer.currentBet >= game.currentBet && (
              <Button onClick={() => onAction("check")} variant="secondary">
                チェック
              </Button>
            )}
            
            {currentPlayer.currentBet < game.currentBet && (
              <Button onClick={() => onAction("call")} variant="default">
                コール (¥{(game.currentBet - currentPlayer.currentBet).toLocaleString()})
              </Button>
            )}
            
            <div className="flex gap-2 items-center">
              <Input
                type="number"
                value={betAmount}
                onChange={(e) => setBetAmount(e.target.value)}
                placeholder="ベット額"
                className="w-32"
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
              >
                {currentPlayer.currentBet === 0 ? "ベット" : "レイズ"}
              </Button>
            </div>
            
            <Button onClick={() => onAction("allin")} variant="outline">
              オールイン (¥{currentPlayer.stack.toLocaleString()})
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
