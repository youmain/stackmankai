"use client"

import React, { useState, useEffect } from "react"
import { AdvisorTypeSelector } from "./AdvisorTypeSelector"
import { PokerAdviceDisplay } from "./PokerAdviceDisplay"
import { usePokerAdvice } from "@/hooks/usePokerAdvice"
import type { AdvisorType } from "@/lib/ai-poker-advisor"
import type { Card } from "@/types/poker"

interface PokerAdvisorPanelProps {
  storeId: string
  gameId: string
  playerId: string
  playerCards: Card[]
  communityCards: Card[]
  potSize: number
  playerStack: number
  opponentStack: number
  gamePhase: string
  opponentId?: string
  onAdvisorTypeChange?: (type: AdvisorType) => void
}

export const PokerAdvisorPanel: React.FC<PokerAdvisorPanelProps> = ({
  storeId,
  gameId,
  playerId,
  playerCards,
  communityCards,
  potSize,
  playerStack,
  opponentStack,
  gamePhase,
  opponentId,
  onAdvisorTypeChange,
}) => {
  const [advisorType, setAdvisorType] = useState<AdvisorType>("balanced")
  const [isExpanded, setIsExpanded] = useState(true)

  const { advice, loading, error, generateAdvice, opponentStats } = usePokerAdvice({
    storeId,
    gameId,
    playerId,
    playerCards,
    communityCards,
    potSize,
    playerStack,
    opponentStack,
    gamePhase,
    opponentId,
    advisorType,
  })

  // アドバイザータイプが変更されたときに自動的にアドバイスを生成
  useEffect(() => {
    generateAdvice()
  }, [advisorType, playerCards, communityCards, potSize, gamePhase])

  const handleAdvisorTypeChange = (type: AdvisorType) => {
    setAdvisorType(type)
    onAdvisorTypeChange?.(type)
  }

  return (
    <div className="w-full bg-slate-950 rounded-lg border border-slate-700 overflow-hidden">
      {/* パネルヘッダー */}
      <div className="bg-gradient-to-r from-slate-800 to-slate-900 px-6 py-4 border-b border-slate-700 flex items-center justify-between cursor-pointer hover:bg-slate-800 transition-colors"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-3">
          <span className="text-2xl">🎯</span>
          <div>
            <h2 className="font-bold text-white">AIアドバイザー</h2>
            {opponentStats && (
              <p className="text-sm text-slate-400">
                相手のハンド数: {opponentStats.totalHands}
              </p>
            )}
          </div>
        </div>
        <button
          className="text-slate-400 hover:text-white transition-colors"
          onClick={(e) => {
            e.stopPropagation()
            setIsExpanded(!isExpanded)
          }}
        >
          {isExpanded ? "▼" : "▶"}
        </button>
      </div>

      {/* パネルコンテンツ */}
      {isExpanded && (
        <div className="p-6 space-y-6">
          {/* アドバイザータイプセレクター */}
          <AdvisorTypeSelector
            currentType={advisorType}
            onSelect={handleAdvisorTypeChange}
          />

          {/* アドバイス表示 */}
          <PokerAdviceDisplay
            advice={advice}
            loading={loading}
            error={error}
          />

          {/* アクションボタン */}
          <div className="flex gap-3">
            <button
              onClick={generateAdvice}
              disabled={loading}
              className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-600 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
            >
              {loading ? "生成中..." : "アドバイスを再生成"}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
