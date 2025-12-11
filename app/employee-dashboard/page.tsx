"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useAuth } from "@/contexts/auth-context"
import {
  Users,
  Receipt,
  BarChart3,
  Settings,
  LogOut,
  TrendingUp,
  DollarSign,
  Clock,
  AlertCircle,
  Gamepad2,
} from "lucide-react"
import Link from "next/link"

export default function EmployeeDashboard() {
  const router = useRouter()
  const { user, signOut } = useAuth()
  const [employeeData, setEmployeeData] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // 認証チェック
    if (!user) {
      router.push("/employee-login")
      return
    }

    // 従業員情報を取得（実装予定）
    // TODO: Firestoreから従業員情報を取得
    setIsLoading(false)
  }, [user, router])

  const handleSignOut = async () => {
    try {
      await signOut()
      router.push("/")
    } catch (error) {
      console.error("ログアウトエラー:", error)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-slate-600">読み込み中...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* ヘッダー */}
      <header className="bg-white shadow-sm border-b border-slate-200">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-gradient-to-r from-green-600 to-green-700 p-2 rounded-lg">
                <Users className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-slate-800">従業員ダッシュボード</h1>
                <p className="text-sm text-slate-600">
                  {employeeData?.storeName || "店舗名"} - {employeeData?.displayName || user?.email}
                </p>
              </div>
            </div>
            <Button onClick={handleSignOut} variant="outline" className="gap-2">
              <LogOut className="w-4 h-4" />
              ログアウト
            </Button>
          </div>
        </div>
      </header>

      {/* メインコンテンツ */}
      <main className="container mx-auto px-4 py-8">
        {/* ウェルカムメッセージ */}
        <Alert className="mb-6 bg-green-50 border-green-200">
          <AlertCircle className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">
            ようこそ！従業員ダッシュボードへ。業務を開始するには、下のメニューから操作を選択してください。
          </AlertDescription>
        </Alert>

        {/* クイックアクション */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {/* スタック管理 */}
          <Link href="/stack-manager">
            <Card className="hover:shadow-lg transition-all duration-300 cursor-pointer border-2 border-transparent hover:border-green-500">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="bg-gradient-to-r from-green-600 to-green-700 p-3 rounded-lg">
                    <Gamepad2 className="w-6 h-6 text-white" />
                  </div>
                  <CardTitle className="text-lg">スタック管理</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-slate-600">ゲーム中のプレイヤーのチップ残高を管理</p>
              </CardContent>
            </Card>
          </Link>

          {/* レシート入力 */}
          <Link href="/receipts">
            <Card className="hover:shadow-lg transition-all duration-300 cursor-pointer border-2 border-transparent hover:border-blue-500">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-3 rounded-lg">
                    <Receipt className="w-6 h-6 text-white" />
                  </div>
                  <CardTitle className="text-lg">レシート入力</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-slate-600">プレイヤーの会計処理とレシート発行</p>
              </CardContent>
            </Card>
          </Link>

          {/* プレイヤー管理 */}
          <Link href="/players">
            <Card className="hover:shadow-lg transition-all duration-300 cursor-pointer border-2 border-transparent hover:border-purple-500">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="bg-gradient-to-r from-purple-600 to-purple-700 p-3 rounded-lg">
                    <Users className="w-6 h-6 text-white" />
                  </div>
                  <CardTitle className="text-lg">プレイヤー管理</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-slate-600">プレイヤー情報の確認と編集</p>
              </CardContent>
            </Card>
          </Link>

          {/* ゲーム管理 */}
          <Link href="/games">
            <Card className="hover:shadow-lg transition-all duration-300 cursor-pointer border-2 border-transparent hover:border-orange-500">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="bg-gradient-to-r from-orange-600 to-orange-700 p-3 rounded-lg">
                    <Clock className="w-6 h-6 text-white" />
                  </div>
                  <CardTitle className="text-lg">ゲーム管理</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-slate-600">ゲームの開始・終了と履歴確認</p>
              </CardContent>
            </Card>
          </Link>

          {/* 売上確認 */}
          <Link href="/daily-sales">
            <Card className="hover:shadow-lg transition-all duration-300 cursor-pointer border-2 border-transparent hover:border-yellow-500">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="bg-gradient-to-r from-yellow-600 to-yellow-700 p-3 rounded-lg">
                    <DollarSign className="w-6 h-6 text-white" />
                  </div>
                  <CardTitle className="text-lg">売上確認</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-slate-600">日次・月次の売上データを確認</p>
              </CardContent>
            </Card>
          </Link>

          {/* ランキング確認 */}
          <Link href="/rankings">
            <Card className="hover:shadow-lg transition-all duration-300 cursor-pointer border-2 border-transparent hover:border-red-500">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="bg-gradient-to-r from-red-600 to-red-700 p-3 rounded-lg">
                    <TrendingUp className="w-6 h-6 text-white" />
                  </div>
                  <CardTitle className="text-lg">ランキング確認</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-slate-600">月間ランキングと統計データ</p>
              </CardContent>
            </Card>
          </Link>
        </div>

        {/* 今日の統計（実装予定） */}
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-center gap-3">
              <BarChart3 className="w-6 h-6 text-slate-700" />
              <CardTitle>今日の統計</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-4 gap-4">
              <div className="bg-gradient-to-br from-green-50 to-green-100 p-4 rounded-lg">
                <p className="text-sm text-green-700 font-medium">アクティブゲーム</p>
                <p className="text-3xl font-bold text-green-800 mt-2">-</p>
                <p className="text-xs text-green-600 mt-1">近日実装予定</p>
              </div>
              <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-lg">
                <p className="text-sm text-blue-700 font-medium">プレイヤー数</p>
                <p className="text-3xl font-bold text-blue-800 mt-2">-</p>
                <p className="text-xs text-blue-600 mt-1">近日実装予定</p>
              </div>
              <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-4 rounded-lg">
                <p className="text-sm text-purple-700 font-medium">今日の売上</p>
                <p className="text-3xl font-bold text-purple-800 mt-2">-</p>
                <p className="text-xs text-purple-600 mt-1">近日実装予定</p>
              </div>
              <div className="bg-gradient-to-br from-orange-50 to-orange-100 p-4 rounded-lg">
                <p className="text-sm text-orange-700 font-medium">レシート数</p>
                <p className="text-3xl font-bold text-orange-800 mt-2">-</p>
                <p className="text-xs text-orange-600 mt-1">近日実装予定</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* ヘルプ */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <Settings className="w-6 h-6 text-slate-700" />
              <CardTitle>ヘルプ・サポート</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-slate-600 mb-4">
              使い方が分からない場合は、各ページのヘルプボタンをクリックするか、店舗オーナーにお問い合わせください。
            </p>
            <Link href="/help">
              <Button variant="outline" className="gap-2">
                <AlertCircle className="w-4 h-4" />
                ヘルプページを見る
              </Button>
            </Link>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
