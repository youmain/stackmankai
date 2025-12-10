"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { registerStore } from "@/lib/firestore-stores"
import type { StoreRegistrationData } from "@/types/store"

export default function StoreRegisterPage() {
  const router = useRouter()
  const [formData, setFormData] = useState<StoreRegistrationData>({
    name: "",
    email: "",
    ownerEmail: "",
    ownerPassword: "",
    storePassword: "",
    phone: "",
    address: "",
    description: "",
  })
  const [confirmPassword, setConfirmPassword] = useState("")
  const [confirmStorePassword, setConfirmStorePassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [generatedCode, setGeneratedCode] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    // バリデーション
    if (!formData.name || !formData.email || !formData.ownerEmail || !formData.ownerPassword || !formData.storePassword) {
      setError("必須項目を入力してください")
      return
    }

    if (formData.ownerPassword !== confirmPassword) {
      setError("オーナーパスワードが一致しません")
      return
    }

    if (formData.storePassword !== confirmStorePassword) {
      setError("店舗パスワードが一致しません")
      return
    }

    if (formData.ownerPassword.length < 6) {
      setError("オーナーパスワードは6文字以上で設定してください")
      return
    }

    if (formData.storePassword.length < 4) {
      setError("店舗パスワードは4文字以上で設定してください")
      return
    }

    setLoading(true)

    try {
      const result = await registerStore(formData)
      setGeneratedCode(result.storeCode)

      // localStorageに店舗情報を保存
      localStorage.setItem("storeId", result.storeId)
      localStorage.setItem("storeCode", result.storeCode)
      localStorage.setItem("storeName", formData.name)
      localStorage.setItem("storeEmail", formData.email)
      localStorage.setItem("isStoreOwner", "true")

      // 成功メッセージを表示後、ダッシュボードへリダイレクト
      setTimeout(() => {
        router.push("/store-dashboard")
      }, 5000)
    } catch (err) {
      console.error("店舗登録エラー:", err)
      setError("店舗登録に失敗しました。もう一度お試しください。")
      setLoading(false)
    }
  }

  if (generatedCode) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full text-center">
          <div className="mb-6">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h1 className="text-3xl font-bold text-gray-800 mb-2">登録完了！</h1>
            <p className="text-gray-600">店舗の登録が完了しました</p>
          </div>

          <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-6 mb-6">
            <p className="text-sm text-gray-600 mb-2">あなたの店舗コード</p>
            <div className="text-6xl font-bold text-blue-600 tracking-wider mb-2">
              {generatedCode}
            </div>
            <p className="text-xs text-gray-500">このコードは従業員がログインする際に使用します</p>
          </div>

          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
            <div className="flex items-start">
              <svg className="w-5 h-5 text-yellow-600 mr-2 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              <div className="text-left">
                <p className="text-sm font-semibold text-yellow-800 mb-1">重要</p>
                <p className="text-xs text-yellow-700">
                  このコードは必ず控えてください。従業員がログインする際に必要です。
                </p>
              </div>
            </div>
          </div>

          <p className="text-sm text-gray-500 mb-4">
            5秒後に自動的にダッシュボードに移動します...
          </p>

          <button
            onClick={() => router.push("/store-dashboard")}
            className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
          >
            今すぐダッシュボードへ
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-2xl w-full">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">店舗登録</h1>
          <p className="text-gray-600">ポーカー店舗管理システムへようこそ</p>
        </div>

        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* 店舗情報 */}
          <div className="border-b pb-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">店舗情報</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  店舗名 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="例: ポーカースポット東京"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  店舗メールアドレス <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="store@example.com"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  電話番号
                </label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="03-1234-5678"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  住所
                </label>
                <input
                  type="text"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="東京都渋谷区..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  店舗説明
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows={3}
                  placeholder="店舗の特徴や雰囲気など..."
                />
              </div>
            </div>
          </div>

          {/* オーナー情報 */}
          <div className="border-b pb-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">オーナー情報</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  オーナーメールアドレス <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  value={formData.ownerEmail}
                  onChange={(e) => setFormData({ ...formData, ownerEmail: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="owner@example.com"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">
                  オーナー専用のログインに使用します
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  オーナーパスワード <span className="text-red-500">*</span>
                </label>
                <input
                  type="password"
                  value={formData.ownerPassword}
                  onChange={(e) => setFormData({ ...formData, ownerPassword: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="6文字以上"
                  required
                  minLength={6}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  オーナーパスワード（確認） <span className="text-red-500">*</span>
                </label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="もう一度入力"
                  required
                />
              </div>
            </div>
          </div>

          {/* 店舗パスワード（従業員用） */}
          <div>
            <h2 className="text-xl font-semibold text-gray-800 mb-4">従業員ログイン設定</h2>
            
            <div className="space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                <p className="text-sm text-blue-800">
                  <strong>店舗パスワード</strong>は、従業員が店舗コードと組み合わせてログインする際に使用します。
                  登録後、3桁の店舗コードが自動生成されます。
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  店舗パスワード <span className="text-red-500">*</span>
                </label>
                <input
                  type="password"
                  value={formData.storePassword}
                  onChange={(e) => setFormData({ ...formData, storePassword: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="4文字以上"
                  required
                  minLength={4}
                />
                <p className="text-xs text-gray-500 mt-1">
                  従業員と共有するパスワードです。覚えやすいものを設定してください。
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  店舗パスワード（確認） <span className="text-red-500">*</span>
                </label>
                <input
                  type="password"
                  value={confirmStorePassword}
                  onChange={(e) => setConfirmStorePassword(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="もう一度入力"
                  required
                />
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {loading ? "登録中..." : "店舗を登録"}
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600">
            すでにアカウントをお持ちですか？{" "}
            <button
              onClick={() => router.push("/store-login")}
              className="text-blue-600 hover:underline font-semibold"
            >
              ログイン
            </button>
          </p>
        </div>
      </div>
    </div>
  )
}
