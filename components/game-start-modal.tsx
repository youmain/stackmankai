"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import type { Player } from "@/types"
import { handleError, handleValidationError } from "@/lib/error-handler"

interface GameStartModalProps {
  open: boolean
  onClose: () => void
  player: Player
  onGameStart: (game: {
    playerId: string
    playerName: string
    buyInAmount: number
    totalPurchase: number
    isActive: boolean
    createReceipt?: boolean
  }) => void
}

export function GameStartModal({ open, onClose, player, onGameStart }: GameStartModalProps) {
  const [buyInAmount, setBuyInAmount] = useState("")
  const [createReceipt, setCreateReceipt] = useState(false)
  const [isStarting, setIsStarting] = useState(false)

  const buyInValue = Number.parseInt(buyInAmount) || 0
  const systemBalance = player.systemBalance
  const purchaseAmount = Math.max(0, buyInValue - systemBalance)
  const remainingBalance = Math.max(0, systemBalance - buyInValue)

  const handleStartGame = async () => {
    if (buyInValue < 0) {
      handleValidationError("バイイン額は0以上を入力してください")
      return
    }

    setIsStarting(true)
    try {
      const gameData = {
        playerId: player.id,
        playerName: player.name,
        buyInAmount: buyInValue,
        totalPurchase: purchaseAmount,
        isActive: true,
        createReceipt,
      }

      onGameStart(gameData)
      onClose()
      setBuyInAmount("")
      setCreateReceipt(false)
    } catch (error) {
      handleError(error, "ゲーム開始")
    } finally {
      setIsStarting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{player.name} - ゲーム開始</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <Card>
            <CardContent className="pt-4">
              <div className="text-sm space-y-2">
                <div className="flex justify-between">
                  <span>現在の貯スタック:</span>
                  <span className="font-medium">{systemBalance.toLocaleString()}©</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="space-y-2">
            <Label htmlFor="buyInAmount">バイイン額</Label>
            <Input
              id="buyInAmount"
              type="number"
              placeholder="バイイン額を入力"
              value={buyInAmount}
              onChange={(e) => setBuyInAmount(e.target.value)}
              min="0"
            />
          </div>

          <div className="flex items-center space-x-2 p-3 bg-gray-50 rounded-lg border">
            <Checkbox
              id="createReceipt"
              checked={createReceipt}
              onCheckedChange={(checked) => setCreateReceipt(checked as boolean)}
            />
            <Label
              htmlFor="createReceipt"
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
            >
              同時に伝票作成
            </Label>
          </div>

          {buyInValue > 0 && (
            <Card className="bg-blue-50">
              <CardContent className="pt-4">
                <div className="text-sm space-y-2">
                  <div className="flex justify-between">
                    <span>バイイン額:</span>
                    <span className="font-medium">{buyInValue.toLocaleString()}©</span>
                  </div>
                  <div className="flex justify-between">
                    <span>貯スタックから使用:</span>
                    <span className="font-medium">{Math.min(systemBalance, buyInValue).toLocaleString()}©</span>
                  </div>
                  {purchaseAmount > 0 && (
                    <div className="flex justify-between text-red-600">
                      <span>スタック購入:</span>
                      <span className="font-medium">{purchaseAmount.toLocaleString()}©</span>
                    </div>
                  )}
                  <div className="flex justify-between border-t pt-2">
                    <span>ゲーム後の貯スタック:</span>
                    <span className="font-medium">{remainingBalance.toLocaleString()}©</span>
                  </div>
                  {createReceipt && (
                    <div className="flex justify-between text-green-600 border-t pt-2">
                      <span>伝票作成:</span>
                      <span className="font-medium">有効</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          <div className="flex space-x-2 pt-4">
            <Button variant="outline" onClick={onClose} className="flex-1 bg-transparent">
              キャンセル
            </Button>
            <Button onClick={handleStartGame} disabled={buyInValue < 0 || isStarting} className="flex-1">
              {isStarting ? "開始中..." : "ゲーム開始"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
