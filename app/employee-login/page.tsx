"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { LogIn, Eye, EyeOff } from "lucide-react"
import { loginEmployee } from "@/lib/firestore-employees"
import type { EmployeeLoginData } from "@/types/employee"

export default function EmployeeLoginPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState<EmployeeLoginData>({
    storeCode: "",
    username: "",
    password: "",
  })
  const [showPassword, setShowPassword] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    setLoading(true)
    try {
      const employee = await loginEmployee(formData)

      if (!employee) {
        alert("ログインに失敗しました\n\n以下を確認してください：\n・店舗コードが正しいか\n・ユーザー名が正しいか\n・パスワードが正しいか")
        return
      }

      // localStorageに店舗情報を保存
      localStorage.setItem("storeId", employee.storeId)
      localStorage.setItem("storeName", employee.storeName)
      localStorage.setItem("storeCode", employee.storeCode)
      localStorage.setItem("isStoreOwner", "false")
      localStorage.setItem("employeeUsername", employee.username)
      localStorage.setItem("uid", employee.uid)

      alert(`ログインしました！\nようこそ、${employee.displayName}さん`)
      router.push("/admin")
    } catch (error: any) {
      console.error("従業員ログインエラー:", error)
      if (error.code === 'auth/wrong-password') {
        alert("パスワードが間違っています")
      } else if (error.code === 'auth/user-not-found') {
        alert("ユーザーが見つかりません\n店舗コードとユーザー名を確認してください")
      } else {
        alert("ログインに失敗しました\nもう一度お試しください")
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md">
        {/* ヘッダー */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
            <LogIn className="text-blue-600" size={32} />
          </div>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">従業員ログイン</h1>
          <p className="text-gray-600">店舗コードとユーザー名でログイン</p>
        </div>

        {/* フォーム */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* 店舗コード */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              店舗コード <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.storeCode}
              onChange={(e) => setFormData({ ...formData, storeCode: e.target.value })}
              placeholder="885"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-center text-2xl font-bold tracking-wider"
              required
              maxLength={3}
            />
            <p className="text-xs text-gray-500 mt-1">
              3桁の店舗コードを入力してください
            </p>
          </div>

          {/* ユーザー名 */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              ユーザー名 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.username}
              onChange={(e) => setFormData({ ...formData, username: e.target.value })}
              placeholder="tanaka_taro"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>

          {/* パスワード */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              パスワード <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                placeholder="••••••••"
                className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>

          {/* ログインボタン */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-blue-500 to-blue-600 text-white py-3 rounded-lg font-semibold hover:from-blue-600 hover:to-blue-700 transition-all shadow-md hover:shadow-lg disabled:from-gray-400 disabled:to-gray-400 disabled:cursor-not-allowed"
          >
            {loading ? "ログイン中..." : "ログイン"}
          </button>
        </form>

        {/* フッター */}
        <div className="mt-6 space-y-3">
          <div className="text-center text-sm text-gray-600">
            <p>
              初めての方は{" "}
              <button
                onClick={() => router.push("/employee-register")}
                className="text-blue-600 hover:text-blue-700 font-semibold"
              >
                従業員登録
              </button>
            </p>
          </div>
          
          <div className="text-center text-sm text-gray-600">
            <p>
              オーナーの方は{" "}
              <button
                onClick={() => router.push("/store-login")}
                className="text-purple-600 hover:text-purple-700 font-semibold"
              >
                店舗ログイン
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
