import { AuthGuard } from "@/components/auth-guard"
import { Header } from "@/components/header"
import { FirebaseConfigWarning } from "@/components/firebase-config-warning"
import Link from "next/link"
import { OnlineUsers } from "@/components/online-users"
import { Users, FileText, BarChart3, Trophy, Settings, ArrowLeft, UserCog } from "lucide-react"

export default function AdminPage() {
  return (
    <AuthGuard>
      <div className="min-h-screen bg-gray-50">
        <Header />
        <main className="container mx-auto px-4 py-8">
          <FirebaseConfigWarning />
          <div className="mb-6">
            <Link
              href="/"
              className="inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 hover:text-gray-900 transition-colors"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              トップページに戻る
            </Link>
          </div>

          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold mb-4">ポーカースタックマネージャー</h2>
            <p className="text-muted-foreground mb-8">店舗管理システムダッシュボード</p>
          </div>

          <div className="mb-8">
            <OnlineUsers />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
            <Link href="/players" className="block">
              <div className="bg-white p-6 rounded-lg shadow-sm border hover:shadow-md transition-shadow h-full">
                <div className="flex items-center mb-4">
                  <Users className="h-8 w-8 text-blue-600 mr-3" />
                  <h3 className="text-xl font-semibold">プレイヤー管理</h3>
                </div>
                <p className="text-muted-foreground mb-4">プレイヤーの登録・残高管理・履歴確認</p>
                <div className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors text-center">
                  プレイヤー管理へ
                </div>
              </div>
            </Link>

            <Link href="/receipts" className="block">
              <div className="bg-white p-6 rounded-lg shadow-sm border hover:shadow-md transition-shadow h-full">
                <div className="flex items-center mb-4">
                  <FileText className="h-8 w-8 text-green-600 mr-3" />
                  <h3 className="text-xl font-semibold">伝票管理</h3>
                </div>
                <p className="text-muted-foreground mb-4">注文伝票の作成・管理・清算処理</p>
                <div className="w-full bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 transition-colors text-center">
                  伝票管理へ
                </div>
              </div>
            </Link>

            <Link href="/daily-sales" className="block">
              <div className="bg-white p-6 rounded-lg shadow-sm border hover:shadow-md transition-shadow h-full">
                <div className="flex items-center mb-4">
                  <BarChart3 className="h-8 w-8 text-purple-600 mr-3" />
                  <h3 className="text-xl font-semibold">売上管理</h3>
                </div>
                <p className="text-muted-foreground mb-4">日別・月別売上の確認と履歴管理</p>
                <div className="w-full bg-purple-600 text-white py-2 px-4 rounded-md hover:bg-purple-700 transition-colors text-center">
                  売上管理へ
                </div>
              </div>
            </Link>

            <Link href="/rankings" className="block">
              <div className="bg-white p-6 rounded-lg shadow-sm border hover:shadow-md transition-shadow h-full">
                <div className="flex items-center mb-4">
                  <Trophy className="h-8 w-8 text-yellow-600 mr-3" />
                  <h3 className="text-xl font-semibold">ランキング</h3>
                </div>
                <p className="text-muted-foreground mb-4">プレイヤーランキングと統計情報</p>
                <div className="w-full bg-yellow-600 text-white py-2 px-4 rounded-md hover:bg-yellow-700 transition-colors text-center">
                  ランキングへ
                </div>
              </div>
            </Link>

            <Link href="/store-invites" className="block">
              <div className="bg-white p-6 rounded-lg shadow-sm border hover:shadow-md transition-shadow h-full">
                <div className="flex items-center mb-4">
                  <UserCog className="h-8 w-8 text-orange-600 mr-3" />
                  <h3 className="text-xl font-semibold">従業員管理</h3>
                </div>
                <p className="text-muted-foreground mb-4">従業員招待コードの発行と管理</p>
                <div className="w-full bg-orange-600 text-white py-2 px-4 rounded-md hover:bg-orange-700 transition-colors text-center">
                  従業員管理へ
                </div>
              </div>
            </Link>

            <Link href="/store-ranking-settings" className="block">
              <div className="bg-white p-6 rounded-lg shadow-sm border hover:shadow-md transition-shadow h-full">
                <div className="flex items-center mb-4">
                  <Settings className="h-8 w-8 text-gray-600 mr-3" />
                  <h3 className="text-xl font-semibold">店舗設定</h3>
                </div>
                <p className="text-muted-foreground mb-4">ランキング設定とプライズ管理</p>
                <div className="w-full bg-gray-600 text-white py-2 px-4 rounded-md hover:bg-gray-700 transition-colors text-center">
                  店舗設定へ
                </div>
              </div>
            </Link>

            <Link href="/help" className="block">
              <div className="bg-white p-6 rounded-lg shadow-sm border hover:shadow-md transition-shadow h-full">
                <div className="flex items-center mb-4">
                  <div className="h-8 w-8 bg-indigo-600 rounded-full flex items-center justify-center mr-3">
                    <span className="text-white font-bold text-sm">?</span>
                  </div>
                  <h3 className="text-xl font-semibold">使い方</h3>
                </div>
                <p className="text-muted-foreground mb-4">システムの使い方と操作説明</p>
                <div className="w-full bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700 transition-colors text-center">
                  使い方を見る
                </div>
              </div>
            </Link>
          </div>
        </main>
      </div>
    </AuthGuard>
  )
}
