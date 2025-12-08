"use client"

import { useEffect, useState } from "react"
import { subscribeToUsers, deleteUser } from "@/lib/firestore"
import { isFirebaseConfigured } from "@/lib/firebase"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Trash2 } from "lucide-react"

interface User {
  id: string
  name: string
  isOnline: boolean
  lastActivity: Date
  createdAt: Date
}

export function OnlineUsers() {
  const [users, setUsers] = useState<User[]>([])
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!isFirebaseConfigured()) {
      console.log("[v0] 👥 Firebase設定不完全、ユーザーリスナーをスキップ")
      setError("v0プレビュー環境ではFirebaseが利用できません。Vercelにデプロイすると正常に動作します。")
      return
    }

    try {
      const unsubscribe = subscribeToUsers(setUsers, (error) => {
        console.error("[v0] OnlineUsers subscription error:", error)
        setError("v0プレビュー環境ではFirebaseが利用できません。Vercelにデプロイすると正常に動作します。")
      })
      return unsubscribe
    } catch (error) {
      console.error("[v0] OnlineUsers initialization error:", error)
      setError("v0プレビュー環境ではFirebaseが利用できません。Vercelにデプロイすると正常に動作します。")
      return () => {} // Return empty cleanup function
    }
  }, [])

  const handleDeleteUser = async (userId: string, userName: string) => {
    if (!isFirebaseConfigured()) {
      alert("v0プレビュー環境ではFirebaseが利用できません。Vercelにデプロイしてください。")
      return
    }

    if (confirm(`${userName}を削除しますか？`)) {
      try {
        await deleteUser(userId)
      } catch (error) {
        console.error("[v0] Delete user error:", error)
        alert("ユーザー削除に失敗しました。Firebase設定を確認してください。")
      }
    }
  }

  if (error) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            ユーザー状況
            <Badge variant="secondary">設定が必要</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4">
            <p className="text-muted-foreground mb-2">{error}</p>
            <p className="text-sm text-muted-foreground">Project Settingsで環境変数を設定してください。</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  const onlineUsers = users.filter((user) => user.isOnline)
  const offlineUsers = users.filter((user) => !user.isOnline)

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          ユーザー状況
          <Badge variant="secondary">{users.length}人</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {onlineUsers.length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-green-600 mb-2">オンライン ({onlineUsers.length}人)</h4>
              <div className="space-y-2">
                {onlineUsers.map((user) => (
                  <div key={user.id} className="flex items-center justify-between p-2 bg-green-50 rounded-md">
                    <span className="font-medium">{user.name}</span>
                    <div className="flex items-center gap-2">
                      <Badge variant="default" className="bg-green-500">
                        オンライン
                      </Badge>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleDeleteUser(user.id, user.name)}
                        className="h-6 w-6 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {offlineUsers.length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-gray-600 mb-2">オフライン ({offlineUsers.length}人)</h4>
              <div className="space-y-2">
                {offlineUsers.map((user) => (
                  <div key={user.id} className="flex items-center justify-between p-2 bg-gray-50 rounded-md">
                    <span className="text-gray-700">{user.name}</span>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary">オフライン</Badge>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleDeleteUser(user.id, user.name)}
                        className="h-6 w-6 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {users.length === 0 && <p className="text-muted-foreground text-center py-4">まだユーザーがいません</p>}
        </div>
      </CardContent>
    </Card>
  )
}
