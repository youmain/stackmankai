"use client"

import React, { useState, useEffect, useMemo } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { PlayerSeat } from "./player-seat"
import { CardDisplay } from "./card-display"
import { WinnerDisplay } from "./winner-display"
import { usePokerAdvice } from "@/hooks/usePokerAdvice"
import type { PokerGameState, PlayerAction } from "@/types/poker"

interface PokerTableProps {
  game: PokerGameState | null
  currentUserId: string
  onAction: (action: PlayerAction, amount?: number) => void
  onJoinSeat: (seatIndex: number) => void
  onLeaveSeat: () => void
  onStartGame: () => void
  onTimeout: () => void
  onReadyNextHand: () => void
  onResetGame?: () => void
}

export function PokerTable({
  game,
  currentUserId,
  onAction,
  onJoinSeat,
  onLeaveSeat,
  onStartGame,
  onTimeout,
  onReadyNextHand,
  onResetGame,
}: PokerTableProps) {
  const [betAmount, setBetAmount] = useState<string>("")
  const [countdown, setCountdown] = useState<number | null>(null)
  const [visibleCommunityCards, setVisibleCommunityCards] = useState<number>(0)

  // AIアドバイス用のデータ準備
  const currentPlayerForAdvice = useMemo(() => 
    game?.players.find(p => p.userId === currentUserId),
    [game?.players, currentUserId]
  )
  
  const opponentForAdvice = useMemo(() => 
    game?.players.find(p => p.userId !== currentUserId && !p.isFolded),
    [game?.players, currentUserId]
  )

  const isMyTurn = useMemo(() => 
    game && 
    game.currentPlayerIndex !== undefined && 
    game.players[game.currentPlayerIndex]?.userId === currentUserId &&
    game.phase !== "waiting" &&
    game.phase !== "showdown",
    [game, currentUserId]
  )

  // AIアドバイスフックの呼び出し
  const { advice, loading: isAdviceLoading } = usePokerAdvice({
    storeId: game?.storeId || "",
    gameId: game?.id || "",
    playerId: currentUserId,
    playerCards: currentPlayerForAdvice?.cards || [],
    communityCards: game?.communityCards || [],
    potSize: game?.pot || 0,
    playerStack: currentPlayerForAdvice?.stack || 0,
    opponentStack: opponentForAdvice?.stack || 0,
    gamePhase: game?.phase || "waiting",
    opponentId: opponentForAdvice?.userId,
    advisorType: "balanced"
  })

  // コミュニティカードのアニメーション表示
  useEffect(() => {
    if (game?.communityCards) {
      setVisibleCommunityCards(game.communityCards.length)
    } else {
      setVisibleCommunityCards(0)
    }
  }, [game?.communityCards?.length])

  // ターンタイマーのカウントダウン
  useEffect(() => {
    if (game?.phase !== "waiting" && game?.phase !== "showdown" && game?.turnStartTime) {
      const startTime = game.turnStartTime instanceof Date 
        ? game.turnStartTime.getTime() 
        : (game.turnStartTime as any).seconds * 1000
      
      const interval = setInterval(() => {
        const now = Date.now()
        const elapsed = Math.floor((now - startTime) / 1000)
        const remaining = Math.max(0, (game.timeoutSeconds || 30) - elapsed)
        setCountdown(remaining)
        
        if (remaining === 0 && isMyTurn) {
          onTimeout()
          clearInterval(interval)
        }
      }, 1000)
      
      return () => {
        clearInterval(interval)
        setCountdown(null)
      }
    } else {
      setCountdown(null)
    }
  }, [game?.phase, game?.players?.length, isMyTurn, game?.turnStartTime, game?.timeoutSeconds, onTimeout])
  
  if (!game) {
    return (
      <Card className="w-full bg-gray-900 border-gray-800">
        <CardContent className="p-12 flex flex-col items-center justify-center min-h-[400px]">
          <div className="text-center space-y-4">
            <div className="text-4xl">🃏</div>
            <div className="text-xl font-bold text-white">ポーカーテーブルを準備中</div>
            <div className="text-gray-400 max-w-xs mx-auto">
              ゲームデータを受信しています。しばらくお待ちいただくか、画面をリロードしてください。
            </div>
            <Button 
              variant="outline" 
              onClick={() => window.location.reload()}
              className="mt-4"
            >
              画面を更新する
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  // 10席分の座席データを作成
  const seats = Array.from({ length: 10 }, (_, i) => {
    const player = game.players.find(p => p.seatIndex === i)
    return { seatIndex: i, player }
  })
  
  const currentPlayer = game.players.find(p => p.userId === currentUserId)
  
  // 空席数を計算
  const emptySeatsCount = 10 - game.players.length
  
  return (
    <div className="relative w-full h-full flex flex-col bg-gray-900 overflow-hidden select-none">
      {/* ゲーム情報ヘッダー */}
      <div className="bg-gray-800/80 p-2 flex justify-between items-center border-b border-gray-700">
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-blue-400 border-blue-400/50">
            {game.phase.toUpperCase()}
          </Badge>
          <div className="text-white font-bold text-sm">
            POT: <span className="text-yellow-400">¥{game.pot.toLocaleString()}</span>
          </div>
        </div>
        
        {countdown !== null && (
          <div className={`font-mono font-bold text-lg ${countdown < 10 ? 'text-red-500 animate-pulse' : 'text-white'}`}>
            ⏱ {countdown}s
          </div>
        )}
      </div>

      {/* アクション履歴（簡易表示） */}
      {game.actionHistory && game.actionHistory.length > 0 && (
        <div className="absolute top-14 left-2 z-10 max-w-[150px]">
          <div className="bg-black/40 rounded p-1.5 text-[10px] space-y-1 backdrop-blur-sm">
            {game.actionHistory.slice(-3).map((entry, i) => (
              <div key={i} className="flex justify-between gap-2 border-b border-white/10 pb-0.5 last:border-0">
                <span className="text-gray-300 truncate">{entry.playerName}</span>
                <span className="text-white font-semibold">{entry.action.toUpperCase()}</span>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {/* メインテーブルエリア */}
      <div className="flex-1 relative p-4 overflow-y-auto">
        {/* 他プレイヤーリスト（グリッド表示） */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2 mb-4">
          {seats.map(({ player, seatIndex }) => {
            // 自分の席はここでは表示しない（最下部に固定表示するため）
            if (player && player.userId === currentUserId) return null;
            
            return (
              <PlayerSeat
                key={seatIndex}
                player={player}
                seatIndex={seatIndex}
                isDealer={game.dealerIndex === seatIndex}
                isSB={game.smallBlindIndex === seatIndex}
                isBB={game.bigBlindIndex === seatIndex}
                currentUserId={currentUserId}
                onJoinSeat={onJoinSeat}
                gamePhase={game.phase}
              />
            )
          })}
        </div>

        {/* 中央エリア: コミュニティカード */}
        <div className="flex flex-col items-center justify-center py-8 bg-green-900/20 rounded-3xl border border-green-500/20 mb-4">
          <div className="flex gap-1.5 items-center justify-center flex-wrap min-h-[100px]">
            {game.communityCards.length > 0 ? (
              game.communityCards.map((card, idx) => (
                idx < visibleCommunityCards ? (
                  <CardDisplay key={`card-${idx}`} card={card} size="normal" animate={true} />
                ) : (
                  <div key={`empty-${idx}`} className="w-12 h-16 border-2 border-dashed border-white/20 rounded-lg" />
                )
              ))
            ) : (
              <div className="text-green-500/50 text-sm font-bold italic">
                {game.phase === "preflop" ? "WAITING FOR FLOP..." : "DEALING..."}
              </div>
            )}
          </div>
          
          {/* ゲーム開始ボタン（待機中かつ2人以上） */}
          {game.phase === "waiting" && game.players.length >= 2 && (
            <Button 
              onClick={onStartGame}
              className="mt-4 bg-yellow-500 hover:bg-yellow-600 text-black font-bold px-8 py-2 rounded-full shadow-lg transform hover:scale-105 transition-transform"
            >
              ゲーム開始
            </Button>
          )}
          
          {/* 待機メッセージ */}
          {game.phase === "waiting" && game.players.length < 2 && (
            <div className="mt-4 text-gray-400 text-sm animate-pulse">
              他のプレイヤーを待っています... (現在 {game.players.length}/2人)
            </div>
          )}
        </div>
      </div>
      
      {/* 自分の情報・アクションエリア（最下部固定） */}
      <div className="bg-gray-800 border-t-2 border-blue-500 p-3 shadow-2xl">
        {currentPlayer ? (
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                {/* 役職バッジ */}
                <div className="flex gap-1">
                  {game.dealerIndex === currentPlayer.seatIndex && (
                    <div className="w-7 h-7 bg-white text-gray-900 rounded-full flex items-center justify-center text-xs font-black shadow-inner">D</div>
                  )}
                  {game.smallBlindIndex === currentPlayer.seatIndex && (
                    <div className="w-7 h-7 bg-yellow-400 text-yellow-900 rounded-full flex items-center justify-center text-[10px] font-black shadow-inner">SB</div>
                  )}
                  {game.bigBlindIndex === currentPlayer.seatIndex && (
                    <div className="w-7 h-7 bg-orange-500 text-orange-950 rounded-full flex items-center justify-center text-[10px] font-black shadow-inner">BB</div>
                  )}
                </div>
                
                <div>
                  <div className="text-white text-xs font-medium opacity-70">{currentPlayer.userName}</div>
                  <div className="text-yellow-400 text-lg font-black leading-none">¥{currentPlayer.stack.toLocaleString()}</div>
                </div>
              </div>

              {/* 自分のカード */}
              <div className="flex gap-1.5">
                {currentPlayer.cards.length > 0 ? (
                  currentPlayer.cards.map((card, idx) => (
                    <CardDisplay key={idx} card={card} size="normal" />
                  ))
                ) : (
                  <div className="flex gap-1.5">
                    <div className="w-10 h-14 bg-gray-700/50 border border-white/10 rounded-md" />
                    <div className="w-10 h-14 bg-gray-700/50 border border-white/10 rounded-md" />
                  </div>
                )}
              </div>

              <div className="flex flex-col gap-1">
                <Button onClick={onLeaveSeat} variant="ghost" size="sm" className="h-7 text-[10px] text-gray-400 hover:text-white">
                  席を立つ
                </Button>
                {onResetGame && (
                  <Button onClick={onResetGame} variant="ghost" size="sm" className="h-7 text-[10px] text-red-400 hover:text-red-300">
                    リセット
                  </Button>
                )}
              </div>
            </div>
            
            {/* アクションボタンエリア */}
            {isMyTurn && !currentPlayer.isFolded ? (
              <div className="space-y-3 animate-in fade-in slide-in-from-bottom-2">
                <div className="flex gap-2">
                  <Button onClick={() => onAction("fold")} variant="destructive" className="flex-1 h-10 font-bold">
                    フォールド
                  </Button>
                  
                  {currentPlayer.currentBet >= game.currentBet ? (
                    <Button onClick={() => onAction("check")} variant="secondary" className="flex-1 h-10 font-bold bg-gray-600 hover:bg-gray-500 text-white">
                      チェック
                    </Button>
                  ) : (
                    <Button onClick={() => onAction("call")} variant="secondary" className="flex-1 h-10 font-bold bg-blue-600 hover:bg-blue-500 text-white">
                      コール (¥{(game.currentBet - currentPlayer.currentBet).toLocaleString()})
                    </Button>
                  )}
                </div>
                
                <div className="flex gap-2 items-center">
                  <div className="flex-1 flex gap-1">
                    {["1/2", "POT", "MAX"].map((label) => (
                      <Button
                        key={label}
                        onClick={() => {
                          if (label === "1/2") setBetAmount(Math.floor(game.pot / 2).toString())
                          else if (label === "POT") setBetAmount(game.pot.toString())
                          else setBetAmount(currentPlayer.stack.toString())
                        }}
                        variant="outline"
                        size="sm"
                        className="flex-1 h-8 text-[10px] border-gray-600 text-gray-300"
                      >
                        {label}
                      </Button>
                    ))}
                  </div>
                  
                  <div className="flex-[2] flex gap-2">
                    <Input
                      type="number"
                      value={betAmount}
                      onChange={(e) => setBetAmount(e.target.value)}
                      placeholder="金額"
                      className="h-8 bg-gray-900 border-gray-700 text-white font-bold text-center"
                    />
                    <Button
                      onClick={() => {
                        const amount = parseInt(betAmount)
                        if (amount > 0) {
                          onAction(game.currentBet === 0 ? "bet" : "raise", amount)
                          setBetAmount("")
                        }
                      }}
                      className="h-8 px-6 bg-yellow-500 hover:bg-yellow-600 text-black font-black text-xs"
                    >
                      {game.currentBet === 0 ? "ベット" : "レイズ"}
                    </Button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="h-20 flex items-center justify-center border border-dashed border-gray-700 rounded-xl">
                <span className="text-gray-500 text-sm font-medium italic">
                  {game.phase === "waiting" ? "ゲーム開始を待っています..." : "相手のアクションを待っています..."}
                </span>
              </div>
            )}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-4">
            <div className="text-gray-400 text-sm mb-3">観戦中（座席が空いています）</div>
            <Button 
              onClick={() => {
                const firstEmpty = seats.find(s => !s.player)?.seatIndex
                if (firstEmpty !== undefined) onJoinSeat(firstEmpty)
              }}
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-10 py-2 rounded-full shadow-lg"
            >
              空いている席に座る
            </Button>
          </div>
        )}
      </div>

      {/* ショーダウン・勝者表示オーバーレイ */}
      {game.phase === "showdown" && (
        <WinnerDisplay 
          winners={game.players.filter(p => game.winners?.includes(p.userId))}
          allPlayers={game.players.filter(p => !p.isFolded || game.winners?.includes(p.userId))}
          communityCards={game.communityCards}
          pot={game.pot}
          showByFold={game.showByFold}
          onNextHand={onReadyNextHand}
          readyPlayers={game.nextHandReadyPlayers}
          nextHandStartTime={game.nextHandStartTime}
          currentUserId={currentUserId}
        />
      )}
    </div>
  )
}
