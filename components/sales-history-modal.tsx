"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Receipt, Calendar, Trash2, X } from "lucide-react"
import { subscribeToReceipts, deleteDailySales, deleteReceipt } from "@/lib/firestore"
import type { Receipt as ReceiptType, DailySales } from "@/types"
import { ReceiptDetailModal } from "./receipt-detail-modal"
import { handleError } from "@/lib/error-handler"

interface SalesHistoryModalProps {
  open: boolean
  onClose: () => void
  salesData: DailySales
}

export function SalesHistoryModal({ open, onClose, salesData }: SalesHistoryModalProps) {
  const [completedReceipts, setCompletedReceipts] = useState<ReceiptType[]>([])
  const [loading, setLoading] = useState(true)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [selectedReceipt, setSelectedReceipt] = useState<ReceiptType | null>(null)
  const [showReceiptDetail, setShowReceiptDetail] = useState(false)
  const [receiptToDelete, setReceiptToDelete] = useState<ReceiptType | null>(null)
  const [showReceiptDeleteConfirm, setShowReceiptDeleteConfirm] = useState(false)
  const [isDeletingReceipt, setIsDeletingReceipt] = useState(false)

  useEffect(() => {
    if (!open) {
      setLoading(false)
      return
    }

    const unsubscribe = subscribeToReceipts(
      (allReceipts) => {
        const filtered = allReceipts.filter((receipt) => receipt.status === "settled")
        setCompletedReceipts(filtered)
        setLoading(false)
      },
      (error) => {
        console.error("❌ 伝票取得エラー:", error)
        setLoading(false)
      },
    )

    return () => {
      unsubscribe()
    }
  }, [open, salesData])

  const getMenuTypeName = (menuType: string): string => {
    const menuNames: Record<string, string> = {
      tournament: "トーナメント",
      rebuy: "リバイ",
      stack_purchase: "スタック購入",
      charge: "チャージ",
      drink: "ドリンク",
      food: "食事",
      other: "その他",
      other_non_taxable: "その他（非課税）",
    }
    return menuNames[menuType] || menuType
  }

  const handleDelete = async () => {
    setIsDeleting(true)
    try {
      await deleteDailySales(salesData.id)
      onClose()
      setShowDeleteConfirm(false)
    } catch (error) {
      console.error("❌ 売上履歴削除エラー:", error)
      handleError(error, "売上履歴削除")
    } finally {
      setIsDeleting(false)
    }
  }

  const handleReceiptDelete = async (receipt: ReceiptType) => {
    setIsDeletingReceipt(true)
    try {
      await deleteReceipt(receipt.id, "管理者")
      setShowReceiptDeleteConfirm(false)
      setReceiptToDelete(null)
    } catch (error) {
      console.error("❌ 個別伝票削除エラー:", error)
      handleError(error, "伝票削除")
    } finally {
      setIsDeletingReceipt(false)
    }
  }

  const handleReceiptClick = (receipt: ReceiptType, event: React.MouseEvent) => {
    if ((event.target as HTMLElement).closest(".delete-button")) {
      return
    }
    setSelectedReceipt(receipt)
    setShowReceiptDetail(true)
  }

  const calculateDynamicTotals = () => {
    const totalSales = completedReceipts.reduce((sum, receipt) => sum + receipt.totalAmount + receipt.totalTax, 0)
    const receiptCount = completedReceipts.length

    return {
      salesAmount: totalSales,
      receiptCount: receiptCount,
      rakeAmount: salesData.rakeAmount, // Keep original rake amount as it's not affected by receipt deletion
    }
  }

  const dynamicTotals = calculateDynamicTotals()

  return (
    <>
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Calendar className="h-5 w-5" />
                <span>{salesData.date} - 売上履歴詳細</span>
              </div>
              <Button
                variant="destructive"
                size="sm"
                onClick={() => setShowDeleteConfirm(true)}
                className="flex items-center gap-2"
              >
                <Trash2 className="h-4 w-4" />
                削除
              </Button>
            </DialogTitle>
          </DialogHeader>

          {showDeleteConfirm && (
            <Card className="border-red-200 bg-red-50">
              <CardHeader>
                <CardTitle className="text-red-700">売上履歴の削除</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-red-600">この売上履歴を削除しますか？この操作は取り消せません。</p>
                <div className="flex gap-2">
                  <Button variant="destructive" onClick={handleDelete} disabled={isDeleting}>
                    {isDeleting ? "削除中..." : "削除実行"}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowDeleteConfirm(false)
                    }}
                  >
                    キャンセル
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {showReceiptDeleteConfirm && receiptToDelete && (
            <Card className="border-red-200 bg-red-50">
              <CardHeader>
                <CardTitle className="text-red-700">伝票の削除</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-red-600">
                  {receiptToDelete.playerName}の伝票を削除しますか？この操作は取り消せません。
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="destructive"
                    onClick={() => handleReceiptDelete(receiptToDelete)}
                    disabled={isDeletingReceipt}
                  >
                    {isDeletingReceipt ? "削除中..." : "削除実行"}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowReceiptDeleteConfirm(false)
                      setReceiptToDelete(null)
                    }}
                  >
                    キャンセル
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">売上サマリー</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">売上合計</p>
                    <p className="text-xl font-bold">¥{dynamicTotals.salesAmount.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">レーキ合計</p>
                    <p className="text-xl font-bold">¥{dynamicTotals.rakeAmount.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">実質売上</p>
                    <p className="text-xl font-bold text-green-600">
                      ¥{(dynamicTotals.salesAmount + dynamicTotals.rakeAmount).toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">伝票件数</p>
                    <p className="text-xl font-bold">{dynamicTotals.receiptCount}件</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Receipt className="h-5 w-5" />
                  確定済み伝票一覧
                </CardTitle>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="text-center py-8 text-muted-foreground">読み込み中...</div>
                ) : completedReceipts.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">確定済み伝票が見つかりません</div>
                ) : (
                  <div className="space-y-4">
                    {completedReceipts.map((receipt) => (
                      <div
                        key={receipt.id}
                        onClick={(e) => handleReceiptClick(receipt, e)}
                        className="flex items-center justify-between p-4 border rounded-lg bg-gray-50 hover:bg-gray-100 cursor-pointer transition-colors"
                      >
                        <div className="flex items-center space-x-4">
                          <div>
                            <div className="font-medium">{receipt.playerName}</div>
                            <div className="text-sm text-muted-foreground">
                              作成: {receipt.createdAt.toLocaleDateString("ja-JP")} | 作成者: {receipt.createdBy}
                            </div>
                            {receipt.gameId && (
                              <Badge variant="outline" className="text-xs mt-1">
                                ゲーム連動
                              </Badge>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="text-right">
                            <div className="font-bold text-lg">
                              ¥{(receipt.totalAmount + receipt.totalTax).toLocaleString()}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              本体: ¥{receipt.totalAmount.toLocaleString()} + 税: ¥{receipt.totalTax.toLocaleString()}
                            </div>
                            <Badge variant="secondary" className="mt-1">
                              清算完了
                            </Badge>
                          </div>
                          <Button
                            variant="destructive"
                            size="sm"
                            className="delete-button flex items-center gap-1"
                            onClick={(e) => {
                              e.stopPropagation()
                              setReceiptToDelete(receipt)
                              setShowReceiptDeleteConfirm(true)
                            }}
                          >
                            <X className="h-4 w-4" />
                            削除
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </DialogContent>
      </Dialog>

      {selectedReceipt && (
        <ReceiptDetailModal
          open={showReceiptDetail}
          onClose={() => {
            setShowReceiptDetail(false)
            setSelectedReceipt(null)
          }}
          receipt={selectedReceipt}
          isEmployeeView={true}
        />
      )}
    </>
  )
}
