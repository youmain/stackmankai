"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { updatePlayer } from "@/lib/firestore"
import type { Player } from "@/types"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface PlayerEditModalProps {
  open: boolean
  onClose: () => void
  player: Player | null
}

const isHiraganaOrKatakana = (text: string): boolean => {
  const hiraganaRegex = /^[\u3040-\u309F\s]+$/
  const katakanaRegex = /^[\u30A0-\u30FF\s]+$/
  return hiraganaRegex.test(text) || katakanaRegex.test(text)
}

export function PlayerEditModal({ open, onClose, player }: PlayerEditModalProps) {
  const [name, setName] = useState("")
  const [pokerName, setPokerName] = useState("")
  const [furigana, setFurigana] = useState("")
  const [membershipStatus, setMembershipStatus] = useState<"trial" | "active" | "expired" | "none">("none")
  const [subscriptionEndDate, setSubscriptionEndDate] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  // Initialize form fields when player changes
  useEffect(() => {
    if (player) {
      setName(player.name || "")
      setPokerName(player.pokerName || "")
      setFurigana(player.furigana || "")
      setMembershipStatus(player.membershipStatus || "none")
      setSubscriptionEndDate(
        player.subscriptionEndDate 
          ? new Date(player.subscriptionEndDate).toISOString().split('T')[0] 
          : ""
      )
    }
  }, [player])

  // Auto-fill furigana for hiragana/katakana names
  useEffect(() => {
    if (name && isHiraganaOrKatakana(name) && !furigana) {
      setFurigana(name)
    }
  }, [name, furigana])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (!player) return

    if (!name.trim()) {
      setError("プレイヤー名を入力してください")
      return
    }

    setLoading(true)
    try {
      await updatePlayer(player.id, {
        name: name.trim(),
        pokerName: pokerName.trim() || undefined,
        furigana: furigana.trim() || undefined,
        membershipStatus: membershipStatus,
        subscriptionEndDate: subscriptionEndDate ? new Date(subscriptionEndDate) : undefined,
      })
      onClose()
    } catch (error: any) {
      console.error("プレイヤー編集エラー:", error)
      setError("プレイヤー情報の更新に失敗しました")
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    if (!loading) {
      setError("")
      onClose()
    }
  }

  if (!player) return null

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>プレイヤー情報編集</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="playerName">プレイヤー名</Label>
            <Input
              id="playerName"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="プレイヤー名を入力"
              disabled={loading}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="pokerName">ポーカーネーム（オプション）</Label>
            <Input
              id="pokerName"
              value={pokerName}
              onChange={(e) => setPokerName(e.target.value)}
              placeholder="ポーカーネームを入力"
              disabled={loading}
            />
            <p className="text-xs text-muted-foreground">ランキングではポーカーネームが優先表示されます</p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="furigana">読み仮名（オプション）</Label>
            <Input
              id="furigana"
              value={furigana}
              onChange={(e) => setFurigana(e.target.value)}
              placeholder="読み仮名を入力（ひらがな・カタカナは自動入力）"
              disabled={loading}
            />
            <p className="text-xs text-muted-foreground">プレイヤー名がひらがな・カタカナの場合は自動で入力されます</p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="membershipStatus">会員ステータス</Label>
              <Select 
                value={membershipStatus} 
                onValueChange={(value: any) => setMembershipStatus(value)}
                disabled={loading}
              >
                <SelectTrigger>
                  <SelectValue placeholder="ステータスを選択" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">未加入</SelectItem>
                  <SelectItem value="trial">無料体験中</SelectItem>
                  <SelectItem value="active">有料会員</SelectItem>
                  <SelectItem value="expired">期限切れ</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="subscriptionEndDate">有効期限</Label>
              <Input
                id="subscriptionEndDate"
                type="date"
                value={subscriptionEndDate}
                onChange={(e) => setSubscriptionEndDate(e.target.value)}
                disabled={loading}
              />
            </div>
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
            <Button type="submit" disabled={loading}>
              {loading ? "更新中..." : "更新"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
