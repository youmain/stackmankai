"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { addReceiptItem } from "@/lib/firestore"
import type { MenuType, MenuCategory } from "@/types"
import { useAuth } from "@/contexts/auth-context"
import { handleError, handleSuccess, handleValidationError } from "@/lib/error-handler"

interface OrderAddModalProps {
  open: boolean
  onClose: () => void
  receiptId: string
  playerName: string
}

const menuCategories: MenuCategory[] = [
  { type: "tournament", name: "トーナメント", isTaxable: false, description: "トーナメント参加費" },
  { type: "rebuy", name: "リバイ", isTaxable: false, description: "リバイ・アドオン" },
  { type: "charge", name: "チャージ", isTaxable: true, description: "チャージ料金" },
  { type: "drink", name: "ドリンク", isTaxable: true, description: "飲み物" },
  { type: "food", name: "食事", isTaxable: true, description: "食べ物" },
  { type: "other", name: "その他", isTaxable: true, description: "その他のサービス" },
  { type: "other_non_taxable", name: "その他（非課税）", isTaxable: false, description: "その他の非課税サービス" }, // その他（非課税）メニューを追加
]

export function OrderAddModal({ open, onClose, receiptId, playerName }: OrderAddModalProps) {
  const { userName } = useAuth()
  const [selectedMenuType, setSelectedMenuType] = useState<MenuType | "">("")
  const [itemName, setItemName] = useState("")
  const [unitPrice, setUnitPrice] = useState("")
  const [quantity, setQuantity] = useState("1")
  const [isAdding, setIsAdding] = useState(false)

  const selectedCategory = menuCategories.find((cat) => cat.type === selectedMenuType)
  const unitPriceValue = Number.parseInt(unitPrice) || 0
  const quantityValue = Number.parseInt(quantity) || 1
  const totalPrice = unitPriceValue * quantityValue
  const taxAmount = selectedCategory?.isTaxable ? Math.floor(totalPrice * 0.1) : 0

  const getDisplayItemName = () => {
    if (selectedMenuType === "other") {
      return itemName
    }
    if (selectedMenuType === "other_non_taxable") {
      return itemName
    }
    return selectedCategory?.name || ""
  }

  const handleAddOrder = async () => {
    const displayItemName = getDisplayItemName()

    if (!selectedMenuType || !displayItemName || unitPriceValue <= 0 || quantityValue <= 0) {
      handleValidationError("全ての項目を正しく入力してください")
      return
    }

    if ((selectedMenuType === "other" || selectedMenuType === "other_non_taxable") && !itemName.trim()) {
      handleValidationError("その他を選択した場合は商品名を入力してください")
      return
    }

    setIsAdding(true)
    try {
      await addReceiptItem(receiptId, {
        receiptId,
        menuType: selectedMenuType as any,
        itemName: displayItemName,
        unitPrice: unitPriceValue,
        quantity: quantityValue,
        totalPrice: unitPriceValue * quantityValue,
        isTaxable: true,
        createdBy: userName || "system",
        createdAt: new Date(),
      })

      handleSuccess(`${displayItemName} × ${quantityValue} を追加しました`)

      // フォームをリセット
      setSelectedMenuType("")
      setItemName("")
      setUnitPrice("")
      setQuantity("1")
      onClose()
    } catch (error) {
      console.error("❌ 注文追加エラー:", error)
      handleError(error, "注文追加")
    } finally {
      setIsAdding(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{playerName} - 注文追加</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="menuType">メニュー種類</Label>
            <Select value={selectedMenuType} onValueChange={(value) => setSelectedMenuType(value as MenuType)}>
              <SelectTrigger>
                <SelectValue placeholder="メニュー種類を選択" />
              </SelectTrigger>
              <SelectContent>
                {menuCategories.map((category) => (
                  <SelectItem key={category.type} value={category.type}>
                    <div className="flex items-center justify-between w-full">
                      <span>{category.name}</span>
                      <Badge variant={category.isTaxable ? "destructive" : "secondary"} className="ml-2 text-xs">
                        {category.isTaxable ? "課税" : "非課税"}
                      </Badge>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selectedCategory && <p className="text-xs text-muted-foreground">{selectedCategory.description}</p>}
          </div>

          {(selectedMenuType === "other" || selectedMenuType === "other_non_taxable") && ( // その他（非課税）でも商品名入力フィールドを表示
            <div className="space-y-2">
              <Label htmlFor="itemName">商品名</Label>
              <Input
                id="itemName"
                placeholder="商品名を入力"
                value={itemName}
                onChange={(e) => setItemName(e.target.value)}
              />
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="unitPrice">単価</Label>
              <Input
                id="unitPrice"
                type="number"
                placeholder="単価"
                value={unitPrice}
                onChange={(e) => setUnitPrice(e.target.value)}
                min="0"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="quantity">数量</Label>
              <Input
                id="quantity"
                type="number"
                placeholder="数量"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                min="1"
              />
            </div>
          </div>

          {selectedMenuType && getDisplayItemName() && unitPriceValue > 0 && (
            <Card className="bg-blue-50">
              <CardContent className="pt-4">
                <div className="text-sm space-y-2">
                  <div className="flex justify-between">
                    <span>商品:</span>
                    <span className="font-medium">{getDisplayItemName()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>単価:</span>
                    <span className="font-medium">{unitPriceValue.toLocaleString()}円</span>
                  </div>
                  <div className="flex justify-between">
                    <span>数量:</span>
                    <span className="font-medium">{quantityValue}個</span>
                  </div>
                  <div className="flex justify-between">
                    <span>小計:</span>
                    <span className="font-medium">{totalPrice.toLocaleString()}円</span>
                  </div>
                  {selectedCategory?.isTaxable && (
                    <div className="flex justify-between text-red-600">
                      <span>消費税:</span>
                      <span className="font-medium">{taxAmount.toLocaleString()}円</span>
                    </div>
                  )}
                  <div className="flex justify-between border-t pt-2 font-bold">
                    <span>合計:</span>
                    <span>{(totalPrice + taxAmount).toLocaleString()}円</span>
                  </div>
                  <div className="flex justify-between">
                    <span>税区分:</span>
                    <Badge variant={selectedCategory?.isTaxable ? "destructive" : "secondary"}>
                      {selectedCategory?.isTaxable ? "課税" : "非課税"}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          <div className="flex space-x-2 pt-4">
            <Button variant="outline" onClick={onClose} className="flex-1 bg-transparent">
              キャンセル
            </Button>
            <Button
              onClick={handleAddOrder}
              disabled={
                !selectedMenuType || !getDisplayItemName() || unitPriceValue <= 0 || quantityValue <= 0 || isAdding
              }
              className="flex-1"
            >
              {isAdding ? "追加中..." : "注文追加"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
