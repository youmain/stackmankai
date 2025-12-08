"use client"

import type React from "react"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { createGame } from "@/lib/firestore"
import { handleFirebaseError, handleSuccess } from "@/lib/error-handler"

interface GameCreationModalProps {
  open: boolean
  onClose: () => void
}

export function GameCreationModal({ open, onClose }: GameCreationModalProps) {
  const [name, setName] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (!name.trim()) {
      setError("ゲーム名を入力してください")
      return
    }

    setLoading(true)
    try {
      await createGame(name.trim())
      handleSuccess("ゲームを作成しました", `${name}を作成しました`)
      setName("")
      onClose()
    } catch (error: unknown) {
      handleFirebaseError(error, "ゲーム作成")
      setError("ゲームの作成に失敗しました")
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    if (!loading) {
      setName("")
      setError("")
      onClose()
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>新規ゲーム作成</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="gameName">ゲーム名</Label>
            <Input
              id="gameName"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="ゲーム名を入力"
              disabled={loading}
            />
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
              {loading ? "作成中..." : "作成"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
