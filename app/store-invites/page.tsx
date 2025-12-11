"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Copy, Plus, Users, Calendar, CheckCircle, XCircle } from "lucide-react"
import { createInviteCode, getStoreInviteCodes, getStoreEmployees } from "@/lib/firestore-employees"
import type { InviteCode, Employee } from "@/types/employee"

export default function StoreInvitesPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [inviteCodes, setInviteCodes] = useState<InviteCode[]>([])
  const [employees, setEmployees] = useState<Employee[]>([])
  const [storeInfo, setStoreInfo] = useState<any>(null)
  const [copiedCode, setCopiedCode] = useState<string | null>(null)

  useEffect(() => {
    // 店舗情報を取得
    const storeId = localStorage.getItem("storeId")
    const storeName = localStorage.getItem("storeName")
    const storeCode = localStorage.getItem("storeCode")
    const isOwner = localStorage.getItem("isStoreOwner") === "true"

    if (!storeId || !storeName || !isOwner) {
      alert("オーナー権限が必要です")
      router.push("/store-login")
      return
    }

    setStoreInfo({ storeId, storeName, storeCode })
    loadData(storeId)
  }, [router])

  const loadData = async (storeId: string) => {
    try {
      const [codes, emps] = await Promise.all([
        getStoreInviteCodes(storeId),
        getStoreEmployees(storeId),
      ])
      setInviteCodes(codes)
      setEmployees(emps)
    } catch (error) {
      console.error("データ読み込みエラー:", error)
    }
  }

  const handleCreateInviteCode = async () => {
    if (!storeInfo) return

    setLoading(true)
    try {
      // 現在のユーザーのUIDを取得（Firebase Authから）
      const uid = localStorage.getItem("uid") || "unknown"
      
      const newCode = await createInviteCode(
        storeInfo.storeId,
        storeInfo.storeName,
        storeInfo.storeCode,
        uid,
        30, // 30日間有効
        -1  // 無制限使用
      )

      setInviteCodes([newCode, ...inviteCodes])
      alert(`招待コードを発行しました: ${newCode.code}`)
    } catch (error) {
      console.error("招待コード発行エラー:", error)
      alert("招待コードの発行に失敗しました")
    } finally {
      setLoading(false)
    }
  }

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code)
    setCopiedCode(code)
    setTimeout(() => setCopiedCode(null), 2000)
  }

  const formatDate = (timestamp: any) => {
    if (!timestamp) return "-"
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp)
    return date.toLocaleDateString("ja-JP")
  }

  const isExpired = (timestamp: any) => {
    if (!timestamp) return false
    const expiresAt = timestamp.toDate ? timestamp.toDate() : new Date(timestamp)
    return new Date() > expiresAt
  }

  if (!storeInfo) {
    return <div className="min-h-screen flex items-center justify-center">読み込み中...</div>
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 p-6">
      <div className="max-w-6xl mx-auto">
        {/* ヘッダー */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-800">従業員招待コード管理</h1>
              <p className="text-gray-600 mt-2">{storeInfo.storeName}</p>
            </div>
            <button
              onClick={handleCreateInviteCode}
              disabled={loading}
              className="flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors disabled:bg-gray-400"
            >
              <Plus size={20} />
              {loading ? "発行中..." : "新しい招待コードを発行"}
            </button>
          </div>
        </div>

        {/* 統計情報 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div className="bg-white rounded-xl shadow p-6">
            <div className="flex items-center gap-4">
              <div className="bg-blue-100 p-3 rounded-lg">
                <Users className="text-blue-600" size={24} />
              </div>
              <div>
                <p className="text-gray-600 text-sm">登録済み従業員</p>
                <p className="text-2xl font-bold text-gray-800">{employees.length}人</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow p-6">
            <div className="flex items-center gap-4">
              <div className="bg-green-100 p-3 rounded-lg">
                <CheckCircle className="text-green-600" size={24} />
              </div>
              <div>
                <p className="text-gray-600 text-sm">有効な招待コード</p>
                <p className="text-2xl font-bold text-gray-800">
                  {inviteCodes.filter(c => c.status === "active" && !isExpired(c.expiresAt)).length}個
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow p-6">
            <div className="flex items-center gap-4">
              <div className="bg-purple-100 p-3 rounded-lg">
                <Calendar className="text-purple-600" size={24} />
              </div>
              <div>
                <p className="text-gray-600 text-sm">総発行数</p>
                <p className="text-2xl font-bold text-gray-800">{inviteCodes.length}個</p>
              </div>
            </div>
          </div>
        </div>

        {/* 招待コード一覧 */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4">招待コード一覧</h2>
          
          {inviteCodes.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <p>招待コードがまだ発行されていません</p>
              <p className="text-sm mt-2">「新しい招待コードを発行」ボタンから作成してください</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4 text-gray-600 font-semibold">招待コード</th>
                    <th className="text-left py-3 px-4 text-gray-600 font-semibold">発行日</th>
                    <th className="text-left py-3 px-4 text-gray-600 font-semibold">有効期限</th>
                    <th className="text-left py-3 px-4 text-gray-600 font-semibold">使用回数</th>
                    <th className="text-left py-3 px-4 text-gray-600 font-semibold">ステータス</th>
                    <th className="text-left py-3 px-4 text-gray-600 font-semibold">操作</th>
                  </tr>
                </thead>
                <tbody>
                  {inviteCodes.map((code) => {
                    const expired = isExpired(code.expiresAt)
                    const active = code.status === "active" && !expired
                    
                    return (
                      <tr key={code.id} className="border-b hover:bg-gray-50">
                        <td className="py-3 px-4">
                          <span className="font-mono font-bold text-lg text-blue-600">
                            {code.code}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-gray-600">
                          {formatDate(code.createdAt)}
                        </td>
                        <td className="py-3 px-4 text-gray-600">
                          {formatDate(code.expiresAt)}
                        </td>
                        <td className="py-3 px-4 text-gray-600">
                          {code.usedCount} {code.maxUses === -1 ? "/ 無制限" : `/ ${code.maxUses}`}
                        </td>
                        <td className="py-3 px-4">
                          {active ? (
                            <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm font-semibold">
                              有効
                            </span>
                          ) : expired ? (
                            <span className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-sm font-semibold">
                              期限切れ
                            </span>
                          ) : (
                            <span className="bg-red-100 text-red-700 px-3 py-1 rounded-full text-sm font-semibold">
                              無効
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          <button
                            onClick={() => handleCopyCode(code.code)}
                            className="flex items-center gap-2 text-blue-600 hover:text-blue-700 font-semibold"
                          >
                            {copiedCode === code.code ? (
                              <>
                                <CheckCircle size={16} />
                                コピー済み
                              </>
                            ) : (
                              <>
                                <Copy size={16} />
                                コピー
                              </>
                            )}
                          </button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* 従業員一覧 */}
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4">登録済み従業員</h2>
          
          {employees.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <p>従業員がまだ登録されていません</p>
              <p className="text-sm mt-2">招待コードを発行して従業員に共有してください</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4 text-gray-600 font-semibold">ユーザー名</th>
                    <th className="text-left py-3 px-4 text-gray-600 font-semibold">表示名</th>
                    <th className="text-left py-3 px-4 text-gray-600 font-semibold">登録日</th>
                    <th className="text-left py-3 px-4 text-gray-600 font-semibold">使用した招待コード</th>
                    <th className="text-left py-3 px-4 text-gray-600 font-semibold">ステータス</th>
                  </tr>
                </thead>
                <tbody>
                  {employees.map((employee) => (
                    <tr key={employee.id} className="border-b hover:bg-gray-50">
                      <td className="py-3 px-4 font-semibold text-gray-800">
                        {employee.username}
                      </td>
                      <td className="py-3 px-4 text-gray-600">
                        {employee.displayName}
                      </td>
                      <td className="py-3 px-4 text-gray-600">
                        {formatDate(employee.createdAt)}
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-mono text-sm text-gray-600">
                          {employee.inviteCode}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        {employee.status === "active" ? (
                          <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm font-semibold">
                            アクティブ
                          </span>
                        ) : (
                          <span className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-sm font-semibold">
                            停止中
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* 戻るボタン */}
        <div className="mt-6 text-center">
          <button
            onClick={() => router.push("/store-dashboard")}
            className="text-blue-600 hover:text-blue-700 font-semibold"
          >
            ← ダッシュボードに戻る
          </button>
        </div>
      </div>
    </div>
  )
}
