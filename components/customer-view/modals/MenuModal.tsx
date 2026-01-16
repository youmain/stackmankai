'use client'

import { memo } from 'react'
import { useRouter } from 'next/navigation'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Separator } from '@/components/ui/separator'
import { Button } from '@/components/ui/button'
import {
  BarChart3,
  Trophy,
  FileText,
  History,
  Bot,
  RefreshCw,
  AlertCircle,
  AlertTriangle,
  Gift,
  MessageCircle,
  LogOut,
  User,
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
  const router = useRouter()

  const handleClose = () => {
    onOpenChange(false)
  }

  const handleViewModeChange = (mode: 'main' | 'posts' | 'my-posts' | 'post-detail' | 'ai-players' | 'chat') => {
    onViewModeChange(mode)
    handleClose()
  }

  const handleDetailedData = () => {
    onDetailedDataClick()
    handleClose()
  }

  const handleRankingClick = () => {
    handleViewModeChange('main')
    // ページ内のランキングセクションにスクロール
    const rankingSection = document.querySelector('[data-ranking-section]')
    if (rankingSection) {
      rankingSection.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }

  const handleResetClick = () => {
    onResetStatistics()
    handleClose()
  }

  const handlePlayerIdChangeClick = () => {
    onPlayerIdChange()
    handleClose()
  }

  const handlePlayerLinking = () => {
    onPlayerLinkClick()
    handleClose()
  }

  const handleStackManHandPurchase = () => {
    router.push('/stack-man-hand/purchase')
    handleClose()
  }

  const handleAccountCancellation = () => {
    onAccountCancellation()
    handleClose()
  }

  const handleLogout = () => {
    onLogout()
    handleClose()
  }

  return (
    <Sheet open={isOpen} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-80">
        <SheetHeader>
          <SheetTitle className="text-lg">メニュー</SheetTitle>
        </SheetHeader>
        <div className="mt-6 space-y-3">
          {customerAccount && (
            <div className="border-b pb-4 mb-4">
              <h3 className="text-sm font-medium text-gray-500 mb-3">プレイヤー情報</h3>

              <div className="mb-3 p-2 bg-gray-50 rounded text-xs">
                <p>顧客ID: {customerAccount.id}</p>
                <p>プレイヤーID: {customerAccount.playerId || '未設定'}</p>
                <p>プレイヤー名: {customerAccount.playerName || '未設定'}</p>
                <p>紐づけ状態: {linkedPlayer ? '成功' : '失敗'}</p>
                {linkedPlayer && <p>紐づけプレイヤー: {getDisplayName(linkedPlayer)}</p>}
              </div>

              <div className="space-y-2">
                {customerAccount?.playerId && linkedPlayer ? (
                  <>
                    <Button
                      variant="ghost"
                      className="w-full justify-start text-base py-3"
                      onClick={handleDetailedData}
                    >
                      <BarChart3 className="h-5 w-5 mr-3" />
                      詳細データを見る
                    </Button>
                    <Button
                      variant="ghost"
                      className="w-full justify-start text-base py-3"
                      onClick={handleRankingClick}
                    >
                      <Trophy className="h-5 w-5 mr-3" />
                      ポーカーランキング
                    </Button>
                    <Button
                      variant="ghost"
                      className="w-full justify-start text-base py-3"
                      onClick={() => handleViewModeChange('posts')}
                    >
                      <FileText className="h-5 w-5 mr-3" />
                      ハンド記録を見る
                    </Button>
                    <Button
                      variant="ghost"
                      className="w-full justify-start text-base py-3"
                      onClick={() => handleViewModeChange('my-posts')}
                    >
                      <History className="h-5 w-5 mr-3" />
                      自分の投稿履歴
                    </Button>
                    <Button
                      variant="ghost"
                      className="w-full justify-start text-base py-3"
                      onClick={() => handleViewModeChange('ai-players')}
                    >
                      <Bot className="h-5 w-5 mr-3" />
                      AIポーカープレイヤー紹介
                    </Button>
                    <Button
                      variant="ghost"
                      className="w-full justify-start text-base py-3 text-orange-600 hover:text-orange-700 hover:bg-orange-50"
                      onClick={handleResetClick}
                    >
                      <RefreshCw className="h-5 w-5 mr-3" />
                      統計データをリセット
                    </Button>
                    <Button
                      variant="ghost"
                      className="w-full justify-start text-base py-3"
                      onClick={handlePlayerIdChangeClick}
                    >
                      <RefreshCw className="h-5 w-5 mr-3" />
                      プレイヤーID変更
                    </Button>
                  </>
                ) : (
                  <div className="space-y-2">
                    <Alert className="border-orange-200 bg-orange-50">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription className="text-orange-800 text-sm">
                        プレイヤー情報が紐づけられていません。
                        {customerAccount?.playerId && 'プレイヤーが見つからない可能性があります。'}
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
              </div>
            </div>
          )}
        </div>
        <Separator />

        <Button
          variant="ghost"
          className="w-full justify-start text-base py-3"
          onClick={() => handleViewModeChange('chat')}
        >
          <MessageCircle className="h-5 w-5 mr-3" />
          チャット
        </Button>

        <Separator />

        <Button
          variant="ghost"
          className="w-full justify-start text-base py-3"
          onClick={handleStackManHandPurchase}
        >
          <Gift className="h-5 w-5 mr-3" />
          Stack Man Hand購入
        </Button>

        <Separator />

        <Button
          variant="outline"
          className="w-full justify-start text-orange-600 hover:text-orange-700 hover:bg-orange-50 bg-transparent"
          onClick={handleAccountCancellation}
        >
          <AlertTriangle className="mr-2 h-4 w-4" />
          スタックマン解約
        </Button>

        <Button
          variant="outline"
          className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50 bg-transparent"
          onClick={handleLogout}
        >
          <LogOut className="mr-2 h-4 w-4" />
          ログアウト
        </Button>
      </SheetContent>
    </Sheet>
  )
})

MenuModal.displayName = 'MenuModal'

export default MenuModal
