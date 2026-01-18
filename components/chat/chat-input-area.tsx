"use client"

import { useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Send, AlertCircle } from "lucide-react"

interface ChatInputAreaProps {
  newMessage: string
  onMessageChange: (message: string) => void
  onSendMessage: (e: React.FormEvent) => void
  isSending: boolean
  error: string
  onErrorClear: () => void
}

export function ChatInputArea({
  newMessage,
  onMessageChange,
  onSendMessage,
  isSending,
  error,
  onErrorClear,
}: ChatInputAreaProps) {
  const inputRef = useRef<HTMLInputElement>(null)

  // エラーが表示されている場合、3秒後に自動削除
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => {
        onErrorClear()
      }, 3000)
      return () => clearTimeout(timer)
    }
  }, [error, onErrorClear])

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      onSendMessage(e as any)
    }
  }

  return (
    <div className="border-t p-4 space-y-2">
      {error && (
        <Alert className="border-red-200 bg-red-50">
          <AlertCircle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-600 text-sm">{error}</AlertDescription>
        </Alert>
      )}

      <form onSubmit={onSendMessage} className="flex gap-2">
        <Input
          ref={inputRef}
          type="text"
          placeholder="メッセージを入力..."
          value={newMessage}
          onChange={(e) => onMessageChange(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={isSending}
          className="flex-1"
        />
        <Button
          type="submit"
          disabled={isSending || !newMessage.trim()}
          className="px-4"
        >
          <Send className="w-4 h-4" />
        </Button>
      </form>

      <div className="text-xs text-gray-400">
        Enterキーで送信、Shift+Enterで改行
      </div>
    </div>
  )
}
