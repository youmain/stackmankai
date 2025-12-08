"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Users, TrendingUp, DollarSign, UserCheck, Search, Download, Eye, Bot } from "lucide-react"
import {
  subscribeToCustomerAccounts,
  subscribeToPlayers,
  updateCustomerSubscription,
  linkPlayerToCustomer,
} from "@/lib/firestore"
import type { CustomerAccount, PaymentHistory, Player } from "@/types"

export default function SubscriptionAdminPage() {
  const router = useRouter()
  const [customers, setCustomers] = useState<CustomerAccount[]>([])
  const [paymentHistory, setPaymentHistory] = useState<PaymentHistory[]>([])
  const [players, setPlayers] = useState<Player[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerAccount | null>(null)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isGeneratingAI, setIsGeneratingAI] = useState(false)
  const [aiGenerationResult, setAiGenerationResult] = useState<string | null>(null)

  useEffect(() => {
    // Simple session check - in production, use proper session management
    const isAuthenticated = sessionStorage.getItem("admin-authenticated")
    if (!isAuthenticated) {
      router.push("/admin-access")
      return
    }

    const unsubscribeCustomers = subscribeToCustomerAccounts(setCustomers)
    const unsubscribePlayers = subscribeToPlayers(setPlayers)

    return () => {
      unsubscribeCustomers()
      unsubscribePlayers()
    }
  }, [router])

  const filteredCustomers = customers.filter((customer) => {
    const matchesSearch =
      customer.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.playerName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.playerId?.includes(searchTerm)

    const matchesStatus = statusFilter === "all" || customer.subscriptionStatus === statusFilter

    return matchesSearch && matchesStatus
  })

  const getStatusBadge = (status: CustomerAccount["subscriptionStatus"]) => {
    const statusConfig = {
      active: { label: "有効", className: "bg-green-100 text-green-800 border-green-200" },
      inactive: { label: "無効", className: "bg-gray-100 text-gray-800 border-gray-200" },
      canceled: { label: "キャンセル", className: "bg-red-100 text-red-800 border-red-200" },
      past_due: { label: "支払い遅延", className: "bg-yellow-100 text-yellow-800 border-yellow-200" },
      trialing: { label: "試用中", className: "bg-blue-100 text-blue-800 border-blue-200" },
    }

    const config = statusConfig[status] || statusConfig.inactive
    return (
      <Badge className={config.className} variant="outline">
        {config.label}
      </Badge>
    )
  }

  const handleStatusUpdate = async (customerId: string, newStatus: CustomerAccount["subscriptionStatus"]) => {
    setIsLoading(true)
    try {
      await updateCustomerSubscription(customerId, {
        subscriptionId: `sub_${Math.random().toString(36).substring(2, 15)}`,
        subscriptionStatus: newStatus,
        currentPeriodStart: new Date(),
        currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
      })
    } catch (error) {
      console.error("❌ サブスクリプション状態更新エラー:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handlePlayerLink = async (customerId: string, playerId: string) => {
    setIsLoading(true)
    try {
      const player = players.find((p) => p.id === playerId)
      if (player) {
        await linkPlayerToCustomer(customerId, playerId, player.name)
      }
    } catch (error) {
      console.error("❌ プレイヤー紐づけエラー:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const calculateRevenue = () => {
    const activeCustomers = customers.filter((c) => c.subscriptionStatus === "active").length
    const monthlyRevenue = activeCustomers * 1650 // 月額1650円（税込）
    const projectedAnnualRevenue = monthlyRevenue * 12

    return {
      activeCustomers,
      monthlyRevenue,
      projectedAnnualRevenue,
    }
  }

  const revenue = calculateRevenue()

  const exportCustomerData = () => {
    const csvData = [
      ["メール", "プレイヤーID", "プレイヤー名", "サブスク状態", "作成日", "更新日"],
      ...filteredCustomers.map((customer) => [
        customer.email,
        customer.playerId || "",
        customer.playerName || "",
        customer.subscriptionStatus,
        customer.createdAt.toLocaleDateString("ja-JP"),
        customer.updatedAt.toLocaleDateString("ja-JP"),
      ]),
    ]

    const csvContent = csvData.map((row) => row.join(",")).join("\n")
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
    const link = document.createElement("a")
    const url = URL.createObjectURL(blob)
    link.setAttribute("href", url)
    link.setAttribute("download", `customers_${new Date().toISOString().split("T")[0]}.csv`)
    link.style.visibility = "hidden"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const handleGenerateAIComments = async () => {
    setIsGeneratingAI(true)
    setAiGenerationResult(null)

    try {
      const response = await fetch("/api/generate-ai-comments")
      const data = await response.json()

      if (data.success) {
        setAiGenerationResult(`✅ ${data.message}`)
      } else {
        setAiGenerationResult(`❌ エラー: ${data.message}`)
      }
    } catch (error) {
      console.error("[v0] AIコメント生成エラー:", error)
      setAiGenerationResult("❌ AIコメント生成に失敗しました")
    } finally {
      setIsGeneratingAI(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="mb-4">
          <Link
            href="/legal"
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            特定商取引法に戻る
          </Link>
        </div>

        {/* ヘッダー */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">サブスクリプション管理</h1>
            <p className="text-gray-600">お客さんアカウントとサブスクリプションの監視・管理</p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              onClick={handleGenerateAIComments}
              variant="outline"
              className="flex items-center gap-2 bg-transparent"
              disabled={isGeneratingAI}
            >
              <Bot className="h-4 w-4" />
              {isGeneratingAI ? "AI生成中..." : "AIコメント生成"}
            </Button>
            <Button onClick={exportCustomerData} variant="outline" className="flex items-center gap-2 bg-transparent">
              <Download className="h-4 w-4" />
              CSVエクスポート
            </Button>
          </div>
        </div>

        {aiGenerationResult && (
          <Card className="border-blue-200 bg-blue-50">
            <CardContent className="pt-6">
              <p className="text-sm">{aiGenerationResult}</p>
            </CardContent>
          </Card>
        )}

        {/* 統計カード */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">総顧客数</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{customers.length}</div>
              <p className="text-xs text-muted-foreground">登録済みアカウント</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">アクティブ会員</CardTitle>
              <UserCheck className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{revenue.activeCustomers}</div>
              <p className="text-xs text-muted-foreground">有効なサブスクリプション</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">月間売上</CardTitle>
              <DollarSign className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">¥{revenue.monthlyRevenue.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">今月の予想売上</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">年間予想売上</CardTitle>
              <TrendingUp className="h-4 w-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-600">
                ¥{revenue.projectedAnnualRevenue.toLocaleString()}
              </div>
              <p className="text-xs text-muted-foreground">現在のペースで計算</p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="customers" className="space-y-6">
          <TabsList>
            <TabsTrigger value="customers">顧客管理</TabsTrigger>
            <TabsTrigger value="analytics">分析</TabsTrigger>
          </TabsList>

          <TabsContent value="customers" className="space-y-6">
            {/* 検索・フィルター */}
            <Card>
              <CardHeader>
                <CardTitle>顧客検索・フィルター</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="flex-1">
                    <Label htmlFor="search">検索</Label>
                    <div className="relative">
                      <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <Input
                        id="search"
                        placeholder="メール、プレイヤー名、IDで検索..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                  </div>
                  <div className="w-full sm:w-48">
                    <Label htmlFor="status-filter">ステータス</Label>
                    <select
                      id="status-filter"
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="all">全て</option>
                      <option value="active">有効</option>
                      <option value="inactive">無効</option>
                      <option value="canceled">キャンセル</option>
                      <option value="past_due">支払い遅延</option>
                      <option value="trialing">試用中</option>
                    </select>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* 顧客一覧 */}
            <Card>
              <CardHeader>
                <CardTitle>顧客一覧 ({filteredCustomers.length}件)</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {filteredCustomers.length > 0 ? (
                    filteredCustomers.map((customer) => (
                      <div
                        key={customer.id}
                        className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="font-medium">{customer.email}</h3>
                            {getStatusBadge(customer.subscriptionStatus)}
                          </div>
                          <div className="text-sm text-gray-600 space-y-1">
                            {customer.playerId ? (
                              <p>
                                プレイヤーID: {customer.playerId}
                                {customer.playerName && ` (${customer.playerName})`}
                              </p>
                            ) : (
                              <p className="text-orange-600">プレイヤーID未紐づけ</p>
                            )}
                            <p>作成日: {customer.createdAt.toLocaleDateString("ja-JP")}</p>
                            {customer.currentPeriodEnd && (
                              <p>次回更新: {customer.currentPeriodEnd.toLocaleDateString("ja-JP")}</p>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button variant="outline" size="sm">
                                <Eye className="h-4 w-4" />
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-2xl">
                              <DialogHeader>
                                <DialogTitle>顧客詳細: {customer.email}</DialogTitle>
                              </DialogHeader>
                              <div className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                  <div>
                                    <Label>メールアドレス</Label>
                                    <p className="text-sm">{customer.email}</p>
                                  </div>
                                  <div>
                                    <Label>サブスクリプション状態</Label>
                                    <div className="mt-1">{getStatusBadge(customer.subscriptionStatus)}</div>
                                  </div>
                                  <div>
                                    <Label>プレイヤーID</Label>
                                    <p className="text-sm">{customer.playerId || "未設定"}</p>
                                  </div>
                                  <div>
                                    <Label>プレイヤー名</Label>
                                    <p className="text-sm">{customer.playerName || "未設定"}</p>
                                  </div>
                                  <div>
                                    <Label>Stripe顧客ID</Label>
                                    <p className="text-sm font-mono">{customer.stripeCustomerId}</p>
                                  </div>
                                  <div>
                                    <Label>サブスクリプションID</Label>
                                    <p className="text-sm font-mono">{customer.subscriptionId || "未設定"}</p>
                                  </div>
                                </div>

                                <div className="space-y-3">
                                  <Label>管理操作</Label>
                                  <div className="flex flex-wrap gap-2">
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => handleStatusUpdate(customer.id, "active")}
                                      disabled={isLoading}
                                    >
                                      有効化
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => handleStatusUpdate(customer.id, "inactive")}
                                      disabled={isLoading}
                                    >
                                      無効化
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => handleStatusUpdate(customer.id, "canceled")}
                                      disabled={isLoading}
                                    >
                                      キャンセル
                                    </Button>
                                  </div>
                                </div>

                                {!customer.playerId && (
                                  <div className="space-y-3">
                                    <Label>プレイヤー紐づけ</Label>
                                    <div className="flex gap-2">
                                      <select
                                        className="flex-1 px-3 py-2 border border-gray-300 rounded-md"
                                        onChange={(e) => {
                                          if (e.target.value) {
                                            handlePlayerLink(customer.id, e.target.value)
                                          }
                                        }}
                                        disabled={isLoading}
                                      >
                                        <option value="">プレイヤーを選択...</option>
                                        {players.map((player) => (
                                          <option key={player.id} value={player.id}>
                                            {player.name} (ID: {player.uniqueId || player.id})
                                          </option>
                                        ))}
                                      </select>
                                    </div>
                                  </div>
                                )}
                              </div>
                            </DialogContent>
                          </Dialog>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <Users className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                      <p>条件に一致する顧客が見つかりません</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="analytics" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>サブスクリプション状態別分布</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {[
                      { status: "active", label: "有効", color: "bg-green-500" },
                      { status: "inactive", label: "無効", color: "bg-gray-500" },
                      { status: "canceled", label: "キャンセル", color: "bg-red-500" },
                      { status: "past_due", label: "支払い遅延", color: "bg-yellow-500" },
                      { status: "trialing", label: "試用中", color: "bg-blue-500" },
                    ].map(({ status, label, color }) => {
                      const count = customers.filter((c) => c.subscriptionStatus === status).length
                      const percentage = customers.length > 0 ? (count / customers.length) * 100 : 0
                      return (
                        <div key={status} className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className={`w-3 h-3 rounded-full ${color}`} />
                            <span className="text-sm">{label}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium">{count}人</span>
                            <span className="text-xs text-gray-500">({percentage.toFixed(1)}%)</span>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>プレイヤー紐づけ状況</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {(() => {
                      const linkedCount = customers.filter((c) => c.playerId).length
                      const unlinkedCount = customers.length - linkedCount
                      const linkedPercentage = customers.length > 0 ? (linkedCount / customers.length) * 100 : 0

                      return (
                        <>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <div className="w-3 h-3 rounded-full bg-green-500" />
                              <span className="text-sm">紐づけ済み</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-medium">{linkedCount}人</span>
                              <span className="text-xs text-gray-500">({linkedPercentage.toFixed(1)}%)</span>
                            </div>
                          </div>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <div className="w-3 h-3 rounded-full bg-orange-500" />
                              <span className="text-sm">未紐づけ</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-medium">{unlinkedCount}人</span>
                              <span className="text-xs text-gray-500">({(100 - linkedPercentage).toFixed(1)}%)</span>
                            </div>
                          </div>
                        </>
                      )
                    })()}
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>売上予測</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center p-4 bg-blue-50 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">¥{revenue.monthlyRevenue.toLocaleString()}</div>
                    <div className="text-sm text-blue-600">今月の売上</div>
                  </div>
                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <div className="text-2xl font-bold text-green-600">
                      ¥{(revenue.monthlyRevenue * 3).toLocaleString()}
                    </div>
                    <div className="text-sm text-green-600">四半期予想</div>
                  </div>
                  <div className="text-center p-4 bg-purple-50 rounded-lg">
                    <div className="text-2xl font-bold text-purple-600">
                      ¥{revenue.projectedAnnualRevenue.toLocaleString()}
                    </div>
                    <div className="text-sm text-purple-600">年間予想</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
