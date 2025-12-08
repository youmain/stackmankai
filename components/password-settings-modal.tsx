"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { getAdminPassword, saveAdminPassword } from "@/lib/firestore"
import { useAuth } from "@/contexts/auth-context"
import { handleSuccess } from "@/lib/error-handler"

interface PasswordSettingsModalProps {
  open: boolean
  onClose: () => void
}

export function PasswordSettingsModal({ open, onClose }: PasswordSettingsModalProps) {
  const { userName } = useAuth()
  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [error, setError] = useState("")
  const [storedPassword, setStoredPassword] = useState("0510")

  useEffect(() => {
    const loadPassword = async () => {
      try {
        const adminPassword = await getAdminPassword()
        setStoredPassword(adminPassword || "0510")
      } catch (error) {
        console.error("パスワード取得エラー:", error)
        setStoredPassword("0510")
      }
    }

    if (open) {
      loadPassword()
    }
  }, [open])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (currentPassword !== storedPassword) {
      setError("現在のパスワードが間違っています")
      return
    }

    if (newPassword !== confirmPassword) {
      setError("新しいパスワードが一致しません")
      return
    }

    if (newPassword.length < 4) {
      setError("パスワードは4文字以上で入力してください")
      return
    }

    try {
      await saveAdminPassword(newPassword)
      handleSuccess("パスワードが変更されました")
      handleClose()
    } catch (error) {
      setError("パスワードの変更に失敗しました")
    }
  }

  const handleClose = () => {
    setCurrentPassword("")
    setNewPassword("")
    setConfirmPassword("")
    setError("")
    onClose()
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>パスワード設定</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="currentPassword">現在のパスワード</Label>
            <Input
              id="currentPassword"
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value || "")}
              placeholder="現在のパスワード"
              required
            />
          </div>

          <div>
            <Label htmlFor="newPassword">新しいパスワード</Label>
            <Input
              id="newPassword"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="新しいパスワード"
              required
            />
          </div>

          <div>
            <Label htmlFor="confirmPassword">新しいパスワード（確認）</Label>
            <Input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="新しいパスワード（確認）"
              required
            />
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <div className="flex space-x-2">
            <Button type="button" variant="outline" onClick={handleClose} className="flex-1 bg-transparent">
              キャンセル
            </Button>
            <Button type="submit" className="flex-1">
              変更
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
