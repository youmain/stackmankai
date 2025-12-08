"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Receipt } from "lucide-react"
import { createStandaloneReceipt } from "@/lib/firestore"
import { useAuth } from "@/contexts/auth-context"
import { handleError } from "@/lib/error-handler"

interface StandaloneReceiptModalProps {
  open: boolean
  onClose: () => void
}

export function StandaloneReceiptModal({ open, onClose }: StandaloneReceiptModalProps) {
  const { userName } = useAuth()
  const [customerName, setCustomerName] = useState("")
  const [isCreating, setIsCreating] = useState(false)

  const handleCreateReceipt = async () => {
    if (!customerName.trim() || !userName) return

    setIsCreating(true)
    try {
      await createStandaloneReceipt("", customerName.trim(), userName)

      // Reset and close
      setCustomerName("")
      onClose()
    } catch (error) {
      console.error("独立伝票作成エラー:", error)
      handleError(error, "伝票作成")
    } finally {
      setIsCreating(false)
    }
  }

  const handleClose = () => {
    setCustomerName("")
    onClose()
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Receipt className="h-5 w-5" />
            <span>新規伝票作成</span>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="customer-name">お客様名</Label>
            <Input
              id="customer-name"
              placeholder="お客様の名前を入力してください"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
            />
          </div>

          <div className="flex space-x-2 pt-4">
            <Button variant="outline" onClick={handleClose} className="flex-1 bg-transparent" disabled={isCreating}>
              キャンセル
            </Button>
            <Button onClick={handleCreateReceipt} disabled={!customerName.trim() || isCreating} className="flex-1">
              {isCreating ? "作成中..." : "伝票作成"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
