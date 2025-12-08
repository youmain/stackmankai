"use client"

import type React from "react"
import { useState, useMemo, useCallback } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { addPlayerToGame } from "@/lib/firestore"
import { useAuth } from "@/contexts/auth-context"
import type { Player, GameParticipant } from "@/types"

interface PlayerJoinModalProps {
  open: boolean
  onClose: () => void
  gameId: string
  players: Player[]
  currentParticipants: GameParticipant[]
}

export function PlayerJoinModal({ open, onClose, gameId, players, currentParticipants }: PlayerJoinModalProps) {
  const [selectedPlayerId, setSelectedPlayerId] = useState("")
  const [gameStack, setGameStack] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const { user } = useAuth()

  const availablePlayers = useMemo(
    () => players.filter((player) => !currentParticipants.some((p) => p.playerId === player.id)),
    [players, currentParticipants],
  )

  const { selectedPlayer, gameStackNum, buyInAmount, newSystemBalance } = useMemo(() => {
    const player = players.find((p) => p.id === selectedPlayerId)
    const stackNum = Number.parseInt(gameStack) || 0
    const buyIn = player ? Math.max(0, stackNum - player.systemBalance) : 0
    const newBalance = player ? Math.max(0, player.systemBalance - stackNum) : 0

    return {
      selectedPlayer: player,
      gameStackNum: stackNum,
      buyInAmount: buyIn,
      newSystemBalance: newBalance,
    }
  }, [players, selectedPlayerId, gameStack])

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault()
      setError("")

      if (!selectedPlayerId) {
        setError("プレイヤーを選択してください")
        return
      }

      if (!gameStackNum || gameStackNum <= 0) {
        setError("正しいゲームスタック額を入力してください")
        return
      }

      const player = players.find((p) => p.id === selectedPlayerId)
      if (!player) {
        setError("選択されたプレイヤーが見つかりません")
        return
      }

      setLoading(true)
      try {
        await addPlayerToGame(gameId, player.id, player.name, gameStackNum, user?.uid || "")
        setSelectedPlayerId("")
        setGameStack("")
        onClose()
      } catch (error: any) {
        console.error("プレイヤー参加エラー:", error)
        setError("プレイヤーの参加に失敗しました")
      } finally {
        setLoading(false)
      }
    },
    [selectedPlayerId, gameStackNum, players, gameId, user?.uid, onClose],
  )

  const handleClose = useCallback(() => {
    if (!loading) {
      setSelectedPlayerId("")
      setGameStack("")
      setError("")
      onClose()
    }
  }, [loading, onClose])

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md" aria-describedby="player-join-description">
        <DialogHeader>
          <DialogTitle id="player-join-title">プレイヤー参加</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4" aria-labelledby="player-join-title">
          <p id="player-join-description" className="sr-only">
            ゲームに参加するプレイヤーを選択し、ゲームスタック額を入力してください
          </p>
          <div className="space-y-2">
            <Label htmlFor="player">プレイヤー選択</Label>
            <Select value={selectedPlayerId} onValueChange={setSelectedPlayerId} disabled={loading}>
              <SelectTrigger id="player" aria-label="プレイヤーを選択">
                <SelectValue placeholder="プレイヤーを選択してください" />
              </SelectTrigger>
              <SelectContent>
                {availablePlayers.map((player) => (
                  <SelectItem key={player.id} value={player.id}>
                    <div className="flex items-center justify-between w-full">
                      <span>{player.pokerName ? `${player.pokerName} (${player.name})` : player.name}</span>
                      <Badge variant={player.systemBalance >= 0 ? "default" : "destructive"} className="ml-2">
                        {player.systemBalance.toLocaleString()}©
                      </Badge>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="gameStack">ゲームスタック額</Label>
            <Input
              id="gameStack"
              type="number"
              value={gameStack}
              onChange={(e) => setGameStack(e.target.value)}
              placeholder="ゲームで使用するスタック額を入力"
              disabled={loading}
              aria-label="ゲームスタック額"
              aria-describedby="gameStack-description"
            />
            <span id="gameStack-description" className="sr-only">
              ゲームで使用するスタック額を数値で入力してください
            </span>
          </div>

          {selectedPlayer && gameStackNum > 0 && (
            <div className="space-y-2 p-4 bg-muted rounded-lg" role="region" aria-label="参加情報の確認">
              <div className="flex justify-between">
                <span className="text-sm font-medium">現在の残高:</span>
                <Badge variant={selectedPlayer.systemBalance >= 0 ? "default" : "destructive"}>
                  {selectedPlayer.systemBalance.toLocaleString()}©
                </Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-sm font-medium">ゲームスタック:</span>
                <span className="text-sm font-bold">{gameStackNum.toLocaleString()}©</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm font-medium">購入金額:</span>
                <span className="text-sm font-bold text-red-600">{buyInAmount.toLocaleString()}©</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm font-medium">参加後残高:</span>
                <Badge variant={newSystemBalance >= 0 ? "default" : "destructive"}>
                  {newSystemBalance.toLocaleString()}©
                </Badge>
              </div>
            </div>
          )}

          {availablePlayers.length === 0 && (
            <Alert role="alert">
              <AlertDescription>参加可能なプレイヤーがいません</AlertDescription>
            </Alert>
          )}

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
              type="submit"
              disabled={loading || !selectedPlayerId || !gameStackNum || availablePlayers.length === 0}
              aria-label={loading ? "参加処理中" : "プレイヤーをゲームに参加させる"}
            >
              {loading ? "参加中..." : "参加"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
