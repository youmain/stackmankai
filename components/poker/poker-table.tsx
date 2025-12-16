"use client"

import { useState, useEffect } from "react"
import "./animations.css"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import type { PokerGameState, PokerPlayer, Card as PokerCard } from "@/types/poker"
import { TimeoutIndicator } from "./timeout-indicator"
import { WinnerDisplay } from "./winner-display"
import { RoundIndicator, PhaseProgressBar } from "./round-indicator"
import { CompactActionHistory } from "./action-history"

interface PokerTableProps {
  game: PokerGameState | null
  currentUserId: string
  onAction: (action: string, amount?: number) => void
  onJoinSeat: (seatIndex: number) => void
  onLeaveSeat: () => void
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
const PlayerCard = ({
  player,
  seatIndex,
  isCurrentPlayer,
  isDealer,
  isSB,
  isBB,
  currentUserId,
  onJoinSeat,
  gamePhase,
}: {
  player?: PokerPlayer
  seatIndex: number
  isCurrentPlayer: boolean
  isDealer: boolean
  isSB: boolean
  isBB: boolean
  currentUserId: string
  onJoinSeat: (seatIndex: number) => void
  gamePhase: string
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
    <div className={`relative rounded p-1.5 border flex items-center gap-2 ${
      isCurrentPlayer ? "bg-green-600 border-green-400 pulse-green" : "bg-gray-800 border-gray-600"
    } ${player.isFolded ? "opacity-50" : ""}`}>
      {/* ターン表示 */}
      {isCurrentPlayer && (
        <div className="absolute -top-2 -right-2 bg-red-500 text-white text-[8px] font-bold px-1.5 py-0.5 rounded animate-pulse">
          YOUR TURN
        </div>
      )}
      
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
        {player.cards.length > 0 && player.cards.map((card, idx) => (
          <CardDisplay
            key={idx}
            card={card}
            isHidden={!isCurrentUser && !player.isFolded && gamePhase !== "showdown"}
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
  onLeaveSeat,
  onJoinSeat,
  onStartGame,
  onResetGame,
}: PokerTableProps) {
  const [betAmount, setBetAmount] = useState(game.minRaise?.toString() || "")
  const [countdown, setCountdown] = useState<number | null>(null)
  
  // SHOWDOWN状態のカウントダウン
  useEffect(() => {
    if (game?.phase === "showdown" && game.players.length >= 2) {
      setCountdown(5)
      
      const interval = setInterval(() => {
        setCountdown(prev => {
          if (prev === null || prev <= 1) {
            clearInterval(interval)
            return null
          }
          return prev - 1
        })
      }, 1000)
      
      return () => {
        clearInterval(interval)
        setCountdown(null)
      }
    } else {
      setCountdown(null)
    }
  }, [game?.phase, game?.players.length])
  
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
  const isMyTurn = currentPlayer && game.currentPlayerIndex !== undefined && game.players[game.currentPlayerIndex]?.userId === currentUserId && game.phase !== "waiting" && game.phase !== "showdown"
  
  // デバッグログ
  console.log('[PokerTable] Debug:', {
    currentUserId,
    currentPlayer,
    isMyTurn,
    currentPlayerIndex: game.currentPlayerIndex,
    currentPlayerUserId: game.players[game.currentPlayerIndex]?.userId,
    phase: game.phase,
    allPlayers: game.players.map(p => ({ userId: p.userId, userName: p.userName }))
  })
  
  // 自分以外のプレイヤー（空席は表示しない）
  const otherPlayers = game.players
    .filter(p => p.userId !== currentUserId)
    .map(p => ({ player: p, seatIndex: p.seatIndex }))
  
  // 空席数を計算
  const emptySeatsCount = 10 - game.players.length
  
  return (
    <div className="flex flex-col h-full bg-gray-900">
      {/* ラウンド表示（最上部固定） */}
      <div className="bg-gray-800 px-3 py-2">
        <RoundIndicator phase={game.phase} pot={game.pot} />
        {countdown !== null && (
          <div className="text-center mt-2">
            <div className="inline-block bg-green-600 text-white px-4 py-1 rounded-full text-sm font-semibold animate-pulse">
              次のハンド: {countdown}秒
            </div>
          </div>
        )}
      </div>
      
      {/* タイムアウトインジケーター（全プレイヤーに表示） */}
      <TimeoutIndicator game={game} currentUserId={currentUserId} />
      
      {/* アクション履歴 */}
      {game.actionHistory && game.actionHistory.length > 0 && (
        <div className="bg-gray-800 px-3 py-1 border-b border-gray-700">
          <div className="flex gap-2 overflow-x-auto text-xs">
            {game.actionHistory.slice(-5).map((entry, idx) => (
              <div key={idx} className="flex-shrink-0 bg-gray-700 px-2 py-0.5 rounded">
                <span className="text-gray-300">{entry.playerName}</span>
                <span className="text-white mx-1">{entry.action.toUpperCase()}</span>
                {entry.amount && <span className="text-yellow-400">{entry.amount}</span>}
              </div>
            ))}
          </div>
        </div>
      )}
      
      {/* 他プレイヤーリスト（左側） */}
      <div className="flex-1 overflow-y-auto p-2 space-y-1">
        {otherPlayers.map(({ player, seatIndex }) => {
          const isCurrentPlayerTurn = game.players[game.currentPlayerIndex]?.seatIndex === seatIndex
          return (
            <PlayerCard
              key={seatIndex}
              player={player}
              seatIndex={seatIndex}
              isCurrentPlayer={isCurrentPlayerTurn}
              isDealer={game.dealerIndex === seatIndex}
              isSB={game.smallBlindIndex === seatIndex}
              isBB={game.bigBlindIndex === seatIndex}
              currentUserId={currentUserId}
              onJoinSeat={onJoinSeat}
              gamePhase={game.phase}
            />
          )
        })}
        
        {/* 空席数表示 */}
        {emptySeatsCount > 0 && (
          <div className="bg-gray-800/30 rounded p-2 border border-dashed border-gray-600 text-center">
            <div className="text-gray-400 text-sm">
              🪑 空席: {emptySeatsCount}席
            </div>
            <Button
              onClick={() => {
                // 最初の空席を見つける
                const occupiedSeats = new Set(game.players.map(p => p.seatIndex))
                for (let i = 0; i < 10; i++) {
                  if (!occupiedSeats.has(i)) {
                    onJoinSeat(i)
                    break
                  }
                }
              }}
              variant="outline"
              size="sm"
              className="mt-2 h-7 text-xs"
            >
              席に着く
            </Button>
          </div>
        )}
      </div>
      
      {/* コミュニティカード（中央固定） */}
      <div className="bg-green-700 p-2">
        <div className="flex gap-1 items-center justify-center flex-wrap min-h-[80px]">
          {game.communityCards.length > 0 ? (
            game.communityCards.map((card, idx) => (
              <CardDisplay key={idx} card={card} size="normal" />
            ))
          ) : (
            <div className="text-gray-400 text-sm font-semibold">
              {game.phase === "preflop" ? "プリフロップ - カード配布待ち" : "カード配布中..."}
            </div>
          )}
        </div>
      </div>
      
      {/* 自分の情報（最下部固定） */}
      {currentPlayer && (
        <div className="bg-gray-800 border-t-2 border-blue-500 p-2">
          <div className="flex items-center gap-2 mb-2">
            {/* ディーラーボタン、SB、BB */}
            <div className="flex gap-0.5">
              {game.dealerIndex === currentPlayer.seatIndex && (
                <div className="w-8 h-8 bg-white border-2 border-gray-800 rounded-full flex items-center justify-center text-sm font-bold shadow-lg">
                  D
                </div>
              )}
              {game.smallBlindIndex === currentPlayer.seatIndex && (
                <div className="w-8 h-8 bg-yellow-400 border-2 border-yellow-600 rounded-full flex items-center justify-center text-xs font-bold shadow-lg">
                  SB
                </div>
              )}
              {game.bigBlindIndex === currentPlayer.seatIndex && (
                <div className="w-8 h-8 bg-orange-500 border-2 border-orange-700 rounded-full flex items-center justify-center text-xs font-bold shadow-lg">
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
            
            {/* 退席ボタン */}
            <Button
              onClick={onLeaveSeat}
              variant="outline"
              size="sm"
              className="h-7 text-xs"
            >
              席を立つ
            </Button>
          </div>
          
          {/* 自分のカード */}
          {currentPlayer.cards.length > 0 && (
            <div className="flex gap-1 justify-center mb-2">
              {currentPlayer.cards.map((card, idx) => (
                <CardDisplay key={idx} card={card} size="large" />
              ))}
            </div>
          )}
          
          {/* ハンド判定 */}
          {currentPlayer.cards.length > 0 && game.communityCards.length > 0 && (
            <div className="text-center mb-2">
              <div className="inline-block bg-blue-600 text-white px-3 py-1 rounded-full text-sm font-bold">
                {(() => {
                  const { evaluateHand } = require("@/lib/poker-hand-evaluator")
                  const evaluation = evaluateHand(currentPlayer.cards, game.communityCards)
                  return evaluation.description
                })()}
              </div>
            </div>
          )}
          
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
              
              {/* プリセットボタン */}
              <div className="flex gap-1">
                <Button
                  onClick={() => setBetAmount(Math.floor(game.pot / 2).toString())}
                  variant="outline"
                  size="sm"
                  className="flex-1 h-7 text-[10px] px-1"
                >
                  1/2 POT
                </Button>
                <Button
                  onClick={() => setBetAmount(game.pot.toString())}
                  variant="outline"
                  size="sm"
                  className="flex-1 h-7 text-[10px] px-1"
                >
                  POT
                </Button>
                <Button
                  onClick={() => setBetAmount((game.pot * 2).toString())}
                  variant="outline"
                  size="sm"
                  className="flex-1 h-7 text-[10px] px-1"
                >
                  2x POT
                </Button>
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
      
      {/* 勝者表示 */}
      {game.phase === "showdown" && game.winners && game.winners.length > 0 && (
        <WinnerDisplay
          winners={game.players.filter(p => game.winners?.includes(p.userId))}
          communityCards={game.communityCards}
          pot={game.pot}
        />
      )}
      
      {/* 開発環境でのみ表示されるリセットボタン */}
      {process.env.NEXT_PUBLIC_SHOW_DEV_TOOLS === 'true' && onResetGame && (
        <div className="mt-2">
          <Button 
            onClick={onResetGame} 
            variant="destructive" 
            size="sm"
            className="w-full h-8 text-xs"
          >
            🛠️ 開発用: ゲームをリセット
          </Button>
        </div>
      )}
    </div>
  )
}
