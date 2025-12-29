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
        // localStorageからの復元は削除（セキュリティリスクのため）
        // Firebase Authの状態のみを信頼する
        
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
            // customerAccountsドキュメントをUIDで直接取得（高速）
            console.log("[Auth] ⏱️ getDoc開始:", new Date().toISOString())
            const startTime = performance.now()
            
            const { getDoc, doc } = await import("firebase/firestore")
            const { db } = await import("@/lib/firebase")
            
            const docRef = doc(db, "customerAccounts", firebaseUser.uid)
            console.log("[Auth] ⏱️ docRef作成完了:", performance.now() - startTime, "ms")
            
            const docSnap = await getDoc(docRef)
            console.log("[Auth] ⏱️ getDoc完了:", performance.now() - startTime, "ms")
            
            if (docSnap.exists()) {
              const customer = { id: docSnap.id, ...docSnap.data() } as CustomerAccount
              console.log("[Auth] ✅ 顧客アカウント取得:", {
                playerId: customer.playerId,
                playerName: customer.playerName,
                totalTime: performance.now() - startTime + "ms",
              })
              
              setUser({
                uid: firebaseUser.uid,
                email: customer.email,
                role: "customer",
                storeId: customer.storeId,
                storeName: customer.storeName,
                playerName: customer.playerName,
                playerId: customer.playerId,
              })
              setCustomerAccountState(customer)
            } else {
              // ドキュメントが存在しない場合（後方互換性）
              console.log("[Auth] ⚠️ UIDでドキュメントが見つからない、emailで検索します")
              const emailSearchStart = performance.now()
              
              const customer = await getCustomerByEmail(firebaseUser.email!)
              console.log("[Auth] ⏱️ emailで検索完了:", performance.now() - emailSearchStart, "ms")
              if (customer) {
                console.log("[Auth] ✅ 顧客アカウント取得（email検索）:", {
                  playerId: customer.playerId,
                  playerName: customer.playerName,
                })
                
                setUser({
                  uid: firebaseUser.uid,
                  email: firebaseUser.email!,
                  role: "customer",
                  storeId: customer.storeId,
                  storeName: customer.storeName,
                  playerName: customer.playerName,
                  playerId: customer.playerId,
                })
                setCustomerAccountState(customer)
              } else {
                console.error("[Auth] ❌ 顧客アカウントが見つかりません")
                setError("顧客アカウントが見つかりません")
              }
            }
          } catch (err) {
            console.error("[Auth] ❌ 認証エラー:", err)
            handleError(err, "認証")
            setError("認証に失敗しました")
          } finally {
            // 必ずローディングを終了
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
      
      // 認証キャッシュをクリア
      const { clearAuthCache } = await import("@/lib/auth-cache")
      clearAuthCache()
      
      // localStorageの認証情報をすべてクリア
      localStorage.removeItem("auth_customerAccount")
      localStorage.removeItem("auth_userType")
      localStorage.removeItem("currentUser")
      
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
