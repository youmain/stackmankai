import { useState, useMemo } from 'react'
import { cancelPlayerAccount } from '@/lib/player-management'
import { useAuth } from '@/hooks/useAuth'

interface UseAccountManagementReturn {
  isCancelling: boolean
  handleCancelAccount: (playerId: string) => Promise<void>
}

/**
 * アカウント管理機能を提供するカスタムフック
 * 
 * 機能:
 * - アカウント解約処理
 * - CP関連データの削除
 * - 認証状態のリセット
 * - ローディング状態を管理
 */
export function useAccountManagement(): UseAccountManagementReturn {
  const [isCancelling, setIsCancelling] = useState(false)
  const { signOut } = useAuth()

  const handleCancelAccount = async (playerId: string) => {
    setIsCancelling(true)
    try {
      await cancelPlayerAccount(playerId)
      alert('スタックマンを解約しました。CP関連データが削除されました。')
      
      // 認証状態をリセット
      signOut()
      
      // ホームページにリダイレクト
      window.location.href = '/'
    } catch (error) {
      console.error('Account cancellation error:', error)
      alert('解約処理に失敗しました。')
      throw error
    } finally {
      setIsCancelling(false)
    }
  }

  return {
    isCancelling,
    handleCancelAccount,
  }
}
