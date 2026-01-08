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
  // storeIdとstoreNameはcustomerAccountから派生させるか、
  // customerAccountがnullでない場合にのみアクセスするように変更
  // storeId: string | null; // 直接提供せず、customerAccount?.storeId でアクセスを推奨
  // storeName: string | null; // 同上
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
      setLoading(true); // ロード開始時に必ずtrueに設定
      setError(null);

      try {
        if (!isFirebaseConfigured()) {
          console.warn("[Auth] ⚠️ v0プレビュー環境ではFirebaseが利用できません。");
          console.warn("[Auth] Vercelにデプロイすると正常に動作します。");
          setLoading(false);
          return;
        }

        const { onAuthStateChanged } = await import("@/lib/firebase-auth");
        const { getUserData, getCustomerByEmail } = await import("@/lib/firestore");
        
        unsubscribe = onAuthStateChanged(async (firebaseUser) => {
          console.log("[Auth] Firebase Auth状態変更:", firebaseUser ? firebaseUser.email : "未ログイン");
          
          if (!firebaseUser) {
            console.log("[Auth] ログアウト状態");
            setUser(null);
            setCustomerAccountState(null);
            setLoading(false);
            return;
          }

          try {
            const startTime = performance.now();
            const { getDoc, doc } = await import("firebase/firestore");
            const { db } = await import("@/lib/firebase");
            
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
              setCustomerAccountState(null); // 店舗オーナーはcustomerAccountを持たない
              setLoading(false);
              return;
            }
            
            // usersコレクションに見つからない場合、customerAccountsを確認
            const customerDocRef = doc(db, "customerAccounts", firebaseUser.uid);
            let customerDocSnap = await getDoc(customerDocRef);

            // 顧客アカウントがまだ作成されていない場合、ポーリングで待機
            // ここでstoreIdとplayerIdが設定されるまで待機するロジックを強化
            if (!customerDocSnap.exists() || !customerDocSnap.data()?.storeId || !customerDocSnap.data()?.playerId) {
              console.warn("[Auth] ⚠️ 顧客アカウントまたはstoreId/playerIdが見つかりません。ポーリングを開始します...");
              const maxRetries = 20; // リトライ回数を増やす
              const retryIntervalMs = 500; // リトライ間隔
              let retries = 0;

              while ((!customerDocSnap.exists() || !customerDocSnap.data()?.storeId || !customerDocSnap.data()?.playerId) && retries < maxRetries) {
                retries++;
                console.log(`[Auth] 🔄 リトライ ${retries}/${maxRetries} (${retryIntervalMs}ms待機)`);
                await new Promise(resolve => setTimeout(resolve, retryIntervalMs));
                customerDocSnap = await getDoc(customerDocRef);
              }

              if (customerDocSnap.exists() && customerDocSnap.data()?.storeId && customerDocSnap.data()?.playerId) {
                console.log(`[Auth] ✅ 顧客アカウントとstoreId/playerIdをリトライで取得成功 (リトライ回数: ${retries})`);
              } else {
                console.error("[Auth] ❌ 顧客アカウントまたはstoreId/playerIdが見つかりません (UID: " + firebaseUser.uid + ")");
                setError("顧客アカウント情報が不完全です。再度ログインしてください。");
                setLoading(false);
                return;
              }
            }
            
            // ドキュメントが存在し、storeIdとplayerIdも設定されている場合
            let customer = { id: customerDocSnap.id, ...customerDocSnap.data() } as CustomerAccount;

            // --- プレイヤーIDの特定と自動修復ロジック (AuthContext内) ---
            // customerAccount.playerId が実際のプレイヤーのドキュメントIDと一致しない可能性を考慮
            // 1. まず、customerAccount.playerId が指す店舗分離構造のプレイヤーを直接確認
            let actualPlayerId = customer.playerId;
            let playerFoundInStoreIsolated = false;
            if (customer.storeId && customer.playerId) {
              const playerStoreIsolatedDocRef = doc(db, "players", `store_${customer.storeId}`, "players", customer.playerId);
              const playerStoreIsolatedDocSnap = await getDoc(playerStoreIsolatedDocRef);
              if (playerStoreIsolatedDocSnap.exists()) {
                playerFoundInStoreIsolated = true;
                console.log("[Auth] ✅ Player found in store-isolated structure using customer.playerId.");
              }
            }

            // 2. 店舗分離構造に見つからない場合、古いフラット構造から探す
            if (!playerFoundInStoreIsolated && firebaseUser.uid) {
              console.log("[Auth] 🔄 Player not found in store-isolated structure. Checking old flat structure...");
              const oldPlayerDocRef = doc(db, "players", firebaseUser.uid); // UIDをプレイヤーIDとして試行
              const oldPlayerDocSnap = await getDoc(oldPlayerDocRef);

              if (oldPlayerDocSnap.exists()) {
                console.log("[Auth] ✅ Player found in old flat structure using UID. Initiating auto-repair...");
                const oldData = oldPlayerDocSnap.data();

                // 新しい店舗分離構造のパスを構築
                const newPlayerDocRef = doc(
                  db,
                  "players",
                  `store_${customer.storeId}`,
                  "players",
                  firebaseUser.uid // UIDを新しいplayerIdとして使用
                );

                const batch = writeBatch(db);
                batch.set(newPlayerDocRef, { ...oldData, storeId: customer.storeId, updatedAt: new Date() }, { merge: true });
                await batch.commit();
                console.log("[Auth] ✅ Player data auto-repaired to new store-isolated structure.");
                actualPlayerId = firebaseUser.uid; // 自動修復されたIDをセット
                playerFoundInStoreIsolated = true;
              } else {
                // メールアドレスで探す（playerIdがメールアドレスの場合を考慮）
                const oldPlayerByEmailQuery = query(collection(db, "players"), where("email", "==", firebaseUser.email));
                const oldPlayerByEmailSnap = await getDocs(oldPlayerByEmailQuery);
                if (!oldPlayerByEmailSnap.empty) {
                  const playerDoc = oldPlayerByEmailSnap.docs[0];
                  console.log("[Auth] ✅ Player found in old flat structure using email. Initiating auto-repair...");
                  const oldData = playerDoc.data();

                  const newPlayerDocRef = doc(
                    db,
                    "players",
                    `store_${customer.storeId}`,
                    "players",
                    playerDoc.id // 既存のドキュメントIDを新しいplayerIdとして使用
                  );

                  const batch = writeBatch(db);
                  batch.set(newPlayerDocRef, { ...oldData, storeId: customer.storeId, updatedAt: new Date() }, { merge: true });
                  await batch.commit();
                  console.log("[Auth] ✅ Player data auto-repaired to new store-isolated structure.");
                  actualPlayerId = playerDoc.id; // 自動修復されたIDをセット
                  playerFoundInStoreIsolated = true;
                }
              }
            }

            // 3. 最終的なplayerIdをcustomerAccountに設定
            if (actualPlayerId && playerFoundInStoreIsolated) {
              customer = { ...customer, playerId: actualPlayerId };
              console.log("[Auth] ✅ Final customer.playerId set to:", actualPlayerId);
            } else {
              console.warn("[Auth] ⚠️ Could not determine actual playerId for store-isolated structure. Using existing customer.playerId or null.");
              // ここでエラーを出すか、不完全な状態で続行するかは要検討
              // 今回は既存のcustomer.playerIdをそのまま使用し、購入ページ側でエラーを出す
            }
            // --- プレイヤーIDの特定と自動修復ロジックの終了 ---
            setUser({
              uid: firebaseUser.uid,
              email: customer.email,
              role: "customer",
              storeId: customer.storeId,
              storeName: customer.storeName,
              playerName: customer.playerName,
              playerId: customer.playerId,
            });
            setCustomerAccountState(customer);

          } catch (err) {
            console.error("[Auth] ❌ 認証エラー:", err);
            handleError(err, "認証");
            setError("認証に失敗しました");
          } finally {
            setLoading(false);
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
