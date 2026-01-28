import {
  collection,
  doc,
  getDoc,
  setDoc,
  deleteDoc,
  serverTimestamp,
  type Firestore
} from "firebase/firestore"
import { getDb } from "./firebase"

// ヘルパー: DBインスタンスが利用可能かチェック
const getSafeDb = (): Firestore | null => {
  return getDb()
}

// 各コレクション取得関数を安全に定義
export const getPlayersCollection = () => {
  const safeDb = getSafeDb()
  if (!safeDb) throw new Error("Database not initialized")
  return collection(safeDb, "players")
}

export const getPointHistoryCollection = () => {
  const safeDb = getSafeDb()
  if (!safeDb) throw new Error("Database not initialized")
  return collection(safeDb, "pointHistory")
}

export const getUsersCollection = () => {
  const safeDb = getSafeDb()
  if (!safeDb) throw new Error("Database not initialized")
  return collection(safeDb, "users")
}

export const getGamesCollection = () => {
  const safeDb = getSafeDb()
  if (!safeDb) throw new Error("Database not initialized")
  return collection(safeDb, "games")
}

export const getTransactionsCollection = () => {
  const safeDb = getSafeDb()
  if (!safeDb) throw new Error("Database not initialized")
  return collection(safeDb, "transactions")
}

export const getGameTransactionsCollection = () => {
  const safeDb = getSafeDb()
  if (!safeDb) throw new Error("Database not initialized")
  return collection(safeDb, "gameTransactions")
}

export const getRakeHistoryCollection = () => {
  const safeDb = getSafeDb()
  if (!safeDb) throw new Error("Database not initialized")
  return collection(safeDb, "rakeHistory")
}

export const getReceiptsCollection = () => {
  const safeDb = getSafeDb()
  if (!safeDb) throw new Error("Database not initialized")
  return collection(safeDb, "receipts")
}

export const getReceiptItemsCollection = () => {
  const safeDb = getSafeDb()
  if (!safeDb) throw new Error("Database not initialized")
  return collection(safeDb, "receiptItems")
}

export const getDailySalesCollection = () => {
  const safeDb = getSafeDb()
  if (!safeDb) throw new Error("Database not initialized")
  return collection(safeDb, "dailySales")
}

export const getStoreRankingSettingsCollection = () => {
  const safeDb = getSafeDb()
  if (!safeDb) throw new Error("Database not initialized")
  return collection(safeDb, "storeRankingSettings")
}

export const getCustomerAccountsCollection = () => {
  const safeDb = getSafeDb()
  if (!safeDb) throw new Error("Database not initialized")
  return collection(safeDb, "customerAccounts")
}

export const getPostsCollection = () => {
  const safeDb = getSafeDb()
  if (!safeDb) throw new Error("Database not initialized")
  return collection(safeDb, "posts")
}

export const getPaymentHistoryCollection = () => {
  const safeDb = getSafeDb()
  if (!safeDb) throw new Error("Database not initialized")
  return collection(safeDb, "paymentHistory")
}

export const getDailyRankingsCollection = () => {
  const safeDb = getSafeDb()
  if (!safeDb) throw new Error("Database not initialized")
  return collection(safeDb, "dailyRankings")
}

export const getMonthlyRankingsCollection = () => {
  const safeDb = getSafeDb()
  if (!safeDb) throw new Error("Database not initialized")
  return collection(safeDb, "monthlyRankings")
}

export const getMonthlyPointsCollection = () => {
  const safeDb = getSafeDb()
  if (!safeDb) throw new Error("Database not initialized")
  return collection(safeDb, "monthlyPoints")
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
