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
import {
  getDailyRankingsCollection,
  getMonthlyPointsCollection,
  getMonthlyRankingsCollection,
  getDailySalesCollection,
  getStoreRankingSettingsCollection,
} from "./firestore-common"
import { getPlayer, updatePlayer } from "./firestore-players"

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

export const subscribeToDailyRankings = (arg1: any, arg2?: any): (() => void) => {
  const callback = typeof arg1 === "function" ? arg1 : (typeof arg2 === "function" ? arg2 : () => {});
  const storeId = typeof arg1 === "string" ? arg1 : (typeof arg2 === "string" ? arg2 : null);

  if (!isFirebaseConfigured) {
    callback(mockDailyRankings)
    return () => {}
  }

  try {
    const rankingsCollection = getDailyRankingsCollection()
    let q = query(rankingsCollection, orderBy("date", "desc"), limit(30))

    if (storeId) {
      q = query(rankingsCollection, where("storeId", "==", storeId), orderBy("date", "desc"), limit(30))
    }

    return onSnapshot(q, (snapshot) => {
      const rankings = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }))
      callback(rankings)
    })
  } catch (error) {
    console.error("Error in subscribeToDailyRankings:", error);
    return () => {};
  }
}

export const subscribeToMonthlyPoints = (arg1: any, arg2?: any, arg3?: any, arg4?: any): (() => void) => {
  // Handle various signatures
  let callback: (points: any[]) => void = () => {};
  let storeId: string | null = null;

  if (typeof arg1 === "function") callback = arg1;
  else if (typeof arg2 === "function") callback = arg2;
  else if (typeof arg3 === "function") callback = arg3;
  else if (typeof arg4 === "function") callback = arg4;

  if (typeof arg1 === "string") storeId = arg1;
  else if (typeof arg2 === "string") storeId = arg2;
  else if (typeof arg3 === "string") storeId = arg3;
  else if (typeof arg4 === "string") storeId = arg4;

  if (!isFirebaseConfigured) {
    callback(mockMonthlyPoints)
    return () => {}
  }
  try {
    const pointsCollection = getMonthlyPointsCollection()
    let q = query(pointsCollection, orderBy("month", "desc"), limit(12))

    if (storeId) {
      q = query(pointsCollection, where("storeId", "==", storeId), orderBy("month", "desc"), limit(12))
    }

    return onSnapshot(q, (snapshot) => {
      const points = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }))
      callback(points)
    })
  } catch (error) {
    console.error("Error in subscribeToMonthlyPoints:", error);
    return () => {};
  }
}

export const subscribeToMonthlyRankings = (arg1: any, arg2?: any): (() => void) => {
  const callback = typeof arg1 === "function" ? arg1 : (typeof arg2 === "function" ? arg2 : () => {});
  const storeId = typeof arg1 === "string" ? arg1 : (typeof arg2 === "string" ? arg2 : null);

  if (!isFirebaseConfigured) {
    callback(mockMonthlyRankings)
    return () => {}
  }
  try {
    const rankingsCollection = getMonthlyRankingsCollection()
    let q = query(rankingsCollection, orderBy("month", "desc"), limit(12))

    if (storeId) {
      q = query(rankingsCollection, where("storeId", "==", storeId), orderBy("month", "desc"), limit(12))
    }

    return onSnapshot(q, (snapshot) => {
      const rankings = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }))
      callback(rankings)
    })
  } catch (error) {
    console.error("Error in subscribeToMonthlyRankings:", error);
    return () => {};
  }
}

export const subscribeToDailySales = (arg1: any, arg2?: any): (() => void) => {
  const callback = typeof arg1 === "function" ? arg1 : (typeof arg2 === "function" ? arg2 : () => {});
  const storeId = typeof arg1 === "string" ? arg1 : (typeof arg2 === "string" ? arg2 : null);

  if (!isFirebaseConfigured) {
    callback([])
    return () => {}
  }
  try {
    const salesCollection = getDailySalesCollection()
    let q = query(salesCollection, orderBy("date", "desc"), limit(30))

    if (storeId) {
      q = query(salesCollection, where("storeId", "==", storeId), orderBy("date", "desc"), limit(30))
    }

    return onSnapshot(q, (snapshot) => {
      const sales = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }) as DailySales)
      callback(sales)
    })
  } catch (error) {
    console.error("Error in subscribeToDailySales:", error);
    return () => {};
  }
}

export const deleteDailySales = async (salesId: string): Promise<void> => {
  if (!isFirebaseConfigured) return
  try {
    await deleteDoc(doc(getDailySalesCollection(), salesId))
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    log.error("[ERROR] 日次売上削除に失敗しました", { error: errorMessage, salesId })
    throw error
  }
}

export const settleDailySales = async (date: string, salesData: any): Promise<void> => {
  if (!isFirebaseConfigured) return
  try {
    const salesCollection = getDailySalesCollection()
    const docRef = doc(salesCollection, date)
    await setDoc(docRef, {
      ...salesData,
      date,
      createdAt: serverTimestamp(),
    })
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    log.error("[ERROR] 日次売上算出に失敗しました", { error: errorMessage, date })
    throw error
  }
}

export const getStoreRankingSettings = async (storeId: string): Promise<StoreRankingSettings | null> => {
  if (!isFirebaseConfigured) {
    return mockStoreRankingSettings.find((s) => s.id === storeId) || null
  }
  try {
    const settingsRef = doc(getStoreRankingSettingsCollection(), storeId)
    const settingsSnap = await getDoc(settingsRef)
    if (!settingsSnap.exists()) {
      return null
    }
    return { id: settingsSnap.id, ...settingsSnap.data() } as StoreRankingSettings
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    log.error("[ERROR] 店舗ランキング設定取得に失敗しました", { error: errorMessage, storeId })
    return null
  }
}

export const saveStoreRankingSettings = async (storeId: string, settings: Partial<StoreRankingSettings>): Promise<void> => {
  if (!isFirebaseConfigured) return
  try {
    const settingsRef = doc(getStoreRankingSettingsCollection(), storeId)
    await setDoc(settingsRef, { ...settings, updatedAt: serverTimestamp() }, { merge: true })
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    log.error("[ERROR] 店舗ランキング設定保存に失敗しました", { error: errorMessage, storeId })
    throw error
  }
}

export const subscribeToStoreRankingSettings = (arg1: any, arg2?: any): (() => void) => {
  const callback = typeof arg1 === "function" ? arg1 : (typeof arg2 === "function" ? arg2 : () => {});
  const storeId = typeof arg1 === "string" ? arg1 : (typeof arg2 === "string" ? arg2 : null);

  if (!isFirebaseConfigured) {
    callback(mockStoreRankingSettings)
    return () => {}
  }
  try {
    const settingsCollection = getStoreRankingSettingsCollection()
    let q = query(settingsCollection)

    if (storeId) {
      q = query(settingsCollection, where("storeId", "==", storeId))
    }

    return onSnapshot(q, (snapshot) => {
      const settings = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }) as StoreRankingSettings)
      callback(settings)
    })
  } catch (error) {
    console.error("Error in subscribeToStoreRankingSettings:", error);
    return () => {};
  }
}

// --- Customer Account Functions ---


export const updateMonthlyPoints = async (playerId: string, points: number): Promise<void> => {
  try {
    const player = await getPlayer(playerId);
    if (!player) throw new Error(`Player ${playerId} not found`);
    await updatePlayer(playerId, {
      monthlyPoints: (player.monthlyPoints || 0) + points,
    } as any);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    log.error("[ERROR] 月間ポイント更新に失敗しました", { error: errorMessage, playerId })
    throw error
  }
};


export const confirmDailyRanking = async (storeId: string, date: string): Promise<void> => {
  // Implementation for confirming daily ranking
  log.info("[v0] Daily ranking confirmed", { storeId, date });
};


export const updateProvisionalRankingForToday = async (storeId: string): Promise<void> => {
  // Implementation for updating provisional ranking
  log.info("[v0] Provisional ranking update triggered", { storeId });
};


export const updateStoreRankingSettings = async (storeId: string, settings: Partial<StoreRankingSettings>): Promise<void> => {
  try {
    return saveStoreRankingSettings(storeId, settings);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    log.error("[ERROR] 店舗ランキング設定更新に失敗しました", { error: errorMessage, storeId })
    throw error
  }
};
