'use client'

import React from 'react'
import { Button } from '@/components/ui/button'
import { AIPlayersInfo } from '@/components/ai-players-info'

interface AIPlayersViewProps {
  onViewModeChange: (mode: string) => void
}

export const AIPlayersView = React.memo<React.FC<AIPlayersViewProps>>(({ onViewModeChange }) => {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-purple-800">AIポーカープレイヤー紹介</h2>
        <Button variant="outline" onClick={() => onViewModeChange('main')}>
          戻る
        </Button>
      </div>
      <AIPlayersInfo />
    </div>
  )
})
