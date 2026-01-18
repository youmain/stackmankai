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

// --- プレイヤー関連操作 ---

export const subscribeToPlayers = (
  storeIdOrCallback: string | ((players: Player[]) => void),
  callbackOrOnError?: ((players: Player[]) => void) | ((error: Error) => void),
  storeIdOrUndefined?: string | null,
): (() => void) => {
  // オーバーロード対応: 新しいシグネチャ (storeId, callback) と古いシグネチャ (callback, onError?, storeId?) の両方に対応
  let actualStoreId: string | null = null
  let actualCallback: (players: Player[]) => void
  let actualOnError: ((error: Error) => void) | undefined

  if (typeof storeIdOrCallback === "string") {
    // 新しいシグネチャ: subscribeToPlayers(storeId, callback)
    actualStoreId = storeIdOrCallback
    actualCallback = callbackOrOnError as (players: Player[]) => void
  } else {
    // 古いシグネチャ: subscribeToPlayers(callback, onError?, storeId?)
    actualCallback = storeIdOrCallback
    actualOnError = callbackOrOnError as ((error: Error) => void) | undefined
    actualStoreId = storeIdOrUndefined || null
  }

  if (!isFirebaseConfigured) {
    if (actualStoreId) {
      actualCallback(mockPlayers.filter((p) => p.storeId === actualStoreId))
    } else {
      actualCallback(mockPlayers)
    }
    return () => {}
  }

  const playersCollection = getPlayersCollection()
  let q = query(playersCollection, orderBy("name"))

  if (actualStoreId) {
    q = query(playersCollection, where("storeId", "==", actualStoreId), orderBy("name"))
  }

  return onSnapshot(
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
}

export const getPlayer = async (id: string): Promise<Player | null> => {
  if (!isFirebaseConfigured) {
    const player = mockPlayers.find((p) => p.id === id)
    return player || null
  }
  const validatedId = validateId(id, "プレイヤーID")
  const playerRef = doc(getPlayersCollection(), validatedId)
  const playerSnap = await getDoc(playerRef)
  if (!playerSnap.exists()) {
    return null
  }
  return { id: playerSnap.id, ...playerSnap.data() } as Player
}

export const addPlayer = async (player: Omit<Player, "id">): Promise<string> => {
  if (!isFirebaseConfigured) {
    log.info("[v0] モック環境: プレイヤー追加をシミュレート", { player })
    return `mock_player_${Date.now()}`
  }
  const playersCollection = getPlayersCollection()
  const docRef = await addDoc(playersCollection, {
    ...player,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  })
  return docRef.id
}

export const updatePlayer = async (id: string, updates: Partial<Player>): Promise<void> => {
  if (!isFirebaseConfigured) {
    log.info("[v0] モック環境: プレイヤー更新をシミュレート", { id, updates })
    return
  }
  const validatedId = validateId(id, "プレイヤーID")
  const playerRef = doc(getPlayersCollection(), validatedId)
  await updateDoc(playerRef, { ...updates, updatedAt: serverTimestamp() })
}

export const deletePlayer = async (id: string): Promise<void> => {
  if (!isFirebaseConfigured) {
    log.info("[v0] モック環境: プレイヤー削除をシミュレート", { id })
    return
  }
  const validatedId = validateId(id, "プレイヤーID")
  await deleteDoc(doc(getPlayersCollection(), validatedId))
}

export const archivePlayer = async (id: string): Promise<void> => {
  if (!isFirebaseConfigured) {
    log.info("[v0] モック環境: プレイヤーのアーカイブをシミュレート", { id })
    return
  }
  const validatedId = validateId(id, "プレイヤーID")
  const playerRef = doc(getPlayersCollection(), validatedId)
  await updateDoc(playerRef, { isArchived: true, updatedAt: serverTimestamp() })
}

export const unarchivePlayer = async (id: string): Promise<void> => {
  if (!isFirebaseConfigured) {
    log.info("[v0] モック環境: プレイヤーのアーカイブ解除をシミュレート", { id })
    return
  }
  const validatedId = validateId(id, "プレイヤーID")
  const playerRef = doc(getPlayersCollection(), validatedId)
  await updateDoc(playerRef, { isArchived: false, updatedAt: serverTimestamp() })
}

export const updatePlayerMembershipRank = async (playerId: string): Promise<void> => {
  if (!isFirebaseConfigured) {
    log.info("[v0] モック環境: メンバーシップランク更新をシミュレート", { playerId })
    return
  }

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
}

// --- Game Functions ---

export const deleteAllPlayers = async (storeId: string): Promise<void> => {
  if (!isFirebaseConfigured) return
  const playersCollection = getPlayersCollection()
  const q = query(playersCollection, where("storeId", "==", storeId))
  const snapshot = await getDocs(q)
  const batch = writeBatch(checkFirebaseConfig())
  snapshot.docs.forEach((doc) => {
    batch.delete(doc.ref)
  })
  await batch.commit()
}

export const resetPlayerStatistics = async (storeId: string): Promise<void> => {
  if (!isFirebaseConfigured) return
  const playersCollection = getPlayersCollection()
  const q = query(playersCollection, where("storeId", "==", storeId))
  const snapshot = await getDocs(q)
  const batch = writeBatch(checkFirebaseConfig())
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
