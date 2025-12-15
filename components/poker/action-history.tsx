"use client"

import { useEffect, useRef } from "react"

interface ActionHistoryProps {
  actions: Array<{
    playerName: string
    action: string
    amount?: number
    timestamp: Date
  }>
}

const ACTION_LABELS: Record<string, string> = {
  fold: "フォールド",
  check: "チェック",
  call: "コール",
  bet: "ベット",
  raise: "レイズ",
  allin: "オールイン"
}

const ACTION_COLORS: Record<string, string> = {
  fold: "text-gray-500",
  check: "text-blue-500",
  call: "text-green-500",
  bet: "text-yellow-600",
  raise: "text-orange-600",
  allin: "text-red-600"
}

export function ActionHistory({ actions }: ActionHistoryProps) {
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [actions])

  if (actions.length === 0) {
    return (
      <div className="bg-gray-50 rounded-lg p-4 text-center text-gray-400">
        アクション履歴はまだありません
      </div>
    )
  }

  return (
    <div 
      ref={scrollRef}
      className="bg-white rounded-lg shadow-md p-4 max-h-64 overflow-y-auto space-y-2"
    >
      <h3 className="text-sm font-bold text-gray-700 mb-2 sticky top-0 bg-white pb-2 border-b">
        📋 アクション履歴
      </h3>
      {actions.map((action, index) => (
        <div 
          key={index}
          className="flex items-center justify-between py-2 px-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
        >
          <div className="flex items-center gap-2">
            <span className="font-semibold text-gray-800">
              {action.playerName}
            </span>
            <span className={`font-bold ${ACTION_COLORS[action.action] || 'text-gray-600'}`}>
              {ACTION_LABELS[action.action] || action.action}
            </span>
          </div>
          {action.amount !== undefined && action.amount > 0 && (
            <span className="font-mono font-bold text-green-600">
              {action.amount.toLocaleString()}
            </span>
          )}
        </div>
      ))}
    </div>
  )
}

// コンパクト版（テーブル内表示用）
export function CompactActionHistory({ actions, maxItems = 5 }: ActionHistoryProps & { maxItems?: number }) {
  const recentActions = actions.slice(-maxItems)

  return (
    <div className="bg-gray-900/80 rounded-lg p-3 space-y-1">
      <h4 className="text-xs font-bold text-gray-300 mb-2">最近のアクション</h4>
      {recentActions.map((action, index) => (
        <div 
          key={index}
          className="text-xs flex items-center justify-between text-gray-200"
        >
          <span>
            <span className="font-semibold">{action.playerName}</span>
            {' '}
            <span className={ACTION_COLORS[action.action] || 'text-gray-400'}>
              {ACTION_LABELS[action.action] || action.action}
            </span>
          </span>
          {action.amount !== undefined && action.amount > 0 && (
            <span className="font-mono font-bold text-yellow-400">
              {action.amount.toLocaleString()}
            </span>
          )}
        </div>
      ))}
    </div>
  )
}
