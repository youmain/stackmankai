'use client'

import React from 'react'
import { Button } from '@/components/ui/button'
import { ChatRoomDualMode } from '@/components/chat/chat-room-dual-mode'

interface ChatViewProps {
  linkedPlayer: any
  customerAccount: any
  getDisplayName: (player: any) => string
  onViewModeChange: (mode: any) => void
}

export const ChatView: React.FC<ChatViewProps> = React.memo(({ 
  onViewModeChange, 
  linkedPlayer, 
  customerAccount, 
  getDisplayName 
}) => {
  const handleModeChange = React.useCallback((mode: any) => {
    console.log('ChatView mode change:', mode);
    if (typeof onViewModeChange === 'function') {
      onViewModeChange(mode);
    }
  }, [onViewModeChange]);

  return (
    <div className="space-y-4 h-full flex flex-col">
      <div className="flex items-center justify-between px-4 pt-2">
        <h2 className="text-2xl font-bold text-purple-800">チャット & ポーカー</h2>
        <Button variant="outline" onClick={() => handleModeChange('main')}>
          戻る
        </Button>
      </div>
      <div className="flex-1 overflow-hidden">
        <ChatRoomDualMode 
          onViewModeChange={(mode) => handleModeChange(mode)}
        />
      </div>
    </div>
  )
})

ChatView.displayName = 'ChatView'
