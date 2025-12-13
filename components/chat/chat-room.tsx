"use client"

import { useState, useEffect, useRef } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Send, MessageCircle, AlertCircle } from "lucide-react"
import { subscribeToChatMessages, sendChatMessage } from "@/lib/firestore"
import type { ChatMessage } from "@/types"
import { useAuth } from "@/contexts/auth-context"

export function ChatRoom() {
  const { customerAccount } = useAuth()
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [newMessage, setNewMessage] = useState("")
  const [isSending, setIsSending] = useState(false)
  const [error, setError] = useState("")
  const scrollAreaRef = useRef<HTMLDivElement>(null)

  // メッセージの購読と入室通知
  useEffect(() => {
    if (!customerAccount || !customerAccount.storeId) {
      console.error("Customer account or storeId is missing")
      setError("店舗情報が見つかりません")
      return
    }

    console.log("Setting up chat subscription for store:", customerAccount.storeId)
    
    // 入室通知を送信
    const sendJoinNotification = async () => {
      try {
        const displayName = customerAccount.playerName || customerAccount.email.split("@")[0]
        await sendChatMessage(
          `${displayName}が入室しました`,
          "system",
          "system",
          customerAccount.storeId,
          "system"
        )
      } catch (error) {
        console.error("Error sending join notification:", error)
      }
    }
    sendJoinNotification()
    
    const unsubscribe = subscribeToChatMessages(
      customerAccount.storeId,
      (msgs) => {
        console.log("Received messages:", msgs.length)
        setMessages(msgs)
        setError("") // Clear error on successful load
        // 新しいメッセージが追加されたら自動スクロール
        setTimeout(() => {
          if (scrollAreaRef.current) {
            scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight
          }
        }, 100)
      },
      (error) => {
        console.error("Chat subscription error:", error)
        setError("メッセージの読み込みに失敗しました")
      }
    )

    return () => unsubscribe()
  }, [customerAccount])

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !customerAccount) return

    setIsSending(true)
    setError("")

    try {
      // プレイヤー名を表示名として使用（なければメールアドレスの@前を使用）
      const displayName = customerAccount.playerName || customerAccount.email.split("@")[0]
      
      if (!customerAccount.storeId) {
        throw new Error("Store ID not found")
      }
      
      await sendChatMessage(newMessage.trim(), customerAccount.id, displayName, customerAccount.storeId)
      setNewMessage("")
    } catch (err) {
      console.error("Error sending message:", err)
      setError("メッセージの送信に失敗しました")
    } finally {
      setIsSending(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  if (!customerAccount) {
    return (
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          チャットを利用するにはログインが必要です
        </AlertDescription>
      </Alert>
    )
  }

  return (
    <Card className="h-[600px] flex flex-col">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageCircle className="h-5 w-5" />
          {customerAccount.storeName || "店舗"} チャット
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col gap-4 p-4">
        {/* メッセージ一覧 */}
        <ScrollArea className="flex-1 pr-4" ref={scrollAreaRef}>
          <div className="space-y-4">
            {messages.length === 0 ? (
              <div className="text-center text-muted-foreground py-8">
                まだメッセージがありません
              </div>
            ) : (
              messages.map((msg) => {
                const isOwnMessage = msg.userId === customerAccount.id
                const isSystemMessage = msg.type === "system"
                
                // システムメッセージの表示
                if (isSystemMessage) {
                  return (
                    <div key={msg.id} className="flex justify-center my-2">
                      <div className="text-xs text-muted-foreground bg-muted/50 px-3 py-1 rounded-full">
                        {msg.message}
                      </div>
                    </div>
                  )
                }
                
                // 通常メッセージの表示
                return (
                  <div
                    key={msg.id}
                    className={`flex ${isOwnMessage ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-[70%] rounded-lg p-3 ${
                        isOwnMessage
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted"
                      }`}
                    >
                      <div className="text-xs opacity-70 mb-1">
                        {msg.userName}
                      </div>
                      <div className="text-sm whitespace-pre-wrap break-words">
                        {msg.message}
                      </div>
                      <div className="text-xs opacity-50 mt-1">
                        {msg.createdAt.toLocaleTimeString("ja-JP", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </div>
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </ScrollArea>

        {/* エラー表示 */}
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* メッセージ入力 */}
        <div className="flex gap-2">
          <Input
            placeholder="メッセージを入力..."
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            disabled={isSending}
            className="flex-1"
          />
          <Button
            onClick={handleSendMessage}
            disabled={!newMessage.trim() || isSending}
            size="icon"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
