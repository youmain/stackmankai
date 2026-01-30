import * as firestore from "firebase/firestore"
import { getDb, isFirebaseConfigured } from "./firebase"
import { getGamesCollection, safeQuery, safeOnSnapshot } from "./firestore-common"

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
  const q = safeQuery(gamesCollection, firestore.where("status", "==", "active"), firestore.orderBy("startTime", "desc"))
  return safeOnSnapshot(q, (snapshot) => {
    const games = snapshot.docs.map((doc: any) => ({ id: doc.id, ...doc.data() }) as Game)
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
  const q = safeQuery(gamesCollection, firestore.orderBy("startTime", "desc"))
  return safeOnSnapshot(q, (snapshot) => {
    const games = snapshot.docs.map((doc: any) => ({ id: doc.id, ...doc.data() }) as Game)
    callback(games)
  })
}

export const getGame = async (id: string): Promise<Game | null> => {
  if (!isFirebaseConfigured()) {
    const game = mockGames.find((g) => g.id === id)
    return game || null
  }
  try {
    const validatedId = validateId(id, "ゲームID")
    const gamesCollection = getGamesCollection()
    if (!gamesCollection) return null
    const gameRef = firestore.doc(gamesCollection, validatedId)
    const gameSnap = await firestore.getDoc(gameRef)
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
  if (!isFirebaseConfigured()) {
    log.info("[v0] モック環境: ゲーム追加をシミュレート", { game })
    return `mock_game_${Date.now()}`
  }
  try {
    const gamesCollection = getGamesCollection()
    if (!gamesCollection) throw new Error("Database not initialized")
    const docRef = await firestore.addDoc(gamesCollection, {
      ...game,
      startTime: firestore.serverTimestamp(),
      updatedAt: firestore.serverTimestamp(),
    })
    return docRef.id
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    log.error("[ERROR] ゲーム追加に失敗しました", { error: errorMessage })
    throw error
  }
}

export const updateGame = async (id: string, updates: Partial<Game>): Promise<void> => {
  if (!isFirebaseConfigured()) {
    log.info("[v0] モック環境: ゲーム更新をシミュレート", { id, updates })
    return
  }
  try {
    const validatedId = validateId(id, "ゲームID")
    const gamesCollection = getGamesCollection()
    if (!gamesCollection) return
    const gameRef = firestore.doc(gamesCollection, validatedId)
    await firestore.updateDoc(gameRef, { ...updates, updatedAt: firestore.serverTimestamp() })
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    log.error("[ERROR] ゲーム更新に失敗しました", { error: errorMessage, id })
    throw error
  }
}

export const deleteGame = async (id: string): Promise<void> => {
  if (!isFirebaseConfigured()) {
    log.info("[v0] モック環境: ゲーム削除をシミュレート", { id })
    return
  }
  try {
    const validatedId = validateId(id, "ゲームID")
    const gamesCollection = getGamesCollection()
    if (!gamesCollection) return
    await firestore.deleteDoc(firestore.doc(gamesCollection, validatedId))
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    log.error("[ERROR] ゲーム削除に失敗しました", { error: errorMessage, id })
    throw error
  }
}

// --- Receipt Functions ---

export const deleteAllGames = async (storeId: string): Promise<void> => {
  if (!isFirebaseConfigured()) return
  try {
    const gamesCollection = getGamesCollection()
    if (!gamesCollection) return
    const q = firestore.query(gamesCollection, firestore.where("storeId", "==", storeId))
    const snapshot = await firestore.getDocs(q)
    const db = getDb()
    if (!db) throw new Error("Database not initialized")
    const batch = firestore.writeBatch(db)
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
  if (!isFirebaseConfigured()) {
    log.info("[v0] モック環境: ゲーム参加者のスタック更新をシミュレート", { gameId, playerId, stack });
    return;
  }

  try {
    const db = getDb();
    if (!db) throw new Error("Database not initialized");
    const gameRef = firestore.doc(db, "games", gameId);
    const gameSnap = await firestore.getDoc(gameRef);

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

    await firestore.updateDoc(gameRef, {
      participants: updatedParticipants,
      updatedAt: firestore.serverTimestamp(),
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
