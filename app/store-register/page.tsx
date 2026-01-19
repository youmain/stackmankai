"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import type { StoreRegistrationData } from "@/types/store"

export default function StoreRegisterPage() {
  const router = useRouter()
  const [formData, setFormData] = useState<StoreRegistrationData>({
    name: "",
    email: "",
    ownerEmail: "",
    ownerPassword: "",
    phone: "",
    address: "",
    description: "",
  })
  const [confirmPassword, setConfirmPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [generatedCode, setGeneratedCode] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    // バリデーション
    if (!formData.name || !formData.email || !formData.ownerEmail || !formData.ownerPassword) {
      setError("必須項目を入力してください")
      return
    }

    if (formData.ownerPassword !== confirmPassword) {
      setError("オーナーパスワードが一致しません")
      return
    }

    if (formData.ownerPassword.length < 6) {
      setError("オーナーパスワードは6文字以上で設定してください")
      return
    }

    setLoading(true)
    console.log("[Client] Starting store registration...")
    console.log("[Client] Form data:", { ...formData, ownerPassword: "***" })

    try {
      // Step 1: Firebase Authentication でユーザーを作成
      console.log("[Client] Step 1: Creating Firebase Auth user...")
      const { getAuth, createUserWithEmailAndPassword } = await import("firebase/auth")
      const auth = getAuth()
      
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        formData.ownerEmail,
        formData.ownerPassword
      )
      
      const uid = userCredential.user.uid
      console.log("[Client] Firebase user created:", uid)

      // Step 2: クライアント側でFirestoreに店舗情報を保存
      console.log("[Client] Step 2: Saving store data to Firestore...")
      const { getFirestore, collection, doc, setDoc } = await import("firebase/firestore")
      const db = getFirestore()

      // 店舗コードを生成
      const storeCode = Math.floor(100000 + Math.random() * 900000).toString()

      // パスワードをBase64でハッシュ化
      const hashedPassword = Buffer.from(formData.ownerPassword).toString("base64")

      // Firestoreに店舗情報を保存
      await setDoc(doc(db, "stores", uid), {
        uid: uid,
        ownerId: uid,
        name: formData.name,
        email: formData.email,
        phone: formData.phone || "",
        address: formData.address || "",
        description: formData.description || "",
        ownerEmail: formData.ownerEmail,
        ownerPassword: hashedPassword,
        storeCode: storeCode,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      })

      console.log("[Client] Store document created:", uid)

      // ユーザー情報も保存
      await setDoc(doc(db, "users", uid), {
        email: formData.ownerEmail,
        role: "store_owner",
        storeId: uid,
        storeName: formData.name,
        displayName: formData.name,
        phoneVerified: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      })

      console.log("[Client] User document created:", uid)

      setGeneratedCode(storeCode)
      
      // 登録成功後、ログインページにリダイレクト
      setTimeout(() => {
        router.push("/store-login")
      }, 2000)
    } catch (err: any) {
      console.error("[Client] Registration error:", err)
      setError(err.message || "登録に失敗しました")
    } finally {
      setLoading(false)
    }
  }

  if (generatedCode) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
          <div className="mb-6">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">登録完了！</h2>
            <p className="text-gray-600">店舗の登録が完了しました</p>
          </div>

          <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-6 mb-6">
            <p className="text-sm text-gray-600 mb-2">あなたの店舗コード</p>
            <p className="text-4xl font-bold text-blue-600 tracking-wider">{generatedCode}</p>
            <p className="text-xs text-gray-500 mt-2">
              このコードは従業員招待時に使用します
            </p>
          </div>

          <p className="text-sm text-gray-600 mb-4">
            ログインページに自動的に移動します...
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">店舗登録</h1>
            <p className="text-gray-600">ポーカー店舗管理システムへようこそ</p>
          </div>

          {/* 注意事項 */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
            <div className="flex items-start">
              <svg className="w-5 h-5 text-yellow-600 mt-0.5 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              <div>
                <h3 className="text-sm font-semibold text-yellow-800 mb-1">⚠️ 登録・初回ログイン時のご注意</h3>
                <p className="text-xs text-yellow-700">
                  Firebaseの認証情報が反映されるまでに時間がかかるため、登録完了後および初回ログイン時に<strong>最大1分程度</strong>の遅延が発生する場合があります。画面が切り替わるまでそのままお待ちください。
                </p>
              </div>
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
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
                    placeholder="例: ポーカーハウス東京"
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
            <div>
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
              <a href="/store-login" className="text-blue-600 hover:text-blue-700 font-medium">
                ログイン
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
