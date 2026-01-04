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
            const startTime = performance.now()
            const { getDoc, doc } = await import("firebase/firestore")
            const { db } = await import("@/lib/firebase")
            
            // まずusersコレクションを確認（店舗オーナー/従業員）
            console.log("[Auth] ⏱️ usersコレクション確認開始:", new Date().toISOString())
            const userDocRef = doc(db, "users", firebaseUser.uid)
            const userDocSnap = await getDoc(userDocRef)
            console.log("[Auth] ⏱️ usersコレクション確認完了:", performance.now() - startTime, "ms")
            
            if (userDocSnap.exists()) {
              // 店舗オーナーまたは従業員
              const userData = userDocSnap.data()
              console.log("[Auth] ✅ ユーザーデータ取得:", {
                role: userData.role,
                storeId: userData.storeId,
                storeName: userData.storeName,
                totalTime: performance.now() - startTime + "ms",
              })
              
              setUser({
                uid: firebaseUser.uid,
                email: userData.email || firebaseUser.email || "",
                role: userData.role || "store_owner",
                storeId: userData.storeId,
                storeName: userData.storeName,
                displayName: userData.displayName,
              })
              setLoading(false)
              return
            }
            
            // usersコレクションに見つからない場合、customerAccountsを確認
            console.log("[Auth] ⏱️ customerAccountsコレクション確認開始")
            const docRef = doc(db, "customerAccounts", firebaseUser.uid)
            let docSnap = await getDoc(docRef)
            console.log("[Auth] ⏱️ customerAccountsコレクション確認完了:", performance.now() - startTime, "ms")

            // 顧客アカウントがまだ作成されていない場合、ポーリングで待機
            if (!docSnap.exists()) {
              console.warn("[Auth] ⚠️ 顧客アカウントが見つかりません。ポーリングを開始します...")
              const maxRetries = 10
              const retryIntervalMs = 500
              let retries = 0

              while (!docSnap.exists() && retries < maxRetries) {
                retries++
                console.log(`[Auth] 🔄 リトライ ${retries}/${maxRetries} (${retryIntervalMs}ms待機)`)
                await new Promise(resolve => setTimeout(resolve, retryIntervalMs))
                docSnap = await getDoc(docRef)
              }

              if (docSnap.exists()) {
                console.log(`[Auth] ✅ 顧客アカウントをリトライで取得成功 (リトライ回数: ${retries})`)
              } else {
                // リトライ後もドキュメントが存在しない場合
                console.error("[Auth] ❌ 顧客アカウントが見つかりません (UID: " + firebaseUser.uid + ")")
                console.error("[Auth] ドキュメントが存在しないか、作成に失敗した可能性があります。")
                setError("顧客アカウントが見つかりません。再度ログインしてください。")
                setLoading(false)
                return
              }
            }
            
            // ドキュメントが存在する場合（初回またはリトライ後）
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
      
      // 強制リダイレクトでクライアント状態をリセット
      setTimeout(() => {
        window.location.href = "/customer-auth"
      }, 100)
    } catch (err) {
      console.error("[Auth] ❌ ログアウトエラー:", err)
      handleFirebaseError(err, "ログアウト")
      // エラー時も強制リダイレクト
      setTimeout(() => {
        window.location.href = "/customer-auth"
      }, 100)
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
