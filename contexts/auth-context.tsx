"use client"

import type React from "react"
import { createContext, useContext, useEffect, useState } from "react"
import { isFirebaseConfigured } from "@/lib/firebase"
import { createOrUpdateUser, updateUserOnlineStatus } from "@/lib/firestore"
import type { CustomerAccount } from "@/types"
import { handleFirebaseError, handleError } from "@/lib/error-handler"

// ユーザーの役割を定義
type UserRole = "store_owner" | "employee" | "customer"

// ユーザーデータの型定義
interface UserData {
  uid: string
  email: string
  role: UserRole
  storeId?: string
  storeName?: string
  displayName?: string
  playerName?: string
  playerId?: string
}

interface AuthContextType {
  user: UserData | null
  // 後方互換性のため残す（将来的に削除予定）
  userName: string | null
  userId: string | null
  userType: "admin" | "customer" | null
  customerAccount: CustomerAccount | null
  // 新しいプロパティ
  storeId: string | null
  storeName: string | null
  isStoreOwner: boolean
  isEmployee: boolean
  isCustomer: boolean
  loading: boolean
  error: string | null
  setUserName: (name: string) => void
  setCustomerAccount: (account: CustomerAccount) => void
  signOut: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserData | null>(null)
  const [customerAccount, setCustomerAccountState] = useState<CustomerAccount | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let unsubscribe: (() => void) | undefined
    
    const initializeAuth = async () => {
      try {
        // まずlocalStorageから顧客アカウントを読み込む（即座に表示するため）
        if (typeof window !== "undefined") {
          const savedCustomerAccount = localStorage.getItem("auth_customerAccount")
          const savedUserType = localStorage.getItem("auth_userType")
          
          if (savedCustomerAccount && savedUserType === "customer") {
            try {
              const parsedAccount = JSON.parse(savedCustomerAccount)
              console.log("[Auth] 💾 localStorageから顧客アカウントを復元:", parsedAccount.email)
              setCustomerAccountState(parsedAccount)
              setUser({
                uid: parsedAccount.uid || "",
                email: parsedAccount.email,
                role: "customer",
                storeId: parsedAccount.storeId,
                storeName: parsedAccount.storeName,
                playerName: parsedAccount.playerName,
                playerId: parsedAccount.playerId,
              })
            } catch (e) {
              console.error("[Auth] ❌ localStorageのパースエラー:", e)
            }
          }
        }
        
        if (!isFirebaseConfigured()) {
          console.warn("[Auth] ⚠️ v0プレビュー環境ではFirebaseが利用できません。")
          console.warn("[Auth] Vercelにデプロイすると正常に動作します。")
          setLoading(false)
          return
        }

        // Firebase Authの認証状態を監視
        const { onAuthStateChanged } = await import("@/lib/firebase-auth")
        const { getUserData, getCustomerByEmail } = await import("@/lib/firestore")
        
        unsubscribe = onAuthStateChanged(async (firebaseUser) => {
          console.log("[Auth] Firebase Auth状態変更:", firebaseUser ? firebaseUser.email : "未ログイン")
          
          if (!firebaseUser) {
            // ログアウト状態
            console.log("[Auth] ログアウト状態")
            setUser(null)
            setCustomerAccountState(null)
            setLoading(false)
            return
          }

          try {
            // Firestoreからユーザーデータを取得
            const userData = await getUserData(firebaseUser.uid)
            
            if (userData) {
              // usersコレクションにデータが存在する場合
              console.log("[Auth] ✅ ユーザーデータ取得:", {
                email: userData.email,
                role: userData.role,
                storeId: userData.storeId,
              })
              
              setUser({
                uid: firebaseUser.uid,
                email: userData.email,
                role: userData.role,
                storeId: userData.storeId,
                storeName: userData.storeName,
                displayName: userData.displayName,
              })
              
              // 顧客の場合は、customerAccountsも取得
              if (userData.role === "customer") {
                const customer = await getCustomerByEmail(userData.email)
                if (customer) {
                  console.log("[Auth] ✅ 顧客アカウント取得:", {
                    playerId: customer.playerId,
                    playerName: customer.playerName,
                  })
                  setCustomerAccountState(customer)
                }
              }
            } else {
              // usersコレクションにデータが存在しない場合
              // 顧客として扱う（後方互換性）
              console.log("[Auth] ⚠️ usersコレクションにデータなし、顧客として扱います")
              
              const customer = await getCustomerByEmail(firebaseUser.email!)
              if (customer) {
                console.log("[Auth] ✅ 顧客アカウント取得:", {
                  playerId: customer.playerId,
                  playerName: customer.playerName,
                })
                
                setUser({
                  uid: firebaseUser.uid,
                  email: firebaseUser.email!,
                  role: "customer",
                  storeId: customer.storeId,
                  playerName: customer.playerName,
                  playerId: customer.playerId,
                })
                setCustomerAccountState(customer)
              } else {
                console.error("[Auth] ❌ ユーザーデータが見つかりません")
                setError("ユーザーデータが見つかりません")
              }
            }
            
            setLoading(false)
          } catch (err) {
            console.error("[Auth] ❌ ユーザーデータ取得エラー:", err)
            handleError(err, "ユーザーデータの取得")
            setError("ユーザーデータの取得に失敗しました")
            setLoading(false)
          }
        })
      } catch (err) {
        console.error("[Auth] ❌ 認証初期化エラー:", err)
        handleError(err, "認証の初期化")
        setError("認証の初期化に失敗しました")
        setLoading(false)
      }
    }

    initializeAuth()

    return () => {
      if (unsubscribe) {
        unsubscribe()
      }
    }
  }, [])

  const setUserName = (name: string) => {
    console.log("[Auth] setUserName:", name)
    if (user) {
      setUser({ ...user, displayName: name })
    }
  }

  const setCustomerAccount = (account: CustomerAccount) => {
    console.log("[Auth] setCustomerAccount:", account)
    setCustomerAccountState(account)
    if (user) {
      setUser({
        ...user,
        storeId: account.storeId,
        playerName: account.playerName,
        playerId: account.playerId,
      })
    }
  }

  const signOut = async () => {
    try {
      const { signOut: firebaseSignOut } = await import("@/lib/firebase-auth")
      await firebaseSignOut()
      setUser(null)
      setCustomerAccountState(null)
      console.log("[Auth] ✅ ログアウト成功")
    } catch (err) {
      console.error("[Auth] ❌ ログアウトエラー:", err)
      handleFirebaseError(err, "ログアウト")
    }
  }

  // 後方互換性のため、古いプロパティも提供
  const userName = user?.displayName || user?.playerName || null
  const userId = user?.uid || null
  const userType = user?.role === "customer" ? "customer" : user?.role === "store_owner" ? "admin" : null
  const storeId = user?.storeId || null
  const storeName = user?.storeName || null
  const isStoreOwner = user?.role === "store_owner"
  const isEmployee = user?.role === "employee"
  const isCustomer = user?.role === "customer"

  return (
    <AuthContext.Provider
      value={{
        user,
        userName,
        userId,
        userType,
        customerAccount,
        storeId,
        storeName,
        isStoreOwner,
        isEmployee,
        isCustomer,
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
