"use client"

import { useRef, useEffect, memo } from "react"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Send, AlertCircle } from "lucide-react"
import type { ChatMessage } from "@/types"

interface ChatPanelProps {
  height: string
  showHeader?: boolean
  messages: ChatMessage[]
  newMessage: string
  isSending: boolean
  error: string
  hiddenMessageIds: Set<string>
  activeUsers: Array<{ userId: string; userName: string }>
  currentUserId: string
  onMessageChange: (message: string) => void
  onSendMessage: () => void
  onKeyPress: (e: React.KeyboardEvent) => void
  onClearHistory: () => void
}

export const ChatPanel = memo(function ChatPanel({
  height,
  showHeader = true,
  messages,
  newMessage,
  isSending,
  error,
  hiddenMessageIds,
  activeUsers,
  currentUserId,
  onMessageChange,
  onSendMessage,
  onKeyPress,
  onClearHistory,
}: ChatPanelProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const scrollAreaRef = useRef<HTMLDivElement>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // メッセージが追加されたら自動スクロール（チャットパネル内のみ）
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ 
      behavior: "smooth",
      block: "nearest", // ページ全体をスクロールしない
      inline: "nearest"
    })
  }, [messages])

  return (
    <Card style={{ height }} className="flex flex-col overflow-hidden rounded-none border-0 border-t-2 border-purple-500">
      {showHeader && (
        <CardHeader className="p-2 pb-1">
          <div className="flex items-center justify-end">
            <Button
              variant="outline"
              size="sm"
              className="h-6 text-xs px-2"
              onClick={onClearHistory}
              disabled={messages.filter(msg => !hiddenMessageIds.has(msg.id)).length === 0}
            >
              消去
            </Button>
          </div>
          {activeUsers.length > 0 && (
            <div className="mt-1">
              <span className="text-xs text-muted-foreground">入室中: ({activeUsers.length}人)</span>
              <div className="flex gap-1 overflow-x-auto pb-1 mt-1" style={{ scrollbarWidth: 'thin' }}>
                {activeUsers.map((user) => (
                  <div
                    key={user.userId}
                    className="px-2 py-0.5 text-[10px] font-medium border border-purple-300 bg-purple-50 text-purple-700 rounded whitespace-nowrap flex-shrink-0"
                  >
                    {user.userName}
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardHeader>
      )}
      <CardContent className="flex-1 flex flex-col gap-2 p-2 overflow-hidden">
        <ScrollArea className="flex-1 pr-4" ref={scrollAreaRef}>
          <div className="space-y-4">
            {messages.filter(msg => !hiddenMessageIds.has(msg.id)).length === 0 ? (
              <div className="text-center text-muted-foreground py-8">
                まだメッセージがありません
              </div>
            ) : (
              messages.filter(msg => !hiddenMessageIds.has(msg.id)).map((msg) => {
                const isOwnMessage = msg.userId === currentUserId
                const isSystemMessage = msg.type === "system"
                
                if (isSystemMessage) {
                  return (
                    <div key={msg.id} className="flex justify-center my-2">
                      <div className="text-xs text-muted-foreground bg-muted/50 px-3 py-1 rounded-full">
                        {msg.message}
                      </div>
                    </div>
                  )
                }
                
                return (
                  <div
                    key={msg.id}
                    className={`flex ${isOwnMessage ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-[70%] rounded-lg px-3 py-2 ${
                        isOwnMessage
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted"
                      }`}
                    >
                      <div className="text-sm">
                        <span className="font-semibold">{msg.userName}</span>
                        <span>: </span>
                        <span className="whitespace-pre-wrap break-words">{msg.message}</span>
                        <span className="text-xs opacity-70 ml-2">({msg.createdAt.toLocaleTimeString("ja-JP", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })})</span>
                      </div>
                    </div>
                  </div>
                )
              })
            )}
            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="flex gap-2">
          <Input
            ref={inputRef}
            placeholder="メッセージを入力..."
            value={newMessage}
            onChange={(e) => onMessageChange(e.target.value)}
            onKeyPress={onKeyPress}
            disabled={isSending}
            className="flex-1"
          />
          <Button
            onClick={onSendMessage}
            disabled={!newMessage.trim() || isSending}
            size="icon"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  )
})
