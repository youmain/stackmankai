"use client"

import type React from "react"
import { useEffect, useState } from "react"
import { useRouter, usePathname } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"

interface AuthGuardProps {
  children: React.ReactNode
  allowedRoles?: ("store_owner" | "employee" | "customer")[]
}

export function AuthGuard({ children, allowedRoles }: AuthGuardProps) {
  const { user, loading, isStoreOwner, isEmployee, isCustomer } = useAuth()
  const router = useRouter()
  const pathname = usePathname()
  const [isAuthorized, setIsAuthorized] = useState(false)

  useEffect(() => {
    // 認証情報の読み込み完了を待つ
    if (loading) return

    // ログインしていない場合
    if (!user) {
      console.log("[AuthGuard] 未ログイン: ログインページへリダイレクト", pathname)
      if (pathname === "/rankings") {
        console.log("[AuthGuard] Rankings page access allowed for guest (temporarily for debug)");
        setIsAuthorized(true);
        return;
      }
      // すでにログインページにいる場合は何もしない
      if (pathname === "/store-login" || pathname === "/customer-auth") {
        return
      }
      
      // 現在のパスに応じて適切なログインページへ
      if (pathname.startsWith("/admin") || pathname.startsWith("/players") || 
          pathname.startsWith("/receipts") || pathname.startsWith("/daily-sales") ||
          pathname.startsWith("/store-settings") || pathname.startsWith("/employee-management") ||
          pathname.startsWith("/store-ranking-settings")) {
        router.replace("/store-login")
      } else {
        router.replace("/customer-auth")
      }
      return
    }

    // ロールチェック
    if (allowedRoles && allowedRoles.length > 0) {
      const userRole = user.role
      if (!allowedRoles.includes(userRole)) {
        console.log("[AuthGuard] 権限不足:", userRole, "許可:", allowedRoles)
        // 権限がない場合はトップまたは適切なダッシュボードへ
        if (isCustomer) {
          router.replace("/rankings")
        } else if (isStoreOwner || isEmployee) {
          router.replace("/admin")
        } else {
          router.replace("/")
        }
        return
      }
    } else {
      // デフォルトでは店舗オーナー、従業員、またはプレイヤーを許可
      if (user.role !== "store_owner" && user.role !== "employee" && user.role !== "customer") {
        console.log("[AuthGuard] デフォルト権限不足:", user.role)
        if (isCustomer) {
          router.replace("/rankings")
        } else {
          router.replace("/")
        }
        return
      }
    }

    // すべてのチェックをパス
    setIsAuthorized(true)
  }, [user, loading, allowedRoles, router, pathname, isStoreOwner, isEmployee, isCustomer])

  // 読み込み中または未承認の場合は何も表示しない（またはローディングスピナー）
  if (loading || !isAuthorized) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="flex flex-col items-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
          <p className="text-gray-600 font-medium">認証を確認中...</p>
        </div>
      </div>
    )
  }

  return <>{children}</>
}
