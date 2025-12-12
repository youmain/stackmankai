"use client"

import type React from "react"
import { createContext, useContext, useEffect, useState } from "react"
import { isFirebaseConfigured } from "@/lib/firebase"
import { createOrUpdateUser, updateUserOnlineStatus } from "@/lib/firestore"
import type { CustomerAccount } from "@/types"
import { handleFirebaseError, handleError } from "@/lib/error-handler"

interface AuthContextType {
  user: { uid: string; email: string | null } | null
  userName: string | null
  userId: string | null
  userType: "admin" | "customer" | null
  customerAccount: CustomerAccount | null
  loading: boolean
  error: string | null
  setUserName: (name: string) => void
  setCustomerAccount: (account: CustomerAccount) => void
  signOut: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [userName, setUserNameState] = useState<string | null>(null)
  const [userId, setUserId] = useState<string | null>(null)
  const [userType, setUserType] = useState<"admin" | "customer" | null>(null)
  const [customerAccount, setCustomerAccountState] = useState<CustomerAccount | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        if (!isFirebaseConfigured()) {
          console.warn("[v0] ⚠️ v0プレビュー環境ではFirebaseが利用できません。")
          console.warn("[v0] Vercelにデプロイすると正常に動作します。")
          setLoading(false)
          return
        }

        // sessionStorageから認証情報を取得
        let savedUserName = sessionStorage.getItem("auth_userName")
        let savedUserId = sessionStorage.getItem("auth_userId")
        let savedUserType = sessionStorage.getItem("auth_userType") as "admin" | "customer" | null
        const savedCustomerAccount = sessionStorage.getItem("auth_customerAccount")

        // sessionStorageになければlocalStorageから取得（従業員/オーナーログイン用）
        if (!savedUserName || !savedUserId) {
          const storeId = localStorage.getItem("storeId")
          const userName = localStorage.getItem("userName") || localStorage.getItem("employeeName")
          const uid = localStorage.getItem("uid")
          
          if (storeId && userName && uid) {
            savedUserName = userName
            savedUserId = uid
            savedUserType = "admin"
          }
        }

        if (savedUserName && savedUserId && savedUserType === "admin") {
          setUserNameState(savedUserName)
          setUserId(savedUserId)
          setUserType("admin")

          try {
            await updateUserOnlineStatus(savedUserId, true)
          } catch (firebaseError) {
            handleFirebaseError(firebaseError, "オンライン状態更新")
            setError("Firebase接続エラーが発生しました。設定を確認してください。")
          }
        } else if (savedCustomerAccount && savedUserType === "customer") {
          try {
            if (savedCustomerAccount && savedCustomerAccount !== "null" && savedCustomerAccount !== "undefined") {
              const account = JSON.parse(savedCustomerAccount) as CustomerAccount
              setCustomerAccountState(account)
              setUserType("customer")
            } else {
              sessionStorage.removeItem("auth_customerAccount")
            }
          } catch (parseError) {
            handleError(parseError, "顧客アカウント情報解析")
            sessionStorage.removeItem("auth_customerAccount")
          }
        }
      } catch (error) {
        handleError(error, "認証初期化")
        setError("認証の初期化に失敗しました。")
      } finally {
        setLoading(false)
      }
    }

    initializeAuth()
  }, [])

  useEffect(() => {
    const handleBeforeUnload = () => {
      if (userId && isFirebaseConfigured() && userType === "admin") {
        updateUserOnlineStatus(userId, false).catch(() => {
          // Silently handle errors on page unload
        })
      }
    }

    const handleVisibilityChange = () => {
      if (userId && isFirebaseConfigured() && userType === "admin") {
        const isOnline = !document.hidden
        updateUserOnlineStatus(userId, isOnline).catch(() => {
          // Silently handle errors
        })
      }
    }

    window.addEventListener("beforeunload", handleBeforeUnload)
    document.addEventListener("visibilitychange", handleVisibilityChange)

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload)
      document.removeEventListener("visibilitychange", handleVisibilityChange)
    }
  }, [userId, userType])

  const setUserName = async (name: string) => {
    try {
      setError(null)

      if (!isFirebaseConfigured()) {
        console.warn("[v0] ⚠️ v0プレビュー環境ではFirebaseが利用できません。")
        console.warn("[v0] ローカルストレージを使用してログインします。")
        console.warn("[v0] Vercelにデプロイすると完全なFirebase機能が利用できます。")

        // ローカルストレージを使用してログイン
        const localUserId = `local_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
        setUserNameState(name)
        setUserId(localUserId)
        setUserType("admin")

        sessionStorage.setItem("auth_userName", name)
        sessionStorage.setItem("auth_userId", localUserId)
        sessionStorage.setItem("auth_userType", "admin")
        return
      }

      const newUserId = await createOrUpdateUser(name)
      setUserNameState(name)
      setUserId(newUserId)
      setUserType("admin")

      sessionStorage.setItem("auth_userName", name)
      sessionStorage.setItem("auth_userId", newUserId)
      sessionStorage.setItem("auth_userType", "admin")
    } catch (error) {
      handleFirebaseError(error, "ユーザー設定")
      setError("ユーザー名の設定に失敗しました。Firebase設定を確認してください。")
    }
  }

  const setCustomerAccount = (account: CustomerAccount) => {
    setCustomerAccountState(account)
    setUserType("customer")

    sessionStorage.setItem("auth_customerAccount", JSON.stringify(account))
    sessionStorage.setItem("auth_userType", "customer")
  }

  const signOut = async () => {
    if (userId && isFirebaseConfigured() && userType === "admin") {
      try {
        await updateUserOnlineStatus(userId, false)
      } catch (error) {
        console.error("[オフライン状態更新]", error)
      }
    }

    setUserNameState(null)
    setUserId(null)
    setCustomerAccountState(null)
    setUserType(null)
    setError(null)

    sessionStorage.removeItem("auth_userName")
    sessionStorage.removeItem("auth_userId")
    sessionStorage.removeItem("auth_customerAccount")
    sessionStorage.removeItem("auth_userType")
  }

  return (
    <AuthContext.Provider
      value={{
        user: userId ? { uid: userId, email: null } : null,
        userName,
        userId,
        userType,
        customerAccount,
        loading,
        error,
        setUserName,
        setCustomerAccount,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
