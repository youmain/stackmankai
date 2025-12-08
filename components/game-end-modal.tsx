"use client"

import { useState, useMemo, useCallback, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { endGameWithFinalStacks } from "@/lib/firestore"
import { useAuth } from "@/contexts/auth-context"
import type { Game } from "@/types"
import { useRouter } from "next/navigation"

interface GameEndModalProps {
  open: boolean
  onClose: () => void
  game: Game
}

export function GameEndModal({ open, onClose, game }: GameEndModalProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [finalStacks, setFinalStacks] = useState<{ [playerId: string]: string }>({})
  const { user } = useAuth()
  const router = useRouter()

  const initializeFinalStacks = useCallback(() => {
    const initialStacks: { [playerId: string]: string } = {}
    game.participants.forEach((participant) => {
      initialStacks[participant.playerId] = participant.currentStack.toString()
    })
    setFinalStacks(initialStacks)
  }, [game.participants])

  useEffect(() => {
    if (open) {
      initializeFinalStacks()
    }
  }, [open, initializeFinalStacks])

  const handleFinalStackChange = useCallback((playerId: string, value: string) => {
    setFinalStacks((prev) => ({
      ...prev,
      [playerId]: value,
    }))
  }, [])

  const handleEndGame = useCallback(async () => {
    console.log("[v0] 🎮 ゲーム終了ボタンクリック:", { gameId: game.id, user: user?.uid })
    setError("")

    const finalStacksArray = game.participants.map((participant) => {
      const finalStack = Number.parseInt(finalStacks[participant.playerId]) || 0
      if (finalStack < 0) {
        setError(`${participant.playerName}の最終スタック額は0以上である必要があります`)
        return null
      }
      return {
        playerId: participant.playerId,
        finalStack,
      }
    })

    if (finalStacksArray.some((stack) => stack === null)) {
      console.log("[v0] ❌ 最終スタック検証エラー")
      return
    }

    console.log("[v0] 🔄 ゲーム終了処理開始前:", { finalStacksArray })
    setLoading(true)

    try {
      console.log("[v0] 📞 endGameWithFinalStacks呼び出し開始")
      await endGameWithFinalStacks(
        game.id,
        finalStacksArray as { playerId: string; finalStack: number }[],
        user?.uid || "",
      )
      console.log("[v0] ✅ endGameWithFinalStacks呼び出し成功")
      onClose()
      router.push("/games")
    } catch (error: any) {
      console.error("[v0] ❌ ゲーム終了エラー:", error)
      console.error("[v0] ❌ エラー詳細:", {
        message: error.message,
        stack: error.stack,
        name: error.name,
      })
      setError(error.message || "ゲームの終了処理に失敗しました")
    } finally {
      setLoading(false)
    }
  }, [game.id, game.participants, finalStacks, user?.uid, onClose, router])

  const handleClose = useCallback(() => {
    if (!loading) {
      setError("")
      setFinalStacks({})
      onClose()
    }
  }, [loading, onClose])

  const participantsWithProfit = useMemo(() => {
    return game.participants.map((participant) => {
      const totalBuyIn = participant.buyInAmount + participant.additionalBuyIns
      const currentFinalStack = Number.parseInt(finalStacks[participant.playerId]) || 0
      const profit = currentFinalStack - totalBuyIn

      return {
        ...participant,
        totalBuyIn,
        currentFinalStack,
        profit,
      }
    })
  }, [game.participants, finalStacks])

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg" aria-describedby="game-end-description">
        <DialogHeader>
          <DialogTitle id="game-end-title">ゲーム終了 - 最終スタック入力</DialogTitle>
        </DialogHeader>

        <div className="space-y-4" role="form" aria-labelledby="game-end-title">
          <Alert role="status">
            <AlertDescription id="game-end-description">
              各プレイヤーの最終スタック額を入力してください。入力された金額がシステム残高に加算されます。
            </AlertDescription>
          </Alert>

          <div className="space-y-3">
            <h4 className="font-medium">最終スタック入力:</h4>
            {participantsWithProfit.map((participant) => (
              <div
                key={participant.playerId}
                className="space-y-2 p-3 border rounded"
                role="group"
                aria-label={`${participant.playerName}の最終スタック入力`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-medium">{participant.playerName}</span>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-muted-foreground">
                      現在: {participant.currentStack.toLocaleString()}©
                    </span>
                    <Badge
                      variant={participant.profit >= 0 ? "default" : "destructive"}
                      aria-label={`損益: ${participant.profit >= 0 ? "+" : ""}${participant.profit.toLocaleString()}円`}
                    >
                      {participant.profit >= 0 ? "+" : ""}
                      {participant.profit.toLocaleString()}©
                    </Badge>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Label htmlFor={`final-${participant.playerId}`} className="text-sm">
                    最終スタック:
                  </Label>
                  <Input
                    id={`final-${participant.playerId}`}
                    type="number"
                    value={finalStacks[participant.playerId] || ""}
                    onChange={(e) => handleFinalStackChange(participant.playerId, e.target.value)}
                    placeholder="最終スタック額"
                    disabled={loading}
                    className="w-32"
                    aria-label={`${participant.playerName}の最終スタック額`}
                    aria-describedby={`final-${participant.playerId}-description`}
                  />
                  <span id={`final-${participant.playerId}-description`} className="text-sm text-muted-foreground">
                    ©
                  </span>
                </div>
              </div>
            ))}
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
              onClick={handleEndGame}
              disabled={loading}
              variant="destructive"
              aria-label={loading ? "終了処理中" : "ゲームを終了"}
            >
              {loading ? "終了処理中..." : "ゲーム終了"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
