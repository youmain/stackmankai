"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { updatePlayerBalance } from "@/lib/firestore"
import { useAuth } from "@/contexts/auth-context"
import type { Player } from "@/types"

interface BalanceManagementModalProps {
  open: boolean
  onClose: () => void
  player: Player
}

export function BalanceManagementModal({ open, onClose, player }: BalanceManagementModalProps) {
  const [newBalance, setNewBalance] = useState(player.systemBalance.toString())
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const { userName } = useAuth()

  const handleBalanceAdjustment = async () => {
    setError("")

    const balanceNum = Number.parseInt(newBalance)
    if (isNaN(balanceNum)) {
      setError("正しい金額を入力してください")
      return
    }

    setLoading(true)
    try {
      const adjustmentAmount = balanceNum - player.systemBalance
      const transactionType = adjustmentAmount >= 0 ? "deposit" : "withdrawal"

      await updatePlayerBalance(
        player.id,
        balanceNum,
        "システム残高調整",
        userName || "不明なユーザー"
      )

      onClose()
    } catch (error: any) {
      console.error("残高調整エラー:", error)
      setError("残高の調整に失敗しました")
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    if (!loading) {
      setNewBalance(player.systemBalance.toString())
      setError("")
      onClose()
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>システム残高調整 - {player.name}</DialogTitle>
          <div className="flex items-center space-x-2">
            <span className="text-sm text-muted-foreground">現在の残高:</span>
            <Badge variant={player.systemBalance >= 0 ? "default" : "destructive"}>
              {player.systemBalance.toLocaleString()}©
            </Badge>
          </div>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="newBalance">新しいシステム残高</Label>
            <div className="relative">
              <Input
                id="newBalance"
                type="number"
                value={newBalance}
                onChange={(e) => setNewBalance(e.target.value)}
                placeholder="新しい残高を入力"
                disabled={loading}
                className="pr-8"
              />
              <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-sm text-muted-foreground">
                ©
              </span>
            </div>
            {newBalance && !isNaN(Number.parseInt(newBalance)) && (
              <div className="text-sm text-muted-foreground">
                調整額: {Number.parseInt(newBalance) - player.systemBalance >= 0 ? "+" : ""}
                {(Number.parseInt(newBalance) - player.systemBalance).toLocaleString()}©
              </div>
            )}
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={handleClose} disabled={loading}>
              キャンセル
            </Button>
            <Button onClick={handleBalanceAdjustment} disabled={loading}>
              {loading ? "調整中..." : "残高を調整"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
