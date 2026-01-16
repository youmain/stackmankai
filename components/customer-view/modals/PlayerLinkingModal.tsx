'use client'

import { memo } from 'react'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { AlertCircle, RefreshCw, User } from 'lucide-react'

interface PlayerLinkingModalProps {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  playerIdInput: string
  onPlayerIdInputChange: (value: string) => void
  isLinking: boolean
  linkingError: string
  onSearch: () => void
}

const PlayerLinkingModal = memo(function PlayerLinkingModal({
  isOpen,
  onOpenChange,
  playerIdInput,
  onPlayerIdInputChange,
  isLinking,
  linkingError,
  onSearch,
}: PlayerLinkingModalProps) {
  const handleCancel = () => {
    onOpenChange(false)
  }

  return (
    <Sheet open={isOpen} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-96">
        <SheetHeader>
          <SheetTitle className="text-lg">プレイヤー情報を紐づける</SheetTitle>
        </SheetHeader>
        <div className="mt-6 space-y-4">
          <Alert className="border-blue-200 bg-blue-50">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="text-blue-800">
              <div className="space-y-2">
                <p className="font-bold">プレイヤー情報の紐づけ</p>
                <p className="text-sm">店舗で確認できるプレイヤーIDまたはプレイヤー名を入力してください。</p>
              </div>
            </AlertDescription>
          </Alert>

          <div className="space-y-3">
            <label className="text-sm font-medium text-gray-700">プレイヤーIDまたは名前</label>
            <input
              type="text"
              value={playerIdInput}
              onChange={(e) => onPlayerIdInputChange(e.target.value)}
              placeholder="例: 123456 または プレイヤー名"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {linkingError && <p className="text-sm text-red-600">{linkingError}</p>}
          </div>

          <div className="space-y-3">
            <Button
              onClick={onSearch}
              disabled={isLinking || !playerIdInput.trim()}
              className="w-full bg-blue-600 hover:bg-blue-700"
            >
              {isLinking ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  確認中...
                </>
              ) : (
                <>
                  <User className="h-4 w-4 mr-2" />
                  プレイヤーを検索
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

          <div className="text-xs text-gray-500">
            <p>※ プレイヤー情報が見つからない場合は、店舗スタッフに確認してください。</p>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
})

PlayerLinkingModal.displayName = 'PlayerLinkingModal'

export default PlayerLinkingModal
