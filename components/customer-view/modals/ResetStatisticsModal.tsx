'use client'

import { memo } from 'react'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { AlertTriangle, RefreshCw } from 'lucide-react'
import type { Player } from '@/types'

interface ResetStatisticsModalProps {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  linkedPlayer: Player | null
  isResetting: boolean
  onConfirm: () => void
}

const ResetStatisticsModal = memo(function ResetStatisticsModal({
  isOpen,
  onOpenChange,
  linkedPlayer,
  isResetting,
  onConfirm,
}: ResetStatisticsModalProps) {
  const handleCancel = () => {
    onOpenChange(false)
  }

  return (
    <Sheet open={isOpen} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-96">
        <SheetHeader>
          <SheetTitle className="text-lg text-orange-600">統計データリセット</SheetTitle>
        </SheetHeader>
        <div className="mt-6 space-y-4">
          <Alert className="border-red-200 bg-red-50">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription className="text-red-800">
              <div className="space-y-3">
                <p className="font-bold">⚠️ 重要な注意事項</p>
                <div className="space-y-2 text-sm">
                  <p>
                    • <strong>復元できません</strong> - 一度削除したデータは元に戻せません
                  </p>
                  <p>
                    • <strong>ランキングに影響しません</strong> - 全体のランキングは変更されません
                  </p>
                  <p>
                    • <strong>貯スタックは保持</strong> - 現在の貯スタック（
                    {linkedPlayer?.systemBalance?.toLocaleString() || 0}©）は削除されません
                  </p>
                </div>
              </div>
            </AlertDescription>
          </Alert>

          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="font-semibold text-gray-800 mb-2">削除される統計データ:</h3>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• 購入履歴（バイイン記録）</li>
              <li>• ゲーム履歴（勝敗記録）</li>
              <li>• 個人ランキング履歴</li>
              <li>• 月間ポイント履歴</li>
              <li>• 詳細データの統計情報</li>
            </ul>
          </div>

          <div className="bg-blue-50 p-4 rounded-lg">
            <h3 className="font-semibold text-blue-800 mb-2">保持されるデータ:</h3>
            <ul className="text-sm text-blue-600 space-y-1">
              <li>• 貯スタック（現在: {linkedPlayer?.systemBalance?.toLocaleString() || 0}©）</li>
              <li>• プレイヤー基本情報</li>
              <li>• アカウント紐づけ情報</li>
            </ul>
          </div>

          <div className="space-y-3">
            <Button
              onClick={onConfirm}
              disabled={isResetting}
              className="w-full bg-red-600 hover:bg-red-700 text-white"
            >
              {isResetting ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  リセット中...
                </>
              ) : (
                <>
                  <AlertTriangle className="h-4 w-4 mr-2" />
                  統計データをリセットする
                </>
              )}
            </Button>

            <Button
              onClick={handleCancel}
              variant="outline"
              className="w-full"
              disabled={isResetting}
            >
              キャンセル
            </Button>
          </div>

          <div className="text-xs text-gray-500 text-center">
            この操作は取り消すことができません。
            <br />
            よく確認してから実行してください。
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
})

ResetStatisticsModal.displayName = 'ResetStatisticsModal'

export default ResetStatisticsModal
