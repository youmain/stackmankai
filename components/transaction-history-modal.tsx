"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { collection, query, where, onSnapshot } from "firebase/firestore"
import { db } from "@/lib/firebase"
import type { Transaction, Player } from "@/types"

interface TransactionHistoryModalProps {
  open: boolean
  onClose: () => void
  player: Player
}

export function TransactionHistoryModal({ open, onClose, player }: TransactionHistoryModalProps) {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!open || !player.id || !db) return

    const q = query(collection(db, "transactions"), where("playerId", "==", player.id))

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const transactionList: Transaction[] = []
      snapshot.forEach((doc) => {
        const data = doc.data()
        transactionList.push({
          id: doc.id,
          playerId: data.playerId,
          gameId: data.gameId,
          type: data.type,
          amount: data.amount,
          balanceBefore: data.balanceBefore,
          balanceAfter: data.balanceAfter,
          description: data.description,
          createdAt: data.createdAt?.toDate() || new Date(),
          createdBy: data.createdBy,
        })
      })
      transactionList.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      setTransactions(transactionList)
      setLoading(false)
    })

    return unsubscribe
  }, [open, player.id])

  const getTransactionTypeLabel = (type: Transaction["type"]) => {
    switch (type) {
      case "deposit":
        return "入金"
      case "withdrawal":
        return "出金"
      case "game_buy_in":
        return "ゲーム参加"
      case "game_additional":
        return "追加購入"
      case "game_cashout":
        return "ゲーム終了"
      default:
        return type
    }
  }

  const getTransactionVariant = (type: Transaction["type"]) => {
    switch (type) {
      case "deposit":
        return "default"
      case "withdrawal":
        return "destructive"
      case "game_buy_in":
        return "secondary"
      case "game_additional":
        return "secondary"
      case "game_cashout":
        return "default"
      default:
        return "outline"
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl lg:max-w-4xl xl:max-w-5xl max-h-[90vh] w-[95vw] sm:w-full">
        <DialogHeader>
          <DialogTitle className="text-lg sm:text-xl">取引履歴 - {player.name}</DialogTitle>
        </DialogHeader>

        <ScrollArea className="h-[60vh] sm:h-96 lg:h-[70vh] w-full">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
            </div>
          ) : transactions.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">取引履歴がありません</div>
          ) : (
            <div className="space-y-3">
              {transactions.map((transaction) => (
                <div key={transaction.id} className="border rounded-lg p-3 sm:p-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-2 gap-2">
                    <Badge variant={getTransactionVariant(transaction.type)} className="w-fit">
                      {getTransactionTypeLabel(transaction.type)}
                    </Badge>
                    <span className="text-xs sm:text-sm text-muted-foreground">
                      {transaction.createdAt.toLocaleString("ja-JP")}
                    </span>
                  </div>
                  <div className="space-y-1">
                    <p className="font-medium text-sm sm:text-base">{transaction.description}</p>
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between text-xs sm:text-sm gap-1 sm:gap-0">
                      <span>金額: {Math.abs(transaction.amount).toLocaleString()}©</span>
                      <span className="text-xs sm:text-sm">
                        残高: {transaction.balanceBefore.toLocaleString()}© →{" "}
                        {transaction.balanceAfter.toLocaleString()}©
                      </span>
                    </div>
                    {transaction.createdBy && (
                      <div className="text-xs text-muted-foreground">操作者: {transaction.createdBy}</div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  )
}
