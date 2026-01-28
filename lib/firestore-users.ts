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
  getUsersCollection,
  getRakeHistoryCollection,
} from "./firestore-common"

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

// --- ユーザー・店舗関連操作 ---

export const createOrUpdateUser = async (name: string): Promise<string> => {
  if (!isFirebaseConfigured()) {
    log.info("[v0] モック環境: ユーザー作成をシミュレート", { name })
    return `mock_user_${Date.now()}`
  }

  const usersCollection = getUsersCollection()

  const q = query(usersCollection, where("name", "==", name), limit(1))
  const snapshot = await getDocs(q)

  if (!snapshot.empty) {
    const userId = snapshot.docs[0].id
    log.info("[v0] 既存ユーザーを更新", { userId, name })
    await updateDoc(doc(usersCollection, userId), {
      name,
      updatedAt: serverTimestamp(),
    })
    return userId
  } else {
    log.info("[v0] 新規ユーザーを作成", { name })
    const docRef = await addDoc(usersCollection, {
      name,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    })
    return docRef.id
  }
}

export const subscribeToUsers = (arg1: any): (() => void) => {
  const callback = typeof arg1 === "function" ? arg1 : () => {};
  if (!isFirebaseConfigured()) {
    callback(mockUsers)
    return () => {}
  }
  const usersCollection = getUsersCollection()
  const q = query(usersCollection, orderBy("name"))
  return onSnapshot(q, (snapshot) => {
    const users = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }))
    callback(users)
  })
}

// --- Player Functions ---

import { performanceMonitor } from './performance-monitor'

export const subscribeToRakeHistory = (arg1: any, arg2?: any): (() => void) => {
  const callback = typeof arg1 === "function" ? arg1 : (typeof arg2 === "function" ? arg2 : () => {});
  const storeId = typeof arg1 === "string" ? arg1 : (typeof arg2 === "string" ? arg2 : null);

  if (!isFirebaseConfigured()) {
    callback(mockRakeHistory)
    return () => {}
  }
  const historyCollection = getRakeHistoryCollection()
  let q = query(historyCollection, orderBy("date", "desc"), limit(30))

  if (storeId) {
    q = query(historyCollection, where("storeId", "==", storeId), orderBy("date", "desc"), limit(30))
  }

  return onSnapshot(q, (snapshot) => {
    const history = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }))
    callback(history)
  })
}

// --- Store Functions ---

export const subscribeToStores = (arg1: any): (() => void) => {
  const callback = typeof arg1 === "function" ? arg1 : () => {};
  if (!isFirebaseConfigured()) {
    callback([])
    return () => {}
  }
  const storesCollection = collection(getDb(), "stores")
  const q = query(storesCollection, orderBy("name"))
  return onSnapshot(q, (snapshot) => {
    const stores = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }))
    callback(stores)
  })
}

export const getStore = async (id: string): Promise<any | null> => {
  if (!isFirebaseConfigured()) {
    return null
  }
  const storeRef = doc(collection(getDb(), "stores"), id)
  const storeSnap = await getDoc(storeRef)
  if (!storeSnap.exists()) {
    return null
  }
  return { id: storeSnap.id, ...storeSnap.data() }
}

// --- Post Functions ---


export const getUserData = async (userId: string): Promise<any | null> => {
  if (!isFirebaseConfigured()) {
    return null;
  }
  const userRef = doc(getUsersCollection(), userId);
  const userSnap = await getDoc(userRef);
  if (!userSnap.exists()) return null;
  return { id: userSnap.id, ...userSnap.data() };
};
