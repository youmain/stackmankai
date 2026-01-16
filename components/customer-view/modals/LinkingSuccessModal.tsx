'use client'

import { memo } from 'react'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Trophy } from 'lucide-react'
import type { CustomerAccount } from '@/types'

interface LinkingSuccessModalProps {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  customerAccount: CustomerAccount | null
  skipLinkingAfterSuccess: boolean
  onSkipChange: (skip: boolean) => void
  onClose: () => void
}

const LinkingSuccessModal = memo(function LinkingSuccessModal({
  isOpen,
  onOpenChange,
  customerAccount,
  skipLinkingAfterSuccess,
  onSkipChange,
  onClose,
}: LinkingSuccessModalProps) {
  return (
    <Sheet open={isOpen} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-96">
        <SheetHeader>
          <SheetTitle className="text-lg text-green-600">紐づけ完了</SheetTitle>
        </SheetHeader>
        <div className="mt-6 space-y-4">
          <Alert className="border-green-200 bg-green-50">
            <Trophy className="h-4 w-4" />
            <AlertDescription className="text-green-800">
              <div className="space-y-2">
                <p className="font-bold">プレイヤーID: {customerAccount?.playerId}</p>
                <p className="text-sm">と紐づけされました</p>
              </div>
            </AlertDescription>
          </Alert>

          <div className="text-center">
            <p className="text-sm text-gray-600 mb-4">
              ランキングページにアクセスして、あなたの戦績を確認しましょう！
            </p>
          </div>

          <div className="space-y-3">
            <Button
              onClick={onClose}
              className="w-full bg-green-600 hover:bg-green-700"
            >
              ランキングページへ
            </Button>

            <div className="flex items-center space-x-2 justify-center">
              <input
                type="checkbox"
                id="skip-linking-success"
                checked={skipLinkingAfterSuccess}
                onChange={(e) => onSkipChange(e.target.checked)}
                className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <label htmlFor="skip-linking-success" className="text-sm text-gray-600 cursor-pointer">
                次回から表示しない
              </label>
            </div>
            <p className="text-xs text-gray-500 text-center">
              チェックすると、今後は紐づけ完了後に直接ランキングページに移動します
            </p>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
})

LinkingSuccessModal.displayName = 'LinkingSuccessModal'

export default LinkingSuccessModal
