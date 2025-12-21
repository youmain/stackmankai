"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Star, Percent, AlertCircle, Gift } from "lucide-react"
import type { StoreRankingSettings, Player } from "@/types"

interface SpecialNoticesSectionProps {
  isDoublePointDay: boolean
  hasSpecialRate: boolean
  currentRewardRate: number
  storeSettings: StoreRankingSettings | null
  linkedPlayer: {
    id: string
    name: string
    player?: Player
  } | null
}

export function SpecialNoticesSection({
  isDoublePointDay,
  hasSpecialRate,
  currentRewardRate,
  storeSettings,
  linkedPlayer,
}: SpecialNoticesSectionProps) {
  return (
    <>
      {/* ポイント2倍デー表示 */}
      {isDoublePointDay && (
        <Card className="border-yellow-200 bg-yellow-50 shadow-md">
          <CardContent className="py-4">
            <div className="flex items-center justify-center space-x-2">
              <Star className="h-6 w-6 text-yellow-600" />
              <span className="text-lg font-bold text-yellow-800">本日はRP2倍デー！</span>
              <Star className="h-6 w-6 text-yellow-600" />
            </div>
          </CardContent>
        </Card>
      )}

      {/* 特別還元率の日表示 */}
      {hasSpecialRate && (
        <Card className="border-purple-200 bg-purple-50 shadow-md">
          <CardContent className="py-4">
            <div className="flex items-center justify-center space-x-2">
              <Percent className="h-6 w-6 text-purple-600" />
              <span className="text-lg font-bold text-purple-800">
                本日は特別還元率！{currentRewardRate}%還元
              </span>
              <Percent className="h-6 w-6 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      )}

      {/* お知らせメッセージ表示 */}
      {storeSettings?.announcement?.isVisible && storeSettings.announcement.message && (
        <Card className="border-blue-200 bg-blue-50 shadow-md">
          <CardContent className="py-4">
            <div className="flex items-center justify-center space-x-2">
              <AlertCircle className="h-6 w-6 text-blue-600" />
              <span className="text-lg font-bold text-blue-800">{storeSettings.announcement.message}</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 会員ランク特典表示 */}
      {storeSettings?.membershipRankSettings?.enabled &&
        linkedPlayer?.player?.membershipRank &&
        linkedPlayer.player.membershipRank !== "none" && (
          <Card className="border-green-200 bg-green-50 shadow-md">
            <CardContent className="py-4">
              <div className="text-center space-y-2">
                <div className="flex items-center justify-center space-x-2">
                  <Gift className="h-6 w-6 text-green-600" />
                  <span className="text-lg font-bold text-green-800">
                    {linkedPlayer.player.membershipRank === "platinum" && "プラチナ"}
                    {linkedPlayer.player.membershipRank === "gold" && "ゴールド"}
                    {linkedPlayer.player.membershipRank === "silver" && "シルバー"}
                    会員特典
                  </span>
                  <Gift className="h-6 w-6 text-green-600" />
                </div>
                <div className="flex flex-wrap justify-center gap-2 text-sm">
                  {(() => {
                    const rank = linkedPlayer.player.membershipRank as "silver" | "gold" | "platinum"
                    const benefits = storeSettings.membershipRankSettings.ranks[rank].benefits
                    const items = []
                    if (benefits.cpBoostPercentage > 0) {
                      items.push(
                        <span key="cp" className="bg-white px-2 py-1 rounded">
                          CP+{benefits.cpBoostPercentage}%
                        </span>
                      )
                    }
                    if (benefits.prioritySeating) {
                      items.push(
                        <span key="seat" className="bg-white px-2 py-1 rounded">
                          優先席
                        </span>
                      )
                    }
                    if (benefits.specialEvents) {
                      items.push(
                        <span key="event" className="bg-white px-2 py-1 rounded">
                          特別イベント参加
                        </span>
                      )
                    }
                    return items
                  })()}
                </div>
              </div>
            </CardContent>
          </Card>
        )}
    </>
  )
}
