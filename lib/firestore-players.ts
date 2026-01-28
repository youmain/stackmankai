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
  checkFirebaseConfig,
  getPlayersCollection,
  deleteCustomerAccount,
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

// --- プレイヤー関連操作 ---

export const subscribeToPlayers = (
  arg1: any,
  arg2?: any,
  arg3?: any
): (() => void) => {
  let actualStoreId: string | null = null
  let actualCallback: (players: Player[]) => void = () => {}
  let actualOnError: ((error: Error) => void) | undefined

  if (typeof arg1 === "string") {
    // subscribeToPlayers(storeId, callback, onError?)
    actualStoreId = arg1
    actualCallback = typeof arg2 === "function" ? arg2 : () => {}
    actualOnError = typeof arg3 === "function" ? arg3 : undefined
  } else if (typeof arg1 === "function") {
    // subscribeToPlayers(callback, onError?, storeId?)
    actualCallback = arg1
    actualOnError = typeof arg2 === "function" ? arg2 : undefined
    actualStoreId = typeof arg3 === "string" ? arg3 : (typeof arg2 === "string" ? arg2 : null)
  } else {
    console.error("Invalid arguments to subscribeToPlayers", { arg1, arg2, arg3 });
    return () => {};
  }

  const isConfigured = typeof isFirebaseConfigured === 'function' ? isFirebaseConfigured() : isFirebaseConfigured;
  if (!isConfigured) {
    if (actualStoreId) {
      actualCallback(mockPlayers.filter((p) => p.storeId === actualStoreId))
    } else {
      actualCallback(mockPlayers)
    }
    return () => {}
  }

  const db = getDb();
  if (!db) {
    if (actualStoreId) {
      actualCallback(mockPlayers.filter((p) => p.storeId === actualStoreId))
    } else {
      actualCallback(mockPlayers)
    }
    return () => {}
  }

  try {
    const playersCollection = getPlayersCollection()
    if (!playersCollection) return () => {};

    let q = query(playersCollection, orderBy("name"))

    if (actualStoreId) {
      q = query(playersCollection, where("storeId", "==", actualStoreId), orderBy("name"))
    }

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const players = snapshot.docs.map((doc) => {
          const data = doc.data()
          return {
            id: doc.id,
            name: data.name || "",
            pokerName: data.pokerName || "",
            email: data.email || "",
            storeId: data.storeId || "",
            totalBuyin: data.totalBuyin || 0,
            totalProfit: data.totalProfit || 0,
            totalGames: data.totalGames || 0,
            rewardPoints: data.rewardPoints || 0,
            totalCPEarned: data.totalCPEarned || 0,
            membershipRank: data.membershipRank || "bronze",
            lastGameDate: data.lastGameDate?.toDate() || null,
            createdAt: data.createdAt?.toDate() || new Date(),
            updatedAt: data.updatedAt?.toDate() || new Date(),
            isArchived: data.isArchived || false,
            systemBalance: data.systemBalance || 0,
            stapokaBalance: data.stapokaBalance || 0,
            storeName: data.storeName || "",
            isPlaying: data.isPlaying || false,
          } as Player
        })
        actualCallback(players)
      },
      (error) => {
        console.error("Error fetching players:", error)
        if (actualOnError) {
          actualOnError(error)
        }
      },
    )

    return typeof unsubscribe === 'function' ? unsubscribe : () => {};
  } catch (error) {
    console.error("Failed to setup players subscription:", error);
    return () => {};
  }
}

export const getPlayer = async (id: string): Promise<Player | null> => {
  const isConfigured = typeof isFirebaseConfigured === 'function' ? isFirebaseConfigured() : isFirebaseConfigured;
  if (!isConfigured) {
    const player = mockPlayers.find((p) => p.id === id)
    return player || null
  }
  try {
    const validatedId = validateId(id, "プレイヤーID")
    const playersCollection = getPlayersCollection()
    if (!playersCollection) return null;
    
    const playerRef = doc(playersCollection, validatedId)
    const playerSnap = await getDoc(playerRef)
    if (!playerSnap.exists()) {
      return null
    }
    return { id: playerSnap.id, ...playerSnap.data() } as Player
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    log.error("[ERROR] プレイヤー取得に失敗しました", { error: errorMessage, id })
    return null
  }
}

export const addPlayer = async (player: Omit<Player, "id">): Promise<string> => {
  const isConfigured = typeof isFirebaseConfigured === 'function' ? isFirebaseConfigured() : isFirebaseConfigured;
  if (!isConfigured) {
    log.info("[v0] モック環境: プレイヤー追加をシミュレート", { player })
    return `mock_player_${Date.now()}`
  }
  try {
    const playersCollection = getPlayersCollection()
    if (!playersCollection) throw new Error("Firestore is not initialized");
    
    const docRef = await addDoc(playersCollection, {
      ...player,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    })
    return docRef.id
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    log.error("[ERROR] プレイヤー追加に失敗しました", { error: errorMessage })
    throw error
  }
}

export const updatePlayer = async (id: string, updates: Partial<Player>): Promise<void> => {
  const isConfigured = typeof isFirebaseConfigured === 'function' ? isFirebaseConfigured() : isFirebaseConfigured;
  if (!isConfigured) {
    log.info("[v0] モック環境: プレイヤー更新をシミュレート", { id, updates })
    return
  }
  try {
    const validatedId = validateId(id, "プレイヤーID")
    const playersCollection = getPlayersCollection()
    if (!playersCollection) throw new Error("Firestore is not initialized");
    
    const playerRef = doc(playersCollection, validatedId)
    await updateDoc(playerRef, { ...updates, updatedAt: serverTimestamp() })
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    log.error("[ERROR] プレイヤー更新に失敗しました", { error: errorMessage, id })
    throw error
  }
}

export const deletePlayer = async (id: string): Promise<void> => {
  const isConfigured = typeof isFirebaseConfigured === 'function' ? isFirebaseConfigured() : isFirebaseConfigured;
  if (!isConfigured) {
    log.info("[v0] モック環境: プレイヤー削除をシミュレート", { id })
    return
  }
  try {
    const validatedId = validateId(id, "プレイヤーID")
    const playersCollection = getPlayersCollection()
    if (!playersCollection) throw new Error("Firestore is not initialized");
    
    await deleteDoc(doc(playersCollection, validatedId))
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    log.error("[ERROR] プレイヤー削除に失敗しました", { error: errorMessage, id })
    throw error
  }
}

export const archivePlayer = async (id: string): Promise<void> => {
  const isConfigured = typeof isFirebaseConfigured === 'function' ? isFirebaseConfigured() : isFirebaseConfigured;
  if (!isConfigured) {
    log.info("[v0] モック環境: プレイヤーのアーカイブをシミュレート", { id })
    return
  }
  try {
    const validatedId = validateId(id, "プレイヤーID")
    const playersCollection = getPlayersCollection()
    if (!playersCollection) throw new Error("Firestore is not initialized");
    
    const playerRef = doc(playersCollection, validatedId)
    await updateDoc(playerRef, { isArchived: true, updatedAt: serverTimestamp() })
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    log.error("[ERROR] プレイヤーアーカイブに失敗しました", { error: errorMessage, id })
    throw error
  }
}

export const unarchivePlayer = async (id: string): Promise<void> => {
  const isConfigured = typeof isFirebaseConfigured === 'function' ? isFirebaseConfigured() : isFirebaseConfigured;
  if (!isConfigured) {
    log.info("[v0] モック環境: プレイヤーのアーカイブ解除をシミュレート", { id })
    return
  }
  try {
    const validatedId = validateId(id, "プレイヤーID")
    const playersCollection = getPlayersCollection()
    if (!playersCollection) throw new Error("Firestore is not initialized");
    
    const playerRef = doc(playersCollection, validatedId)
    await updateDoc(playerRef, { isArchived: false, updatedAt: serverTimestamp() })
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    log.error("[ERROR] プレイヤーアーカイブ解除に失敗しました", { error: errorMessage, id })
    throw error
  }
}

export const updatePlayerMembershipRank = async (playerId: string): Promise<void> => {
  const isConfigured = typeof isFirebaseConfigured === 'function' ? isFirebaseConfigured() : isFirebaseConfigured;
  if (!isConfigured) {
    log.info("[v0] モック環境: メンバーシップランク更新をシミュレート", { playerId })
    return
  }

  try {
    const player = await getPlayer(playerId)
    if (!player) return

    const totalCP = player.totalCPEarned || 0
    let newRank = "bronze"
    if (totalCP >= 100000) {
      newRank = "platinum"
    } else if (totalCP >= 50000) {
      newRank = "gold"
    } else if (totalCP >= 10000) {
      newRank = "silver"
    }

    if (newRank !== player.membershipRank) {
      await updatePlayer(playerId, { membershipRank: newRank })
      log.info(`[v0] プレイヤー ${playerId} のランクが ${newRank} に更新されました`)
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    log.error("[ERROR] メンバーシップランク更新に失敗しました", { error: errorMessage, playerId })
  }
}

// --- Game Functions ---

export const deleteAllPlayers = async (storeId: string): Promise<void> => {
  const isConfigured = typeof isFirebaseConfigured === 'function' ? isFirebaseConfigured() : isFirebaseConfigured;
  if (!isConfigured) return
  
  const playersCollection = getPlayersCollection()
  if (!playersCollection) return;
  
  const q = query(playersCollection, where("storeId", "==", storeId))
  const snapshot = await getDocs(q)
  
  const db = getDb();
  if (!db) return;
  
  const batch = writeBatch(db)
  snapshot.docs.forEach((doc) => {
    batch.delete(doc.ref)
  })
  await batch.commit()
}

export const resetPlayerStatistics = async (storeId: string): Promise<void> => {
  const isConfigured = typeof isFirebaseConfigured === 'function' ? isFirebaseConfigured() : isFirebaseConfigured;
  if (!isConfigured) return
  
  const playersCollection = getPlayersCollection()
  if (!playersCollection) return;
  
  const q = query(playersCollection, where("storeId", "==", storeId))
  const snapshot = await getDocs(q)
  
  const db = getDb();
  if (!db) return;
  
  const batch = writeBatch(db)
  snapshot.docs.forEach((doc) => {
    batch.update(doc.ref, {
      totalBuyin: 0,
      totalProfit: 0,
      totalGames: 0,
    })
  })
  await batch.commit()
}


export const togglePlayerStatus = async (playerId: string): Promise<void> => {
  const player = await getPlayer(playerId);
  if (!player) throw new Error(`Player ${playerId} not found`);
  await updatePlayer(playerId, {
    status: player.status === "active" ? "inactive" : "active",
  });
};


export const updatePlayerBalance = async (playerId: string, amount: number): Promise<void> => {
  const player = await getPlayer(playerId);
  if (!player) throw new Error(`Player ${playerId} not found`);
  await updatePlayer(playerId, {
    balance: (player.balance || 0) + amount,
  });
};


export const cancelPlayerAccount = async (customerId: string): Promise<void> => {
  await deleteCustomerAccount(customerId);
};
