"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import { useAuth } from "@/contexts/auth-context"
import { ChatRoom } from "@/components/chat/chat-room"

export default function ChatPage() {
  const { customerAccount } = useAuth()
  const router = useRouter()

  useEffect(() => {
    // 認証されていない場合はログインページにリダイレクト
    if (!customerAccount) {
      router.push("/customer-auth")
    }
  }, [customerAccount, router])

  if (!customerAccount) {
    return null
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50">
      <div className="container mx-auto p-4 max-w-4xl">
        {/* ヘッダー */}
        <div className="mb-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-purple-900">
            {customerAccount.playerName || "プレイヤー"}さんのチャット
          </h1>
          <Button
            variant="outline"
            onClick={() => router.push("/customer-view")}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            マイページに戻る
          </Button>
        </div>

        {/* チャットコンポーネント */}
        <ChatRoom />
      </div>
    </div>
  )
}
