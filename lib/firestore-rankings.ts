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

// --- ランキング・統計関連操作 ---

export const subscribeToDailyRankings = (
  callback: (rankings: PlayerRanking[]) => void,
  storeId?: string | null,
): (() => void) => {
  if (!isFirebaseConfigured) {
    callback(mockDailyRankings)
    return () => {}
  }

  const rankingsCollection = getDailyRankingsCollection()
  let q = query(rankingsCollection, orderBy("date", "desc"), limit(30))

  if (storeId) {
    q = query(rankingsCollection, where("storeId", "==", storeId), orderBy("date", "desc"), limit(30))
  }

  return onSnapshot(q, (snapshot) => {
    const rankings = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }))
    callback(rankings)
  })
}

export const subscribeToMonthlyPoints = (year: number, month: number, callback: (points: any[]) => void, storeId?: string | null): (() => void) => {
  if (!isFirebaseConfigured) {
    callback(mockMonthlyPoints)
    return () => {}
  }
  const pointsCollection = getMonthlyPointsCollection()
  let q = query(pointsCollection, orderBy("month", "desc"), limit(12))

  if (storeId) {
    q = query(pointsCollection, where("storeId", "==", storeId), orderBy("month", "desc"), limit(12))
  }

  return onSnapshot(q, (snapshot) => {
    const points = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }))
    callback(points)
  })
}

export const subscribeToMonthlyRankings = (callback: (rankings: any[]) => void, storeId?: string | null): (() => void) => {
  if (!isFirebaseConfigured) {
    callback(mockMonthlyRankings)
    return () => {}
  }
  const rankingsCollection = getMonthlyRankingsCollection()
  let q = query(rankingsCollection, orderBy("month", "desc"), limit(12))

  if (storeId) {
    q = query(rankingsCollection, where("storeId", "==", storeId), orderBy("month", "desc"), limit(12))
  }

  return onSnapshot(q, (snapshot) => {
    const rankings = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }))
    callback(rankings)
  })
}

export const subscribeToDailySales = (
  callback: (sales: DailySales[]) => void,
  storeId?: string | null,
): (() => void) => {
  if (!isFirebaseConfigured) {
    callback([])
    return () => {}
  }
  const salesCollection = getDailySalesCollection()
  let q = query(salesCollection, orderBy("date", "desc"), limit(30))

  if (storeId) {
    q = query(salesCollection, where("storeId", "==", storeId), orderBy("date", "desc"), limit(30))
  }

  return onSnapshot(q, (snapshot) => {
    const sales = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }) as DailySales)
    callback(sales)
  })
}

export const deleteDailySales = async (salesId: string): Promise<void> => {
  if (!isFirebaseConfigured) return
  await deleteDoc(doc(getDailySalesCollection(), salesId))
}

export const settleDailySales = async (date: string, salesData: any): Promise<void> => {
  if (!isFirebaseConfigured) return
  const salesCollection = getDailySalesCollection()
  const docRef = doc(salesCollection, date)
  await setDoc(docRef, {
    ...salesData,
    date,
    createdAt: serverTimestamp(),
  })
}

export const getStoreRankingSettings = async (storeId: string): Promise<StoreRankingSettings | null> => {
  if (!isFirebaseConfigured) {
    return mockStoreRankingSettings.find((s) => s.id === storeId) || null
  }
  const settingsRef = doc(getStoreRankingSettingsCollection(), storeId)
  const settingsSnap = await getDoc(settingsRef)
  if (!settingsSnap.exists()) {
    return null
  }
  return { id: settingsSnap.id, ...settingsSnap.data() } as StoreRankingSettings
}

export const saveStoreRankingSettings = async (storeId: string, settings: Partial<StoreRankingSettings>): Promise<void> => {
  if (!isFirebaseConfigured) return
  const settingsRef = doc(getStoreRankingSettingsCollection(), storeId)
  await setDoc(settingsRef, { ...settings, updatedAt: serverTimestamp() }, { merge: true })
}

export const subscribeToStoreRankingSettings = (
  callback: (settings: StoreRankingSettings[]) => void,
  storeId?: string | null,
): (() => void) => {
  if (!isFirebaseConfigured) {
    callback(mockStoreRankingSettings)
    return () => {}
  }
  const settingsCollection = getStoreRankingSettingsCollection()
  let q = query(settingsCollection)

  if (storeId) {
    q = query(settingsCollection, where("storeId", "==", storeId))
  }

  return onSnapshot(q, (snapshot) => {
    const settings = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }) as StoreRankingSettings)
    callback(settings)
  })
}

// --- Customer Account Functions ---


export const updateMonthlyPoints = async (playerId: string, points: number): Promise<void> => {
  const player = await getPlayer(playerId);
  if (!player) throw new Error(`Player ${playerId} not found`);
  await updatePlayer(playerId, {
    monthlyPoints: (player.monthlyPoints || 0) + points,
  } as any);
};


export const confirmDailyRanking = async (storeId: string, date: string): Promise<void> => {
  // Implementation for confirming daily ranking
  log.info("[v0] Daily ranking confirmed", { storeId, date });
};
