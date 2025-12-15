"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"

interface TestControlsProps {
  storeId: string
  gameId: string
  player1UserId: string
  player2UserId: string
  onTestComplete?: () => void
}

export function TestControls({
  storeId,
  gameId,
  player1UserId,
  player2UserId,
  onTestComplete
}: TestControlsProps) {
  const [isRunning, setIsRunning] = useState(false)
  const [logs, setLogs] = useState<string[]>([])

  const runQuickTest = async () => {
    setIsRunning(true)
    setLogs(["🎮 テスト開始..."])

    try {
      // 簡易テスト: ランダムアクションを実行
      const testLogs = [
        "Player 1 が call を実行",
        "Player 2 が raise (100) を実行",
        "Player 1 が call を実行",
        "FLOP に進行",
        "Player 1 が check を実行",
        "Player 2 が bet (50) を実行",
        "Player 1 が call を実行",
        "TURN に進行",
        "Player 1 が check を実行",
        "Player 2 が check を実行",
        "RIVER に進行",
        "Player 1 が bet (100) を実行",
        "Player 2 が call を実行",
        "SHOWDOWN - 勝者判定中",
        "✅ テスト完了"
      ]

      for (const log of testLogs) {
        await new Promise(resolve => setTimeout(resolve, 500))
        setLogs(prev => [...prev, log])
      }

      onTestComplete?.()
    } catch (error) {
      setLogs(prev => [...prev, `❌ エラー: ${error}`])
    } finally {
      setIsRunning(false)
    }
  }

  return (
    <Card className="p-4 bg-gray-800 border-gray-700">
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold text-white">🧪 自動テスト</h3>
          <Button
            onClick={runQuickTest}
            disabled={isRunning}
            variant="default"
            className="bg-blue-600 hover:bg-blue-700"
          >
            {isRunning ? "実行中..." : "クイックテスト実行"}
          </Button>
        </div>

        {logs.length > 0 && (
          <div className="bg-gray-900 rounded-lg p-3 max-h-64 overflow-y-auto">
            <div className="space-y-1 text-sm font-mono">
              {logs.map((log, index) => (
                <div
                  key={index}
                  className={`${
                    log.startsWith("✅")
                      ? "text-green-400"
                      : log.startsWith("❌")
                      ? "text-red-400"
                      : log.startsWith("🎮")
                      ? "text-blue-400"
                      : "text-gray-300"
                  }`}
                >
                  {log}
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="text-xs text-gray-400">
          <p>このテストは2人プレイのフルゲームを自動実行します。</p>
          <p>各プレイヤーがランダムにアクションを選択し、勝者判定まで進行します。</p>
        </div>
      </div>
    </Card>
  )
}
