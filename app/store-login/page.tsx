"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { loginStore, loginStoreOwner } from "@/lib/firestore-stores"

export default function StoreLoginPage() {
  const router = useRouter()
  const [loginType, setLoginType] = useState<"employee" | "owner">("employee")
  
  // 従業員ログイン用
  const [storeCode, setStoreCode] = useState("")
  const [storePassword, setStorePassword] = useState("")
  
  // オーナーログイン用
  const [ownerEmail, setOwnerEmail] = useState("")
  const [ownerPassword, setOwnerPassword] = useState("")
  
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const handleEmployeeLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setLoading(true)

    try {
      const store = await loginStore(storeCode, storePassword)
      
      if (!store) {
        setError("店舗コードまたはパスワードが正しくありません")
        setLoading(false)
        return
      }

      // localStorageに店舗情報を保存
      localStorage.setItem("storeId", store.id)
      localStorage.setItem("storeCode", store.storeCode)
      localStorage.setItem("storeName", store.name)
      localStorage.setItem("storeEmail", store.email)
      localStorage.setItem("isStoreOwner", "false")

      // ダッシュボードへリダイレクト
      router.push("/admin")
    } catch (err) {
      console.error("ログインエラー:", err)
      setError("ログインに失敗しました。もう一度お試しください。")
      setLoading(false)
    }
  }

  const handleOwnerLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setLoading(true)

    try {
      const store = await loginStoreOwner(ownerEmail, ownerPassword)
      
      if (!store) {
        setError("メールアドレスまたはパスワードが正しくありません")
        setLoading(false)
        return
      }

      // localStorageに店舗情報を保存
      localStorage.setItem("storeId", store.id)
      localStorage.setItem("storeCode", store.storeCode)
      localStorage.setItem("storeName", store.name)
      localStorage.setItem("storeEmail", store.email)
      localStorage.setItem("isStoreOwner", "true")

      // ダッシュボードへリダイレクト
      router.push("/admin")
    } catch (err) {
      console.error("ログインエラー:", err)
      setError("ログインに失敗しました。もう一度お試しください。")
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">ログイン</h1>
          <p className="text-gray-600">ポーカー店舗管理システム</p>
        </div>

        {/* ログインタイプ切り替え */}
        <div className="flex mb-6 bg-gray-100 rounded-lg p-1">
          <button
            onClick={() => setLoginType("employee")}
            className={`flex-1 py-2 rounded-md font-semibold transition-colors ${
              loginType === "employee"
                ? "bg-white text-blue-600 shadow"
                : "text-gray-600 hover:text-gray-800"
            }`}
          >
            従業員
          </button>
          <button
            onClick={() => setLoginType("owner")}
            className={`flex-1 py-2 rounded-md font-semibold transition-colors ${
              loginType === "owner"
                ? "bg-white text-blue-600 shadow"
                : "text-gray-600 hover:text-gray-800"
            }`}
          >
            オーナー
          </button>
        </div>

        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
            {error}
          </div>
        )}

        {loginType === "employee" ? (
          <form onSubmit={handleEmployeeLogin} className="space-y-4">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
              <p className="text-sm text-blue-800">
                店舗コード（3桁の数字）とパスワードを入力してください
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                店舗コード
              </label>
              <input
                type="text"
                value={storeCode}
                onChange={(e) => setStoreCode(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-center text-2xl tracking-widest font-bold"
                placeholder="123"
                maxLength={3}
                pattern="[0-9]{3}"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                店舗パスワード
              </label>
              <input
                type="password"
                value={storePassword}
                onChange={(e) => setStorePassword(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="パスワードを入力"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {loading ? "ログイン中..." : "ログイン"}
            </button>
          </form>
        ) : (
          <form onSubmit={handleOwnerLogin} className="space-y-4">
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 mb-4">
              <p className="text-sm text-purple-800">
                オーナー専用のメールアドレスとパスワードでログインしてください
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                メールアドレス
              </label>
              <input
                type="email"
                value={ownerEmail}
                onChange={(e) => setOwnerEmail(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder="owner@example.com"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                パスワード
              </label>
              <input
                type="password"
                value={ownerPassword}
                onChange={(e) => setOwnerPassword(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder="パスワードを入力"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-purple-600 text-white py-3 rounded-lg font-semibold hover:bg-purple-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {loading ? "ログイン中..." : "ログイン"}
            </button>
          </form>
        )}

        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600">
            店舗をまだ登録していませんか？{" "}
            <button
              onClick={() => router.push("/store-register")}
              className="text-blue-600 hover:underline font-semibold"
            >
              新規登録
            </button>
          </p>
        </div>
      </div>
    </div>
  )
}
