"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { addPlayer } from "@/lib/firestore"
import { handleFirebaseError, handleSuccess, handleValidationError } from "@/lib/error-handler"

interface PlayerRegistrationModalProps {
  open: boolean
  onClose: () => void
}

const isHiraganaOrKatakana = (text: string): boolean => {
  const hiraganaRegex = /^[\u3040-\u309F\s]+$/
  const katakanaRegex = /^[\u30A0-\u30FF\s]+$/
  return hiraganaRegex.test(text) || katakanaRegex.test(text)
}

export function PlayerRegistrationModal({ open, onClose }: PlayerRegistrationModalProps) {
  const [name, setName] = useState("")
  const [pokerName, setPokerName] = useState("")
  const [furigana, setFurigana] = useState("")
  const [initialStack, setInitialStack] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    if (name && isHiraganaOrKatakana(name) && !furigana) {
      setFurigana(name)
    }
  }, [name, furigana])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (!name.trim()) {
      const errorMessage = "プレイヤー名を入力してください"
      setError(errorMessage)
      handleValidationError(errorMessage)
      return
    }

    if (!initialStack.trim()) {
      const errorMessage = "初期スタックを入力してください"
      setError(errorMessage)
      handleValidationError(errorMessage)
      return
    }

    const stackAmount = Number.parseInt(initialStack)
    if (isNaN(stackAmount) || stackAmount < 0) {
      const errorMessage = "初期スタックは0以上の数値を入力してください"
      setError(errorMessage)
      handleValidationError(errorMessage)
      return
    }

    setLoading(true)
    try {
      await addPlayer({
        name: name.trim(),
        pokerName: pokerName.trim() || undefined,
        furigana: furigana.trim() || undefined,
        systemBalance: stackAmount,
      })
      handleSuccess("プレイヤーを登録しました", `${name}を登録しました`)
      setName("")
      setPokerName("")
      setFurigana("")
      setInitialStack("")
      onClose()
    } catch (error: unknown) {
      handleFirebaseError(error, "プレイヤー登録")
      setError("プレイヤーの登録に失敗しました")
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    if (!loading) {
      setName("")
      setPokerName("")
      setFurigana("")
      setInitialStack("")
      setError("")
      onClose()
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>新規プレイヤー登録</DialogTitle>
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
          <div className="space-y-2">
            <Label htmlFor="initialStack">初期スタック</Label>
            <div className="relative">
              <Input
                id="initialStack"
                type="number"
                value={initialStack}
                onChange={(e) => setInitialStack(e.target.value)}
                placeholder="初期スタック額を入力"
                disabled={loading}
                className="pr-8"
              />
              <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-sm text-muted-foreground">
                ©
              </span>
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
              {loading ? "登録中..." : "登録"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
