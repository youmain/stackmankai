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

export const subscribeToActiveGames = (arg1: any): (() => void) => {
  const callback = typeof arg1 === "function" ? arg1 : () => {};
  if (!isFirebaseConfigured()) {
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

export const subscribeToGames = (arg1: any): (() => void) => {
  const callback = typeof arg1 === "function" ? arg1 : () => {};
  if (!isFirebaseConfigured()) {
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
  try {
    const validatedId = validateId(id, "ゲームID")
    const gameRef = doc(getGamesCollection(), validatedId)
    const gameSnap = await getDoc(gameRef)
    if (!gameSnap.exists()) {
      return null
    }
    return { id: gameSnap.id, ...gameSnap.data() } as Game
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    log.error("[ERROR] ゲーム取得に失敗しました", { error: errorMessage, id })
    return null
  }
}

export const addGame = async (game: Omit<Game, "id">): Promise<string> => {
  if (!isFirebaseConfigured) {
    log.info("[v0] モック環境: ゲーム追加をシミュレート", { game })
    return `mock_game_${Date.now()}`
  }
  try {
    const gamesCollection = getGamesCollection()
    const docRef = await addDoc(gamesCollection, {
      ...game,
      startTime: serverTimestamp(),
      updatedAt: serverTimestamp(),
    })
    return docRef.id
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    log.error("[ERROR] ゲーム追加に失敗しました", { error: errorMessage })
    throw error
  }
}

export const updateGame = async (id: string, updates: Partial<Game>): Promise<void> => {
  if (!isFirebaseConfigured) {
    log.info("[v0] モック環境: ゲーム更新をシミュレート", { id, updates })
    return
  }
  try {
    const validatedId = validateId(id, "ゲームID")
    const gameRef = doc(getGamesCollection(), validatedId)
    await updateDoc(gameRef, { ...updates, updatedAt: serverTimestamp() })
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    log.error("[ERROR] ゲーム更新に失敗しました", { error: errorMessage, id })
    throw error
  }
}

export const deleteGame = async (id: string): Promise<void> => {
  if (!isFirebaseConfigured) {
    log.info("[v0] モック環境: ゲーム削除をシミュレート", { id })
    return
  }
  try {
    const validatedId = validateId(id, "ゲームID")
    await deleteDoc(doc(getGamesCollection(), validatedId))
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    log.error("[ERROR] ゲーム削除に失敗しました", { error: errorMessage, id })
    throw error
  }
}

// --- Receipt Functions ---

export const deleteAllGames = async (storeId: string): Promise<void> => {
  if (!isFirebaseConfigured) return
  try {
    const gamesCollection = getGamesCollection()
    const q = query(gamesCollection, where("storeId", "==", storeId))
    const snapshot = await getDocs(q)
    const batch = writeBatch(checkFirebaseConfig())
    snapshot.docs.forEach((doc) => {
      batch.delete(doc.ref)
    })
    await batch.commit()
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    log.error("[ERROR] ゲーム一括削除に失敗しました", { error: errorMessage, storeId })
    throw error
  }
}


export const applyStackResetAndRake = async (gameId: string, rakeAmount: number): Promise<void> => {
  try {
    const game = await getGame(gameId);
    if (!game) throw new Error(`Game ${gameId} not found`);
    await updateGame(gameId, {
      rakeAmount,
      status: "completed",
    } as any);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    log.error("[ERROR] スタックリセットとレーク適用に失敗しました", { error: errorMessage, gameId })
    throw error
  }
};


export const createGame = async (game: Omit<Game, "id">): Promise<string> => {
  return addGame(game);
};


export const addPlayerToGame = async (gameId: string, playerId: string): Promise<void> => {
  try {
    const game = await getGame(gameId);
    if (!game) throw new Error(`Game ${gameId} not found`);
    await updateGame(gameId, {
      playerIds: [...(game.playerIds || []), playerId],
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    log.error("[ERROR] ゲームへのプレイヤー追加に失敗しました", { error: errorMessage, gameId, playerId })
    throw error
  }
};


export const updateGameParticipantStack = async (
  gameId: string,
  playerId: string,
  stack: number,
): Promise<void> => {
  if (!isFirebaseConfigured) {
    log.info("[v0] モック環境: ゲーム参加者のスタック更新をシミュレート", { gameId, playerId, stack });
    return;
  }

  try {
    const db = checkFirebaseConfig();
    const gameRef = doc(db, "games", gameId);
    const gameSnap = await getDoc(gameRef);

    if (!gameSnap.exists()) {
      throw new Error(`ゲームが見つかりません: ${gameId}`);
    }

    const gameData = gameSnap.data();
    const participants = gameData.participants || [];
    const participantIndex = participants.findIndex((p: any) => p.id === playerId);

    if (participantIndex === -1) {
      throw new Error(`ゲームに参加しているプレイヤーが見つかりません: ${playerId}`);
    }

    const updatedParticipants = [...participants];
    updatedParticipants[participantIndex].stack = stack;

    await updateDoc(gameRef, {
      participants: updatedParticipants,
      updatedAt: serverTimestamp(),
    });

    log.info("[v0] ゲーム参加者のスタック更新完了", { gameId, playerId, stack });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    log.error("[ERROR] ゲーム参加者のスタック更新に失敗しました", { error: errorMessage, gameId, playerId })
    throw error
  }
};


export const endGameWithFinalStacks = async (gameId: string, finalStacks: Record<string, number>): Promise<void> => {
  try {
    await updateGame(gameId, {
      status: "completed",
      finalStacks,
      endTime: new Date(),
    } as any);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    log.error("[ERROR] ゲーム終了に失敗しました", { error: errorMessage, gameId })
    throw error
  }
};
