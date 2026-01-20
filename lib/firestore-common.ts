import {
  Timestamp,
  doc,
  getDoc,
  updateDoc,
  serverTimestamp,
  getDocs,
  query,
  where,
  orderBy,
  limit,
  addDoc,
  onSnapshot,
  collection,
  deleteDoc,
  setDoc,
  writeBatch,
} from "firebase/firestore"
import { getDb, isFirebaseConfigured } from "./firebase"

// Force Vercel rebuild with stable version - Manus AI (2026-01-13)
import { validateId } from "./validation"
import { createModuleLogger } from "./logger"
import type {
  Player,
  Game,
  Receipt,
  ReceiptItem,
  DailySales,
  StoreRankingSettings,
  CustomerAccount,
  PaymentHistory,
} from "@/types"
import type { PostData as Post } from "@/types/post"
import type { PlayerRanking } from "@/types"
import {
  mockPlayers,
  mockGames,
  mockReceipts,
  mockRakeHistory,
  mockUsers,
  mockStoreRankingSettings,
  mockDailyRankings,
  mockMonthlyRankings,
  mockMonthlyPoints,
} from "./mock-data"

const log = createModuleLogger("Firestore")

// --- 共通・ユーティリティ関数 ---

export const checkFirebaseConfig = () => {
  if (typeof window !== "undefined") {
    const isConfigured = !!process.env.NEXT_PUBLIC_FIREBASE_API_KEY || 
                        (window as any).__FIREBASE_CONFIGURED__;
    if (!isConfigured) {
      console.warn("[Firebase] Configuration missing in browser");
    }
  }

  const db = getDb()
  if (!db) {
    throw new Error("Firestoreが初期化されていません。環境変数を確認してください。")
  }
  return db
}

export const getPlayersCollection = (storeId?: string) => {
  const db = checkFirebaseConfig()
  // プレイヤーデータは常にトップレベルの /players コレクションに保存されている
  // storeIdでの絞り込みはクエリ条件で実施する
  return collection(db, "players")
}

export const getPointHistoryCollection = () => {
  const db = checkFirebaseConfig()
  return collection(db, "pointHistory")
}

export const getUsersCollection = () => {
  const db = checkFirebaseConfig()
  return collection(db, "users")
}

export const getGamesCollection = () => {
  const db = checkFirebaseConfig()
  return collection(db, "games")
}

export const getTransactionsCollection = () => {
  const db = checkFirebaseConfig()
  return collection(db, "transactions")
}

export const getGameTransactionsCollection = () => {
  const db = checkFirebaseConfig()
  return collection(db, "gameTransactions")
}

export const getRakeHistoryCollection = () => {
  const db = checkFirebaseConfig()
  return collection(db, "rakeHistory")
}

export const getReceiptsCollection = () => {
  const db = checkFirebaseConfig()
  return collection(db, "receipts")
}

export const getReceiptItemsCollection = () => {
  const db = checkFirebaseConfig()
  return collection(db, "receiptItems")
}

export const getDailySalesCollection = () => {
  const db = checkFirebaseConfig()
  return collection(db, "dailySales")
}

export const getStoreRankingSettingsCollection = () => {
  const db = checkFirebaseConfig()
  return collection(db, "storeRankingSettings")
}

export const getCustomerAccountsCollection = () => {
  const db = checkFirebaseConfig()
  return collection(db, "customerAccounts")
}

export const getPostsCollection = () => {
  const db = checkFirebaseConfig()
  return collection(db, "posts")
}

export const getPaymentHistoryCollection = () => {
  const db = checkFirebaseConfig()
  return collection(db, "paymentHistory")
}

export const getDailyRankingsCollection = () => {
  const db = checkFirebaseConfig()
  return collection(db, "dailyRankings")
}

export const getMonthlyRankingsCollection = () => {
  const db = checkFirebaseConfig()
  return collection(db, "monthlyRankings")
}

export const getMonthlyPointsCollection = () => {
  const db = checkFirebaseConfig()
  return collection(db, "monthlyPoints")
}

// --- Point System Functions ---

export const getMembershipRankDetails = (rank: string) => {
  switch (rank) {
    case "platinum":
      return { name: "プラチナ", color: "#E5E4E2" }
    case "gold":
      return { name: "ゴールド", color: "#FFD700" }
    case "silver":
      return { name: "シルバー", color: "#C0C0C0" }
    default:
      return { name: "ブロンズ", color: "#CD7F32" }
  }
}


export const getAdminPassword = async (): Promise<string | null> => {
  try {
    const db = checkFirebaseConfig()
    const docRef = doc(db, "settings", "admin")
    const snapshot = await getDoc(docRef)
    if (!snapshot.exists()) return "0000"
    return snapshot.data().password || "0000"
  } catch (error) {
    return "0000"
  }
}


export const saveAdminPassword = async (password: string): Promise<void> => {
  try {
    const db = checkFirebaseConfig()
    const docRef = doc(db, "settings", "admin")
    await setDoc(docRef, { password, updatedAt: serverTimestamp() })
  } catch (error) {
    console.error("Failed to save admin password:", error)
  }
}

export const deleteCustomerAccount = async (id: string): Promise<void> => {
  try {
    const db = checkFirebaseConfig()
    await deleteDoc(doc(db, "customerAccounts", id))
  } catch (error) {
    console.error("Failed to delete customer account:", error)
    throw error
  }
}

// --- Ranking & Sales Functions ---
