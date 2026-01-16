'use client'

import { memo } from 'react'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { AlertTriangle } from 'lucide-react'

interface AccountCancellationModalProps {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  isCancelling: boolean
  onConfirm: () => void
}

const AccountCancellationModal = memo(function AccountCancellationModal({
  isOpen,
  onOpenChange,
  isCancelling,
  onConfirm,
}: AccountCancellationModalProps) {
  const handleCancel = () => {
    onOpenChange(false)
  }

  return (
    <Sheet open={isOpen} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="h-auto">
        <SheetHeader>
          <SheetTitle className="text-red-600 flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            スタックマン解約の確認
          </SheetTitle>
        </SheetHeader>
        <div className="mt-6 space-y-4">
          <Alert className="border-red-200 bg-red-50">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription className="text-red-800">
              <div className="space-y-2">
                <p className="font-bold">⚠️ この操作は取り消せません</p>
                <p className="text-sm">
                  スタックマンを解約すると、以下のデータが削除されます：
                </p>
                <ul className="text-sm list-disc list-inside space-y-1 mt-2">
                  <li>すべてのCP関連データ</li>
                  <li>ランキング履歴</li>
                  <li>ゲーム記録</li>
                  <li>個人統計情報</li>
                </ul>
              </div>
            </AlertDescription>
          </Alert>

          <div className="bg-orange-50 p-4 rounded-lg">
            <p className="text-sm text-orange-800">
              本当にスタックマンを解約してもよろしいですか？
            </p>
          </div>

          <div className="flex gap-3">
            <Button
              variant="outline"
              className="flex-1"
              onClick={handleCancel}
              disabled={isCancelling}
            >
              キャンセル
            </Button>
            <Button
              variant="destructive"
              className="flex-1"
              onClick={onConfirm}
              disabled={isCancelling}
            >
              {isCancelling ? '削除中...' : '削除する'}
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
})

AccountCancellationModal.displayName = 'AccountCancellationModal'

export default AccountCancellationModal
