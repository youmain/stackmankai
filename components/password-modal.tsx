"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

interface PasswordModalProps {
  open: boolean
  onClose: () => void
  onSuccess: () => void
  title: string
  description: string
}

export function PasswordModal({ open, onClose, onSuccess, title, description }: PasswordModalProps) {
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [correctPassword, setCorrectPassword] = useState("0510")

  useEffect(() => {
    const loadPassword = async () => {
      try {
        const stackmanPassword = localStorage.getItem("stackmanPassword") || "0510"
        setCorrectPassword(stackmanPassword)
      } catch (error) {
        console.error("パスワード取得エラー:", error)
        setCorrectPassword("0510")
      }
    }

    if (open) {
      loadPassword()
    }
  }, [open])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (password === correctPassword) {
      setPassword("")
      setError("")
      onClose()
      onSuccess()
    } else {
      setError("パスワードが間違っています")
      setPassword("")
    }
  }

  const handleClose = () => {
    setPassword("")
    setError("")
    onClose()
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">{description}</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="password">パスワード</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="パスワードを入力"
                autoFocus
              />
              {error && <p className="text-sm text-red-600 mt-1">{error}</p>}
            </div>

            <div className="flex space-x-2">
              <Button type="button" variant="outline" onClick={handleClose} className="flex-1 bg-transparent">
                キャンセル
              </Button>
              <Button type="submit" className="flex-1">
                確認
              </Button>
            </div>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  )
}
