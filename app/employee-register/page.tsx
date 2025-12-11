"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { UserPlus, Eye, EyeOff } from "lucide-react"
import { registerEmployee } from "@/lib/firestore-employees"
import type { EmployeeRegistrationData } from "@/types/employee"

export default function EmployeeRegisterPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState<EmployeeRegistrationData>({
    inviteCode: "",
    username: "",
    password: "",
    displayName: "",
  })
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (formData.password !== confirmPassword) {
      alert("パスワードが一致しません")
      return
    }

    if (formData.password.length < 6) {
      alert("パスワードは6文字以上で設定してください")
      return
    }

    setLoading(true)
    try {
      const employee = await registerEmployee(formData)
      
      // localStorageに店舗情報を保存
      localStorage.setItem("storeId", employee.storeId)
      localStorage.setItem("storeName", employee.storeName)
      localStorage.setItem("storeCode", employee.storeCode)
      localStorage.setItem("isStoreOwner", "false")
      localStorage.setItem("employeeUsername", employee.username)
      localStorage.setItem("uid", employee.uid)

      alert(`従業員登録が完了しました！\nユーザー名: ${employee.username}`)
      router.push("/admin")
    } catch (error: any) {
      console.error("従業員登録エラー:", error)
      if (error.message?.includes('招待コード')) {
        alert(error.message)
      } else if (error.message?.includes('ユーザー名')) {
        alert("このユーザー名は既に使用されています\n別のユーザー名を選んでください")
      } else if (error.code === 'auth/email-already-in-use') {
        alert("このアカウントは既に登録されています")
      } else if (error.code === 'auth/weak-password') {
        alert("パスワードが弱すぎます\n6文字以上で設定してください")
      } else {
        alert("従業員登録に失敗しました\n\n" + (error.message || "もう一度お試しください"))
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md">
        {/* ヘッダー */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
            <UserPlus className="text-green-600" size={32} />
          </div>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">従業員登録</h1>
          <p className="text-gray-600">招待コードを使って従業員アカウントを作成</p>
        </div>

        {/* フォーム */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* 招待コード */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              招待コード <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.inviteCode}
              onChange={(e) => setFormData({ ...formData, inviteCode: e.target.value.toUpperCase() })}
              placeholder="ABC-DEF-123"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent font-mono text-lg"
              required
            />
            <p className="text-xs text-gray-500 mt-1">
              オーナーから受け取った招待コードを入力してください
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
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              required
            />
            <p className="text-xs text-gray-500 mt-1">
              ログイン時に使用するユーザー名（ひらがな・漢字・英数字可）
            </p>
          </div>

          {/* 表示名（任意） */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              表示名（任意）
            </label>
            <input
              type="text"
              value={formData.displayName}
              onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
              placeholder="田中 太郎"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
            <p className="text-xs text-gray-500 mt-1">
              空欄の場合はユーザー名が表示名として使用されます
            </p>
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
                className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                required
                minLength={6}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              6文字以上で設定してください
            </p>
          </div>

          {/* パスワード確認 */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              パスワード確認 <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                type={showConfirmPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                required
                minLength={6}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
              >
                {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>

          {/* 登録ボタン */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-green-500 to-green-600 text-white py-3 rounded-lg font-semibold hover:from-green-600 hover:to-green-700 transition-all shadow-md hover:shadow-lg disabled:from-gray-400 disabled:to-gray-400 disabled:cursor-not-allowed"
          >
            {loading ? "登録中..." : "従業員登録"}
          </button>
        </form>

        {/* フッター */}
        <div className="mt-6 text-center text-sm text-gray-600">
          <p>
            既にアカウントをお持ちですか？{" "}
            <button
              onClick={() => router.push("/employee-login")}
              className="text-green-600 hover:text-green-700 font-semibold"
            >
              ログイン
            </button>
          </p>
        </div>
      </div>
    </div>
  )
}
