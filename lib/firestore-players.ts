import {
  doc,
  getDoc,
  updateDoc,
  serverTimestamp,
  getDocs,
  query,
  where,
  orderBy,
  addDoc,
  onSnapshot,
  deleteDoc,
  writeBatch,
} from "firebase/firestore"
import { getDb, isFirebaseConfigured } from "./firebase"
import {
  getPlayersCollection,
  deleteCustomerAccount,
  safeQuery,
  safeOnSnapshot,
} from "./firestore-common"
import { validateId } from "./validation"
import { createModuleLogger } from "./logger"
import type { Player } from "@/types"
import { mockPlayers } from "./mock-data"

const log = createModuleLogger("FirestorePlayers")

// --- プレイヤー関連操作 ---

export const subscribeToPlayers = (
  arg1: any,
  arg2?: any,
  arg3?: any
): (() => void) => {
  let storeId: string | null = null
  let callback: (players: Player[]) => void = () => {}
  let onError: ((error: Error) => void) | undefined

  // 引数のパース
  if (typeof arg1 === "string") {
    storeId = arg1
    callback = typeof arg2 === "function" ? arg2 : () => {}
    onError = typeof arg3 === "function" ? arg3 : undefined
  } else if (typeof arg1 === "function") {
    callback = arg1
    onError = typeof arg2 === "function" ? arg2 : undefined
    storeId = typeof arg3 === "string" ? arg3 : (typeof arg2 === "string" ? arg2 : null)
  }

  // Firebaseが未設定またはDBがない場合はモックデータを返す
  if (!isFirebaseConfigured() || !getDb()) {
    const players = storeId ? mockPlayers.filter(p => p.storeId === storeId) : mockPlayers
    callback(players as Player[])
    return () => {}
  }

  try {
    const playersCol = getPlayersCollection()
    const q = storeId 
      ? safeQuery(playersCol, where("storeId", "==", storeId), orderBy("name"))
      : safeQuery(playersCol, orderBy("name"))

    const unsubscribe = safeOnSnapshot(
      q,
      (snapshot) => {
        const players = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
          lastGameDate: doc.data().lastGameDate?.toDate() || null,
          createdAt: doc.data().createdAt?.toDate() || new Date(),
          updatedAt: doc.data().updatedAt?.toDate() || new Date(),
        })) as Player[]
        callback(players)
      },
      (error) => {
        log.error("Error fetching players:", error)
        if (onError) onError(error)
      }
    )

    return typeof unsubscribe === "function" ? unsubscribe : () => {}
  } catch (error) {
    log.error("Failed to setup players subscription:", error)
    return () => {}
  }
}

export const getPlayer = async (id: string): Promise<Player | null> => {
  if (!isFirebaseConfigured() || !getDb()) {
    return (mockPlayers.find(p => p.id === id) as Player) || null
  }
  try {
    const playersCol = getPlayersCollection()
    if (!playersCol) return null
    const playerSnap = await getDoc(doc(playersCol, validateId(id, "プレイヤーID")))
    return playerSnap.exists() ? ({ id: playerSnap.id, ...playerSnap.data() } as Player) : null
  } catch (error) {
    log.error("プレイヤー取得失敗:", error)
    return null
  }
}

export const addPlayer = async (player: Omit<Player, "id">): Promise<string> => {
  if (!isFirebaseConfigured() || !getDb()) return `mock_${Date.now()}`
  const playersCol = getPlayersCollection()
  if (!playersCol) throw new Error("Database not initialized")
  const docRef = await addDoc(playersCol, { ...player, createdAt: serverTimestamp(), updatedAt: serverTimestamp() })
  return docRef.id
}

export const updatePlayer = async (id: string, updates: Partial<Player>): Promise<void> => {
  if (!isFirebaseConfigured() || !getDb()) return
  const playersCol = getPlayersCollection()
  if (!playersCol) return
  await updateDoc(doc(playersCol, validateId(id, "プレイヤーID")), { ...updates, updatedAt: serverTimestamp() })
}

export const deletePlayer = async (id: string): Promise<void> => {
  if (!isFirebaseConfigured() || !getDb()) return
  const playersCol = getPlayersCollection()
  if (!playersCol) return
  await deleteDoc(doc(playersCol, validateId(id, "プレイヤーID")))
}

export const archivePlayer = async (id: string): Promise<void> => {
  await updatePlayer(id, { isArchived: true })
}

export const unarchivePlayer = async (id: string): Promise<void> => {
  await updatePlayer(id, { isArchived: false })
}

export const updatePlayerMembershipRank = async (playerId: string): Promise<void> => {
  const player = await getPlayer(playerId)
  if (!player) return
  const totalCP = player.totalCPEarned || 0
  let newRank = "bronze"
  if (totalCP >= 100000) newRank = "platinum"
  else if (totalCP >= 50000) newRank = "gold"
  else if (totalCP >= 10000) newRank = "silver"
  if (newRank !== player.membershipRank) await updatePlayer(playerId, { membershipRank: newRank })
}

export const deleteAllPlayers = async (storeId: string): Promise<void> => {
  if (!getDb()) return
  const playersCol = getPlayersCollection()
  if (!playersCol) return
  const snapshot = await getDocs(query(playersCol, where("storeId", "==", storeId)))
  const batch = writeBatch(getDb()!)
  snapshot.docs.forEach(d => batch.delete(d.ref))
  await batch.commit()
}

export const resetPlayerStatistics = async (storeId: string): Promise<void> => {
  if (!getDb()) return
  const playersCol = getPlayersCollection()
  if (!playersCol) return
  const snapshot = await getDocs(query(playersCol, where("storeId", "==", storeId)))
  const batch = writeBatch(getDb()!)
  snapshot.docs.forEach(d => batch.update(d.ref, { totalBuyin: 0, totalProfit: 0, totalGames: 0 }))
  await batch.commit()
}

export const togglePlayerStatus = async (playerId: string): Promise<void> => {
  const player = await getPlayer(playerId)
  if (player) await updatePlayer(playerId, { status: player.status === "active" ? "inactive" : "active" })
}

export const updatePlayerBalance = async (playerId: string, amount: number): Promise<void> => {
  const player = await getPlayer(playerId)
  if (player) await updatePlayer(playerId, { balance: (player.balance || 0) + amount })
}

export const cancelPlayerAccount = async (customerId: string): Promise<void> => {
  await deleteCustomerAccount(customerId)
}
