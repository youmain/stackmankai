"use client"

import type React from "react"

import { useParams } from "next/navigation"
import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useAuth } from "@/contexts/auth-context"
import { useRouter } from "next/navigation"
import { Users, ArrowLeft } from "lucide-react"

export default function StoreSpecificPage() {
  const params = useParams()
  const storeName = params.storeName as string
  const decodedStoreName = decodeURIComponent(storeName)
  const { setUserName } = useAuth()
  const router = useRouter()
  const [userName, setUserNameInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!userName.trim()) return

    setIsLoading(true)
    try {
      await setUserName(userName.trim())
      router.push("/players")
    } catch (error) {
      console.error("ログインエラー:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleCustomerView = () => {
    router.push("/customer-view")
  }

  const handleBackToTop = () => {
    router.push("/")
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        <div className="flex justify-start">
          <Button
            onClick={handleBackToTop}
            variant="outline"
            size="sm"
            className="flex items-center gap-2 bg-transparent"
          >
            <ArrowLeft className="h-4 w-4" />
            トップページに戻る
          </Button>
        </div>

        {/* Welcome Message */}
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold text-gray-900">{decodedStoreName}様</h1>
          <p className="text-xl text-gray-600">アクセスありがとうございます</p>
          <p className="text-sm text-gray-500">ポーカースタックマネージャーへようこそ</p>
        </div>

        {/* Login Form */}
        <Card>
          <CardHeader>
            <CardTitle className="text-center">スタッフログイン</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="userName">ユーザー名</Label>
                <Input
                  id="userName"
                  type="text"
                  placeholder="ユーザー名を入力してください"
                  value={userName}
                  onChange={(e) => setUserNameInput(e.target.value)}
                  required
                />
              </div>
              <Button type="submit" className="w-full" disabled={isLoading || !userName.trim()}>
                {isLoading ? "ログイン中..." : "ログイン"}
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-center text-green-700">お客様用ランキング</CardTitle>
          </CardHeader>
          <CardContent>
            <Button onClick={handleCustomerView} className="w-full bg-green-600 hover:bg-green-700" variant="default">
              <Users className="mr-2 h-4 w-4" />
              お客様用画面へ
            </Button>
            <p className="text-xs text-gray-500 text-center mt-2">プレイヤーランキングとポイント情報を確認</p>
          </CardContent>
        </Card>

        {/* Store Info */}
        <Card>
          <CardContent className="pt-6">
            <div className="text-center space-y-2">
              <h3 className="font-semibold text-gray-900">{decodedStoreName}専用システム</h3>
              <p className="text-sm text-gray-600">プレイヤー管理・伝票管理・売上管理を一元化</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
