import {
  collection,
  doc,
  getDoc,
  setDoc,
  deleteDoc,
  serverTimestamp,
  query as firestoreQuery,
  where as firestoreWhere,
  orderBy as firestoreOrderBy,
  limit as firestoreLimit,
  onSnapshot as firestoreOnSnapshot,
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
  // firestoreQuery が関数でない場合、または collectionRef が無効な場合は null を返す
  if (typeof firestoreQuery !== 'function') {
    console.warn("[safeQuery] firestoreQuery is not a function. This might happen during build optimization.");
    return null;
  }
  if (!collectionRef) return null;
  
  try {
    return firestoreQuery(collectionRef, ...queryConstraints);
  } catch (e) {
    console.error("[safeQuery] Error executing query:", e);
    return null;
  }
};

export const safeOnSnapshot = (query: any, onNext: (snapshot: any) => void, onError?: (error: any) => void): (() => void) => {
  // firestoreOnSnapshot が関数でない場合、または query が無効な場合は空の関数を返す
  if (typeof firestoreOnSnapshot !== 'function') {
    console.warn("[safeOnSnapshot] firestoreOnSnapshot is not a function.");
    return () => {};
  }
  if (!query) return () => {};
  
  try {
    return firestoreOnSnapshot(query, onNext, onError);
  } catch (e) {
    console.error("[safeOnSnapshot] Error setting up snapshot:", e);
    return () => {};
  }
};

// 各コレクション取得関数を安全に定義
export const getPlayersCollection = () => {
  const safeDb = getSafeDb()
  return safeDb ? collection(safeDb, "players") : null
}

export const getPointHistoryCollection = () => {
  const safeDb = getSafeDb()
  return safeDb ? collection(safeDb, "pointHistory") : null
}

export const getUsersCollection = () => {
  const safeDb = getSafeDb()
  return safeDb ? collection(safeDb, "users") : null
}

export const getGamesCollection = () => {
  const safeDb = getSafeDb()
  return safeDb ? collection(safeDb, "games") : null
}

export const getTransactionsCollection = () => {
  const safeDb = getSafeDb()
  return safeDb ? collection(safeDb, "transactions") : null
}

export const getGameTransactionsCollection = () => {
  const safeDb = getSafeDb()
  return safeDb ? collection(safeDb, "gameTransactions") : null
}

export const getRakeHistoryCollection = () => {
  const safeDb = getSafeDb()
  return safeDb ? collection(safeDb, "rakeHistory") : null
}

export const getReceiptsCollection = () => {
  const safeDb = getSafeDb()
  return safeDb ? collection(safeDb, "receipts") : null
}

export const getReceiptItemsCollection = () => {
  const safeDb = getSafeDb()
  return safeDb ? collection(safeDb, "receiptItems") : null
}

export const getDailySalesCollection = () => {
  const safeDb = getSafeDb()
  return safeDb ? collection(safeDb, "dailySales") : null
}

export const getStoreRankingSettingsCollection = () => {
  const safeDb = getSafeDb()
  return safeDb ? collection(safeDb, "storeRankingSettings") : null
}

export const getCustomerAccountsCollection = () => {
  const safeDb = getSafeDb()
  return safeDb ? collection(safeDb, "customerAccounts") : null
}

export const getPostsCollection = () => {
  const safeDb = getSafeDb()
  return safeDb ? collection(safeDb, "posts") : null
}

export const getPaymentHistoryCollection = () => {
  const safeDb = getSafeDb()
  return safeDb ? collection(safeDb, "paymentHistory") : null
}

export const getDailyRankingsCollection = () => {
  const safeDb = getSafeDb()
  return safeDb ? collection(safeDb, "dailyRankings") : null
}

export const getMonthlyRankingsCollection = () => {
  const safeDb = getSafeDb()
  return safeDb ? collection(safeDb, "monthlyRankings") : null
}

export const getMonthlyPointsCollection = () => {
  const safeDb = getSafeDb()
  return safeDb ? collection(safeDb, "monthlyPoints") : null
}

// パスワード関連
export const getAdminPassword = async (): Promise<string> => {
  try {
    const safeDb = getSafeDb()
    if (!safeDb) return "0000"
    const docRef = doc(safeDb, "settings", "admin")
    const snapshot = await getDoc(docRef)
    return snapshot.exists() ? (snapshot.data().password || "0000") : "0000"
  } catch {
    return "0000"
  }
}

export const saveAdminPassword = async (password: string): Promise<void> => {
  const safeDb = getSafeDb()
  if (!safeDb) return
  try {
    const docRef = doc(safeDb, "settings", "admin")
    await setDoc(docRef, { password, updatedAt: serverTimestamp() })
  } catch (error) {
    console.error("Failed to save admin password:", error)
  }
}

export const deleteCustomerAccount = async (id: string): Promise<void> => {
  const safeDb = getSafeDb()
  if (!safeDb) return
  try {
    await deleteDoc(doc(safeDb, "customerAccounts", id))
  } catch (error) {
    console.error("Failed to delete customer account:", error)
    throw error
  }
}
