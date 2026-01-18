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

// --- ゲーム関連操作 ---

export const subscribeToActiveGames = (callback: (games: Game[]) => void): (() => void) => {
  if (!isFirebaseConfigured) {
    callback(mockGames.filter((g) => g.status === "active"))
    return () => {}
  }
  const gamesCollection = getGamesCollection()
  const q = query(gamesCollection, where("status", "==", "active"), orderBy("startTime", "desc"))
  return onSnapshot(q, (snapshot) => {
    const games = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }) as Game)
    callback(games)
  })
}

export const subscribeToGames = (callback: (games: Game[]) => void): (() => void) => {
  if (!isFirebaseConfigured) {
    callback(mockGames)
    return () => {}
  }
  const gamesCollection = getGamesCollection()
  const q = query(gamesCollection, orderBy("startTime", "desc"))
  return onSnapshot(q, (snapshot) => {
    const games = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }) as Game)
    callback(games)
  })
}

export const getGame = async (id: string): Promise<Game | null> => {
  if (!isFirebaseConfigured) {
    const game = mockGames.find((g) => g.id === id)
    return game || null
  }
  const validatedId = validateId(id, "ゲームID")
  const gameRef = doc(getGamesCollection(), validatedId)
  const gameSnap = await getDoc(gameRef)
  if (!gameSnap.exists()) {
    return null
  }
  return { id: gameSnap.id, ...gameSnap.data() } as Game
}

export const addGame = async (game: Omit<Game, "id">): Promise<string> => {
  if (!isFirebaseConfigured) {
    log.info("[v0] モック環境: ゲーム追加をシミュレート", { game })
    return `mock_game_${Date.now()}`
  }
  const gamesCollection = getGamesCollection()
  const docRef = await addDoc(gamesCollection, {
    ...game,
    startTime: serverTimestamp(),
    updatedAt: serverTimestamp(),
  })
  return docRef.id
}

export const updateGame = async (id: string, updates: Partial<Game>): Promise<void> => {
  if (!isFirebaseConfigured) {
    log.info("[v0] モック環境: ゲーム更新をシミュレート", { id, updates })
    return
  }
  const validatedId = validateId(id, "ゲームID")
  const gameRef = doc(getGamesCollection(), validatedId)
  await updateDoc(gameRef, { ...updates, updatedAt: serverTimestamp() })
}

export const deleteGame = async (id: string): Promise<void> => {
  if (!isFirebaseConfigured) {
    log.info("[v0] モック環境: ゲーム削除をシミュレート", { id })
    return
  }
  const validatedId = validateId(id, "ゲームID")
  await deleteDoc(doc(getGamesCollection(), validatedId))
}

// --- Receipt Functions ---

export const deleteAllGames = async (storeId: string): Promise<void> => {
  if (!isFirebaseConfigured) return
  const gamesCollection = getGamesCollection()
  const q = query(gamesCollection, where("storeId", "==", storeId))
  const snapshot = await getDocs(q)
  const batch = writeBatch(checkFirebaseConfig())
  snapshot.docs.forEach((doc) => {
    batch.delete(doc.ref)
  })
  await batch.commit()
}


export const applyStackResetAndRake = async (gameId: string, rakeAmount: number): Promise<void> => {
  const game = await getGame(gameId);
  if (!game) throw new Error(`Game ${gameId} not found`);
  await updateGame(gameId, {
    rakeAmount,
    status: "completed",
  } as any);
};
