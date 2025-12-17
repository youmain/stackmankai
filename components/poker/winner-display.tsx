"use client"

import { useEffect, useState } from "react"
import type { PokerPlayer } from "@/types/poker"
import { evaluateHand, type HandEvaluation } from "@/lib/poker-hand-evaluator"

interface WinnerDisplayProps {
  winners: PokerPlayer[]
  communityCards: any[]
  pot: number
  showByFold?: boolean // フォールド勝利の場合true
  onClose?: () => void
}

export function WinnerDisplay({ winners, communityCards, pot, showByFold = false, onClose }: WinnerDisplayProps) {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    // アニメーション用に少し遅延
    setTimeout(() => setVisible(true), 100)
  }, [])

  if (winners.length === 0) return null

  // 各勝者のハンド評価を取得
  const winnerEvaluations = winners.map(winner => ({
    player: winner,
    evaluation: evaluateHand(winner.cards, communityCards)
  }))

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
            // 通常のショーダウン：ハンドと役を表示
            winnerEvaluations.map(({ player, evaluation }, index) => (
              <div 
                key={player.userId}
                className="bg-white/95 rounded-xl p-6 shadow-lg"
              >
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h3 className="text-2xl font-bold text-gray-800">
                      {player.userName}
                    </h3>
                    <p className="text-lg text-gray-600">
                      獲得: <span className="font-bold text-green-600">+{potPerWinner.toLocaleString()}</span>
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-3xl font-bold text-purple-600">
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
                      className="w-16 h-22 bg-white border-4 border-yellow-400 rounded-lg flex flex-col items-center justify-center shadow-lg"
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

        {/* 閉じるボタン */}
        {onClose && (
          <div className="text-center mt-6">
            <button
              onClick={onClose}
              className="bg-white text-yellow-600 px-8 py-3 rounded-full font-bold text-lg hover:bg-yellow-50 transition-colors shadow-lg"
            >
              次のハンドへ
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
