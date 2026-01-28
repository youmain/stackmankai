import React from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { User, BarChart3, Star, Zap, AlertCircle, Gift } from "lucide-react"
import { MainDashboard } from "../MainDashboard"
import { CustomerAccount, LinkedPlayer, Player, PointHistory, StoreRankingSettings, PlayerStats } from "@/types"
import { getDisplayName } from "@/lib/utils/formatters" // getDisplayName is defined in page.tsx, but I'll assume it's available or pass it as prop

interface CustomerMainContentProps {
  customerAccount: CustomerAccount | null
  linkedPlayer: LinkedPlayer | null
  viewMode: string
  playerStats: PlayerStats | null
  pointHistory: PointHistory[]
  currentRewardRate: number
  storeSettings: StoreRankingSettings | null
  playingPlayers: Player[]
  getDisplayName: (player: LinkedPlayer) => string
  handleDetailedDataClick: () => void
  onViewModeChange: (mode: string) => void
}

export const CustomerMainContent: React.FC<CustomerMainContentProps> = ({
  customerAccount,
  linkedPlayer,
  viewMode,
  playerStats,
  pointHistory,
  currentRewardRate,
  storeSettings,
  playingPlayers = [],
  getDisplayName,
  handleDetailedDataClick,
  onViewModeChange,
}) => {
  const router = useRouter()

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* currentCustomerの代わりにcustomerAccountを使用 */}
      {customerAccount?.playerId && linkedPlayer && viewMode === "main" && (
        <MainDashboard
          linkedPlayer={linkedPlayer as any}
          storeSettings={storeSettings as any}
          dailyRankings={[]}
          monthlyRankings={[]}
          pointHistory={pointHistory}
          isDoublePointDay={false}
          hasSpecialRate={false}
          currentRewardRate={currentRewardRate}
          currentMonthStr={new Date().toISOString().slice(0, 7)}
          onDetailedDataClick={handleDetailedDataClick}
          onViewModeChange={onViewModeChange}
        />
      )}

      {customerAccount?.playerId && linkedPlayer && viewMode !== "chat" && viewMode !== "main" && (
        <>
          {/* プレイヤー情報カード */}
          <Card className="border-green-200 bg-green-50 shadow-md">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-green-700 text-lg sm:text-xl">
                <User className="h-5 w-5" />
                プレイヤー情報
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">プレイヤー名</p>
                  <p className="text-lg font-semibold text-gray-900">{getDisplayName(linkedPlayer)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">ホーム店舗</p>
                  <p className="text-lg font-semibold text-gray-900">{customerAccount?.storeName || "未設定"}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">貯スタック</p>
                  <p className="text-lg font-semibold text-blue-600">
                    {linkedPlayer.systemBalance?.toLocaleString() || 0}💰
                  </p>
                </div>
                <div 
                  className="cursor-pointer hover:bg-green-50 p-2 rounded-lg transition-colors"
                  onClick={() => router.push('/stack-man-hand/purchase')}
                >
                  <p className="text-sm text-gray-600">スタポカ貯スタック</p>
                  <p className="text-lg font-semibold text-green-600">
                    {customerAccount?.stapokaBalance?.toLocaleString() || 0}💰
                  </p>
                  <p className="text-xs text-green-500 mt-1">クリックでStack Man Hand購入</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">CP (Cashback Points)</p>
                  <p className="text-lg font-semibold text-purple-600">
                    {linkedPlayer.rewardPoints?.toLocaleString() || 0}CP
                  </p>
                  <p className="text-xs text-gray-500">今日のCP率: {currentRewardRate}%</p>
                </div>
                {storeSettings?.membershipRankSettings?.enabled && (
                  <div>
                    <p className="text-sm text-gray-600">会員ランク</p>
                    <div className="flex items-center gap-2">
                      {linkedPlayer.membershipRank === "platinum" && (
                        <Badge className="bg-purple-600 text-white">プラチナ</Badge>
                      )}
                      {linkedPlayer.membershipRank === "gold" && (
                        <Badge className="bg-yellow-500 text-white">ゴールド</Badge>
                      )}
                      {linkedPlayer.membershipRank === "silver" && (
                        <Badge className="bg-gray-400 text-white">シルバー</Badge>
                      )}
                      {(!linkedPlayer.membershipRank || linkedPlayer.membershipRank === "none") && (
                        <Badge variant="outline">一般</Badge>
                      )}
                    </div>
                    {linkedPlayer.membershipRank && linkedPlayer.membershipRank !== "none" && linkedPlayer.membershipRank !== "platinum" && storeSettings?.membershipRankSettings?.ranks && (
                      <p className="text-xs text-gray-500 mt-1">
                        次のランクまで: {(() => {
                          const currentRank = linkedPlayer.membershipRank
                          const totalCP = linkedPlayer.totalCPEarned || 0
                          if (currentRank === "silver" && storeSettings.membershipRankSettings.ranks.gold) {
                            const required = storeSettings.membershipRankSettings.ranks.gold.requiredCP
                            return `${(required - totalCP).toLocaleString()}CP`
                          } else if (currentRank === "gold" && storeSettings.membershipRankSettings.ranks.platinum) {
                            const required = storeSettings.membershipRankSettings.ranks.platinum.requiredCP
                            return `${(required - totalCP).toLocaleString()}CP`
                          }
                          return "0CP"
                        })()}
                      </p>
                    )}
                    {(!linkedPlayer.membershipRank || linkedPlayer.membershipRank === "none") && storeSettings?.membershipRankSettings?.ranks?.silver && (
                      <p className="text-xs text-gray-500 mt-1">
                        シルバーまで: {(() => {
                          const totalCP = linkedPlayer.totalCPEarned || 0
                          const required = storeSettings.membershipRankSettings.ranks.silver.requiredCP
                          return `${(required - totalCP).toLocaleString()}CP`
                        })()}
                      </p>
                    )}
                  </div>
                )}
                {linkedPlayer.pokerName && (
                  <div>
                    <p className="text-sm text-gray-600">ポーカーネーム</p>
                    <p className="text-lg font-semibold text-purple-600">{linkedPlayer.pokerName}</p>
                  </div>
                )}
                <div>
                  <p className="text-sm text-gray-600">ステータス</p>
                  <Badge variant={linkedPlayer.isPlaying ? "default" : "secondary"}>
                    {linkedPlayer.isPlaying ? "プレイ中" : "待機中"}
                  </Badge>
                </div>
              </div>
              <Button onClick={handleDetailedDataClick} className="w-full bg-blue-600 hover:bg-blue-700">
                <BarChart3 className="h-4 w-4 mr-2" />
                詳細データを見る
              </Button>
            </CardContent>
          </Card>

          {pointHistory && pointHistory.length > 0 && (
            <Card className="shadow-md">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
                  <Star className="h-5 w-5 text-purple-500" />
                  CP履歴
                </CardTitle>
                <p className="text-sm text-gray-600">
                  現在の保有CP: <span className="font-bold text-purple-600">{linkedPlayer.rewardPoints?.toLocaleString() || 0}CP</span>
                </p>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {pointHistory.slice(0, 10).map((history: any) => (
                    <div
                      key={history.id}
                      className={`flex items-center justify-between p-4 rounded-lg border ${
                        history.type === "earn"
                          ? "bg-green-50 border-green-200"
                          : "bg-red-50 border-red-200"
                      }`}
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <Badge
                            variant={history.type === "earn" ? "default" : "destructive"}
                            className="text-xs"
                          >
                            {history.type === "earn" ? "獲得" : "使用"}
                          </Badge>
                          <span className="text-sm text-gray-600">
                            {(() => {
                              try {
                                const date = history.createdAt?.toDate ? history.createdAt.toDate() : (history.createdAt ? new Date(history.createdAt) : new Date());
                                return date.toLocaleString("ja-JP", {
                                  year: "numeric",
                                  month: "2-digit",
                                  day: "2-digit",
                                  hour: "2-digit",
                                  minute: "2-digit",
                                });
                              } catch (e) {
                                return "----/--/-- --:--";
                              }
                            })()}
                          </span>
                        </div>
                        <p className="text-sm text-gray-700 mt-1">{history.reason}</p>
                        {history.purchaseAmount && history.rate && (
                          <p className="text-xs text-gray-500 mt-1">
                            購入金額: {history.purchaseAmount.toLocaleString()}円 × {history.rate}%
                          </p>
                        )}
                      </div>
                      <div className="text-right">
                        <div
                          className={`text-lg font-bold ${
                            history.type === "earn" ? "text-green-600" : "text-red-600"
                          }`}
                        >
                          {history.type === "earn" ? "+" : "-"}
                          {history.points.toLocaleString()}P
                        </div>
                        <div className="text-xs text-gray-500">
                          残高: {history.balanceAfter.toLocaleString()}P
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                {pointHistory.length > 10 && (
                  <p className="text-center text-sm text-gray-500 mt-4">
                    最新10件を表示中（全{pointHistory.length}件）
                  </p>
                )}
              </CardContent>
            </Card>
          )}

          {/* 戦績サマリー */}
          {playerStats && (
            <Card className="shadow-md">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
                  <BarChart3 className="h-5 w-5 text-blue-500" />
                  戦績サマリー
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center p-4 bg-blue-50 rounded-lg">
                    <p className="text-sm text-gray-600">総ゲーム数</p>
                    <p className="text-2xl font-bold text-blue-600">{playerStats.totalGames}</p>
                  </div>
                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <p className="text-sm text-gray-600">総収支</p>
                    <p
                      className={`text-2xl font-bold ${playerStats.totalProfit >= 0 ? "text-green-600" : "text-red-600"}`}
                    >
                      {playerStats.totalProfit >= 0 ? "+" : ""}
                      {playerStats.totalProfit.toLocaleString()}©
                    </p>
                  </div>
                  <div className="text-center p-4 bg-purple-50 rounded-lg">
                    <p className="text-sm text-gray-600">勝率</p>
                    <p className="text-2xl font-bold text-purple-600">{playerStats.winRate.toFixed(1)}%</p>
                  </div>
                  <div className="text-center p-4 bg-orange-50 rounded-lg">
                    <p className="text-sm text-gray-600">平均収支</p>
                    <p
                      className={`text-2xl font-bold ${playerStats.averageProfit >= 0 ? "text-green-600" : "text-red-600"}`}
                    >
                      {playerStats.averageProfit >= 0 ? "+" : ""}
                      {Math.round(playerStats.averageProfit).toLocaleString()}©
                    </p>
                  </div>
                </div>

                {playerStats.todayGames > 0 && (
                  <div className="mt-4 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                    <h3 className="font-semibold text-yellow-800 mb-2">今日の戦績</h3>
                    <div className="flex justify-between items-center">
                      <p className="text-sm text-gray-600">ゲーム数: {playerStats.todayGames}</p>
                      <p className="text-sm text-gray-600">勝率: {playerStats.todayWinRate.toFixed(1)}%</p>
                      <span
                        className={`font-bold ${playerStats.todayProfit >= 0 ? "text-green-600" : "text-red-600"}`}
                      >
                        {playerStats.todayProfit >= 0 ? "+" : ""}
                        {playerStats.todayProfit.toLocaleString()}©
                      </span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </>
      )}

      {/* プレイ中表示 */}
      {viewMode !== "chat" && (
      <Card className="border-green-200 bg-green-50 shadow-md">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-green-700 text-lg sm:text-xl">
            <Zap className="h-5 w-5" />🎮 現在プレイ中 🎮
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          {playingPlayers && playingPlayers.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {playingPlayers.map((player) => (
                <Badge
                  key={player.id}
                  variant="secondary"
                  className="bg-green-100 text-green-800 px-3 py-2 text-sm sm:text-base"
                >
                  {player.pokerName || player.name}
                </Badge>
              ))}
            </div>
          ) : (
            <p className="text-center text-gray-600 py-2">現在プレイ中のプレイヤーはいません</p>
          )}
        </CardContent>
      </Card>
      )}
    </div>
  )
}
