'use client'

import { useCallback, useMemo } from 'react'
import { resetPlayerStatistics, updateCustomerAccount, cancelPlayerAccount } from '@/lib/firestore'
import type { Player, CustomerAccount } from '@/types'

interface UseModalHandlersProps {
  customerAccount: CustomerAccount | null
  linkedPlayer: Player | null
  players: Player[]
  playerIdInput: string
  skipLinkingAfterSuccess: boolean
  isLinking: boolean
  isResetting: boolean
  isCancelling: boolean
  
  setCustomerAccount: (account: CustomerAccount | null) => void
  setSelectedPlayer: (player: Player | null) => void
  setPlayerIdInput: (input: string) => void
  setLinkingError: (error: string) => void
  setShowConfirmation: (show: boolean) => void
  setShowPlayerLinkModal: (show: boolean) => void
  setShowLinkingSuccessModal: (show: boolean) => void
  setIsLinking: (loading: boolean) => void
  setIsResetting: (resetting: boolean) => void
  setIsCancelling: (cancelling: boolean) => void
  setIsResetConfirmOpen: (open: boolean) => void
  setIsCancelConfirmOpen: (open: boolean) => void
  setSelectedPlayerForDetailedData: (data: any) => void
  setIsDetailedDataModalOpen: (open: boolean) => void
  setSelectedPostId: (id: string | null) => void
  setViewMode: (mode: any) => void
  setSkipLinkingAfterSuccess: (skip: boolean) => void
  signOut: () => void
  getDisplayName: (player: Player) => string
}

export function useModalHandlers({
  customerAccount,
  linkedPlayer,
  players,
  playerIdInput,
  skipLinkingAfterSuccess,
  isLinking,
  isResetting,
  isCancelling,
  
  setCustomerAccount,
  setSelectedPlayer,
  setPlayerIdInput,
  setLinkingError,
  setShowConfirmation,
  setShowPlayerLinkModal,
  setShowLinkingSuccessModal,
  setIsLinking,
  setIsResetting,
  setIsCancelling,
  setIsResetConfirmOpen,
  setIsCancelConfirmOpen,
  setSelectedPlayerForDetailedData,
  setIsDetailedDataModalOpen,
  setSelectedPostId,
  setViewMode,
  setSkipLinkingAfterSuccess,
  signOut,
  getDisplayName,
}: UseModalHandlersProps) {
  // プレイヤーID検索
  const handlePlayerIdLink = useCallback(async () => {
    if (!playerIdInput.trim()) {
      setLinkingError('プレイヤーIDまたは名前を入力してください')
      return
    }

    console.log('[v0] プレイヤー検索開始:', playerIdInput.trim())
    console.log('[v0] 利用可能なプレイヤー数:', players.length)

    const searchTerm = playerIdInput.trim().toLowerCase()

    const targetPlayer = players.find((player) => {
      const checks = [
        // 1. 完全一致検索
        player.uniqueId === playerIdInput.trim(),
        player.id === playerIdInput.trim(),
        player.name === playerIdInput.trim(),
        player.pokerName === playerIdInput.trim(),

        // 2. 大文字小文字を無視した検索
        player.name?.toLowerCase() === searchTerm,
        player.pokerName?.toLowerCase() === searchTerm,
        player.uniqueId?.toLowerCase() === searchTerm,

        // 3. 部分一致検索（より柔軟）
        player.name?.toLowerCase().includes(searchTerm),
        player.pokerName?.toLowerCase().includes(searchTerm),

        // 4. ひらがな・カタカナの変換を考慮した検索
        player.name?.includes(playerIdInput.trim()),
        player.pokerName?.includes(playerIdInput.trim()),

        // 5. 数値IDの検索（uniqueIdが数値の場合）
        player.uniqueId && playerIdInput.trim().match(/^\d+$/) && player.uniqueId.includes(playerIdInput.trim()),
      ]

      const matchFound = checks.some((check) => check)

      if (matchFound) {
        console.log('[v0] プレイヤー検索成功:', {
          searchTerm: playerIdInput.trim(),
          foundPlayer: {
            id: player.id,
            uniqueId: player.uniqueId,
            name: player.name,
            pokerName: player.pokerName,
          },
        })
      }

      return matchFound
    })

    if (!targetPlayer) {
      console.log('[v0] プレイヤー検索失敗 - 利用可能なプレイヤー例:')
      const availableExamples = players.slice(0, 10).map((player, index) => {
        const info = `${index + 1}. 名前: ${player.name || '未設定'}, ポーカーネーム: ${player.pokerName || '未設定'}, ID: ${player.uniqueId || player.id}`
        console.log(`[v0] ${info}`)
        return info
      })

      setLinkingError(`プレイヤー「${playerIdInput.trim()}」が見つかりません。

以下を確認してください：
• プレイヤー名の正確な入力（例: りゅうさん、あかねちゃん）
• ポーカーネームでの検索
• プレイヤーIDでの検索

利用可能なプレイヤー例：
${availableExamples.slice(0, 5).join('\n')}

※ 他にも多数のプレイヤーが登録されています。正確な名前を店舗で確認してください。`)
      return
    }

    setSelectedPlayer(targetPlayer)
    setShowConfirmation(true)
    setLinkingError('')
  }, [playerIdInput, players, setLinkingError, setSelectedPlayer, setShowConfirmation])

  // プレイヤー紐づけ確認
  const confirmPlayerLink = useCallback(
    async (selectedPlayer: Player | null) => {
      if (!selectedPlayer || !customerAccount) return

      setIsLinking(true)
      setLinkingError('')

      try {
        const playerIdToSave = selectedPlayer.uniqueId || selectedPlayer.id

        await updateCustomerAccount(customerAccount.id, {
          playerId: playerIdToSave,
          playerName: selectedPlayer.pokerName || selectedPlayer.name,
          linkedAt: new Date(),
        })

        // Update local state
        setCustomerAccount({
          ...customerAccount,
          playerId: playerIdToSave,
          playerName: selectedPlayer.pokerName || selectedPlayer.name,
          linkedAt: new Date(),
        })

        setPlayerIdInput('')
        setShowConfirmation(false)
        setSelectedPlayer(null)
        setShowPlayerLinkModal(false)

        if (!skipLinkingAfterSuccess) {
          setShowLinkingSuccessModal(true)
        }
      } catch (error) {
        console.error('[v0] プレイヤーID紐づけエラー:', error)
        setLinkingError('紐づけに失敗しました。もう一度お試しください。')
      } finally {
        setIsLinking(false)
      }
    },
    [customerAccount, skipLinkingAfterSuccess, setIsLinking, setLinkingError, setCustomerAccount, setPlayerIdInput, setShowConfirmation, setSelectedPlayer, setShowPlayerLinkModal, setShowLinkingSuccessModal],
  )

  // 統計リセット
  const handleStatisticsReset = useCallback(async () => {
    if (!customerAccount?.playerId || !linkedPlayer) return

    setIsResetting(true)
    try {
      await resetPlayerStatistics(linkedPlayer.id, getDisplayName(linkedPlayer))
      setIsResetConfirmOpen(false)

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
    } finally {
      setIsResetting(false)
    }
  }, [customerAccount?.playerId, linkedPlayer, setIsResetting, setIsResetConfirmOpen, getDisplayName])

  // 詳細データ表示
  const handleDetailedDataClick = useCallback(() => {
    console.log('[v0] handleDetailedDataClick called')
    console.log('[v0] customerAccount?.playerId:', customerAccount?.playerId)
    console.log('[v0] linkedPlayer:', linkedPlayer)

    if (customerAccount?.playerId && linkedPlayer) {
      console.log('[v0] Conditions met, setting modal data')
      try {
        const displayName = getDisplayName(linkedPlayer)
        console.log('[v0] Display name:', displayName)

        setSelectedPlayerForDetailedData({
          playerId: customerAccount.playerId,
          playerName: displayName,
          player: linkedPlayer,
        })
        console.log('[v0] Modal data set, opening modal')
        setIsDetailedDataModalOpen(true)
        console.log('[v0] Modal opened successfully')
      } catch (error) {
        console.error('[v0] Error in handleDetailedDataClick:', error)
      }
    } else {
      console.log('[v0] Conditions not met - playerId:', customerAccount?.playerId, 'linkedPlayer:', !!linkedPlayer)
    }
  }, [customerAccount?.playerId, linkedPlayer, setSelectedPlayerForDetailedData, setIsDetailedDataModalOpen, getDisplayName])

  // プレイヤーID変更
  const handlePlayerIdChange = useCallback(() => {
    if (!customerAccount) return
    setCustomerAccount({ ...customerAccount, playerId: undefined, playerName: undefined })
  }, [customerAccount, setCustomerAccount])

  // プレイヤー紐づけクリック
  const handlePlayerLinkClick = useCallback(() => {
    console.log('[v0] プレイヤー紐づけボタンクリック')
    setShowPlayerLinkModal(true)
  }, [setShowPlayerLinkModal])

  // スキップ設定変更
  const handleSkipLinkingAfterSuccessChange = useCallback((checked: boolean) => {
    setSkipLinkingAfterSuccess(checked)
    if (checked) {
      localStorage.setItem('skipPlayerLinkingSuccess', 'true')
    } else {
      localStorage.removeItem('skipPlayerLinkingSuccess')
    }
  }, [setSkipLinkingAfterSuccess])

  // ポスト表示
  const handlePostClick = useCallback(
    (postId: string) => {
      setSelectedPostId(postId)
      setViewMode('post-detail')
    },
    [setSelectedPostId, setViewMode],
  )

  // 詳細から戻る
  const handleBackFromPostDetail = useCallback(() => {
    setSelectedPostId(null)
    setViewMode('posts')
  }, [setSelectedPostId, setViewMode])

  // アカウント解約
  const handleAccountCancellation = useCallback(async () => {
    if (!linkedPlayer?.id) return
    setIsCancelling(true)
    try {
      await cancelPlayerAccount(linkedPlayer.id)
      alert('スタックマンを解約しました。CP関連データが削除されました。')
      setCustomerAccount(null)
      signOut()
      window.location.href = '/'
    } catch (error) {
      console.error('Account cancellation error:', error)
      alert('解約処理に失敗しました。')
    } finally {
      setIsCancelling(false)
      setIsCancelConfirmOpen(false)
    }
  }, [linkedPlayer?.id, setIsCancelling, setCustomerAccount, signOut, setIsCancelConfirmOpen])

  return useMemo(
    () => ({
      handlePlayerIdLink,
      confirmPlayerLink,
      handleStatisticsReset,
      handleDetailedDataClick,
      handlePlayerIdChange,
      handlePlayerLinkClick,
      handleSkipLinkingAfterSuccessChange,
      handlePostClick,
      handleBackFromPostDetail,
      handleAccountCancellation,
    }),
    [
      handlePlayerIdLink,
      confirmPlayerLink,
      handleStatisticsReset,
      handleDetailedDataClick,
      handlePlayerIdChange,
      handlePlayerLinkClick,
      handleSkipLinkingAfterSuccessChange,
      handlePostClick,
      handleBackFromPostDetail,
      handleAccountCancellation,
    ],
  )
}
