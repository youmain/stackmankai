import { useState, useMemo } from 'react'
import { resetPlayerStatistics } from '@/lib/player-management'

interface UsePlayerStatisticsReturn {
  isResetting: boolean
  handleResetStatistics: (playerId: string, playerName: string) => Promise<void>
}

/**
 * プレイヤーの統計データをリセットするカスタムフック
 * 
 * 機能:
 * - 統計データ（勝敗、獲得ポイント、ランク等）をリセット
 * - 貯スタックは保持
 * - ローディング状態を管理
 */
export function usePlayerStatistics(): UsePlayerStatisticsReturn {
  const [isResetting, setIsResetting] = useState(false)

  const handleResetStatistics = async (playerId: string, playerName: string) => {
    setIsResetting(true)
    try {
      await resetPlayerStatistics(playerId, playerName)
      console.log('[v0] 統計リセット完了 - データ更新中')

      // 成功メッセージを表示
      alert('統計データをリセットしました。貯スタックは保持されています。')

      // データの再読み込みを促すため、少し待ってからページをリフレッシュ
      setTimeout(() => {
        window.location.reload()
      }, 1000)
    } catch (error) {
      console.error('[v0] 統計リセットエラー:', error)
      alert('統計リセットに失敗しました。もう一度お試しください。')
      throw error
    } finally {
      setIsResetting(false)
    }
  }

  return {
    isResetting,
    handleResetStatistics,
  }
}
