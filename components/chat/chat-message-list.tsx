"use client"

import { useRef, useEffect } from "react"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Button } from "@/components/ui/button"
import { Trash2 } from "lucide-react"
import type { ChatMessage } from "@/types"

interface ChatMessageListProps {
  messages: ChatMessage[]
  hiddenMessageIds: Set<string>
  onToggleVisibility: (messageId: string) => void
  onClearHistory: () => void
}

export function ChatMessageList({
  messages,
  hiddenMessageIds,
  onToggleVisibility,
  onClearHistory,
}: ChatMessageListProps) {
  const scrollAreaRef = useRef<HTMLDivElement>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // 新しいメッセージが追加されたときに自動スクロール
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  const visibleMessages = messages.filter((msg) => !hiddenMessageIds.has(msg.id || ""))

  return (
    <div className="flex flex-col h-full">
      <div className="flex justify-between items-center p-2 border-b">
        <h3 className="font-semibold text-sm">チャット</h3>
        <Button
          variant="ghost"
          size="sm"
          onClick={onClearHistory}
          className="text-xs"
        >
          <Trash2 className="w-4 h-4 mr-1" />
          履歴削除
        </Button>
      </div>

      <ScrollArea className="flex-1" ref={scrollAreaRef}>
        <div className="p-4 space-y-2">
          {visibleMessages.length === 0 ? (
            <div className="text-center text-gray-400 text-sm py-8">
              メッセージがありません
            </div>
          ) : (
            visibleMessages.map((msg) => (
              <div
                key={msg.id}
                className="text-xs bg-gray-50 p-2 rounded hover:bg-gray-100 transition-colors group"
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="font-semibold text-gray-700">{msg.userName}</div>
                    <div className="text-gray-600 break-words">{msg.message}</div>
                    <div className="text-gray-400 text-xs mt-1">
                      {msg.timestamp instanceof Date
                        ? msg.timestamp.toLocaleTimeString("ja-JP")
                        : new Date(msg.timestamp).toLocaleTimeString("ja-JP")}
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onToggleVisibility(msg.id || "")}
                    className="opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    ✕
                  </Button>
                </div>
              </div>
            ))
          )}
          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>
    </div>
  )
}
