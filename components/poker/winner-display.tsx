"use client"

import { useEffect, useState } from "react"
import type { PokerPlayer } from "@/types/poker"
import { evaluateHand, type HandEvaluation } from "@/lib/poker-hand-evaluator"

interface WinnerDisplayProps {
  winners: PokerPlayer[]
  allPlayers: PokerPlayer[] // ショーダウンまで残った全プレイヤー
  communityCards: any[]
  pot: number
  showByFold?: boolean // フォールド勝利の場合true
  onClose?: () => void
  onNextHand?: () => void // 次のハンドに進む
  readyPlayers?: string[] // 準備完了プレイヤーのIDリスト
  nextHandStartTime?: Date // 次のハンド自動開始時刻
  currentUserId?: string // 現在のユーザーID
}

export function WinnerDisplay({ 
  winners, 
  allPlayers, 
  communityCards, 
  pot, 
  showByFold = false, 
  onClose, 
  onNextHand,
  readyPlayers = [],
  nextHandStartTime,
  currentUserId
}: WinnerDisplayProps) {
  const [visible, setVisible] = useState(false)
  const [countdown, setCountdown] = useState<number>(15)

  useEffect(() => {
    // アニメーション用に少し遅延
    setTimeout(() => setVisible(true), 100)
  }, [])
  
  // カウントダウン
  useEffect(() => {
    if (!nextHandStartTime) return
    
    const interval = setInterval(() => {
      const now = new Date()
      const remaining = Math.max(0, Math.floor((nextHandStartTime.getTime() - now.getTime()) / 1000))
      setCountdown(remaining)
      
      if (remaining === 0) {
        clearInterval(interval)
      }
    }, 100)
    
    return () => clearInterval(interval)
  }, [nextHandStartTime])
  
  const activePlayerCount = allPlayers.filter(p => p.isActive && p.stack > 0).length
  // readyPlayersが配列であることを保証
  const safeReadyPlayers = Array.isArray(readyPlayers) ? readyPlayers : []
  const readyCount = safeReadyPlayers.length
  const isCurrentUserReady = currentUserId && safeReadyPlayers.includes(currentUserId)

  if (winners.length === 0) return null

  // 各プレイヤーのハンド評価を取得（ショーダウンまで残った全員）
  const allPlayerEvaluations = allPlayers.map(player => ({
    player,
    evaluation: evaluateHand(player.cards, communityCards),
    isWinner: winners.some(w => w.userId === player.userId)
  })).sort((a, b) => {
    // 勝者を先に表示
    if (a.isWinner && !b.isWinner) return -1
    if (!a.isWinner && b.isWinner) return 1
    return 0
  })

  const potPerWinner = Math.floor(pot / winners.length)

  return (
    <div 
      className={`fixed inset-0 bg-black/60 flex items-center justify-center z-50 transition-opacity duration-300 ${
        visible ? 'opacity-100' : 'opacity-0'
      }`}
      onClick={onClose}
    >
      <div 
        className={`bg-gradient-to-br from-yellow-400 via-yellow-500 to-yellow-600 p-8 rounded-2xl shadow-2xl max-w-2xl w-full mx-4 transform transition-all duration-300 ${
          visible ? 'scale-100' : 'scale-90'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* タイトル */}
        <div className="text-center mb-6">
          <h2 className="text-5xl font-bold text-white mb-2 animate-bounce">
            🏆 {winners.length === 1 ? 'WINNER!' : 'SPLIT POT!'} 🏆
          </h2>
          <p className="text-2xl text-yellow-100">
            POT: {pot.toLocaleString()}
          </p>
        </div>

        {/* コミュニティカード */}
        {!showByFold && communityCards.length > 0 && (
          <div className="mb-6">
            <p className="text-center text-white text-lg font-semibold mb-3">
              コミュニティカード
            </p>
            <div className="flex gap-2 justify-center">
              {communityCards.map((card, idx) => (
                <div 
                  key={idx}
                  className="w-16 h-22 bg-white rounded-lg flex flex-col items-center justify-center shadow-xl border-2 border-white"
                >
                  <span className={`text-2xl font-bold ${
                    card.suit === 'hearts' || card.suit === 'diamonds' ? 'text-red-600' : 'text-gray-900'
                  }`}>
                    {card.rank}
                  </span>
                  <span className={`text-3xl ${
                    card.suit === 'hearts' || card.suit === 'diamonds' ? 'text-red-600' : 'text-gray-900'
                  }`}>
                    {card.suit === 'hearts' ? '♥' : card.suit === 'diamonds' ? '♦' : card.suit === 'clubs' ? '♣' : '♠'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 勝者情報 */}
        <div className="space-y-4">
          {showByFold ? (
            // フォールド勝利時：ハンドを表示しない
            winners.map((player) => (
              <div 
                key={player.userId}
                className="bg-white/95 rounded-xl p-6 shadow-lg text-center"
              >
                <h3 className="text-3xl font-bold text-gray-800 mb-2">
                  {player.userName}
                </h3>
                <p className="text-xl text-gray-600">
                  獲得: <span className="font-bold text-green-600">+{potPerWinner.toLocaleString()}</span>
                </p>
                <p className="text-sm text-gray-500 mt-2">
                  （全員フォールドによる勝利）
                </p>
              </div>
            ))
          ) : (
            // 通常のショーダウン：全プレイヤーのハンドと役を表示
            allPlayerEvaluations.map(({ player, evaluation, isWinner }, index) => (
              <div 
                key={player.userId}
                className={`rounded-xl p-6 shadow-lg ${
                  isWinner ? 'bg-gradient-to-r from-yellow-100 to-yellow-50 border-4 border-yellow-400' : 'bg-white/80'
                }`}
              >
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h3 className={`text-2xl font-bold ${
                      isWinner ? 'text-yellow-700' : 'text-gray-700'
                    }`}>
                      {isWinner && '🏆 '}{player.userName}
                    </h3>
                    {isWinner && (
                      <p className="text-lg text-gray-600">
                        獲得: <span className="font-bold text-green-600">+{potPerWinner.toLocaleString()}</span>
                      </p>
                    )}
                  </div>
                  <div className="text-right">
                    <p className={`text-3xl font-bold ${
                      isWinner ? 'text-purple-700' : 'text-gray-600'
                    }`}>
                      {evaluation.description}
                    </p>
                    <p className="text-sm text-gray-500">
                      {evaluation.rank.replace(/_/g, ' ').toUpperCase()}
                    </p>
                  </div>
                </div>

                {/* プレイヤーのカード */}
                <div className="flex gap-2 justify-center">
                  {player.cards.map((card, idx) => (
                    <div 
                      key={idx}
                      className={`w-16 h-22 bg-white rounded-lg flex flex-col items-center justify-center shadow-lg ${
                        isWinner ? 'border-4 border-yellow-400' : 'border-2 border-gray-300'
                      }`}
                    >
                      <span className={`text-2xl font-bold ${
                        card.suit === 'hearts' || card.suit === 'diamonds' ? 'text-red-600' : 'text-gray-900'
                      }`}>
                        {card.rank}
                      </span>
                      <span className={`text-3xl ${
                        card.suit === 'hearts' || card.suit === 'diamonds' ? 'text-red-600' : 'text-gray-900'
                      }`}>
                        {card.suit === 'hearts' ? '♥' : card.suit === 'diamonds' ? '♦' : card.suit === 'clubs' ? '♣' : '♠'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>

        {/* 次のハンドボタン */}
        {onNextHand && (
          <div className="text-center mt-6 space-y-3">
            <button
              onClick={onNextHand}
              className="px-8 py-3 rounded-full font-bold text-lg transition-colors shadow-lg bg-white text-yellow-600 hover:bg-yellow-50"
            >
              {isCurrentUserReady ? '✓ 準備完了' : '次のハンドへ'}
            </button>
            <div className="text-white text-sm">
              <p>準備完了: {readyCount}/{activePlayerCount}</p>
              <p>自動開始まで: {countdown}秒</p>
            </div>
          </div>
        )}
        
        {/* 閉じるボタン（旧版、onCloseのみの場合） */}
        {onClose && !onNextHand && (
          <div className="text-center mt-6">
            <button
              onClick={onClose}
              className="bg-white text-yellow-600 px-8 py-3 rounded-full font-bold text-lg hover:bg-yellow-50 transition-colors shadow-lg"
            >
              閉じる
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
