"use client"

import type React from "react"
import { useAuth } from "@/contexts/auth-context"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useRouter, usePathname } from "next/navigation"
import { useEffect, useState } from "react"

interface AuthGuardProps {
  children: React.ReactNode
}

export function AuthGuard({ children }: AuthGuardProps) {
  const { user, loading } = useAuth()
  const router = useRouter()
  const pathname = usePathname()
  const [isAuthorized, setIsAuthorized] = useState(false)

  useEffect(() => {
    // 読み込み中は判定しない
    if (loading) return

    if (!user || (user.role !== "store_owner" && user.role !== "employee")) {
      // 認証がない場合はログインページへ飛ばす
      // すでにログインページにいる場合は何もしない
      if (pathname !== "/store-login") {
        console.log("[AuthGuard] 未認証のためリダイレクト:", pathname)
        router.push("/store-login")
      }
    } else {
      // 認証成功
      setIsAuthorized(true)
    }
  }, [loading, user, router, pathname])

  // 読み込み中、または認証が確定していない場合はローディングを表示
  if (loading || !isAuthorized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-500 font-medium">認証を確認中...</p>
        </div>
      </div>
    )
  }

  // 顧客アカウントで管理画面にアクセスしようとした場合
  if (user && user.role === "customer") {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-gray-50">
        <div className="max-w-md w-full">
          <Alert className="border-red-200 bg-red-50">
            <AlertCircle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-800">
              <div className="space-y-3">
                <p className="font-bold">アクセス権限がありません</p>
                <p className="text-sm">このページは店舗管理者専用です。お客さん専用ページに戻ってください。</p>
                <Button
                  onClick={() => {
                    window.location.href = "/customer-view"
                  }}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                >
                  お客さん専用ページに戻る
                </Button>
              </div>
            </AlertDescription>
          </Alert>
        </div>
      </div>
    )
  }

  return <>{children}</>
}
