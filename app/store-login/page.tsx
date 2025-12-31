"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { signInWithEmailAndPassword, waitForAuthState } from "@/lib/firebase-auth"
import { getUserData, createOrUpdateUserData } from "@/lib/firestore"
import type { UserData } from "@/lib/firestore"

export default function StoreLoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setLoading(true)

    try {
      const startAuth = Date.now()
      // Firebase Authでログイン
      const userCredential = await signInWithEmailAndPassword(email, password)
      const user = userCredential.user
      
      console.log("[StoreLogin] Firebase Authログイン成功:", user.email)
      
      // 認証状態の伝播を待機 (最大5秒)
      const startWait = Date.now()
      await waitForAuthState(user.uid, 5000)
      const endWait = Date.now()
      console.log(`[StoreLogin] waitForAuthState完了: ${endWait - startWait}ms`)
      
      // Firestoreからユーザーデータを取得
      const userData = await getUserData(user.uid)
      const endFirestore = Date.now()
      console.log(`[StoreLogin] Firestoreデータ取得完了: ${endFirestore - startFirestore}ms`)
      
      if (!userData) {
        setError("ユーザーデータが見つかりません。管理者にお問い合わせください。")
        setLoading(false)
        return
      }
      
      // 店舗オーナーまたは従業員のみログイン可能
      if (userData.role !== "store_owner" && userData.role !== "employee") {
        setError("店舗オーナーまたは従業員としてログインしてください。")
        setLoading(false)
        return
      }
      
      console.log("[StoreLogin] ユーザーデータ取得成功:", {
        role: userData.role,
        storeId: userData.storeId,
        storeName: userData.storeName,
      })
      
      // ダッシュボードへリダイレクト
      router.push("/admin")
    } catch (err: any) {
      console.error("[StoreLogin] ログインエラー:", err)
      if (err.code === "auth/wrong-password" || err.code === "auth/invalid-credential") {
        setError("メールアドレスまたはパスワードが正しくありません")
      } else if (err.code === "auth/user-not-found") {
        setError("ユーザーが見つかりません")
      } else if (err.code === "auth/invalid-email") {
        setError("メールアドレスの形式が正しくありません")
      } else {
        setError("ログインに失敗しました。もう一度お試しください")
      }
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">店舗ログイン</h1>
          <p className="text-gray-600">店舗オーナー・従業員用</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
              メールアドレス
            </label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="store@example.com"
              required
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
              パスワード
            </label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="••••••••"
              required
            />
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "ログイン中..." : "ログイン"}
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600">
            アカウントをお持ちでない場合は、
            <a href="/store-register" className="text-blue-600 hover:text-blue-700 font-medium">
              新規登録
            </a>
          </p>
        </div>

        <div className="mt-4 text-center">
          <p className="text-sm text-gray-600">
            顧客の方は
            <a href="/customer-auth" className="text-blue-600 hover:text-blue-700 font-medium">
              こちら
            </a>
          </p>
        </div>
      </div>
    </div>
  )
}
