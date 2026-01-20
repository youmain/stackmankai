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
import { useAuth } from '@/contexts/auth-context'

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
  const { error } = useAuth()
  const router = useRouter()

  const handleClose = () => {
    onOpenChange(false)
  }

  const handleViewModeChange = (mode: 'main' | 'posts' | 'my-posts' | 'post-detail' | 'ai-players' | 'chat') => {
    onViewModeChange(mode)
    handleClose()
  }

  const handleStackManHandPurchase = () => {
    router.push('/stack-man-hand/purchase')
    handleClose()
  }

  return (
    <Sheet open={isOpen} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-80 overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="text-lg">メニュー</SheetTitle>
        </SheetHeader>
        <div className="mt-6 space-y-3">
          {customerAccount ? (
            <div className="space-y-4">
              {/* プレイヤー情報セクション */}
              <div className="border-b pb-4">
                <h3 className="text-sm font-medium text-gray-500 mb-3">プレイヤー情報</h3>
                <div className="mb-3 p-2 bg-gray-50 rounded text-xs space-y-1">
                  <p><span className="font-semibold">顧客ID:</span> {customerAccount.id}</p>
                  <p><span className="font-semibold">プレイヤーID:</span> {customerAccount.playerId || '未設定'}</p>
                  <p><span className="font-semibold">プレイヤー名:</span> {customerAccount.playerName || '未設定'}</p>
                  <p><span className="font-semibold">ホーム店舗:</span> {customerAccount.storeName || '未設定'}</p>
                  <p><span className="font-semibold">紐づけ状態:</span> {linkedPlayer ? '成功' : '未紐付け'}</p>
                </div>

                {!linkedPlayer && (
                  <Button
                    variant="outline"
                    className="w-full justify-start text-sm py-2 bg-transparent border-orange-200 text-orange-700 hover:bg-orange-50"
                    onClick={() => { onPlayerLinkClick(); handleClose(); }}
                  >
                    <User className="h-4 w-4 mr-2" />
                    プレイヤー情報を紐づける
                  </Button>
                )}
              </div>

              {/* メインメニュー */}
              <div className="space-y-1">
                <Button
                  variant="ghost"
                  className="w-full justify-start text-base py-3"
                  onClick={() => handleViewModeChange('main')}
                >
                  <Home className="h-5 w-5 mr-3" />
                  ダッシュボード
                </Button>

                <Button
                  variant="ghost"
                  className="w-full justify-start text-base py-3"
                  onClick={() => {
                    handleViewModeChange('main');
                    setTimeout(() => {
                      const rankingSection = document.querySelector('[data-ranking-section]');
                      if (rankingSection) rankingSection.scrollIntoView({ behavior: 'smooth' });
                    }, 100);
                  }}
                >
                  <Trophy className="h-5 w-5 mr-3" />
                  ポーカーランキング
                </Button>

                {linkedPlayer && (
                  <>
                    <Button
                      variant="ghost"
                      className="w-full justify-start text-base py-3"
                      onClick={() => { onDetailedDataClick(); handleClose(); }}
                    >
                      <BarChart3 className="h-5 w-5 mr-3" />
                      詳細データを見る
                    </Button>

                    <Button
                      variant="ghost"
                      className="w-full justify-start text-base py-3 text-orange-600 hover:text-orange-700 hover:bg-orange-50"
                      onClick={() => { onResetStatistics(); handleClose(); }}
                    >
                      <RefreshCw className="h-5 w-5 mr-3" />
                      統計データをリセット
                    </Button>

                    <Button
                      variant="ghost"
                      className="w-full justify-start text-base py-3"
                      onClick={() => { onPlayerIdChange(); handleClose(); }}
                    >
                      <User className="h-5 w-5 mr-3" />
                      プレイヤーID変更
                    </Button>
                  </>
                )}

                <Separator className="my-2" />

                <Button
                  variant="ghost"
                  className="w-full justify-start text-base py-3"
                  onClick={() => handleViewModeChange('chat')}
                >
                  <MessageCircle className="h-5 w-5 mr-3" />
                  チャットルーム
                </Button>

                <Button
                  variant="ghost"
                  className="w-full justify-start text-base py-3"
                  onClick={handleStackManHandPurchase}
                >
                  <Gift className="h-5 w-5 mr-3" />
                  Stack Man Hand購入
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

                <Separator className="my-2" />

                <Button
                  variant="ghost"
                  className="w-full justify-start text-base py-3 text-red-600 hover:text-red-700 hover:bg-red-50"
                  onClick={() => { onAccountCancellation(); handleClose(); }}
                >
                  <AlertTriangle className="h-5 w-5 mr-3" />
                  スタックマン解約
                </Button>

                <Button
                  variant="outline"
                  className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50 bg-transparent mt-4"
                  onClick={() => { onLogout(); handleClose(); }}
                >
                  <LogOut className="h-5 w-5 mr-3" />
                  ログアウト
                </Button>
              </div>
            </div>
          ) : (
            <div className="p-4 text-center space-y-4">
              <AlertCircle className="h-12 w-12 text-red-500 mx-auto" />
              <div>
                <p className="text-lg font-semibold text-red-600">エラーが発生しました</p>
                <p className="text-sm text-gray-500 mt-1">
                  {error || "顧客情報が見つかりません。再度ログインしてください。"}
                </p>
              </div>
              <Button onClick={() => { onLogout(); handleClose(); }} className="w-full">
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
