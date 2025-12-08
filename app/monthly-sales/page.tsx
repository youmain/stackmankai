"use client"

import { useState, useEffect } from "react"
import { AuthGuard } from "@/components/auth-guard"
import { Header } from "@/components/header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Calendar, TrendingUp, ChevronLeft, ChevronRight, Eye, DollarSign, Percent } from "lucide-react"
import { subscribeToDailySales } from "@/lib/firestore"
import type { DailySales } from "@/types"
import { SalesHistoryModal } from "@/components/sales-history-modal"

export default function MonthlySalesPage() {
  const [dailySales, setDailySales] = useState<DailySales[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedMonth, setSelectedMonth] = useState(() => {
    return new Date().toISOString().slice(0, 7) // YYYY-MM format
  })
  const [showHistoryModal, setShowHistoryModal] = useState(false)
  const [selectedSalesData, setSelectedSalesData] = useState<DailySales | null>(null)

  useEffect(() => {
    const unsubscribeDailySales = subscribeToDailySales(
      (data) => {
        setDailySales(data)
        setLoading(false)
      },
      (error) => {
        console.error("❌ 日別売上リスナーエラー:", error)
        setLoading(false)
      },
    )

    return () => {
      unsubscribeDailySales()
    }
  }, [])

  // 選択した月の売上データをフィルタリング
  const monthSalesData = dailySales.filter((sales) => sales.date.startsWith(selectedMonth))

  // 月間合計を計算
  const monthlyTotals = monthSalesData.reduce(
    (totals, sales) => ({
      salesAmount: totals.salesAmount + sales.salesAmount,
      rakeAmount: totals.rakeAmount + sales.rakeAmount,
      receiptCount: totals.receiptCount + sales.receiptCount,
    }),
    { salesAmount: 0, rakeAmount: 0, receiptCount: 0 },
  )

  const totalAmount = monthlyTotals.salesAmount + monthlyTotals.rakeAmount

  // 月の切り替え
  const handlePreviousMonth = () => {
    const date = new Date(selectedMonth + "-01")
    date.setMonth(date.getMonth() - 1)
    setSelectedMonth(date.toISOString().slice(0, 7))
  }

  const handleNextMonth = () => {
    const date = new Date(selectedMonth + "-01")
    date.setMonth(date.getMonth() + 1)
    setSelectedMonth(date.toISOString().slice(0, 7))
  }

  const handleViewSalesHistory = (salesData: DailySales) => {
    setSelectedSalesData(salesData)
    setShowHistoryModal(true)
  }

  // 月名を日本語で表示
  const getMonthDisplayName = (monthStr: string) => {
    const date = new Date(monthStr + "-01")
    return `${date.getFullYear()}年${date.getMonth() + 1}月`
  }

  if (loading) {
    return (
      <AuthGuard>
        <div className="min-h-screen bg-gray-50">
          <Header />
          <div className="container mx-auto p-6">
            <div className="flex items-center justify-center h-64">
              <div className="text-lg text-muted-foreground">読み込み中...</div>
            </div>
          </div>
        </div>
      </AuthGuard>
    )
  }

  return (
    <AuthGuard>
      <div className="min-h-screen bg-gray-50">
        <Header />
        <main className="container mx-auto px-3 py-4 sm:px-6 lg:px-8 sm:py-8">
          <div className="space-y-6">
            {/* ヘッダーと月選択 */}
            <div className="flex items-center justify-between">
              <h1 className="text-3xl font-bold flex items-center gap-2">
                <Calendar className="h-8 w-8" />
                月別売上管理
              </h1>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={handlePreviousMonth}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <div className="text-lg font-semibold min-w-[120px] text-center">
                  {getMonthDisplayName(selectedMonth)}
                </div>
                <Button variant="outline" size="sm" onClick={handleNextMonth}>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* 月間サマリー */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">月間売上</CardTitle>
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">¥{monthlyTotals.salesAmount.toLocaleString()}</div>
                  <p className="text-xs text-muted-foreground">{monthlyTotals.receiptCount}件の伝票</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">月間レーキ</CardTitle>
                  <Percent className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">¥{monthlyTotals.rakeAmount.toLocaleString()}</div>
                  <p className="text-xs text-muted-foreground">レーキ合計</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">実質売上</CardTitle>
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600">¥{totalAmount.toLocaleString()}</div>
                  <p className="text-xs text-muted-foreground">売上 + レーキ</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">営業日数</CardTitle>
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{monthSalesData.length}</div>
                  <p className="text-xs text-muted-foreground">日間</p>
                </CardContent>
              </Card>
            </div>

            {/* 日別売上一覧 */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  {getMonthDisplayName(selectedMonth)}の日別売上
                </CardTitle>
              </CardHeader>
              <CardContent>
                {monthSalesData.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    {getMonthDisplayName(selectedMonth)}の売上データがありません
                  </div>
                ) : (
                  <div className="space-y-3">
                    {monthSalesData
                      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                      .map((sales) => (
                        <div
                          key={sales.id}
                          className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                          onClick={() => handleViewSalesHistory(sales)}
                        >
                          <div className="flex items-center space-x-4">
                            <div className="text-lg font-medium">
                              {new Date(sales.date).toLocaleDateString("ja-JP", {
                                month: "short",
                                day: "numeric",
                                weekday: "short",
                              })}
                            </div>
                            <Badge variant="outline">{sales.receiptCount}件</Badge>
                          </div>
                          <div className="flex items-center space-x-6">
                            <div className="text-right space-y-1">
                              <div className="text-sm">
                                <span className="text-muted-foreground">売上:</span>
                                <span className="font-medium ml-2">¥{sales.salesAmount.toLocaleString()}</span>
                              </div>
                              <div className="text-sm">
                                <span className="text-muted-foreground">レーキ:</span>
                                <span className="font-medium ml-2">¥{sales.rakeAmount.toLocaleString()}</span>
                              </div>
                              <div className="text-sm font-bold text-green-600">
                                実質: ¥{(sales.salesAmount + sales.rakeAmount).toLocaleString()}
                              </div>
                            </div>
                            <Eye className="h-4 w-4 text-muted-foreground" />
                          </div>
                        </div>
                      ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </main>

        {selectedSalesData && (
          <SalesHistoryModal
            open={showHistoryModal}
            onClose={() => {
              setShowHistoryModal(false)
              setSelectedSalesData(null)
            }}
            salesData={selectedSalesData}
          />
        )}
      </div>
    </AuthGuard>
  )
}
