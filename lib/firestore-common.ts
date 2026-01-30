import { query, onSnapshot, collection, doc, getDoc, setDoc, updateDoc, deleteDoc, addDoc, serverTimestamp, where, orderBy, writeBatch, getDocs } from "firebase/firestore"
import {
  type Firestore,
  type CollectionReference,
  type Query
} from "firebase/firestore"
import { getDb } from "./firebase"

// ヘルパー: DBインスタンスが利用可能かチェック
const getSafeDb = (): Firestore | null => {
  return getDb()
}

// 安全なラッパー関数
export const safeQuery = (collectionRef: any, ...queryConstraints: any[]): any => {
  const q = query;
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
  const snap = onSnapshot;
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
  return safeDb && typeof collection === 'function' ? collection(safeDb, "players") : null
}

export const getPointHistoryCollection = () => {
  const safeDb = getSafeDb()
  return safeDb && typeof collection === 'function' ? collection(safeDb, "pointHistory") : null
}

export const getUsersCollection = () => {
  const safeDb = getSafeDb()
  return safeDb && typeof collection === 'function' ? collection(safeDb, "users") : null
}

export const getGamesCollection = () => {
  const safeDb = getSafeDb()
  return safeDb && typeof collection === 'function' ? collection(safeDb, "games") : null
}

export const getTransactionsCollection = () => {
  const safeDb = getSafeDb()
  return safeDb && typeof collection === 'function' ? collection(safeDb, "transactions") : null
}

export const getGameTransactionsCollection = () => {
  const safeDb = getSafeDb()
  return safeDb && typeof collection === 'function' ? collection(safeDb, "gameTransactions") : null
}

export const getRakeHistoryCollection = () => {
  const safeDb = getSafeDb()
  return safeDb && typeof collection === 'function' ? collection(safeDb, "rakeHistory") : null
}

export const getReceiptsCollection = () => {
  const safeDb = getSafeDb()
  return safeDb && typeof collection === 'function' ? collection(safeDb, "receipts") : null
}

export const getReceiptItemsCollection = () => {
  const safeDb = getSafeDb()
  return safeDb && typeof collection === 'function' ? collection(safeDb, "receiptItems") : null
}

export const getDailySalesCollection = () => {
  const safeDb = getSafeDb()
  return safeDb && typeof collection === 'function' ? collection(safeDb, "dailySales") : null
}

export const getStoreRankingSettingsCollection = () => {
  const safeDb = getSafeDb()
  return safeDb && typeof collection === 'function' ? collection(safeDb, "storeRankingSettings") : null
}

export const getCustomerAccountsCollection = () => {
  const safeDb = getSafeDb()
  return safeDb && typeof collection === 'function' ? collection(safeDb, "customerAccounts") : null
}

export const getPostsCollection = () => {
  const safeDb = getSafeDb()
  return safeDb && typeof collection === 'function' ? collection(safeDb, "posts") : null
}

export const getPaymentHistoryCollection = () => {
  const safeDb = getSafeDb()
  return safeDb && typeof collection === 'function' ? collection(safeDb, "paymentHistory") : null
}

export const getDailyRankingsCollection = () => {
  const safeDb = getSafeDb()
  return safeDb && typeof collection === 'function' ? collection(safeDb, "dailyRankings") : null
}

export const getMonthlyRankingsCollection = () => {
  const safeDb = getSafeDb()
  return safeDb && typeof collection === 'function' ? collection(safeDb, "monthlyRankings") : null
}

export const getMonthlyPointsCollection = () => {
  const safeDb = getSafeDb()
  return safeDb && typeof collection === 'function' ? collection(safeDb, "monthlyPoints") : null
}

// パスワード関連
export const getAdminPassword = async (): Promise<string> => {
  try {
    const safeDb = getSafeDb()
    if (!safeDb || typeof doc !== 'function' || typeof getDoc !== 'function') return "0000"
    const docRef = doc(safeDb, "settings", "admin")
    const snapshot = await getDoc(docRef)
    return snapshot.exists() ? (snapshot.data().password || "0000") : "0000"
  } catch {
    return "0000"
  }
}

export const saveAdminPassword = async (password: string): Promise<void> => {
  const safeDb = getSafeDb()
  if (!safeDb || typeof doc !== 'function' || typeof setDoc !== 'function') return
  try {
    const docRef = doc(safeDb, "settings", "admin")
    await setDoc(docRef, { password, updatedAt: serverTimestamp() })
  } catch (error) {
    console.error("Failed to save admin password:", error)
  }
}

export const deleteCustomerAccount = async (id: string): Promise<void> => {
  const safeDb = getSafeDb()
  if (!safeDb || typeof doc !== 'function' || typeof deleteDoc !== 'function') return
  try {
    await deleteDoc(doc(safeDb, "customerAccounts", id))
  } catch (error) {
    console.error("Failed to delete customer account:", error)
    throw error
  }
}
