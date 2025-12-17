"use client"

import { useEffect, useState } from "react"
import type { ChatMessage } from "@/types"

interface ChatToastProps {
  message: ChatMessage
  onClose: () => void
  onClick?: () => void
}

export function ChatToast({ message, onClose, onClick }: ChatToastProps) {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    // フェードイン
    setTimeout(() => setVisible(true), 10)

    // 5秒後にフェードアウト
    const timer = setTimeout(() => {
      setVisible(false)
      setTimeout(onClose, 300) // アニメーション完了後にクローズ
    }, 5000)

    return () => clearTimeout(timer)
  }, [onClose])

  return (
    <div
      className={`fixed top-4 left-1/2 transform -translate-x-1/2 z-50 transition-all duration-300 ${
        visible ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-4"
      }`}
      onClick={onClick}
      style={{ maxWidth: "90%", width: "400px" }}
    >
      <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg shadow-2xl p-3 cursor-pointer hover:shadow-xl transition-shadow">
        <div className="flex items-start gap-2">
          <div className="flex-shrink-0">
            <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
              💬
            </div>
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-bold text-sm mb-1">{message.userName}</div>
            <div className="text-sm line-clamp-2 break-words">{message.message}</div>
          </div>
          <button
            onClick={(e) => {
              e.stopPropagation()
              setVisible(false)
              setTimeout(onClose, 300)
            }}
            className="flex-shrink-0 text-white/80 hover:text-white text-lg leading-none"
          >
            ×
          </button>
        </div>
      </div>
    </div>
  )
}

interface ChatToastContainerProps {
  messages: ChatMessage[]
  onDismiss: (messageId: string) => void
  onClickToast?: () => void
}

export function ChatToastContainer({ messages, onDismiss, onClickToast }: ChatToastContainerProps) {
  return (
    <div className="fixed top-0 left-0 right-0 z-50 pointer-events-none">
      <div className="relative pointer-events-auto">
        {messages.map((message, index) => (
          <div
            key={message.id}
            style={{
              position: "absolute",
              top: `${index * 80}px`,
              left: 0,
              right: 0,
            }}
          >
            <ChatToast
              message={message}
              onClose={() => onDismiss(message.id)}
              onClick={onClickToast}
            />
          </div>
        ))}
      </div>
    </div>
  )
}
