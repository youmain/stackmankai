import { useCallback } from "react"
import { useRouter } from "next/navigation"
import { doc, getDoc, writeBatch, collection, query, where, getDocs } from "firebase/firestore"
import { getDb } from "@/lib/firebase"
import { cache, CacheKeys } from "@/lib/cache"
import {
  updateCustomerAccount,
  resetPlayerStatistics,
  cancelPlayerAccount,
  updatePlayer,
} from "@/lib/firestore"
import type { Player, CustomerAccount, StoreSettings } from "@/types"

// 必要な状態とセッターの型定義
interface CustomerHandlersProps {
  customerAccount: CustomerAccount | null
  linkedPlayer: Player | null
  playerSearchId: string
  isPlayerLinking: boolean
  isPlayerConfirmationOpen: boolean
  isLinkingSuccessOpen: boolean
  isStatisticsResetOpen: boolean
  isAccountCancellationOpen: boolean
  selectedPlayerForDetailedData: Player | null
  isDetailedDataModalOpen: boolean
  viewMode: "main" | "posts" | "my-posts" | "post-detail" | "ai-players" | "chat"
  selectedPostId: string | null
  skipLinkingAfterSuccess: boolean
  currentRewardRate: number
  storeSettings: any // StoreRankingSettings
  players: Player[]
  
  setLinkedPlayer: (player: Player | null) => void
  setPlayerSearchId: (id: string) => void
  setIsPlayerLinking: (isLinking: boolean) => void
  setIsPlayerConfirmationOpen: (isOpen: boolean) => void
  setIsLinkingSuccessOpen: (isOpen: boolean) => void
  setIsStatisticsResetOpen: (isOpen: boolean) => void
  setIsAccountCancellationOpen: (isOpen: boolean) => void
  setSelectedPlayerForDetailedData: (player: Player | null) => void
  setIsDetailedDataModalOpen: (isOpen: boolean) => void
  setViewMode: (mode: "main" | "posts" | "my-posts" | "post-detail" | "ai-players" | "chat") => void
  setSelectedPostId: (id: string | null) => void
  setSkipLinkingAfterSuccess: (skip: boolean) => void
  setCustomerAccount: (account: CustomerAccount | null) => void
  setIsMenuOpen: (isOpen: boolean) => void
  setIsCancelling: (isCancelling: boolean) => void
  setLinkingError: (error: string | null) => void
  setOriginalPlayerData: (data: any) => void
  setShowPlayerIdForm: (show: boolean) => void
  setShowPlayerLinkModal: (show: boolean) => void
  signOut: () => void
  playerId: string | null
}

export const useCustomerHandlers = (props: CustomerHandlersProps) => {
  const router = useRouter()
  const {
    customerAccount, linkedPlayer, playerSearchId, skipLinkingAfterSuccess, players,
    setCustomerAccount, setLinkedPlayer, setPlayerSearchId, setIsPlayerLinking,
    setIsPlayerConfirmationOpen, setIsLinkingSuccessOpen, setIsStatisticsResetOpen,
    setIsAccountCancellationOpen, setSelectedPlayerForDetailedData, setIsDetailedDataModalOpen,
    setViewMode, setSelectedPostId, setIsMenuOpen, setIsCancelling, setLinkingError,
    setOriginalPlayerData, setShowPlayerIdForm, setShowPlayerLinkModal, signOut,
    playerId
  } = props
  const { setSkipLinkingAfterSuccess } = props

  // 1. 支払い完了処理
  const handlePaymentCompletion = useCallback(async () => {
    if (!customerAccount) return

    try {
      // サーバーサイドのAPIを叩く、Firebaseのデータを更新するなど
      console.log("[v0] Payment completed for customer:", customerAccount.id)
      
      // 顧客アカウントのhasCompletedPaymentをtrueに更新
      await updateCustomerAccount(customerAccount.id, { hasCompletedPayment: true })
      setCustomerAccount((prev) => prev ? { ...prev, hasCompletedPayment: true } : null)

      // プレイヤー紐づけがスキップ設定されている場合は、ここで紐づけ処理をスキップ
      if (skipLinkingAfterSuccess) {
        console.log("[v0] Player linking skipped after payment completion.")
        return
      }

      // 紐づけ処理へ
      setShowPlayerLinkModal(true)
    } catch (error) {
      console.error('Error updating payment status:', error)
    }
  }, [customerAccount, skipLinkingAfterSuccess, setCustomerAccount, setShowPlayerLinkModal])

  // 2. プレイヤーID検索
  const handlePlayerIdLink = useCallback(async () => {
    if (!playerSearchId) return

    setIsPlayerLinking(true)
    setLinkingError(null)
    
    try {
      if (!players || !Array.isArray(players)) {
        console.warn("[useCustomerHandlers] players is not an array:", players)
        setLinkingError("プレイヤーデータの読み込みに失敗しました。")
        setIsPlayerLinking(false)
        return
      }
      const player = (players || []).find(p => p.uniqueId === playerSearchId)

      if (player) {
        setLinkedPlayer(player)
        setOriginalPlayerData(player) // 確認モーダル用にオリジナルデータを保存
        setIsPlayerConfirmationOpen(true)
        setShowPlayerIdForm(false)
      } else {
        setLinkingError("プレイヤーIDが見つかりませんでした。")
      }
    } catch (error) {
      console.error("Error linking player:", error)
      setLinkingError("プレイヤー紐づけ中にエラーが発生しました。")
    } finally {
      setIsPlayerLinking(false)
    }
  }, [playerSearchId, players, setLinkedPlayer, setOriginalPlayerData, setIsPlayerConfirmationOpen, setShowPlayerIdForm, setIsPlayerLinking, setLinkingError])

  // 3. プレイヤー紐づけ確認
  const confirmPlayerLink = useCallback(async () => {
    if (!customerAccount || !linkedPlayer) return

    setIsPlayerConfirmationOpen(false)
    setIsPlayerLinking(true)

    try {
      const db = getDb()
      if (!db) throw new Error("Firestore not initialized")

      const batch = writeBatch(db)
      
      // 1. CustomerAccountの更新
      const customerRef = doc(db, "customer", customerAccount.id)
      batch.update(customerRef, {
        playerId: linkedPlayer.id,
        playerName: linkedPlayer.name,
      })

      // 2. Playerの更新 (customerAccountIdを設定)
      const playerRef = doc(db, "players", linkedPlayer.id)
      batch.update(playerRef, {
        customerAccountId: customerAccount.id,
      })

      await batch.commit()

      // 3. ローカルの状態更新
      setCustomerAccount({
        ...customerAccount,
        playerId: linkedPlayer.id,
        playerName: linkedPlayer.name,
      })

      // 4. キャッシュのクリア
      cache.clear(CacheKeys.CUSTOMER_ACCOUNT)

      setIsLinkingSuccessOpen(true)
      setShowPlayerLinkModal(false) // 紐づけモーダルを閉じる
    } catch (error) {
      console.error("Error confirming player link:", error)
      setLinkingError("プレイヤー紐づけ中にエラーが発生しました。")
    } finally {
      setIsPlayerLinking(false)
    }
  }, [customerAccount, linkedPlayer, setCustomerAccount, setIsPlayerConfirmationOpen, setIsPlayerLinking, setIsLinkingSuccessOpen, setLinkingError, setShowPlayerLinkModal])

  // 4. 統計リセット
  const handleStatisticsReset = useCallback(async () => {
    if (!linkedPlayer) return

    setIsStatisticsResetOpen(false)
    
    try {
      await resetPlayerStatistics(linkedPlayer.id)
      alert("統計データがリセットされました。")
    } catch (error) {
      console.error("Error resetting statistics:", error)
      alert("統計データのリセット中にエラーが発生しました。")
    }
  }, [linkedPlayer, setIsStatisticsResetOpen])

  // 5. 詳細データ表示
  const handleDetailedDataClick = useCallback(() => {
    if (linkedPlayer) {
      setSelectedPlayerForDetailedData(linkedPlayer)
      setIsDetailedDataModalOpen(true)
    }
  }, [linkedPlayer, setSelectedPlayerForDetailedData, setIsDetailedDataModalOpen])

  // 6. プレイヤーカードクリック（現在は詳細データ表示と同じ）
  const handlePlayerClick = useCallback((playerId: string, playerName: string) => {
    // 現在は詳細データ表示と同じロジック
    handleDetailedDataClick()
  }, [handleDetailedDataClick])

  // 7. プレイヤーID変更
  const handlePlayerIdChange = useCallback(() => {
    setPlayerSearchId("")
    setLinkedPlayer(null)
    setIsPlayerConfirmationOpen(false)
    setShowPlayerIdForm(true)
    setLinkingError(null)
  }, [setPlayerSearchId, setLinkedPlayer, setIsPlayerConfirmationOpen, setShowPlayerIdForm, setLinkingError])

  // 8. プレイヤー紐づけクリック
  const handlePlayerLinkClick = useCallback(() => {
    setIsMenuOpen(false)
    setShowPlayerLinkModal(true)
    setShowPlayerIdForm(true)
    setLinkingError(null)
  }, [setIsMenuOpen, setShowPlayerLinkModal, setShowPlayerIdForm, setLinkingError])

  // 9. 紐づけ成功後のスキップ設定変更
  const handleSkipLinkingAfterSuccessChange = useCallback((checked: boolean) => {
    // ローカルストレージに保存
    localStorage.setItem("skipLinkingAfterSuccess", checked ? "true" : "false")
    setSkipLinkingAfterSuccess(checked)
  }, [setSkipLinkingAfterSuccess])

  // 10. ポスト表示
  const handlePostClick = useCallback((postId: string) => {
    setSelectedPostId(postId)
    setViewMode("detail")
  }, [setSelectedPostId, setViewMode])

  // 11. 詳細から戻る
  const handleBackFromPostDetail = useCallback(() => {
    setSelectedPostId(null)
    setViewMode("posts")
  }, [setSelectedPostId, setViewMode])

  // 12. アカウント解約
  const handleAccountCancellation = useCallback(async () => {
    if (!customerAccount) return

    setIsAccountCancellationOpen(false)
    setIsCancelling(true)

    try {
      await cancelPlayerAccount(customerAccount.id)
      alert("アカウントが解約されました。")
      // ログアウト処理など
      signOut()
      router.push("/")
    } catch (error) {
      console.error("Error cancelling account:", error)
      alert("アカウント解約中にエラーが発生しました。")
    } finally {
      setIsCancelling(false)
    }
  }, [customerAccount, setIsAccountCancellationOpen, setIsCancelling, signOut, router])

  return {
    handlePaymentCompletion,
    handlePlayerIdLink,
    confirmPlayerLink,
    handleStatisticsReset,
    handleDetailedDataClick,
    handlePlayerClick,
    handlePlayerIdChange,
    handlePlayerLinkClick,
    handleSkipLinkingAfterSuccessChange,
    handlePostClick,
    handleBackFromPostDetail,
    handleAccountCancellation,
  }
}
