"use client"

import type React from "react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useAuth } from "@/contexts/auth-context"
import Link from "next/link"
import { ArrowLeft, Lock } from "lucide-react"

export function LoginForm() {
  const [name, setName] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const { setUserName, loading } = useAuth()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (!name.trim()) {
      setError("名前を入力してください")
      return
    }

    if (!password) {
      setError("パスワードを入力してください")
      return
    }

    if (password !== "0000") {
      setError("パスワードが正しくありません")
      return
    }

    try {
      setUserName(name.trim())
    } catch (error: any) {
      console.error("名前設定エラー:", error)
      setError("名前の設定に失敗しました。")
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <Link
        href="/"
        className="absolute top-4 left-4 flex items-center gap-2 text-gray-600 hover:text-gray-800 transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        <span>トップページに戻る</span>
      </Link>

      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold text-black">スタックマン！</CardTitle>
          <CardDescription>名前とパスワードを入力してください</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">あなたの名前</Label>
              <Input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="名前を入力してください"
                disabled={loading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">パスワード</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="パスワードを入力してください"
                  className="pl-10"
                  disabled={loading}
                />
              </div>
            </div>
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            <Button type="submit" className="w-full" disabled={loading || !name.trim() || !password}>
              {loading ? "設定中..." : "開始"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
