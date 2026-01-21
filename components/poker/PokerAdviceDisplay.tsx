"use client"

import React from "react"
import type { PokerAdvice } from "@/lib/ai-poker-advisor"

interface PokerAdviceDisplayProps {
  advice: PokerAdvice | null
  loading: boolean
  error: string | null
}

export const PokerAdviceDisplay: React.FC<PokerAdviceDisplayProps> = ({
  advice,
  loading,
  error,
}) => {
  if (loading) {
    return (
      <div className="w-full bg-gradient-to-br from-slate-900 to-slate-800 rounded-lg p-6 border border-slate-700">
        <div className="flex items-center gap-3">
          <div className="animate-spin">
            <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full"></div>
          </div>
          <span className="text-slate-300">AIアドバイスを生成中...</span>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="w-full bg-gradient-to-br from-red-900 to-red-800 rounded-lg p-6 border border-red-700">
        <div className="flex items-start gap-3">
          <span className="text-2xl">⚠️</span>
          <div>
            <h4 className="font-semibold text-white mb-1">エラーが発生しました</h4>
            <p className="text-sm text-red-200">{error}</p>
          </div>
        </div>
      </div>
    )
  }

  if (!advice) {
    return (
      <div className="w-full bg-gradient-to-br from-slate-900 to-slate-800 rounded-lg p-6 border border-slate-700">
        <p className="text-slate-400 text-center">アドバイスを待機中...</p>
      </div>
    )
  }

  const getActionColor = (action: string) => {
    switch (action.toLowerCase()) {
      case "fold":
        return "bg-red-500 text-white"
      case "call":
        return "bg-yellow-500 text-black"
      case "raise":
        return "bg-green-500 text-white"
      case "check":
        return "bg-blue-500 text-white"
      default:
        return "bg-slate-500 text-white"
    }
  }

  const getActionLabel = (action: string) => {
    const labels: { [key: string]: string } = {
      fold: "フォールド",
      call: "コール",
      raise: "レイズ",
      check: "チェック",
    }
    return labels[action.toLowerCase()] || action
  }

  const getAdvisorTypeLabel = (type: string) => {
    const labels: { [key: string]: string } = {
      exploit: "エクスプロイト型",
      balanced: "バランス型",
      gto: "GTO型",
    }
    return labels[type] || type
  }

  return (
    <div className="w-full space-y-4">
      {/* ヘッダー */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-lg p-4 border border-blue-500">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🤖</span>
            <div>
              <h3 className="font-bold text-white">AIアドバイザー</h3>
              <p className="text-sm text-blue-100">{getAdvisorTypeLabel(advice.advisorType)}</p>
            </div>
          </div>
          <div className="text-right">
            <div className="text-sm text-blue-100">信頼度</div>
            <div className="text-2xl font-bold text-white">
              {Math.round(advice.confidence * 100)}%
            </div>
          </div>
        </div>
      </div>

      {/* 推奨アクション */}
      <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-lg p-4 border border-slate-700">
        <div className="flex items-center justify-between mb-3">
          <h4 className="font-semibold text-white">推奨アクション</h4>
          <span
            className={`px-3 py-1 rounded-full font-bold text-sm ${getActionColor(
              advice.recommendedAction
            )}`}
          >
            {getActionLabel(advice.recommendedAction)}
          </span>
        </div>
      </div>

      {/* 現状分析 */}
      <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-lg p-4 border border-slate-700">
        <h4 className="font-semibold text-white mb-2 flex items-center gap-2">
          <span>📊</span> 現状分析
        </h4>
        <p className="text-slate-300 text-sm whitespace-pre-wrap">{advice.currentAnalysis}</p>
      </div>

      {/* 相手分析 */}
      <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-lg p-4 border border-slate-700">
        <h4 className="font-semibold text-white mb-2 flex items-center gap-2">
          <span>👤</span> 相手分析
        </h4>
        <p className="text-slate-300 text-sm whitespace-pre-wrap">{advice.opponentAnalysis}</p>
      </div>

      {/* 根拠 */}
      <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-lg p-4 border border-slate-700">
        <h4 className="font-semibold text-white mb-2 flex items-center gap-2">
          <span>💡</span> 根拠
        </h4>
        <p className="text-slate-300 text-sm whitespace-pre-wrap">{advice.reasoning}</p>
      </div>

      {/* 免責事項 */}
      <div className="bg-slate-900 rounded-lg p-3 border border-slate-700">
        <p className="text-xs text-slate-400">
          ⚠️ このアドバイスは参考情報です。最終的な判断はプレイヤーの責任で行ってください。
        </p>
      </div>
    </div>
  )
}
