import * as firestore from "firebase/firestore"
import { getDb } from "./firebase"

// ヘルパー: DBインスタンスが利用可能かチェック
const getSafeDb = (): firestore.Firestore | null => {
  return getDb()
}

// 安全なラッパー関数
export const safeQuery = (collectionRef: any, ...queryConstraints: any[]): any => {
  const q = firestore.query;
  if (typeof q !== 'function') {
    console.warn("[safeQuery] firestore.query is not a function.");
    return null;
  }
  if (!collectionRef) return null;
  
  try {
    return q(collectionRef, ...queryConstraints);
  } catch (e) {
    console.error("[safeQuery] Error executing query:", e, "Query:", queryConstraints);
    return null;
  }
};

export const safeOnSnapshot = (query: any, onNext: (snapshot: any) => void, onError?: (error: any) => void): (() => void) => {
  const snap = firestore.onSnapshot;
  if (typeof snap !== 'function') {
    console.warn("[safeOnSnapshot] firestore.onSnapshot is not a function.");
    return () => {};
  }
  if (!query) return () => {};
  
  try {
    return snap(query, onNext, onError);
  } catch (e) {
    console.error("[safeOnSnapshot] Error setting up snapshot:", e, "Query:", query);
    return () => {};
  }
};

// 各コレクション取得関数を安全に定義
export const getPlayersCollection = () => {
  const safeDb = getSafeDb()
  return safeDb && typeof firestore.collection === 'function' ? firestore.collection(safeDb, "players") : null
}

export const getPointHistoryCollection = () => {
  const safeDb = getSafeDb()
  return safeDb && typeof firestore.collection === 'function' ? firestore.collection(safeDb, "pointHistory") : null
}

export const getUsersCollection = () => {
  const safeDb = getSafeDb()
  return safeDb && typeof firestore.collection === 'function' ? firestore.collection(safeDb, "users") : null
}

export const getGamesCollection = () => {
  const safeDb = getSafeDb()
  return safeDb && typeof firestore.collection === 'function' ? firestore.collection(safeDb, "games") : null
}

export const getTransactionsCollection = () => {
  const safeDb = getSafeDb()
  return safeDb && typeof firestore.collection === 'function' ? firestore.collection(safeDb, "transactions") : null
}

export const getGameTransactionsCollection = () => {
  const safeDb = getSafeDb()
  return safeDb && typeof firestore.collection === 'function' ? firestore.collection(safeDb, "gameTransactions") : null
}

export const getRakeHistoryCollection = () => {
  const safeDb = getSafeDb()
  return safeDb && typeof firestore.collection === 'function' ? firestore.collection(safeDb, "rakeHistory") : null
}

export const getReceiptsCollection = () => {
  const safeDb = getSafeDb()
  return safeDb && typeof firestore.collection === 'function' ? firestore.collection(safeDb, "receipts") : null
}

export const getReceiptItemsCollection = () => {
  const safeDb = getSafeDb()
  return safeDb && typeof firestore.collection === 'function' ? firestore.collection(safeDb, "receiptItems") : null
}

export const getDailySalesCollection = () => {
  const safeDb = getSafeDb()
  return safeDb && typeof firestore.collection === 'function' ? firestore.collection(safeDb, "dailySales") : null
}

export const getStoreRankingSettingsCollection = () => {
  const safeDb = getSafeDb()
  return safeDb && typeof firestore.collection === 'function' ? firestore.collection(safeDb, "storeRankingSettings") : null
}

export const getCustomerAccountsCollection = () => {
  const safeDb = getSafeDb()
  return safeDb && typeof firestore.collection === 'function' ? firestore.collection(safeDb, "customerAccounts") : null
}

export const getPostsCollection = () => {
  const safeDb = getSafeDb()
  return safeDb && typeof firestore.collection === 'function' ? firestore.collection(safeDb, "posts") : null
}

export const getPaymentHistoryCollection = () => {
  const safeDb = getSafeDb()
  return safeDb && typeof firestore.collection === 'function' ? firestore.collection(safeDb, "paymentHistory") : null
}

export const getDailyRankingsCollection = () => {
  const safeDb = getSafeDb()
  return safeDb && typeof firestore.collection === 'function' ? firestore.collection(safeDb, "dailyRankings") : null
}

export const getMonthlyRankingsCollection = () => {
  const safeDb = getSafeDb()
  return safeDb && typeof firestore.collection === 'function' ? firestore.collection(safeDb, "monthlyRankings") : null
}

export const getMonthlyPointsCollection = () => {
  const safeDb = getSafeDb()
  return safeDb && typeof firestore.collection === 'function' ? firestore.collection(safeDb, "monthlyPoints") : null
}

// パスワード関連
export const getAdminPassword = async (): Promise<string> => {
  try {
    const safeDb = getSafeDb()
    if (!safeDb || typeof firestore.doc !== 'function' || typeof firestore.getDoc !== 'function') return "0000"
    const docRef = firestore.doc(safeDb, "settings", "admin")
    const snapshot = await firestore.getDoc(docRef)
    return snapshot.exists() ? (snapshot.data().password || "0000") : "0000"
  } catch {
    return "0000"
  }
}

export const saveAdminPassword = async (password: string): Promise<void> => {
  const safeDb = getSafeDb()
  if (!safeDb || typeof firestore.doc !== 'function' || typeof firestore.setDoc !== 'function') return
  try {
    const docRef = firestore.doc(safeDb, "settings", "admin")
    await firestore.setDoc(docRef, { password, updatedAt: firestore.serverTimestamp() })
  } catch (error) {
    console.error("Failed to save admin password:", error)
  }
}

export const deleteCustomerAccount = async (id: string): Promise<void> => {
  const safeDb = getSafeDb()
  if (!safeDb || typeof firestore.doc !== 'function' || typeof firestore.deleteDoc !== 'function') return
  try {
    await firestore.deleteDoc(firestore.doc(safeDb, "customerAccounts", id))
  } catch (error) {
    console.error("Failed to delete customer account:", error)
    throw error
  }
}
