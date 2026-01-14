"use client"

import type React from "react"
import { createContext, useContext, useEffect, useState } from "react"
import { isFirebaseConfigured } from "@/lib/firebase"
import { createOrUpdateUser, updateUserOnlineStatus, subscribeToCustomerAccount } from "@/lib/firestore"
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
  // storeIdとstoreNameはcustomerAccountから派生させるか、
  // customerAccountがnullでない場合にのみアクセスするように変更
  storeId: string | undefined // 直接提供（user?.storeId から派生）
  // storeName: string | null; // 同上
  isStoreOwner: boolean
  isEmployee: boolean
  isCustomer: boolean
  loading: boolean
  error: string | null
  setUserName: (name: string) => void
  setCustomerAccount: (account: CustomerAccount) => void
  refreshCustomerAccount: () => Promise<void>
  signOut: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserData | null>(null)
  const [customerAccount, setCustomerAccountState] = useState<CustomerAccount | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const refreshCustomerAccount = async () => {
    if (!user || !user.uid) return;
    setLoading(true);
    setError(null);
    try {
      const { getDoc, doc } = await import("firebase/firestore");
      const { getDb } = await import("@/lib/firebase");
      const db = getDb();
      if (!db) throw new Error("Firestore is not initialized");

      const customerDocRef = doc(db, "customerAccounts", user.uid);
      const customerDocSnap = await getDoc(customerDocRef);

      if (customerDocSnap.exists()) {
        const customer = { id: customerDocSnap.id, ...customerDocSnap.data() } as CustomerAccount;
        setCustomerAccountState(customer);
        setUser(prevUser => prevUser ? { ...prevUser, storeId: customer.storeId, playerName: customer.playerName, playerId: customer.playerId } : null);
      } else {
        console.warn("[Auth] ⚠️ refreshCustomerAccount: Customer account not found for UID:", user.uid);
        setCustomerAccountState(null);
      }
    } catch (err) {
      console.error("[Auth] ❌ refreshCustomerAccount error:", err);
      setError("アカウント情報の更新に失敗しました。");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let unsubscribeAuth: (() => void) | undefined;
    let unsubscribeCustomerAccount: (() => void) | undefined;
    
    const initializeAuth = async () => {
      setLoading(true); // ロード開始時に必ずtrueに設定
      setError(null);

      try {
        if (!isFirebaseConfigured) {
          console.warn("[Auth] ⚠️ v0プレビュー環境ではFirebaseが利用できません。");
          console.warn("[Auth] Vercelにデプロイすると正常に動作します。");
          setLoading(false);
          return;
        }

        const { onAuthStateChanged } = await import("@/lib/firebase-auth");
        const { getUserData, getCustomerByEmail, subscribeToCustomerAccount } = await import("@/lib/firestore");
        
        unsubscribeAuth = onAuthStateChanged(async (firebaseUser) => {
// console.log("[Auth] Firebase Auth状態変更:", firebaseUser ? firebaseUser.email : "未ログイン");
          
          if (!firebaseUser) {
// console.log("[Auth] ログアウト状態");
            setUser(null);
            setCustomerAccountState(null);
            setLoading(false);
            return;
          }

          try {
            const startTime = performance.now();
            const { getDoc, doc, collection, query, where, getDocs, writeBatch } = await import("firebase/firestore");
            const { getDb } = await import("@/lib/firebase");
            const db = getDb();
            if (!db) throw new Error("Firestore is not initialized");
            
            // まずusersコレクションを確認（店舗オーナー/従業員）
            const userDocRef = doc(db, "users", firebaseUser.uid);
            const userDocSnap = await getDoc(userDocRef);
            
            if (userDocSnap.exists()) {
              const userData = userDocSnap.data();
              setUser({
                uid: firebaseUser.uid,
                email: userData.email || firebaseUser.email || "",
                role: userData.role || "store_owner",
                storeId: userData.storeId,
                storeName: userData.storeName,
                displayName: userData.displayName,
              });
              setCustomerAccountState(null);
              setLoading(false);
              return;
            }
            
            // usersコレクションに見つからない場合、デフォルトでcustomerロールを割り当て
            setUser({
              uid: firebaseUser.uid,
              email: firebaseUser.email || "",
              role: "customer",
              storeId: "king-high-store", // テスト用デフォルト
            });

            // customerAccountsを購読
            unsubscribeCustomerAccount = subscribeToCustomerAccount(firebaseUser.uid, (account) => {
              console.log("[Auth] Customer account updated:", account);
              setCustomerAccountState(account);
              if (account) {
                setUser(prevUser => ({
                  uid: firebaseUser.uid,
                  email: firebaseUser.email || "",
                  role: "customer",
                  ...prevUser,
                  storeId: account.storeId,
                  playerName: account.playerName,
                  playerId: account.playerId
                }));
              }
              setLoading(false);
            });

            // 初回ロード時にcustomerAccountのポーリングロジックは不要になるため削除
            // onSnapshotが初回データをすぐに提供するため

          } catch (err) {
            console.error("[Auth] ❌ 認証エラー:", err);
            handleError(err, "認証");
            setError("認証に失敗しました");
          } finally {
            // onSnapshotが初回データをロードした後にloadingをfalseにするため、ここでは設定しない
            // setLoading(false);
          }
        });
      } catch (err) {
        console.error("[Auth] ❌ 認証初期化エラー:", err);
        handleError(err, "認証の初期化");
        setError("認証の初期化に失敗しました");
        setLoading(false);
      }
    }

    initializeAuth()

    return () => {
      if (unsubscribeAuth) {
        unsubscribeAuth()
      }
      if (unsubscribeCustomerAccount) {
        unsubscribeCustomerAccount();
      }
    }
  }, [])

  const setUserName = (name: string) => {
    // console.log("[Auth] setUserName:", name)
    if (user) {
      setUser({ ...user, displayName: name })
    }
  }

  const setCustomerAccount = (account: CustomerAccount) => {
    setCustomerAccountState(account)
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
// console.log("[Auth] ✅ ログアウト成功")
      
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
  const storeId = user?.storeId

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
        isStoreOwner,
        isEmployee,
        isCustomer,
        loading,
        error,
        setUserName,
        setCustomerAccount,
        signOut,
        refreshCustomerAccount,
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
