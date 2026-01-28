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
  return safeDb ? collection(safeDb, "players") : null as any
}

export const getPointHistoryCollection = () => {
  const safeDb = getSafeDb()
  return safeDb ? collection(safeDb, "pointHistory") : null as any
}

export const getUsersCollection = () => {
  const safeDb = getSafeDb()
  return safeDb ? collection(safeDb, "users") : null as any
}

export const getGamesCollection = () => {
  const safeDb = getSafeDb()
  return safeDb ? collection(safeDb, "games") : null as any
}

export const getTransactionsCollection = () => {
  const safeDb = getSafeDb()
  return safeDb ? collection(safeDb, "transactions") : null as any
}

export const getGameTransactionsCollection = () => {
  const safeDb = getSafeDb()
  return safeDb ? collection(safeDb, "gameTransactions") : null as any
}

export const getRakeHistoryCollection = () => {
  const safeDb = getSafeDb()
  return safeDb ? collection(safeDb, "rakeHistory") : null as any
}

export const getReceiptsCollection = () => {
  const safeDb = getSafeDb()
  return safeDb ? collection(safeDb, "receipts") : null as any
}

export const getReceiptItemsCollection = () => {
  const safeDb = getSafeDb()
  return safeDb ? collection(safeDb, "receiptItems") : null as any
}

export const getDailySalesCollection = () => {
  const safeDb = getSafeDb()
  return safeDb ? collection(safeDb, "dailySales") : null as any
}

export const getStoreRankingSettingsCollection = () => {
  const safeDb = getSafeDb()
  return safeDb ? collection(safeDb, "storeRankingSettings") : null as any
}

export const getCustomerAccountsCollection = () => {
  const safeDb = getSafeDb()
  return safeDb ? collection(safeDb, "customerAccounts") : null as any
}

export const getPostsCollection = () => {
  const safeDb = getSafeDb()
  return safeDb ? collection(safeDb, "posts") : null as any
}

export const getPaymentHistoryCollection = () => {
  const safeDb = getSafeDb()
  return safeDb ? collection(safeDb, "paymentHistory") : null as any
}

export const getDailyRankingsCollection = () => {
  const safeDb = getSafeDb()
  return safeDb ? collection(safeDb, "dailyRankings") : null as any
}

export const getMonthlyRankingsCollection = () => {
  const safeDb = getSafeDb()
  return safeDb ? collection(safeDb, "monthlyRankings") : null as any
}

export const getMonthlyPointsCollection = () => {
  const safeDb = getSafeDb()
  return safeDb ? collection(safeDb, "monthlyPoints") : null as any
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
