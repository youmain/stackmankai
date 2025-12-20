"use client"

import { useEffect, useRef, useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Download, Copy, Check } from "lucide-react"
import type { Player } from "@/types"
import QRCode from "qrcode"

interface PlayerQRCodeModalProps {
  player: Player | null
  isOpen: boolean
  onClose: () => void
}

export function PlayerQRCodeModal({ player, isOpen, onClose }: PlayerQRCodeModalProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [copied, setCopied] = useState(false)
  const [qrDataUrl, setQrDataUrl] = useState<string>("")

  useEffect(() => {
    if (player && isOpen && canvasRef.current) {
      generateQRCode()
    }
  }, [player, isOpen])

  const generateQRCode = async () => {
    if (!player || !canvasRef.current) return

    const qrData = JSON.stringify({
      storeId: player.storeId,
      playerId: player.id,
      playerUniqueId: player.uniqueId,
      playerName: player.name,
      storeName: player.storeName || "店舗",
      timestamp: Date.now(),
    })

    try {
      await QRCode.toCanvas(canvasRef.current, qrData, {
        width: 300,
        margin: 2,
        color: {
          dark: "#000000",
          light: "#FFFFFF",
        },
      })

      // Generate data URL for download
      const dataUrl = await QRCode.toDataURL(qrData, {
        width: 600,
        margin: 2,
      })
      setQrDataUrl(dataUrl)
    } catch (error) {
      console.error("QRコード生成エラー:", error)
    }
  }

  const handleDownload = () => {
    if (!qrDataUrl || !player) return

    const link = document.createElement("a")
    link.href = qrDataUrl
    link.download = `qr-${player.uniqueId || player.id}.png`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const handleCopyData = async () => {
    if (!player) return

    const qrData = JSON.stringify({
      storeId: player.storeId,
      playerId: player.id,
      playerUniqueId: player.uniqueId,
      playerName: player.name,
      storeName: player.storeName || "店舗",
      timestamp: Date.now(),
    })

    try {
      await navigator.clipboard.writeText(qrData)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      console.error("コピーエラー:", error)
    }
  }

  if (!player) return null

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>プレイヤー紐づけQRコード</DialogTitle>
          <DialogDescription>
            このQRコードをプレイヤーにスキャンしてもらうことで、簡単にアカウントを紐づけできます。
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col items-center space-y-4 py-4">
          <div className="bg-white p-4 rounded-lg border-2 border-gray-200">
            <canvas ref={canvasRef} />
          </div>
          <div className="text-center space-y-1">
            <p className="font-semibold text-lg">{player.name}</p>
            <p className="text-sm text-gray-600">プレイヤーID: {player.uniqueId}</p>
            <p className="text-xs text-gray-500">{player.storeName || "店舗"}</p>
          </div>
          <div className="flex gap-2 w-full">
            <Button onClick={handleDownload} variant="outline" className="flex-1">
              <Download className="h-4 w-4 mr-2" />
              ダウンロード
            </Button>
            <Button onClick={handleCopyData} variant="outline" className="flex-1">
              {copied ? (
                <>
                  <Check className="h-4 w-4 mr-2" />
                  コピー済み
                </>
              ) : (
                <>
                  <Copy className="h-4 w-4 mr-2" />
                  データコピー
                </>
              )}
            </Button>
          </div>
          <p className="text-xs text-gray-500 text-center">
            プレイヤーはアプリの「QRコードで紐づけ」機能を使用してこのコードをスキャンできます。
          </p>
        </div>
      </DialogContent>
    </Dialog>
  )
}
