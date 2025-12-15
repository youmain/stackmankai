import { useState, useEffect } from 'react'
import { ViewMode } from '@/types/poker'

const VIEW_MODE_STORAGE_KEY = 'poker-view-mode'

export function useViewMode() {
  const [viewMode, setViewModeState] = useState<ViewMode>('poker')

  // ローカルストレージから初期値を読み込み
  useEffect(() => {
    const saved = localStorage.getItem(VIEW_MODE_STORAGE_KEY)
    if (saved === 'poker' || saved === 'chat' || saved === 'spectate') {
      setViewModeState(saved)
    }
  }, [])

  // モード変更時にローカルストレージに保存
  const setViewMode = (mode: ViewMode) => {
    setViewModeState(mode)
    localStorage.setItem(VIEW_MODE_STORAGE_KEY, mode)
  }

  return { viewMode, setViewMode }
}
