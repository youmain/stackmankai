"use client"

import { PokerTable, type Player } from "./poker-table"
import type { PlayingCard } from "./playing-card"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

export interface HandData {
  situation: string
  players: Player[]
  communityCards: PlayingCard[]
  pot: number
  currentBet: number
  stage: "preflop" | "flop" | "turn" | "river"
  heroPosition: number
  action: string
  result?: string
}

interface HandVisualizerProps {
  handData: HandData
  showAllCards?: boolean
  showHeroCards?: boolean
  className?: string
}

const stageNames = {
  preflop: "プリフロップ",
  flop: "フロップ",
  turn: "ターン",
  river: "リバー",
}

export function HandVisualizer({
  handData,
  showAllCards = false,
  showHeroCards = false,
  className,
}: HandVisualizerProps) {
  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Badge variant="outline">{stageNames[handData.stage]}</Badge>
            ハンド詳細
          </CardTitle>
          <div className="text-sm text-muted-foreground">現在のベット: ©{handData.currentBet.toLocaleString()}</div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* 状況説明 */}
        {handData.situation && (
          <div className="bg-muted p-3 rounded-lg">
            <h4 className="font-semibold mb-2">状況</h4>
            <p className="text-sm">{handData.situation}</p>
          </div>
        )}

        {/* ポーカーテーブル */}
        <PokerTable
          players={handData.players}
          communityCards={handData.communityCards}
          pot={handData.pot}
          currentBet={handData.currentBet}
          showPlayerCards={showAllCards}
          showHeroCards={showHeroCards}
        />

        {/* アクション */}
        {handData.action && (
          <div className="bg-blue-50 p-3 rounded-lg">
            <h4 className="font-semibold mb-2">アクション</h4>
            <p className="text-sm">{handData.action}</p>
          </div>
        )}

        {/* 結果 */}
        {handData.result && (
          <div className="bg-green-50 p-3 rounded-lg">
            <h4 className="font-semibold mb-2">結果</h4>
            <p className="text-sm">{handData.result}</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
