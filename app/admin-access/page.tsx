"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, Lock, Crown } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function AdminAccessPage() {
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")

    if (password === "8621") {
      sessionStorage.setItem("admin-authenticated", "true")
      router.push("/subscription-admin")
    } else {
      setError("パスワードが正しくありません")
    }

    setIsLoading(false)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-card to-muted flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="mb-8">
          <Link
            href="/legal"
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            特定商取引法に戻る
          </Link>
        </div>

        <Card className="shadow-2xl border border-border/50">
          <CardHeader className="text-center">
            <div className="mx-auto bg-gradient-to-r from-primary to-secondary p-3 rounded-full w-fit mb-4">
              <Crown className="w-8 h-8 text-white" />
            </div>
            <CardTitle className="text-2xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              運営者認証
            </CardTitle>
            <p className="text-muted-foreground">
              サブスクリプション管理にアクセスするにはパスワードを入力してください
            </p>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="password">パスワード</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10"
                    placeholder="パスワードを入力"
                    required
                  />
                </div>
              </div>

              {error && (
                <div className="text-sm text-red-600 bg-red-50 p-3 rounded-lg border border-red-200">{error}</div>
              )}

              <Button
                type="submit"
                className="w-full bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90"
                disabled={isLoading}
              >
                {isLoading ? "認証中..." : "アクセス"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
