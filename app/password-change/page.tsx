"use client"

import type React from "react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AuthGuard } from "@/components/auth-guard"
import { Header } from "@/components/header"
import { Lock, CheckCircle } from "lucide-react"

export default function PasswordChangePage() {
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [stackmanPassword, setStackmanPassword] = useState("")
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setSuccess("")
    setIsLoading(true)

    try {
      if (stackmanPassword !== "0510") {
        throw new Error("スタックマンパスワードが正しくありません")
      }

      // Validate new password
      if (!newPassword) {
        throw new Error("新しいパスワードを入力してください")
      }

      if (newPassword.length < 4) {
        throw new Error("新しいパスワードは4文字以上で入力してください")
      }

      if (newPassword !== confirmPassword) {
        throw new Error("新しいパスワードが一致しません")
      }

      // In a real implementation, this would update the password in the database
      // For now, we'll just show a success message
      localStorage.setItem("loginPassword", newPassword)

      setSuccess("パスワードが正常に変更されました")
      setNewPassword("")
      setConfirmPassword("")
      setStackmanPassword("")
    } catch (error) {
      setError(error instanceof Error ? error.message : "パスワード変更に失敗しました")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <AuthGuard>
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-md mx-auto">
            <Card>
              <CardHeader className="text-center">
                <CardTitle className="text-2xl font-bold flex items-center justify-center gap-2">
                  <Lock className="h-6 w-6" />
                  パスワード変更
                </CardTitle>
                <CardDescription>ログイン用のパスワードを変更できます</CardDescription>
              </CardHeader>
              <CardContent>
                {error && (
                  <Alert variant="destructive" className="mb-4">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                {success && (
                  <Alert className="mb-4 border-green-200 bg-green-50">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <AlertDescription className="text-green-600">{success}</AlertDescription>
                  </Alert>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="stackman-password">スタックマンパスワード</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <Input
                        id="stackman-password"
                        type="password"
                        value={stackmanPassword}
                        onChange={(e) => setStackmanPassword(e.target.value)}
                        placeholder="スタックマンパスワード"
                        className="pl-10"
                        disabled={isLoading}
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="new-password">新しいパスワード</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <Input
                        id="new-password"
                        type="password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="新しいパスワード（4文字以上）"
                        className="pl-10"
                        disabled={isLoading}
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="confirm-password">新しいパスワード（確認）</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <Input
                        id="confirm-password"
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="新しいパスワードを再入力"
                        className="pl-10"
                        disabled={isLoading}
                        required
                      />
                    </div>
                  </div>

                  <Button
                    type="submit"
                    className="w-full"
                    disabled={isLoading || !stackmanPassword || !newPassword || !confirmPassword}
                  >
                    {isLoading ? "変更中..." : "パスワードを変更"}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </AuthGuard>
  )
}
