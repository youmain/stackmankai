"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"

export default function StoreDashboardPage() {
  const router = useRouter()
  const [storeInfo, setStoreInfo] = useState({
    storeId: "",
    storeCode: "",
    storeName: "",
    storeEmail: "",
    isStoreOwner: false,
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // localStorageから店舗情報を取得
    const storeId = localStorage.getItem("storeId")
    const storeCode = localStorage.getItem("storeCode")
    const storeName = localStorage.getItem("storeName")
    const storeEmail = localStorage.getItem("storeEmail")
    const isStoreOwner = localStorage.getItem("isStoreOwner") === "true"

    if (!storeId || !storeCode) {
      // ログインしていない場合はログインページへ
      router.push("/store-login")
      return
    }

    setStoreInfo({
      storeId,
      storeCode,
      storeName: storeName || "",
      storeEmail: storeEmail || "",
      isStoreOwner,
    })
    setLoading(false)
  }, [router])

  const handleLogout = () => {
    localStorage.removeItem("storeId")
    localStorage.removeItem("storeCode")
    localStorage.removeItem("storeName")
    localStorage.removeItem("storeEmail")
    localStorage.removeItem("isStoreOwner")
    router.push("/store-login")
  }

  const handleGoToMainApp = () => {
    router.push("/")
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">読み込み中...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50">
      {/* ヘッダー */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-800">{storeInfo.storeName}</h1>
              <p className="text-sm text-gray-600">
                {storeInfo.isStoreOwner ? "オーナーアカウント" : "従業員アカウント"}
              </p>
            </div>
            <button
              onClick={handleLogout}
              className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
            >
              ログアウト
            </button>
          </div>
        </div>
      </header>

      {/* メインコンテンツ */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 店舗コード表示 */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-gray-800 mb-2">店舗コード</h2>
              <p className="text-sm text-gray-600 mb-4">
                従業員がログインする際に使用するコードです
              </p>
              <div className="text-5xl font-bold text-blue-600 tracking-wider">
                {storeInfo.storeCode}
              </div>
            </div>
            <div className="bg-blue-50 rounded-full p-6">
              <svg className="w-16 h-16 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
          </div>
        </div>

        {/* 店舗情報 */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">店舗情報</h2>
          <div className="space-y-3">
            <div className="flex justify-between py-2 border-b">
              <span className="text-gray-600">店舗ID</span>
              <span className="font-mono text-sm text-gray-800">{storeInfo.storeId}</span>
            </div>
            <div className="flex justify-between py-2 border-b">
              <span className="text-gray-600">メールアドレス</span>
              <span className="text-gray-800">{storeInfo.storeEmail}</span>
            </div>
            <div className="flex justify-between py-2">
              <span className="text-gray-600">ステータス</span>
              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold bg-green-100 text-green-800">
                アクティブ
              </span>
            </div>
          </div>
        </div>

        {/* クイックアクション */}
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">クイックアクション</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <button
              onClick={handleGoToMainApp}
              className="flex items-center justify-between p-4 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl hover:from-blue-600 hover:to-blue-700 transition-all shadow-md hover:shadow-lg"
            >
              <div className="text-left">
                <div className="font-semibold mb-1">管理画面へ</div>
                <div className="text-sm opacity-90">プレイヤー管理・ゲーム管理</div>
              </div>
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>

            {storeInfo.isStoreOwner && (
              <>
                <button
                  onClick={() => router.push("/store-invites")}
                  className="flex items-center justify-between p-4 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-xl hover:from-green-600 hover:to-green-700 transition-all shadow-md hover:shadow-lg"
                >
                  <div className="text-left">
                    <div className="font-semibold mb-1">従業員管理</div>
                    <div className="text-sm opacity-90">招待コード発行・従業員一覧</div>
                  </div>
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </button>
                <button
                  onClick={() => alert("パスワード変更機能は近日実装予定です")}
                  className="flex items-center justify-between p-4 bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-xl hover:from-purple-600 hover:to-purple-700 transition-all shadow-md hover:shadow-lg"
                >
                  <div className="text-left">
                    <div className="font-semibold mb-1">パスワード変更</div>
                    <div className="text-sm opacity-90">店舗・オーナーパスワード</div>
                  </div>
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                  </svg>
                </button>
              </>
            )}
          </div>
        </div>

        {/* 統計情報（将来の拡張用） */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-xl shadow p-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-semibold text-gray-600">登録プレイヤー</h3>
              <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <div className="text-3xl font-bold text-gray-800">-</div>
            <p className="text-xs text-gray-500 mt-1">近日実装予定</p>
          </div>

          <div className="bg-white rounded-xl shadow p-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-semibold text-gray-600">アクティブゲーム</h3>
              <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="text-3xl font-bold text-gray-800">-</div>
            <p className="text-xs text-gray-500 mt-1">近日実装予定</p>
          </div>

          <div className="bg-white rounded-xl shadow p-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-semibold text-gray-600">今月の売上</h3>
              <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="text-3xl font-bold text-gray-800">-</div>
            <p className="text-xs text-gray-500 mt-1">近日実装予定</p>
          </div>
        </div>
      </main>
    </div>
  )
}
