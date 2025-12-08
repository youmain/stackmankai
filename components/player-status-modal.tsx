"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { User, Star, Calculator, Coins } from 'lucide-react'

interface PlayerStatusModalProps {
  open: boolean
  onClose: () => void
  playerName: string
  currentStatus: "normal" | "special" | "deduction"
  onStatusChange: (status: "normal" | "special" | "deduction") => void
  rewardPoints?: number
  currentRewardRate?: number
}

export function PlayerStatusModal({
  open,
  onClose,
  playerName,
  currentStatus,
  onStatusChange,
  rewardPoints,
  currentRewardRate,
}: PlayerStatusModalProps) {
  const [selectedStatus, setSelectedStatus] = useState<"normal" | "special" | "deduction">(currentStatus)

  const statusOptions = [
    {
      value: "normal" as const,
      label: "通常仕様",
      description: "通常の購入金額計算",
      icon: User,
      color: "bg-gray-50 border-gray-200 text-gray-900",
      badgeColor: "bg-gray-100 text-gray-800",
    },
    {
      value: "special" as const,
      label: "特別仕様",
      description: "システム残高がマイナスになっても購入金額は発生しません",
      icon: Star,
      color: "bg-red-50 border-red-200 text-red-900",
      badgeColor: "bg-red-100 text-red-800",
    },
    {
      value: "deduction" as const,
      label: "差引仕様",
      description: "ゲーム中はマイナス表示、ゲーム終了時に残ったマイナス分のみ購入金額として計上",
      icon: Calculator,
      color: "bg-orange-50 border-orange-200 text-orange-900",
      badgeColor: "bg-orange-100 text-orange-800",
    },
  ]

  const handleConfirm = () => {
    if (selectedStatus !== currentStatus) {
      onStatusChange(selectedStatus)
    }
    onClose()
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{playerName}の仕様変更</DialogTitle>
          <DialogDescription>
            プレイヤーの仕様を選択してください。現在の設定から変更する場合は、新しい仕様を選択して確定してください。
          </DialogDescription>
        </DialogHeader>

        {rewardPoints !== undefined && (
          <Card className="bg-purple-50 border-purple-200">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Coins className="h-4 w-4 text-purple-600" />
                リワードポイント情報
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-600">保有ポイント</p>
                  <p className="text-2xl font-bold text-purple-600">{rewardPoints.toLocaleString()}P</p>
                </div>
                {currentRewardRate !== undefined && (
                  <div className="text-right">
                    <p className="text-xs text-gray-600">現在の還元率</p>
                    <p className="text-lg font-semibold text-purple-600">{currentRewardRate}%</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        <div className="space-y-3">
          {statusOptions.map((option) => {
            const Icon = option.icon
            const isSelected = selectedStatus === option.value
            const isCurrent = currentStatus === option.value

            return (
              <Card
                key={option.value}
                className={`cursor-pointer transition-all hover:shadow-md ${
                  isSelected ? `${option.color} ring-2 ring-offset-2 ring-current` : "hover:bg-gray-50"
                }`}
                onClick={() => setSelectedStatus(option.value)}
              >
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Icon className="h-4 w-4" />
                      <CardTitle className="text-sm">{option.label}</CardTitle>
                    </div>
                    <div className="flex items-center space-x-2">
                      {isCurrent && (
                        <Badge variant="outline" className="text-xs">
                          現在
                        </Badge>
                      )}
                      {isSelected && <Badge className={`text-xs ${option.badgeColor}`}>選択中</Badge>}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <CardDescription className="text-xs">{option.description}</CardDescription>
                </CardContent>
              </Card>
            )
          })}
        </div>

        <div className="flex justify-end space-x-2 pt-4">
          <Button variant="outline" onClick={onClose}>
            キャンセル
          </Button>
          <Button onClick={handleConfirm}>{selectedStatus === currentStatus ? "閉じる" : "変更を確定"}</Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
