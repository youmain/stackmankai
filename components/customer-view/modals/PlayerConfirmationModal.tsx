'use client'

import { memo } from 'react'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Trophy, RefreshCw } from 'lucide-react'
import type { Player } from '@/types'

interface PlayerConfirmationModalProps {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  selectedPlayer: Player | null
  isLinking: boolean
  onConfirm: () => void
}

const PlayerConfirmationModal = memo(function PlayerConfirmationModal({
  isOpen,
  onOpenChange,
  selectedPlayer,
  isLinking,
  onConfirm,
}: PlayerConfirmationModalProps) {
  const handleCancel = () => {
    onOpenChange(false)
  }

  return (
    <Sheet open={isOpen} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-96">
        <SheetHeader>
          <SheetTitle className="text-lg">プレイヤー情報の確認</SheetTitle>
        </SheetHeader>
        <div className="mt-6 space-y-4">
          {selectedPlayer && (
            <>
              <Alert className="border-green-200 bg-green-50">
                <Trophy className="h-4 w-4" />
                <AlertDescription className="text-green-800">
                  <div className="space-y-2">
                    <p className="font-bold">プレイヤーが見つかりました</p>
                    <p className="text-sm">以下の情報で紐づけを行います。</p>
                  </div>
                </AlertDescription>
              </Alert>

              <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                <div>
                  <p className="text-sm text-gray-600">プレイヤー名</p>
                  <p className="font-semibold">{selectedPlayer.name}</p>
                </div>
                {selectedPlayer.pokerName && (
                  <div>
                    <p className="text-sm text-gray-600">ポーカーネーム</p>
                    <p className="font-semibold text-purple-600">{selectedPlayer.pokerName}</p>
                  </div>
                )}
                <div>
                  <p className="text-sm text-gray-600">プレイヤーID</p>
                  <p className="font-mono text-sm">{selectedPlayer.uniqueId || selectedPlayer.id}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">貯スタック</p>
                  <p className="font-semibold text-blue-600">
                    {selectedPlayer.systemBalance?.toLocaleString() || 0}©
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                <Button
                  onClick={onConfirm}
                  disabled={isLinking}
                  className="w-full bg-green-600 hover:bg-green-700"
                >
                  {isLinking ? (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      紐づけ中...
                    </>
                  ) : (
                    <>
                      <Trophy className="h-4 w-4 mr-2" />
                      この情報で紐づける
                    </>
                  )}
                </Button>

                <Button
                  onClick={handleCancel}
                  variant="outline"
                  className="w-full"
                  disabled={isLinking}
                >
                  キャンセル
                </Button>
              </div>
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
})

PlayerConfirmationModal.displayName = 'PlayerConfirmationModal'

export default PlayerConfirmationModal
