"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Loader2, QrCode } from "lucide-react"

interface LinkPlayerFormProps {
  playerId: string
  isLoading: boolean
  onPlayerIdChange: (value: string) => void
  onSubmit: (e: React.FormEvent) => void
  onShowQRScanner: () => void
}

export function LinkPlayerForm({
  playerId,
  isLoading,
  onPlayerIdChange,
  onSubmit,
  onShowQRScanner,
}: LinkPlayerFormProps) {
  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="player-id">プレイヤーID</Label>
        <Input
          id="player-id"
          type="text"
          placeholder="プレイヤーIDを入力"
          value={playerId}
          onChange={(e) => onPlayerIdChange(e.target.value)}
          required
        />
      </div>

      <Button type="submit" className="w-full" disabled={isLoading}>
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            リンク中...
          </>
        ) : (
          "プレイヤーをリンク"
        )}
      </Button>

      <Button
        type="button"
        variant="outline"
        className="w-full"
        onClick={onShowQRScanner}
        disabled={isLoading}
      >
        <QrCode className="mr-2 h-4 w-4" />
        QRコードをスキャン
      </Button>
    </form>
  )
}
