"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Plus, Wallet, History, Trash2, Play, Square, Edit, Crown, Clock } from 'lucide-react'
import type { Player } from "@/types"

interface PlayerCardProps {
  player: Player
  isPlaying: boolean
  totalPurchaseAmount: number
  deletingPlayerId: string | null
  onToggleStatus: (player: Player) => void
  onGenerateId: (player: Player) => void
  onEdit: (player: Player) => void
  onBalanceManagement: (player: Player) => void
  onViewHistory: (player: Player) => void
  onStartGame: (player: Player) => void
  onManageGame: (player: Player) => void
  onDelete: (player: Player) => void
}

export function PlayerCard({
  player,
  isPlaying,
  totalPurchaseAmount,
  deletingPlayerId,
  onToggleStatus,
  onGenerateId,
  onEdit,
  onBalanceManagement,
  onViewHistory,
  onStartGame,
  onManageGame,
  onDelete,
}: PlayerCardProps) {
  const playerName = typeof player.name === "string" ? player.name : (player.name as any)?.name || "プレイヤー"

  return (
    <Card
      className={`hover:shadow-lg transition-shadow lg:hover:shadow-xl ${
        isPlaying ? "ring-2 ring-blue-500 bg-blue-50" : ""
      }`}
    >
      <CardHeader className="pb-2 sm:pb-3 lg:pb-4 overflow-hidden">
        <div className="flex flex-col gap-2">
          {/* 上部：プレイヤー名とプレイ中バッジ */}
          <div className="flex items-center justify-between gap-2">
            <div className="flex flex-col min-w-0 flex-1">
              {player.furigana && <div className="text-xs text-gray-400 mb-0.5 leading-tight">{player.furigana}</div>}
              <CardTitle
                className={`text-base sm:text-lg lg:text-xl truncate cursor-pointer hover:underline ${
                  player.isSpecial ? "text-red-600" : player.isDeduction ? "text-blue-600" : ""
                }`}
                onClick={() => onToggleStatus(player)}
                title="クリックして仕様を切り替え"
              >
                {playerName}
                {player.pokerName && <span className="text-sm text-gray-500 ml-1">({player.pokerName})</span>}
                {player.isSpecial && <span className="ml-1 text-xs bg-red-100 text-red-800 px-1 rounded">特別</span>}
                {player.isDeduction && (
                  <span className="ml-1 text-xs bg-blue-100 text-blue-800 px-1 rounded">差引</span>
                )}
              </CardTitle>
            </div>
            <div className="flex flex-col items-end gap-1">
              {isPlaying && (
                <Badge
                  variant="secondary"
                  className="bg-blue-500 text-white text-xs lg:text-sm font-semibold flex-shrink-0"
                >
                  プレイ中
                </Badge>
              )}
              {player.membershipStatus === "active" && (
                <Badge className="bg-yellow-500 text-white text-[10px] px-1.5 py-0.5 flex items-center gap-0.5">
                  <Crown className="w-3 h-3" />
                  有料会員
                </Badge>
              )}
              {player.membershipStatus === "trial" && (
                <Badge className="bg-green-500 text-white text-[10px] px-1.5 py-0.5 flex items-center gap-0.5">
                  <Clock className="w-3 h-3" />
                  無料体験
                </Badge>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <Badge variant="secondary" className="bg-black text-white text-xs lg:text-sm px-2 py-1 font-semibold">
              {player.systemBalance.toLocaleString()}©
            </Badge>
            <Badge variant="destructive" className="bg-red-100 text-red-800 text-xs lg:text-sm px-2 py-1">
              購入: {totalPurchaseAmount.toLocaleString()}©
            </Badge>
            <Badge variant="secondary" className="bg-green-100 text-green-800 text-xs lg:text-sm px-2 py-1 font-semibold">
              {(player.rewardPoints || 0).toLocaleString()}P
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2 sm:space-y-3 lg:space-y-4">
          <div className="text-xs sm:text-sm lg:text-base text-muted-foreground">
            <p>プレイヤーID: {player.uniqueId || "ID未設定"}</p>
            <p>登録日: {player.createdAt.toLocaleDateString("ja-JP")}</p>
            <p>最終更新: {player.updatedAt.toLocaleDateString("ja-JP")}</p>
          </div>
          <div className="flex flex-col space-y-2">
            {!player.uniqueId && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => onGenerateId(player)}
                className="w-full text-xs sm:text-sm lg:text-base lg:py-2 bg-yellow-50 border-yellow-200 text-yellow-800 hover:bg-yellow-100"
              >
                <Plus className="h-3 w-3 sm:h-4 sm:w-4 lg:h-5 lg:w-5 mr-1" />
                IDを生成
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={() => onEdit(player)}
              className="w-full text-xs sm:text-sm lg:text-base lg:py-2"
            >
              <Edit className="h-3 w-3 sm:h-4 sm:w-4 lg:h-5 lg:w-5 mr-1" />
              編集
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onBalanceManagement(player)}
              className="w-full text-xs sm:text-sm lg:text-base lg:py-2"
            >
              <Wallet className="h-3 w-3 sm:h-4 sm:w-4 lg:h-5 lg:w-5 mr-1" />
              システム残高調整
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onViewHistory(player)}
              className="w-full text-xs sm:text-sm lg:text-base lg:py-2"
            >
              <History className="h-3 w-3 sm:h-4 sm:w-4 lg:h-5 lg:w-5 mr-1" />
              履歴
            </Button>
          </div>

          {isPlaying ? (
            <Button
              onClick={() => onManageGame(player)}
              className="w-full text-sm lg:text-base lg:py-3 bg-black hover:bg-gray-800 text-white"
              size="sm"
            >
              <Square className="h-3 w-3 sm:h-4 sm:w-4 lg:h-5 lg:w-5 mr-1" />
              ゲーム管理
            </Button>
          ) : (
            <Button
              onClick={() => onStartGame(player)}
              className="w-full text-sm lg:text-base lg:py-3 bg-black hover:bg-gray-800 text-white"
              size="sm"
            >
              <Play className="h-3 w-3 sm:h-4 sm:w-4 lg:h-5 lg:w-5 mr-1" />
              ゲーム開始
            </Button>
          )}

          <Button
            variant="destructive"
            size="sm"
            onClick={() => onDelete(player)}
            disabled={deletingPlayerId === player.id || isPlaying}
            className="w-full text-xs sm:text-sm lg:text-base lg:py-2 bg-red-500 hover:bg-red-600"
            title={isPlaying ? "ゲーム中のプレイヤーは削除できません" : ""}
          >
            <Trash2 className="h-3 w-3 sm:h-4 sm:w-4 lg:h-5 lg:w-5 mr-2" />
            {deletingPlayerId === player.id ? "削除中..." : isPlaying ? "削除不可" : "削除"}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
