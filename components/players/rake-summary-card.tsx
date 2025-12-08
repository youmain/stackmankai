"use client"

import { Card, CardContent } from "@/components/ui/card"

interface RakeSummaryCardProps {
  totalRake: number
  rakeCount: number
}

export function RakeSummaryCard({ totalRake, rakeCount }: RakeSummaryCardProps) {
  return (
    <Card className="bg-gradient-to-r from-green-50 to-blue-50 border-green-200">
      <CardContent className="pt-4 sm:pt-6 lg:pt-8">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-green-800">レーキ合計</h2>
            <p className="text-xs sm:text-sm lg:text-base text-green-600 mt-1 sm:mt-2">全プレイヤーのレーキ合計額</p>
          </div>
          <div className="text-right">
            <div className="text-2xl sm:text-3xl lg:text-4xl font-bold text-green-800">
              {totalRake >= 0 ? "+" : ""}
              {totalRake.toLocaleString()}©
            </div>
            <div className="text-xs sm:text-sm lg:text-base text-green-600">{rakeCount}人分</div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
