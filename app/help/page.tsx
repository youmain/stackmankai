"use client"

import { AuthGuard } from "@/components/auth-guard"
import { Header } from "@/components/header"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Users, Receipt, TrendingUp, Plus, Edit, Eye, Calculator } from "lucide-react"

export default function HelpPage() {
  return (
    <AuthGuard>
      <div className="min-h-screen bg-gray-50">
        <Header />
        <main className="container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold text-gray-900 mb-4">スタックマン！使い方ガイド</h1>
              <p className="text-lg text-gray-600">ポーカー店向け売上管理システムの操作方法を説明します</p>
            </div>

            <div className="grid gap-8">
              {/* プレイヤー管理 */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Users className="h-6 w-6 text-blue-600" />
                    <span>プレイヤー管理</span>
                  </CardTitle>
                  <CardDescription>プレイヤーの登録・管理・ゲーム参加を行います</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <h3 className="font-semibold mb-3 flex items-center space-x-2">
                        <Plus className="h-4 w-4" />
                        <span>プレイヤー登録</span>
                      </h3>
                      <ol className="list-decimal list-inside space-y-2 text-sm">
                        <li>「プレイヤー追加」ボタンをクリック</li>
                        <li>プレイヤー名とふりがなを入力</li>
                        <li>「登録」ボタンで完了</li>
                      </ol>
                    </div>
                    <div>
                      <h3 className="font-semibold mb-3 flex items-center space-x-2">
                        <Edit className="h-4 w-4" />
                        <span>ゲーム参加</span>
                      </h3>
                      <ol className="list-decimal list-inside space-y-2 text-sm">
                        <li>プレイヤーカードの「ゲーム開始」をクリック</li>
                        <li>購入金額を入力</li>
                        <li>「開始」ボタンでゲーム参加</li>
                      </ol>
                    </div>
                  </div>
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <h4 className="font-medium text-blue-900 mb-2">💡 ポイント</h4>
                    <ul className="text-sm text-blue-800 space-y-1">
                      <li>• プレイヤーカードには残高と購入金額が表示されます</li>
                      <li>• ゲーム中のプレイヤーには「プレイ中」バッジが表示されます</li>
                      <li>• レーキ合計は全プレイヤーのレーキを自動集計します</li>
                    </ul>
                  </div>
                </CardContent>
              </Card>

              {/* 伝票管理 */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Receipt className="h-6 w-6 text-green-600" />
                    <span>伝票管理</span>
                  </CardTitle>
                  <CardDescription>注文の作成・管理・清算を行います</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <h3 className="font-semibold mb-3 flex items-center space-x-2">
                        <Plus className="h-4 w-4" />
                        <span>伝票作成（方法1：ゲーム開始時）</span>
                      </h3>
                      <ol className="list-decimal list-inside space-y-2 text-sm">
                        <li>プレイヤー管理でプレイヤーの「ゲーム開始」をクリック</li>
                        <li>「同時に伝票作成」チェックボックスを選択</li>
                        <li>「ゲーム開始」ボタンでゲーム参加と伝票作成を同時実行</li>
                      </ol>
                    </div>
                    <div>
                      <h3 className="font-semibold mb-3 flex items-center space-x-2">
                        <Plus className="h-4 w-4" />
                        <span>伝票作成（方法2：独立作成）</span>
                      </h3>
                      <ol className="list-decimal list-inside space-y-2 text-sm">
                        <li>伝票管理ページで「新規伝票作成」ボタンをクリック</li>
                        <li>お客様名を入力</li>
                        <li>「伝票作成」ボタンで独立した伝票を作成</li>
                      </ol>
                    </div>
                  </div>
                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <h3 className="font-semibold mb-3 flex items-center space-x-2">
                        <Eye className="h-4 w-4" />
                        <span>伝票詳細確認</span>
                      </h3>
                      <ol className="list-decimal list-inside space-y-2 text-sm">
                        <li>伝票カードをクリック</li>
                        <li>注文一覧と合計金額を確認</li>
                        <li>個別注文の削除も可能</li>
                      </ol>
                    </div>
                    <div>
                      <h3 className="font-semibold mb-3 flex items-center space-x-2">
                        <Calculator className="h-4 w-4" />
                        <span>清算完了</span>
                      </h3>
                      <ol className="list-decimal list-inside space-y-2 text-sm">
                        <li>伝票カードの「清算完了」をクリック</li>
                        <li>伝票が完了状態に変更</li>
                        <li>売上履歴に反映される</li>
                      </ol>
                    </div>
                  </div>
                  <div className="bg-green-50 p-4 rounded-lg">
                    <h4 className="font-medium text-green-900 mb-2">💡 ポイント</h4>
                    <ul className="text-sm text-green-800 space-y-1">
                      <li>• プレイヤーと紐づけた伝票はゲーム開始時に作成します</li>
                      <li>• 独立伝票はプレイヤー以外のお客様用です</li>
                      <li>• 伝票には税込み・税抜きの自動計算機能があります</li>
                      <li>• 清算完了した伝票は売上履歴で確認できます</li>
                      <li>• 伝票の削除にはパスワードが必要です</li>
                    </ul>
                  </div>
                </CardContent>
              </Card>

              {/* 売上管理 */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <TrendingUp className="h-6 w-6 text-purple-600" />
                    <span>売上管理</span>
                  </CardTitle>
                  <CardDescription>日別・月別の売上確認と履歴管理を行います</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <h3 className="font-semibold mb-3">日別売上タブ</h3>
                      <ul className="list-disc list-inside space-y-2 text-sm">
                        <li>今日の売上・レーキ・実質売上を表示</li>
                        <li>今月の売上合計も確認可能</li>
                        <li>売上確定ボタンで日次確定処理</li>
                      </ul>
                    </div>
                    <div>
                      <h3 className="font-semibold mb-3">月別売上タブ</h3>
                      <ul className="list-disc list-inside space-y-2 text-sm">
                        <li>月間サマリーと日別履歴を表示</li>
                        <li>前月・次月の切り替えが可能</li>
                        <li>各日の詳細をクリックで確認</li>
                      </ul>
                    </div>
                  </div>
                  <div className="bg-purple-50 p-4 rounded-lg">
                    <h4 className="font-medium text-purple-900 mb-2">💡 ポイント</h4>
                    <ul className="text-sm text-purple-800 space-y-1">
                      <li>• 売上履歴をクリックすると確定済み伝票一覧が表示されます</li>
                      <li>• 実質売上 = 売上 + レーキで計算されます</li>
                      <li>• 売上確定時にレーキと購入金額がリセットされます</li>
                    </ul>
                  </div>
                </CardContent>
              </Card>

              {/* システム概要 */}
              <Card>
                <CardHeader>
                  <CardTitle>システム概要</CardTitle>
                  <CardDescription>スタックマン！の基本的な流れ</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="bg-gray-50 p-6 rounded-lg">
                    <h3 className="font-semibold mb-4">基本的な運用フロー</h3>
                    <div className="flex flex-wrap gap-2 mb-4">
                      <Badge variant="outline">1. プレイヤー登録</Badge>
                      <span>→</span>
                      <Badge variant="outline">2. ゲーム参加</Badge>
                      <span>→</span>
                      <Badge variant="outline">3. 伝票作成</Badge>
                      <span>→</span>
                      <Badge variant="outline">4. 注文追加</Badge>
                      <span>→</span>
                      <Badge variant="outline">5. 清算完了</Badge>
                      <span>→</span>
                      <Badge variant="outline">6. 売上確認</Badge>
                    </div>
                    <p className="text-sm text-gray-600">
                      このシステムはポーカー店の日常業務を効率化し、売上管理を自動化します。
                      各機能は連携しており、プレイヤーの参加から売上確定まで一貫して管理できます。
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </main>
      </div>
    </AuthGuard>
  )
}
