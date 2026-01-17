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
  const [hasBeenAuthorized, setHasBeenAuthorized] = useState(false)

  useEffect(() => {
    // 1. 認証情報の読み込み中
    if (loading) {
      console.log("[AuthGuard] Loading is true. Path:", pathname);
      // すでに一度認証されている場合は、読み込み中でもコンテンツを表示し続ける（チラつき防止）
      if (hasBeenAuthorized) {
        setIsAuthorized(true);
      } else {
        setIsAuthorized(false);
      }
      return;
    }

    // 2. ログインしていない場合
    if (!user) {
      // すでに一度認証されている場合、一時的なnullの可能性があるため、即座にリダイレクトしない
      // ページ遷移や再レンダリング時の認証情報のチラつきを完全に防止する
      const isAuthStored = typeof window !== "undefined" && localStorage.getItem("is_authenticated") === "true";
      if (hasBeenAuthorized || isAuthStored) {
        console.log("[AuthGuard] User is null but was previously authorized. Maintaining view. Path:", pathname);
        setIsAuthorized(true);
        return;
      }

      // ランキングページは未ログインでも閲覧可能にする
      if (pathname === "/rankings") {
        setIsAuthorized(true);
        return;
      }
      // すでにログインページにいる場合は何もしない
      if (pathname === "/store-login" || pathname === "/customer-auth") {
        setIsAuthorized(true);
        return
      }

      console.log("[AuthGuard] User is null, initiating redirect. Path:", pathname);
      setIsAuthorized(false);
      
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

    // 3. ログインしている場合 - 権限チェック
    setHasBeenAuthorized(true);
    if (typeof window !== "undefined") {
      localStorage.setItem("is_authenticated", "true");
    }

    // ロールチェック
    console.log("[AuthGuard] Role Check:", { role: user.role, pathname, isCustomer, isStoreOwner });
    
    if (allowedRoles && allowedRoles.length > 0) {
      const userRole = user.role
      if (!allowedRoles.includes(userRole)) {
        console.log("[AuthGuard] 権限不足:", userRole, "許可:", allowedRoles)
        // 権限がない場合はトップまたは適切なダッシュボードへ
        if (userRole === "customer" || isCustomer) {
          setIsAuthorized(true); // プレイヤーならランキングは見れるはず
          return
        } else if (isStoreOwner || isEmployee) {
          router.replace("/admin")
        } else {
          router.replace("/")
        }
        return
      }
    } else {
      // デフォルトでは店舗オーナー、従業員、またはプレイヤーを許可
      // ランキングページは誰でも（プレイヤー含む）見れるようにする
      if (pathname === "/rankings") {
        console.log("[AuthGuard] Allowing access to rankings for role:", user.role);
        setIsAuthorized(true);
        return;
      }

      if (user.role !== "store_owner" && user.role !== "employee" && user.role !== "customer") {
        console.log("[AuthGuard] デフォルト権限不足:", user.role)
        if (user.role === "customer" || isCustomer) {
          router.replace("/rankings")
        } else {
          router.replace("/")
        }
        return
      }
    }

    // すべてのチェックをパス
    setIsAuthorized(true)
  }, [user, loading, allowedRoles, pathname])

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
