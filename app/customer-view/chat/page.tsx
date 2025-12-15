"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import { useAuth } from "@/contexts/auth-context"
import { ChatRoomDualMode } from "@/components/chat/chat-room-dual-mode"

export default function ChatPage() {
  const { customerAccount } = useAuth()
  const router = useRouter()

  useEffect(() => {
    // 認証されていない場合はログインページにリダイレクト
    if (customerAccount === null) {
      router.push("/customer-auth")
    }
  }, [customerAccount, router])

  // 認証チェック中または未認証の場合は何も表示しない
  if (customerAccount === undefined || customerAccount === null) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">読み込み中...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="h-screen flex flex-col bg-gradient-to-br from-purple-50 via-white to-pink-50">
      {/* ヘッダー */}
      <div className="flex items-center justify-between p-2 bg-white shadow-sm">
        <h1 className="text-base font-bold text-purple-900">
          {customerAccount.playerName || "プレイヤー"}さんのチャット
        </h1>
        <Button
          variant="outline"
          size="sm"
          className="h-8 text-xs"
          onClick={() => router.push("/customer-view")}
        >
          <ArrowLeft className="h-3 w-3 mr-1" />
          戻る
        </Button>
      </div>

      {/* チャットコンポーネント */}
      <div className="flex-1 overflow-hidden">
        <ChatRoomDualMode />
      </div>
    </div>
  )
}
