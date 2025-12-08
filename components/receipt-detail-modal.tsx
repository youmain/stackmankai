"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Eye, Users, Receipt, CheckCircle, Trash2, Gift } from 'lucide-react'
import { subscribeToReceiptItems, completeReceipt, deleteReceiptItem, getStoreRankingSettings } from "@/lib/firestore"
import type { Receipt as ReceiptType, ReceiptItem, MenuType, StoreRankingSettings } from "@/types"
import { useAuth } from "@/contexts/auth-context"
import { handleError, handleSuccess } from "@/lib/error-handler"

interface ReceiptDetailModalProps {
  open: boolean
  onClose: () => void
  receipt: ReceiptType
  playerRewardPoints?: number
}

export function ReceiptDetailModal({ open, onClose, receipt, playerRewardPoints }: ReceiptDetailModalProps) {
  const { userName } = useAuth()
  const [receiptItems, setReceiptItems] = useState<ReceiptItem[]>([])
  const [isCompleting, setIsCompleting] = useState(false)
  const [deletingItemId, setDeletingItemId] = useState<string | null>(null)
  const [usePoints, setUsePoints] = useState(false)
  const [pointsToUse, setPointsToUse] = useState<string>("0")
  const [settings, setSettings] = useState<StoreRankingSettings | null>(null)

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const storeSettings = await getStoreRankingSettings()
        setSettings(storeSettings)
      } catch (error) {
        console.error("設定読み込みエラー:", error)
      }
    }
    loadSettings()
  }, [])

  useEffect(() => {
    if (!open || !receipt.id) return

    const unsubscribe = subscribeToReceiptItems(
      receipt.id,
      (items) => {
        setReceiptItems(items)
      },
      (error) => {
        console.error("伝票項目リスナーエラー:", error)
      },
    )

    return () => {
      unsubscribe()
    }
  }, [open, receipt.id])

  const getMenuTypeName = (menuType: MenuType): string => {
    const menuNames = {
      tournament: "トーナメント",
      rebuy: "リバイ",
      stack_purchase: "スタック購入",
      charge: "チャージ",
      drink: "ドリンク",
      food: "食事",
      other: "その他",
    }
    return menuNames[menuType] || menuType
  }

  const consolidatedItems: { menuType: MenuType; itemName: string; unitPrice: number; totalQuantity: number; totalPrice: number; isTaxable: boolean }[] = receiptItems.reduce((acc, item) => {
    const existing = acc.find(
      (consolidated) =>
        consolidated.menuType === item.menuType &&
        consolidated.itemName === item.itemName &&
        consolidated.unitPrice === item.unitPrice,
    )

    if (existing) {
      existing.totalQuantity += item.quantity
      existing.totalPrice += item.totalPrice
    } else {
      acc.push({
        menuType: item.menuType,
        itemName: item.itemName,
        unitPrice: item.unitPrice,
        totalQuantity: item.quantity,
        totalPrice: item.totalPrice,
        isTaxable: item.isTaxable,
      })
    }

    return acc
  }, [] as { menuType: MenuType; itemName: string; unitPrice: number; totalQuantity: number; totalPrice: number; isTaxable: boolean }[])

  const currentTotals = receiptItems.reduce(
    (acc, item) => {
      acc.totalAmount += item.totalPrice
      if (item.isTaxable) {
        acc.totalTaxableAmount += item.totalPrice
        acc.totalTax += Math.floor(item.totalPrice * 0.1)
      }
      return acc
    },
    { totalAmount: 0, totalTaxableAmount: 0, totalTax: 0 },
  )

  const pointUsableAmount = settings?.rewardPointsSettings?.usageScope === "stack_only"
    ? receiptItems
        .filter((item) => 
          item.menuType === "stack_purchase" || 
          item.menuType === "tournament" || 
          item.menuType === "rebuy"
        )
        .reduce((sum, item) => sum + item.totalPrice, 0)
    : currentTotals.totalAmount + currentTotals.totalTax

  const pointsUsed = Math.min(
    Number.parseInt(pointsToUse) || 0,
    playerRewardPoints || 0,
    pointUsableAmount
  )
  const finalAmount = Math.max(0, currentTotals.totalAmount + currentTotals.totalTax - pointsUsed)

  const handleCompleteReceipt = async () => {
    const confirmMessage = usePoints && pointsUsed > 0
      ? `${receipt.playerName}の伝票を清算完了にしますか？\n\n使用ポイント: ${pointsUsed}P\n支払金額: ${finalAmount.toLocaleString()}円`
      : `${receipt.playerName}の伝票を清算完了にしますか？`
    
    if (!confirm(confirmMessage)) {
      return
    }

    setIsCompleting(true)
    try {
      await completeReceipt(
        receipt.id,
        userName || "system",
        usePoints ? pointsUsed : 0,
        receipt.playerId
      )
      handleSuccess(`${receipt.playerName}の伝票を清算完了しました${usePoints ? `（${pointsUsed}P使用）` : ""}`)
      onClose()
    } catch (error) {
      console.error("❌ 伝票完了エラー:", error)
      handleError(error, "伝票完了処理")
    } finally {
      setIsCompleting(false)
    }
  }

  const handleDeleteReceiptItem = async (receiptItemId: string, itemName: string) => {
    if (!confirm(`「${itemName}」を削除しますか？`)) {
      return
    }

    setDeletingItemId(receiptItemId)
    try {
      await deleteReceiptItem(receiptItemId, userName || "system")
    } catch (error) {
      console.error("❌ 注文項目削除エラー:", error)
      handleError(error, "注文項目削除")
    } finally {
      setDeletingItemId(null)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl lg:max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Receipt className="h-5 w-5" />
            <span>{receipt.playerName} - 伝票詳細</span>
            {receipt.status === "active" && (
              <Badge variant="default" className="bg-blue-100 text-blue-800">
                進行中
              </Badge>
            )}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">伝票情報</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p>
                    <strong>プレイヤー:</strong> {receipt.playerName}
                  </p>
                  <p>
                    <strong>作成日:</strong> {receipt.createdAt.toLocaleDateString("ja-JP")}
                  </p>
                  <p>
                    <strong>作成者:</strong> {receipt.createdBy}
                  </p>
                </div>
                <div>
                  <p>
                    <strong>合計金額:</strong> {currentTotals.totalAmount.toLocaleString()}円
                  </p>
                  <p>
                    <strong>課税対象:</strong> {currentTotals.totalTaxableAmount.toLocaleString()}円
                  </p>
                  <p>
                    <strong>消費税:</strong> {currentTotals.totalTax.toLocaleString()}円
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {receipt.status === "active" && playerRewardPoints && playerRewardPoints > 0 && (
            <Card className="border-purple-200 bg-purple-50">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Gift className="h-5 w-5 text-purple-600" />
                  <span className="text-purple-900">ポイント使用</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm">利用可能ポイント:</span>
                  <Badge variant="secondary" className="bg-purple-600 text-white text-sm font-bold px-3 py-1">
                    {playerRewardPoints.toLocaleString()}P
                  </Badge>
                </div>
                {settings?.rewardPointsSettings?.usageScope === "stack_only" && (
                  <div className="text-xs text-purple-700 bg-purple-100 p-2 rounded">
                    ※ポイントはスタック購入のみに使用できます（{pointUsableAmount.toLocaleString()}円分）
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="use-points"
                    checked={usePoints}
                    onChange={(e) => {
                      setUsePoints(e.target.checked)
                      if (e.target.checked) {
                        const maxUsable = Math.min(
                          playerRewardPoints,
                          pointUsableAmount
                        )
                        setPointsToUse(maxUsable.toString())
                      } else {
                        setPointsToUse("0")
                      }
                    }}
                    className="h-4 w-4"
                  />
                  <Label htmlFor="use-points" className="cursor-pointer">
                    ポイントを使用する
                  </Label>
                </div>
                {usePoints && (
                  <div className="space-y-2">
                    <Label htmlFor="points-amount">使用ポイント数</Label>
                    <Input
                      id="points-amount"
                      type="number"
                      min="0"
                      max={Math.min(playerRewardPoints, pointUsableAmount)}
                      value={pointsToUse}
                      onChange={(e) => setPointsToUse(e.target.value)}
                      className="font-semibold"
                    />
                    <p className="text-xs text-gray-600">
                      最大{Math.min(playerRewardPoints, pointUsableAmount).toLocaleString()}P使用可能
                    </p>
                  </div>
                )}
                {usePoints && pointsUsed > 0 && (
                  <div className="border-t pt-3 space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>会計金額:</span>
                      <span>{(currentTotals.totalAmount + currentTotals.totalTax).toLocaleString()}円</span>
                    </div>
                    <div className="flex justify-between text-sm text-purple-600">
                      <span>ポイント使用:</span>
                      <span>-{pointsUsed.toLocaleString()}P（円）</span>
                    </div>
                    <div className="flex justify-between text-lg font-bold text-green-600">
                      <span>支払金額:</span>
                      <span>{finalAmount.toLocaleString()}円</span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          <Tabs defaultValue="customer" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="customer" className="flex items-center space-x-2">
                <Eye className="h-4 w-4" />
                <span>顧客用表示</span>
              </TabsTrigger>
              <TabsTrigger value="staff" className="flex items-center space-x-2">
                <Users className="h-4 w-4" />
                <span>従業員用表示</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="customer" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">注文内容（顧客用）</CardTitle>
                </CardHeader>
                <CardContent>
                  {consolidatedItems.length === 0 ? (
                    <p className="text-muted-foreground text-center py-4">注文がありません</p>
                  ) : (
                    <div className="space-y-3">
                      {consolidatedItems.map((item, index) => (
                        <div key={index} className="flex justify-between items-center py-2 border-b last:border-b-0">
                          <div className="flex-1">
                            <div className="flex items-center space-x-2">
                              <span className="font-medium">{item.itemName}</span>
                              <Badge variant={item.isTaxable ? "destructive" : "secondary"} className="text-xs">
                                {item.isTaxable ? "課税" : "非課税"}
                              </Badge>
                            </div>
                            <p className="text-xs text-muted-foreground">{getMenuTypeName(item.menuType)}</p>
                          </div>
                          <div className="text-right">
                            <p className="font-medium">
                              {item.unitPrice.toLocaleString()}円 × {item.totalQuantity}
                            </p>
                            <p className="text-sm font-bold">{item.totalPrice.toLocaleString()}円</p>
                          </div>
                        </div>
                      ))}
                      <div className="border-t pt-3 mt-3">
                        <div className="flex justify-between text-lg font-bold">
                          <span>合計金額:</span>
                          <span>{(currentTotals.totalAmount + currentTotals.totalTax).toLocaleString()}円</span>
                        </div>
                        {currentTotals.totalTax > 0 && (
                          <div className="flex justify-between text-sm text-muted-foreground">
                            <span>（うち消費税:</span>
                            <span>{currentTotals.totalTax.toLocaleString()}円）</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="staff" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">注文内容（従業員用）</CardTitle>
                </CardHeader>
                <CardContent>
                  {receiptItems.length === 0 ? (
                    <p className="text-muted-foreground text-center py-4">注文がありません</p>
                  ) : (
                    <div className="space-y-3">
                      {receiptItems.map((item) => (
                        <div key={item.id} className="flex justify-between items-center py-2 border-b last:border-b-0">
                          <div className="flex-1">
                            <div className="flex items-center space-x-2">
                              <span className="font-medium">{item.itemName}</span>
                              <Badge variant={item.isTaxable ? "destructive" : "secondary"} className="text-xs">
                                {item.isTaxable ? "課税" : "非課税"}
                              </Badge>
                            </div>
                            <p className="text-xs text-muted-foreground">{getMenuTypeName(item.menuType)}</p>
                            <p className="text-xs text-blue-600">注文者: {item.createdBy}</p>
                            <p className="text-xs text-muted-foreground">
                              {item.createdAt.toLocaleDateString("ja-JP")} {item.createdAt.toLocaleTimeString("ja-JP")}
                            </p>
                          </div>
                          <div className="flex items-center space-x-2">
                            <div className="text-right">
                              <p className="font-medium">
                                {item.unitPrice.toLocaleString()}円 × {item.quantity}
                              </p>
                              <p className="text-sm font-bold">{item.totalPrice.toLocaleString()}円</p>
                            </div>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDeleteReceiptItem(item.id, item.itemName)}
                              disabled={deletingItemId === item.id}
                              className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      ))}
                      <div className="border-t pt-3 mt-3">
                        <div className="flex justify-between text-lg font-bold">
                          <span>合計金額:</span>
                          <span>{(currentTotals.totalAmount + currentTotals.totalTax).toLocaleString()}円</span>
                        </div>
                        {currentTotals.totalTax > 0 && (
                          <div className="flex justify-between text-sm text-muted-foreground">
                            <span>（うち消費税:</span>
                            <span>{currentTotals.totalTax.toLocaleString()}円）</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          <div className="flex space-x-2 pt-4">
            <Button variant="outline" onClick={onClose} className="flex-1 bg-transparent">
              閉じる
            </Button>
            {receipt.status === "active" && (
              <Button onClick={handleCompleteReceipt} disabled={isCompleting} className="flex-1">
                <CheckCircle className="h-4 w-4 mr-2" />
                {isCompleting ? "完了中..." : "清算完了"}
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
