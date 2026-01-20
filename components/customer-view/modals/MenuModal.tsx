"use client"

import { memo } from 'react'
import { useRouter } from 'next/navigation'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Separator } from '@/components/ui/separator'
import { Button } from '@/components/ui/button'
import {
  Home,
  Trophy,
  BarChart3,
  RefreshCw,
  User,
  MessageCircle,
  Gift,
  FileText,
  History,
  AlertTriangle,
  LogOut,
  AlertCircle,
} from 'lucide-react'
import type { CustomerAccount, Player } from '@/types'

interface MenuModalProps {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  customerAccount: CustomerAccount | null
  linkedPlayer: Player | null
  onViewModeChange: (mode: 'main' | 'posts' | 'my-posts' | 'post-detail' | 'ai-players' | 'chat') => void
  onDetailedDataClick: () => void
  onPlayerIdChange: () => void
  onResetStatistics: () => void
  onPlayerLinkClick: () => void
  onAccountCancellation: () => void
  onLogout: () => void
  getDisplayName: (player: Player) => string
}

const MenuModal = memo(function MenuModal({
  const { error } = useAuth()
  isOpen,
  onOpenChange,
  customerAccount,
  linkedPlayer,
  onViewModeChange,
  onDetailedDataClick,
  onPlayerIdChange,
  onResetStatistics,
  onPlayerLinkClick,
  onAccountCancellation,
  onLogout,
  getDisplayName,
}: MenuModalProps) {
  console.log("[MenuModal] Rendered. isOpen:", isOpen, "customerAccount:", !!customerAccount, "linkedPlayer:", !!linkedPlayer);
  console.log("[MenuModal] customerAccount details:", customerAccount ? {
    id: customerAccount.id,
    playerId: customerAccount.playerId,
    playerName: customerAccount.playerName,
    storeName: customerAccount.storeName,
    storeId: customerAccount.storeId,
  } : "NULL");
  
  const router = useRouter()

  const handleClose = () => {
    onOpenChange(false)
  }

  const handleViewModeChange = (mode: 'main' | 'posts' | 'my-posts' | 'post-detail' | 'ai-players' | 'chat') => {
    try {
      console.log("[MenuModal] handleViewModeChange called with mode:", mode);
      onViewModeChange(mode)
      handleClose()
    } catch (error) {
      console.error("[MenuModal] Error in handleViewModeChange:", error);
    }
  }

  const handleDetailedData = () => {
    try {
      onDetailedDataClick()
      handleClose()
    } catch (error) {
      console.error("[MenuModal] Error in handleDetailedData:", error);
    }
  }

  const handleDashboard = () => {
    try {
      handleViewModeChange('main')
      // ページ内のランキングセクションにスクロール
      const rankingSection = document.querySelector('[data-ranking-section]')
      if (rankingSection) {
        rankingSection.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }
    } catch (error) {
      console.error("[MenuModal] Error in handleDashboard:", error);
    }
  }

  const handlePokerRanking = () => {
    try {
      handleViewModeChange('main')
      // ページ内のランキングセクションにスクロール
      const rankingSection = document.querySelector('[data-ranking-section]')
      if (rankingSection) {
        rankingSection.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }
    } catch (error) {
      console.error("[MenuModal] Error in handlePokerRanking:", error);
    }
  }

  const handleResetClick = () => {
    try {
      onResetStatistics()
      handleClose()
    } catch (error) {
      console.error("[MenuModal] Error in handleResetClick:", error);
    }
  }

  const handlePlayerIdChangeClick = () => {
    try {
      onPlayerIdChange()
      handleClose()
    } catch (error) {
      console.error("[MenuModal] Error in handlePlayerIdChangeClick:", error);
    }
  }

  const handlePlayerLinking = () => {
    try {
      onPlayerLinkClick()
      handleClose()
    } catch (error) {
      console.error("[MenuModal] Error in handlePlayerLinking:", error);
    }
  }

  const handleStackManHandPurchase = () => {
    try {
      router.push('/stack-man-hand/purchase')
      handleClose()
    } catch (error) {
      console.error("[MenuModal] Error in handleStackManHandPurchase:", error);
    }
  }

  const handleMyPosts = () => {
    try {
      handleViewModeChange('my-posts')
    } catch (error) {
      console.error("[MenuModal] Error in handleMyPosts:", error);
    }
  }

  const handleHandRecords = () => {
    try {
      handleViewModeChange('posts')
    } catch (error) {
      console.error("[MenuModal] Error in handleHandRecords:", error);
    }
  }

  const handleAccountCancellationClick = () => {
    try {
      onAccountCancellation()
      handleClose()
    } catch (error) {
      console.error("[MenuModal] Error in handleAccountCancellationClick:", error);
    }
  }

  const handleLogoutClick = () => {
    try {
      onLogout()
      handleClose()
    } catch (error) {
      console.error("[MenuModal] Error in handleLogoutClick:", error);
    }
  }

  return (
    <Sheet open={isOpen} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-80">
        <SheetHeader>
          <SheetTitle className="text-lg">メニュー</SheetTitle>
        </SheetHeader>
        <div className="mt-6 space-y-3">
          {/* プレイヤー情報セクション */}
          {customerAccount ? (
            <div className="border-b pb-4 mb-4">
              <h3 className="text-sm font-medium text-gray-500 mb-3">プレイヤー情報</h3>

              <div className="mb-3 p-2 bg-gray-50 rounded text-xs">
                <p>顧客ID: {customerAccount.id}</p>
                <p>プレイヤーID: {customerAccount.playerId || '未設定'}</p>
                <p>プレイヤー名: {customerAccount.playerName || '未設定'}</p>
                <p>ホーム店舗: {customerAccount.storeName || '未設定'}</p>
                <p>紐づけ状態: {linkedPlayer ? '成功' : '失敗'}</p>
                {linkedPlayer && <p>紐づけプレイヤー: {getDisplayName(linkedPlayer)}</p>}
              </div>

              {/* プレイヤー紐付け状態に基づくメニュー */}
              {linkedPlayer ? (
                <div className="space-y-2 mb-4">
                  <h4 className="text-sm font-semibold text-gray-600 pt-2">プレイヤー向け機能</h4>
                  {/* 1. ダッシュボード */}
                  <Button
                    variant="ghost"
                    className="w-full justify-start text-base py-3"
                    onClick={handleDashboard}
                  >
                    <Home className="h-5 w-5 mr-3" />
                    ダッシュボード
                  </Button>

                  {/* 2. ポーカーランキング */}
                  <Button
                    variant="ghost"
                    className="w-full justify-start text-base py-3"
                    onClick={handlePokerRanking}
                  >
                    <Trophy className="h-5 w-5 mr-3" />
                    ポーカーランキング
                  </Button>

                  {/* 3. 詳細データを見る */}
                  <Button
                    variant="ghost"
                    className="w-full justify-start text-base py-3"
                    onClick={handleDetailedData}
                  >
                    <BarChart3 className="h-5 w-5 mr-3" />
                    詳細データを見る
                  </Button>

                  {/* 4. 統計データをリセット */}
                  <Button
                    variant="ghost"
                    className="w-full justify-start text-base py-3 text-orange-600 hover:text-orange-700 hover:bg-orange-50"
                    onClick={handleResetClick}
                  >
                    <RefreshCw className="h-5 w-5 mr-3" />
                    統計データをリセット
                  </Button>

                  {/* 5. プレイヤーID変更 */}
                  <Button
                    variant="ghost"
                    className="w-full justify-start text-base py-3"
                    onClick={handlePlayerIdChangeClick}
                  >
                    <User className="h-5 w-5 mr-3" />
                    プレイヤーID変更
                  </Button>


                  {/* 6. チャット */}
                  <Button
                    variant="ghost"
                    className="w-full justify-start text-base py-3"
                    onClick={() => handleViewModeChange('chat')}
                  >
                    <MessageCircle className="h-5 w-5 mr-3" />
                    チャット
                  </Button>

                  {/* 7. Stack Man Hand購入 */}
                  <Button
                    variant="ghost"
                    className="w-full justify-start text-base py-3"
                    onClick={handleStackManHandPurchase}
                  >
                    <Gift className="h-5 w-5 mr-3" />
                    Stack Man Hand購入
                  </Button>

                  {/* 8. ハンド記録を見る */}
                  <Button
                    variant="ghost"
                    className="w-full justify-start text-base py-3"
                    onClick={handleHandRecords}
                  >
                    <FileText className="h-5 w-5 mr-3" />
                    ハンド記録を見る
                  </Button>

                  {/* 9. 自分の投稿履歴 */}
                  <Button
                    variant="ghost"
                    className="w-full justify-start text-base py-3"
                    onClick={handleMyPosts}
                  >
                    <History className="h-5 w-5 mr-3" />
                    自分の投稿履歴
                  </Button>

                  {/* 10. スタックマン解約 */}
                  <Button
                    variant="ghost"
                    className="w-full justify-start text-base py-3 text-red-600 hover:text-red-700 hover:bg-red-50"
                    onClick={handleAccountCancellationClick}
                  >
                    <AlertTriangle className="mr-2 h-4 w-4" />
                    スタックマン解約
                  </Button>

                  {/* 11. ログアウト */}
                  <Button
                    variant="outline"
                    className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50 bg-transparent"
                    onClick={handleLogoutClick}
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    ログアウト
                  </Button>

                </div>
              ) : (
                <div className="space-y-2 mb-4">
                  <Alert className="border-orange-200 bg-orange-50">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription className="text-orange-800 text-sm">
                      プレイヤー情報が紐づけられていません。
                      {customerAccount && customerAccount.playerId && 'プレイヤーが見つからない可能性があります。'}
                    </AlertDescription>
                  </Alert>
                  <Button
                    variant="outline"
                    className="w-full justify-start text-base py-3 bg-transparent"
                    onClick={handlePlayerLinking}
                  >
                    <User className="h-5 w-5 mr-3" />
                    プレイヤー情報を紐づける
                  </Button>
                </div>
              )}

              <Separator className="my-4" />

              {/* 共通メニュー (紐付け状態に関わらず表示) */}
              <div className="space-y-2">
                <h4 className="text-sm font-semibold text-gray-600 pt-2">共通機能</h4>
                {/* 6. チャット */}
                <Button
                  variant="ghost"
                  className="w-full justify-start text-base py-3"
                  onClick={() => handleViewModeChange('chat')}
                >
                  <MessageCircle className="h-5 w-5 mr-3" />
                  チャット
                </Button>

                {/* 7. Stack Man Hand購入 */}
                <Button
                  variant="ghost"
                  className="w-full justify-start text-base py-3"
                  onClick={handleStackManHandPurchase}
                >
                  <Gift className="h-5 w-5 mr-3" />
                  Stack Man Hand購入
                </Button>

                {/* 8. ハンド記録を見る */}
                <Button
                  variant="ghost"
                  className="w-full justify-start text-base py-3"
                  onClick={handleHandRecords}
                >
                  <FileText className="h-5 w-5 mr-3" />
                  ハンド記録を見る
                </Button>

                {/* 9. 自分の投稿履歴 */}
                <Button
                  variant="ghost"
                  className="w-full justify-start text-base py-3"
                  onClick={handleMyPosts}
                >
                  <History className="h-5 w-5 mr-3" />
                  自分の投稿履歴
                </Button>

                {/* 10. スタックマン解約 */}
                <Button
                  variant="ghost"
                  className="w-full justify-start text-base py-3 text-red-600 hover:text-red-700 hover:bg-red-50"
                  onClick={handleAccountCancellationClick}
                >
                  <AlertTriangle className="mr-2 h-4 w-4" />
                  スタックマン解約
                </Button>

                {/* 11. ログアウト */}
                <Button
                  variant="outline"
                  className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50 bg-transparent"
                  onClick={handleLogoutClick}
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  ログアウト
                </Button>
              </div>
            </div>
          ) : (
	            <div className="p-4 text-center">
	              <p className="text-lg font-semibold text-red-600">エラーが発生しました</p>
	              <p className="text-sm text-gray-500 mt-2">
	                {error ? error : "顧客情報が見つかりません。再度ログインしてください。"}
	              </p>
	              <p className="text-xs text-gray-400 mt-2">
	                ※ Firebase Security Rules の設定が不十分な可能性があります。
	              </p>
	              <Button onClick={handleLogoutClick} className="mt-4 w-full">
	                <LogOut className="mr-2 h-4 w-4" />
	                ログアウト
	              </Button>
	            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
})

export default MenuModal
