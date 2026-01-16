import { useState, useMemo, useEffect } from 'react'

interface PokerGameState {
  gameId: string | null
  isActive: boolean
  playerName: string | null
}

interface UsePokerGameReturn {
  gameState: PokerGameState
  setGameId: (gameId: string | null) => void
  setIsActive: (isActive: boolean) => void
  setPlayerName: (playerName: string | null) => void
  resetGameState: () => void
}

/**
 * ポーカーゲーム状態を管理するカスタムフック
 * 
 * 機能:
 * - ゲームID の管理（LocalStorage に保存）
 * - ゲーム状態（アクティブ/非アクティブ）の管理
 * - プレイヤー名の管理
 * - ゲーム状態のリセット
 */
export function usePokerGame(storeId?: string): UsePokerGameReturn {
  const [gameState, setGameState] = useState<PokerGameState>({
    gameId: null,
    isActive: false,
    playerName: null,
  })

  // LocalStorage からゲームID を復元
  useEffect(() => {
    if (!storeId) return

    const storageKey = `pokerGameId_${storeId}`
    const savedGameId = localStorage.getItem(storageKey)

    if (savedGameId) {
      setGameState((prev) => ({
        ...prev,
        gameId: savedGameId,
      }))
    }
  }, [storeId])

  const setGameId = (gameId: string | null) => {
    setGameState((prev) => ({
      ...prev,
      gameId,
    }))

    if (storeId) {
      const storageKey = `pokerGameId_${storeId}`
      if (gameId) {
        localStorage.setItem(storageKey, gameId)
      } else {
        localStorage.removeItem(storageKey)
      }
    }
  }

  const setIsActive = (isActive: boolean) => {
    setGameState((prev) => ({
      ...prev,
      isActive,
    }))
  }

  const setPlayerName = (playerName: string | null) => {
    setGameState((prev) => ({
      ...prev,
      playerName,
    }))
  }

  const resetGameState = () => {
    setGameState({
      gameId: null,
      isActive: false,
      playerName: null,
    })

    if (storeId) {
      const storageKey = `pokerGameId_${storeId}`
      localStorage.removeItem(storageKey)
    }
  }

  return {
    gameState,
    setGameId,
    setIsActive,
    setPlayerName,
    resetGameState,
  }
}
