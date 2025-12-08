"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { getPlayer, updateGameParticipantStack } from "@/lib/firestore"
import { useAuth } from "@/contexts/auth-context"
import { handleError, handleSuccess, handleValidationError } from "@/lib/error-handler"

interface Player {
  id: string
  name: string
  systemBalance: number
  currentGameId: string
}

interface GameManagementModalProps {
  open: boolean
  onClose: () => void
  player: Player
  onGameEnd: (finalStack: number, playerId: string) => void
  onGameUpdate: (game: any) => void
}

const safeToLocaleString = (value: any): string => {
  const num = Number(value)
  return isNaN(num) ? "0" : num.toLocaleString()
}

export function GameManagementModal({ open, onClose, player, onGameEnd, onGameUpdate }: GameManagementModalProps) {
  const [additionalStack, setAdditionalStack] = useState("")
  const [finalStack, setFinalStack] = useState("")
  const [isProcessing, setIsProcessing] = useState(false)
  const [currentSystemBalance, setCurrentSystemBalance] = useState(0)
  const { userName } = useAuth()

  const additionalValue = Math.max(0, Number(additionalStack) || 0)
  const finalValue = Math.max(0, Number(finalStack) || 0)

  const safePlayerName = player?.name || "不明"
  const safeCurrentSystemBalance = Math.max(0, Number(currentSystemBalance) || 0)

  useEffect(() => {
    const fetchPlayerBalance = async () => {
      if (open && player?.id) {
        try {
          const playerData = await getPlayer(player.id)
          if (playerData) {
            setCurrentSystemBalance(Number(playerData.systemBalance) || 0)
          }
        } catch (error) {
          console.error("プレイヤー情報の取得に失敗:", error)
          setCurrentSystemBalance(0)
        }
      }
    }
    fetchPlayerBalance()
  }, [open, player?.id])

  const calculatePurchaseAmount = (additionalAmount: number) => {
    const additional = Math.max(0, Number(additionalAmount) || 0)
    const balance = Math.max(0, Number(safeCurrentSystemBalance) || 0)

    if (additional <= balance) {
      return 0 // システム残高内なので購入金額は0
    }
    return additional - balance // システム残高を上回った分のみ購入
  }

  const purchaseAmount = calculatePurchaseAmount(additionalValue)

  const handleAddStack = async () => {
    if (additionalValue <= 0) {
      handleValidationError("追加スタック額を入力してください")
      return
    }

    if (!player?.currentGameId || !player?.id) {
      handleValidationError("ゲーム情報が見つかりません")
      return
    }

    setIsProcessing(true)
    try {
      await updateGameParticipantStack(
        player.currentGameId,
        player.id,
        additionalValue,
        `ゲーム中追加スタック: ${safeToLocaleString(additionalValue)}©`,
        userName || "不明なユーザー",
      )

      const updatedPlayer = await getPlayer(player.id)
      if (updatedPlayer) {
        setCurrentSystemBalance(updatedPlayer.systemBalance)
      }

      setAdditionalStack("")

      if (purchaseAmount > 0) {
        handleSuccess(
          `${safeToLocaleString(additionalValue)}©の追加スタックを購入しました（${safeToLocaleString(purchaseAmount)}円）`,
        )
      } else {
        handleSuccess(
          `${safeToLocaleString(additionalValue)}©の追加スタックを貯スタックから使用しました（購入金額: 0円）`,
        )
      }
    } catch (error) {
      console.error("追加スタック処理エラー:", error)
      handleError(error, "追加スタック処理")
    } finally {
      setIsProcessing(false)
    }
  }

  const handleEndGame = async () => {
    if (finalValue < 0) {
      handleValidationError("最終スタック額を正しく入力してください")
      return
    }

    if (!confirm("ゲームを終了しますか？")) {
      return
    }

    setIsProcessing(true)
    try {
      await onGameEnd(finalValue, player.id)
      onClose()
      setFinalStack("")
    } catch (error) {
      console.error("❌ GameManagementModal - onGameEndエラー:", error)
      handleError(error, "ゲーム終了処理")
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{safePlayerName} - ゲーム管理</DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="status" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="status">状況</TabsTrigger>
            <TabsTrigger value="add">追加</TabsTrigger>
            <TabsTrigger value="end">終了</TabsTrigger>
          </TabsList>

          <TabsContent value="status" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">現在の状況</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span>プレイヤー:</span>
                  <span className="font-medium">{safePlayerName}</span>
                </div>
                <div className="flex justify-between">
                  <span>現在の貯スタック:</span>
                  <span className="font-medium">{safeToLocaleString(safeCurrentSystemBalance)}©</span>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="add" className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="additionalStack">追加スタック額</Label>
              <Input
                id="additionalStack"
                type="number"
                placeholder="追加スタック額を入力"
                value={additionalStack}
                onChange={(e) => setAdditionalStack(e.target.value)}
                min="0"
              />
            </div>

            {additionalValue > 0 && (
              <Card className={purchaseAmount > 0 ? "bg-red-50" : "bg-blue-50"}>
                <CardContent className="pt-4">
                  <div className="text-sm space-y-2">
                    <div className="flex justify-between">
                      <span>現在の貯スタック:</span>
                      <span className="font-medium">{safeToLocaleString(safeCurrentSystemBalance)}©</span>
                    </div>
                    <div className="flex justify-between">
                      <span>追加スタック:</span>
                      <span className="font-medium">{safeToLocaleString(additionalValue)}©</span>
                    </div>
                    <div className="flex justify-between border-t pt-2">
                      <span>追加後の貯スタック:</span>
                      <span className="font-medium">
                        {safeToLocaleString(Math.max(0, safeCurrentSystemBalance - additionalValue))}©
                      </span>
                    </div>
                    {purchaseAmount > 0 && (
                      <div className="flex justify-between text-red-600 border-t pt-2">
                        <span>購入金額:</span>
                        <span className="font-medium">{safeToLocaleString(purchaseAmount)}円</span>
                      </div>
                    )}
                    {purchaseAmount === 0 && (
                      <div className="text-xs text-blue-600 mt-2">貯スタック内での使用のため、現金は不要です</div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            <Button onClick={handleAddStack} disabled={additionalValue <= 0 || isProcessing} className="w-full">
              {isProcessing ? "処理中..." : "追加スタック購入"}
            </Button>
          </TabsContent>

          <TabsContent value="end" className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="finalStack">最終スタック額</Label>
              <Input
                id="finalStack"
                type="number"
                placeholder="ゲーム終了時のスタック額を入力"
                value={finalStack}
                onChange={(e) => setFinalStack(e.target.value)}
                min="0"
              />
            </div>

            {finalValue > 0 && (
              <Card className="bg-green-50">
                <CardContent className="pt-4">
                  <div className="text-sm space-y-2">
                    <div className="flex justify-between">
                      <span>最終スタック:</span>
                      <span className="font-medium">{safeToLocaleString(finalValue)}©</span>
                    </div>
                    <div className="flex justify-between">
                      <span>現在の貯スタック:</span>
                      <span className="font-medium">{safeToLocaleString(safeCurrentSystemBalance)}©</span>
                    </div>
                    <div className="flex justify-between border-t pt-2">
                      <span>ゲーム後の貯スタック:</span>
                      <span className="font-medium">{safeToLocaleString(finalValue + safeCurrentSystemBalance)}©</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            <Button
              onClick={handleEndGame}
              disabled={finalValue < 0 || isProcessing}
              className="w-full"
              variant="destructive"
            >
              {isProcessing ? "処理中..." : "ゲーム終了"}
            </Button>
          </TabsContent>
        </Tabs>

        <div className="flex justify-end pt-4">
          <Button variant="outline" onClick={onClose}>
            閉じる
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
