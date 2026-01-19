'use client'

import React from 'react'
import { Button } from '@/components/ui/button'
import { ChatRoomDualMode } from '@/components/chat/chat-room-dual-mode'

interface ChatViewProps {
  linkedPlayer: any
  customerAccount: any
  getDisplayName: (player: any) => string
  onViewModeChange?: (mode: string) => void
}

export const ChatView = React.memo<React.FC<ChatViewProps>>(({ onViewModeChange }) => {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-purple-800">チャット</h2>
        <Button variant="outline" onClick={() => onViewModeChange('main')}>
          戻る
        </Button>
      </div>
      <ChatRoomDualMode />
    </div>
  )
})
