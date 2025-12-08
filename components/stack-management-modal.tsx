"use client"

import { useState, useMemo, useCallback } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { updateGameParticipantStack } from "@/lib/firestore"
import { useAuth } from "@/contexts/auth-context"
import type { GameParticipant } from "@/types"

interface StackManagementModalProps {
  open: boolean
  onClose: () => void
  gameId: string
  participant: GameParticipant
  playerSystemBalance: number
}

export function StackManagementModal({
  open,
  onClose,
  gameId,
  participant,
  playerSystemBalance,
}: StackManagementModalProps) {
  const [amount, setAmount] = useState("")
  const [description, setDescription] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const { user } = useAuth()

  const { amountNum, newSystemBalance, buyInAmount, finalSystemBalance } = useMemo(() => {
    const num = Number.parseInt(amount) || 0
    const newBalance = playerSystemBalance - num
    const buyIn = newBalance < 0 ? Math.abs(newBalance) : 0
    const finalBalance = Math.max(0, newBalance)

    return {
      amountNum: num,
      newSystemBalance: newBalance,
      buyInAmount: buyIn,
      finalSystemBalance: finalBalance,
    }
  }, [amount, playerSystemBalance])

  const handleStackAdd = useCallback(async () => {
    setError("")

    if (!amountNum || amountNum <= 0) {
      setError("正しい金額を入力してください")
      return
    }

    const finalDescription = description.trim() || "スタック追加"

    setLoading(true)
    try {
      await updateGameParticipantStack(gameId, participant.playerId, amountNum, finalDescription, user?.uid || "")

      setAmount("")
      setDescription("")
      onClose()
    } catch (error: any) {
      console.error("スタック更新エラー:", error)
      setError(error.message || "スタックの更新に失敗しました")
    } finally {
      setLoading(false)
    }
  }, [amountNum, description, gameId, participant.playerId, user?.uid, onClose])

  const handleClose = useCallback(() => {
    if (!loading) {
      setAmount("")
      setDescription("")
      setError("")
      onClose()
    }
  }, [loading, onClose])

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md" aria-describedby="stack-management-description">
        <DialogHeader>
          <DialogTitle id="stack-management-title">スタック管理 - {participant.playerName}</DialogTitle>
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <span className="text-sm text-muted-foreground">ゲームスタック:</span>
              <Badge
                variant="default"
                aria-label={`現在のゲームスタック: ${participant.currentStack.toLocaleString()}円`}
              >
                {participant.currentStack.toLocaleString()}©
              </Badge>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-sm text-muted-foreground">システム残高:</span>
              <Badge
                variant={playerSystemBalance >= 0 ? "default" : "destructive"}
                aria-label={`システム残高: ${playerSystemBalance.toLocaleString()}円`}
              >
                {playerSystemBalance.toLocaleString()}©
              </Badge>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4" role="form" aria-labelledby="stack-management-title">
          <p id="stack-management-description" className="sr-only">
            追加するスタック額を入力し、必要に応じて詳細を記入してください
          </p>
          <div className="space-y-2">
            <Label htmlFor="amount">追加スタック額</Label>
            <Input
              id="amount"
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="追加するスタック額を入力"
              disabled={loading}
              aria-label="追加スタック額"
              aria-describedby="amount-description"
            />
            <span id="amount-description" className="sr-only">
              追加するスタック額を数値で入力してください
            </span>
          </div>

          {amountNum > 0 && (
            <div className="space-y-2 p-4 bg-muted rounded-lg" role="region" aria-label="スタック追加情報の確認">
              <div className="flex justify-between">
                <span className="text-sm font-medium">追加スタック:</span>
                <span className="text-sm font-bold">{amountNum.toLocaleString()}©</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm font-medium">現在システム残高:</span>
                <span className="text-sm">{playerSystemBalance.toLocaleString()}©</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm font-medium">新システム残高:</span>
                <Badge variant={finalSystemBalance >= 0 ? "default" : "destructive"}>
                  {finalSystemBalance.toLocaleString()}©
                </Badge>
              </div>
              {buyInAmount > 0 && (
                <div className="flex justify-between border-t pt-2">
                  <span className="text-sm font-medium text-red-600">購入金額:</span>
                  <span className="text-sm font-bold text-red-600">{buyInAmount.toLocaleString()}©</span>
                </div>
              )}
              {buyInAmount === 0 && (
                <div className="flex justify-between border-t pt-2">
                  <span className="text-sm font-medium text-green-600">残高から使用</span>
                  <span className="text-sm text-green-600">購入なし</span>
                </div>
              )}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="description">詳細</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="追加の詳細を入力"
              disabled={loading}
              aria-label="スタック追加の詳細"
            />
          </div>

          {error && (
            <Alert variant="destructive" role="alert">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={handleClose} disabled={loading}>
              キャンセル
            </Button>
            <Button
              onClick={handleStackAdd}
              disabled={loading || !amountNum}
              aria-label={loading ? "処理中" : "スタックを追加"}
            >
              {loading ? "処理中..." : "スタック追加"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
