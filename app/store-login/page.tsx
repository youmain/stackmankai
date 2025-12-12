"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { loginStoreOwner } from "@/lib/firestore-stores"
import { loginEmployee } from "@/lib/firestore-employees"
import type { EmployeeLoginData } from "@/types/employee"

export default function StoreLoginPage() {
  const router = useRouter()
  const [loginType, setLoginType] = useState<"employee" | "owner">("employee")
  
  // 従業員ログイン用
  const [employeeData, setEmployeeData] = useState<EmployeeLoginData>({
    storeCode: "",
    username: "",
    password: "",
  })
  
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
      const employee = await loginEmployee(employeeData)
      
      if (!employee) {
        setError("店舗コード、ユーザー名、またはパスワードが正しくありません")
        setLoading(false)
        return
      }

      // localStorageに店舗情報と従業員情報を保存
      localStorage.setItem("storeId", employee.storeId)
      localStorage.setItem("storeName", employee.storeName)
      localStorage.setItem("storeCode", employee.storeCode)
      localStorage.setItem("isStoreOwner", "false")
      localStorage.setItem("employeeUsername", employee.username)
      localStorage.setItem("employeeName", employee.displayName)
      localStorage.setItem("userName", employee.displayName)
      localStorage.setItem("uid", employee.uid)

      // ダッシュボードへリダイレクト
      router.push("/admin")
    } catch (err: any) {
      console.error("従業員ログインエラー:", err)
      if (err.code === 'auth/wrong-password') {
        setError("パスワードが間違っています")
      } else if (err.code === 'auth/user-not-found') {
        setError("ユーザーが見つかりません。店舗コードとユーザー名を確認してください")
      } else {
        setError("ログインに失敗しました。もう一度お試しください")
      }
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
      localStorage.setItem("userName", store.name)
      localStorage.setItem("isStoreOwner", "true")

      // ダッシュボードへリダイレクト
      router.push("/admin")
    } catch (err) {
      console.error("オーナーログインエラー:", err)
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
                ? "bg-white text-purple-600 shadow"
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
                店舗コード、ユーザー名、パスワードを入力してください
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                店舗コード
              </label>
              <input
                type="text"
                value={employeeData.storeCode}
                onChange={(e) => setEmployeeData({ ...employeeData, storeCode: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-center text-2xl tracking-widest font-bold"
                placeholder="510"
                maxLength={3}
                pattern="[0-9]{3}"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                ユーザー名
              </label>
              <input
                type="text"
                value={employeeData.username}
                onChange={(e) => setEmployeeData({ ...employeeData, username: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="山田太郎"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                パスワード
              </label>
              <input
                type="password"
                value={employeeData.password}
                onChange={(e) => setEmployeeData({ ...employeeData, password: e.target.value })}
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

            <div className="text-center text-sm text-gray-600 mt-4">
              <p>
                初めての方は{" "}
                <button
                  type="button"
                  onClick={() => router.push("/employee-register")}
                  className="text-blue-600 hover:text-blue-700 font-semibold"
                >
                  従業員登録
                </button>
              </p>
            </div>
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
