"use client"

import { useState, useEffect } from "react"
import { AuthGuard } from "@/components/auth-guard"
import { Header } from "@/components/header"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Search, Receipt, Plus, Eye, Trash2 } from "lucide-react"
import { subscribeToReceipts, deleteReceipt, getAdminPassword, completeReceipt } from "@/lib/firestore"
import type { Receipt as ReceiptType } from "@/types"
import { OrderAddModal } from "@/components/order-add-modal"
import { ReceiptDetailModal } from "@/components/receipt-detail-modal"
import { StandaloneReceiptModal } from "@/components/standalone-receipt-modal"
import { useAuth } from "@/contexts/auth-context"
import { handleError, handleValidationError } from "@/lib/error-handler"

export default function ReceiptsPage() {
  const { userName } = useAuth()
  const [receipts, setReceipts] = useState<ReceiptType[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [showOrderAddModal, setShowOrderAddModal] = useState(false)
  const [showReceiptDetailModal, setShowReceiptDetailModal] = useState(false)
  const [showStandaloneReceiptModal, setShowStandaloneReceiptModal] = useState(false)
  const [selectedReceipt, setSelectedReceipt] = useState<ReceiptType | null>(null)
  const [showPasswordDialog, setShowPasswordDialog] = useState(false)
  const [password, setPassword] = useState("")
  const [receiptToDelete, setReceiptToDelete] = useState<ReceiptType | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [isCompleting, setIsCompleting] = useState(false)

  useEffect(() => {
    let unsubscribeReceipts: (() => void) | null = null

    try {
      const storeId = localStorage.getItem("storeId")
      unsubscribeReceipts = subscribeToReceipts(
        (newReceipts) => {
          setReceipts(newReceipts)
        },
        storeId
      )
    } catch (error) {
      console.error("伝票リスナー初期化エラー:", error)
    }

    return () => {
      if (unsubscribeReceipts) {
        unsubscribeReceipts()
      }
    }
  }, [])

  const handleDeleteReceipt = async (receipt: ReceiptType) => {
    setReceiptToDelete(receipt)
    setShowPasswordDialog(true)
    setPassword("")
  }

  const handlePasswordSubmit = async () => {
    if (!receiptToDelete || !userName) return

    setIsDeleting(true)
    try {
      const adminPassword = await getAdminPassword()

      if (password !== adminPassword) {
        handleValidationError("パスワードが正しくありません")
        setIsDeleting(false)
        return
      }

      await deleteReceipt(receiptToDelete.id)

      // Close dialog and reset state
      setShowPasswordDialog(false)
      setReceiptToDelete(null)
      setPassword("")
    } catch (error) {
      console.error("伝票削除エラー:", error)
      handleError(error, "伝票削除")
    } finally {
      setIsDeleting(false)
    }
  }

  const handleCompleteReceipt = async (receipt: ReceiptType) => {
    if (!userName) return

    setIsCompleting(true)
    try {
      await completeReceipt(
        receipt.id,
        0, // receivedAmount
        0, // changeAmount
        0, // pointsUsed
        userName
      )
    } catch (error) {
      console.error("伝票清算エラー:", error)
      handleError(error, "伝票清算")
    } finally {
      setIsCompleting(false)
    }
  }

  const filteredReceipts = receipts
    .filter((receipt) => receipt.playerName.toLowerCase().includes(searchTerm.toLowerCase()))
    .filter((receipt) => receipt.status !== "cancelled" && receipt.status !== "settled")
    .sort((a, b) => {
      // アクティブな伝票を上に表示
      if (a.status === "active" && b.status !== "active") return -1
      if (a.status !== "active" && b.status === "active") return 1

      // 作成日時の降順
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    })

  const getStatusBadge = (status: ReceiptType["status"]) => {
    switch (status) {
      case "active":
        return (
          <Badge variant="default" className="bg-blue-100 text-blue-800">
            進行中
          </Badge>
        )
      case "completed":
        return (
          <Badge variant="secondary" className="bg-green-100 text-green-800">
            完了
          </Badge>
        )
      case "cancelled":
        return <Badge variant="destructive">キャンセル</Badge>
      case "settled":
        return <Badge variant="outline">済</Badge>
      default:
        return <Badge variant="outline">不明</Badge>
    }
  }

  const handleAddOrder = (receipt: ReceiptType) => {
    setSelectedReceipt(receipt)
    setShowOrderAddModal(true)
  }

  const handleViewDetail = (receipt: ReceiptType) => {
    setSelectedReceipt(receipt)
    setShowReceiptDetailModal(true)
  }

  const calculateTotalSales = () => {
    return receipts
      .filter((receipt) => receipt.status === "completed")
      .reduce((total, receipt) => total + receipt.totalAmount + receipt.totalTax, 0)
  }

  return (
    <AuthGuard>
      <div className="min-h-screen bg-gray-50">
        <Header />
        <main className="container mx-auto px-3 py-4 sm:px-6 lg:px-8 sm:py-8">
          <div className="mb-4 sm:mb-6 lg:mb-8">
            <Card className="bg-gradient-to-r from-green-50 to-blue-50 border-green-200">
              <CardContent className="pt-4 sm:pt-6 lg:pt-8">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-green-800">売上合計</h2>
                    <p className="text-xs sm:text-sm lg:text-base text-green-600 mt-1 sm:mt-2">
                      清算完了した伝票の売上合計額
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl sm:text-3xl lg:text-4xl font-bold text-green-800">
                      {calculateTotalSales().toLocaleString()}円
                    </div>
                    <div className="text-xs sm:text-sm lg:text-base text-green-600">
                      {receipts.filter((r) => r.status === "completed").length}件完了
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="mb-6 sm:mb-8 lg:mb-10">
            <div className="mb-4 lg:mb-6">
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold">伝票管理</h1>
              <p className="text-sm sm:text-base lg:text-lg text-muted-foreground mt-1 sm:mt-2">
                プレイヤーの伝票一覧・注文管理・清算
              </p>
            </div>
          </div>

          <div className="mb-4 sm:mb-6 lg:mb-8">
            <div className="relative w-full sm:max-w-md lg:max-w-lg">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 lg:h-5 lg:w-5 text-muted-foreground" />
              <Input
                placeholder="プレイヤー名で検索..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 lg:pl-12 lg:py-3 lg:text-base"
              />
            </div>
            <div className="mt-4">
              <Button onClick={() => setShowStandaloneReceiptModal(true)} className="bg-black hover:bg-gray-800">
                <Plus className="h-4 w-4 mr-2" />
                新規伝票作成
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6 lg:gap-8">
            {filteredReceipts.map((receipt) => (
              <Card
                key={receipt.id}
                className={`hover:shadow-lg transition-shadow lg:hover:shadow-xl ${
                  receipt.status === "active" ? "ring-2 ring-blue-500 bg-blue-50" : ""
                }`}
              >
                <CardHeader className="pb-2 sm:pb-3 lg:pb-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-2 min-w-0 flex-1">
                      <CardTitle className="text-base sm:text-lg lg:text-xl truncate">{receipt.playerName}</CardTitle>
                      {getStatusBadge(receipt.status)}
                    </div>
                    <div className="flex flex-col items-end space-y-1 ml-2 flex-shrink-0">
                      <Badge variant="default" className="text-xs lg:text-sm lg:px-2 lg:py-1 whitespace-nowrap">
                        {(receipt.totalAmount + receipt.totalTax).toLocaleString()}円
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 sm:space-y-3 lg:space-y-4">
                    <div className="text-xs sm:text-sm lg:text-base text-muted-foreground">
                      <p>作成日: {receipt.createdAt.toLocaleDateString("ja-JP")}</p>
                      <p>作成者: {receipt.createdBy}</p>
                      {receipt.gameId && <p className="text-blue-600">ゲーム連動</p>}
                    </div>
                    <div className="flex flex-col space-y-2">
                      {receipt.status === "active" && (
                        <>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleAddOrder(receipt)}
                            className="w-full text-xs sm:text-sm lg:text-base lg:py-2 bg-transparent"
                          >
                            <Plus className="h-3 w-3 sm:h-4 sm:w-4 lg:h-5 lg:w-5 mr-1" />
                            注文追加
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleCompleteReceipt(receipt)}
                            disabled={isCompleting}
                            className="w-full text-xs sm:text-sm lg:text-base lg:py-2 bg-transparent text-green-600 hover:text-green-700 hover:bg-green-50"
                          >
                            <Receipt className="h-3 w-3 sm:h-4 sm:w-4 lg:h-5 lg:w-5 mr-1" />
                            {isCompleting ? "清算中..." : "清算完了"}
                          </Button>
                        </>
                      )}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleViewDetail(receipt)}
                        className="w-full text-xs sm:text-sm lg:text-base lg:py-2 bg-transparent"
                      >
                        <Eye className="h-3 w-3 sm:h-4 sm:w-4 lg:h-5 lg:w-5 mr-1" />
                        詳細表示
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteReceipt(receipt)}
                        className="w-full text-xs sm:text-sm lg:text-base lg:py-2 bg-transparent text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="h-3 w-3 sm:h-4 sm:w-4 lg:h-5 lg:w-5 mr-1" />
                        削除
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {filteredReceipts.length === 0 && (
            <div className="text-center py-8 sm:py-12 lg:py-16">
              <Receipt className="h-12 w-12 lg:h-16 lg:w-16 text-muted-foreground mx-auto mb-4" />
              <p className="text-sm sm:text-base lg:text-lg text-muted-foreground">
                {searchTerm ? "検索条件に一致する伝票が見つかりません" : "伝票が作成されていません"}
              </p>
              <p className="text-xs sm:text-sm lg:text-base text-muted-foreground mt-2">
                ゲーム開始時に「同時に伝票作成」をチェックすると伝票が作成されます
              </p>
            </div>
          )}
        </main>

        <Dialog open={showPasswordDialog} onOpenChange={setShowPasswordDialog}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>伝票削除の確認</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                {receiptToDelete?.playerName}の伝票を削除します。
                <br />
                削除すると売上合計からも除外されます。
                <br />
                管理者パスワードを入力してください。
              </p>
              <Input
                type="password"
                placeholder="管理者パスワード"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    handlePasswordSubmit()
                  }
                }}
              />
              <div className="flex space-x-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowPasswordDialog(false)
                    setReceiptToDelete(null)
                    setPassword("")
                  }}
                  className="flex-1"
                  disabled={isDeleting}
                >
                  キャンセル
                </Button>
                <Button
                  onClick={handlePasswordSubmit}
                  disabled={!password || isDeleting}
                  className="flex-1 bg-red-600 hover:bg-red-700"
                >
                  {isDeleting ? "削除中..." : "削除"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {selectedReceipt && (
          <>
            <OrderAddModal
              open={showOrderAddModal}
              onClose={() => {
                setShowOrderAddModal(false)
                setSelectedReceipt(null)
              }}
              receiptId={selectedReceipt.id}
              playerName={selectedReceipt.playerName}
            />
            <ReceiptDetailModal
              open={showReceiptDetailModal}
              onClose={() => {
                setShowReceiptDetailModal(false)
                setSelectedReceipt(null)
              }}
              receipt={selectedReceipt}
            />
          </>
        )}

        <StandaloneReceiptModal
          open={showStandaloneReceiptModal}
          onClose={() => setShowStandaloneReceiptModal(false)}
        />
      </div>
    </AuthGuard>
  )
}
