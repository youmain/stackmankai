"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { QrCode, Copy, Check } from "lucide-react"

interface QRCodeModalProps {
  isOpen: boolean
  onClose: () => void
}

export function QRCodeModal({ isOpen, onClose }: QRCodeModalProps) {
  const [customerViewUrl, setCustomerViewUrl] = useState("")
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (typeof window !== "undefined") {
      const baseUrl = window.location.origin
      setCustomerViewUrl(`${baseUrl}/customer-view`)
    }
  }, [])

  const handleCopyUrl = async () => {
    try {
      await navigator.clipboard.writeText(customerViewUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      console.error("URLのコピーに失敗しました:", error)
    }
  }

  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(customerViewUrl)}`

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <QrCode className="h-5 w-5" />
            <span>お客さん用ランキングQRコード</span>
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="flex justify-center">
            <div className="bg-white p-4 rounded-lg border">
              <img
                src={qrCodeUrl || "/placeholder.svg"}
                alt="お客さん用ランキングページQRコード"
                className="w-64 h-64"
                onError={(e) => {
                  const target = e.target as HTMLImageElement
                  target.src = "/qr--------.jpg"
                }}
              />
            </div>
          </div>
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground text-center">
              お客さんにこのQRコードをスキャンしてもらい、
              <br />
              ランキングページにアクセスしてもらってください
            </p>
            <div className="flex items-center space-x-2">
              <input
                type="text"
                value={customerViewUrl}
                readOnly
                className="flex-1 px-3 py-2 text-sm border rounded-md bg-gray-50"
              />
              <Button
                variant="outline"
                size="sm"
                onClick={handleCopyUrl}
                className="flex items-center space-x-1 bg-transparent"
              >
                {copied ? (
                  <>
                    <Check className="h-4 w-4" />
                    <span>コピー済み</span>
                  </>
                ) : (
                  <>
                    <Copy className="h-4 w-4" />
                    <span>コピー</span>
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
