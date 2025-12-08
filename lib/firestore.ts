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

// --- Collection Getters ---

export const checkFirebaseConfig = () => {
  const db = getDb()
  if (!db) {
    throw new Error("Firestoreが初期化されていません")
  }
  return db
}

export const getPlayersCollection = () => {
  const db = checkFirebaseConfig()
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

export const recordPointHistory = async (
  playerId: string,
  playerName: string,
  type: "earn" | "use",
  points: number,
  reason: string,
  balanceBefore: number,
  balanceAfter: number,
  receiptId?: string,
  purchaseAmount?: number,
  rate?: number,
  createdBy = "system",
): Promise<void> => {
  const historyCollection = getPointHistoryCollection()
  if (!historyCollection) {
    console.warn("[v0] モック環境: ポイント履歴記録をスキップ")
    return
  }

  await addDoc(historyCollection, {
    playerId,
    playerName,
    type,
    points,
    reason,
    balanceBefore,
    balanceAfter,
    receiptId: receiptId || null,
    purchaseAmount: purchaseAmount || null,
    rate: rate || null,
    createdAt: serverTimestamp(),
    createdBy,
  })
}

export const addRewardPoints = async (
  playerId: string,
  points: number,
  reason: string,
  receiptId?: string,
  purchaseAmount?: number,
  rate?: number,
  createdBy = "system",
): Promise<void> => {
  if (!isFirebaseConfigured()) {
    log.info("[v0] モック環境: ポイント付与をシミュレート", { playerId, points, reason })
    return
  }

  const db = checkFirebaseConfig()
  const validatedId = validateId(playerId, "プレイヤーID")
  const validatedPoints = Math.max(0, Math.floor(points))

  log.info("[v0] ポイント付与開始", { playerId: validatedId, points: validatedPoints, reason })

  const playerRef = doc(getPlayersCollection(), validatedId)
  const playerSnap = await getDoc(playerRef)

  if (!playerSnap.exists()) {
    throw new Error(`プレイヤーが見つかりません: ${validatedId}`)
  }

  const playerData = playerSnap.data()
  const currentPoints = playerData.rewardPoints || 0
  const currentTotalCP = playerData.totalCPEarned || 0
  const newPoints = currentPoints + validatedPoints
  const newTotalCP = currentTotalCP + validatedPoints

  await updateDoc(playerRef, {
    rewardPoints: newPoints,
    totalCPEarned: newTotalCP,
    updatedAt: serverTimestamp(),
  })

  // ランクアップ判定を実行
  await updatePlayerMembershipRank(validatedId)

  await recordPointHistory(
    validatedId,
    playerData.name || playerData.pokerName || "不明",
    "earn",
    validatedPoints,
    reason,
    currentPoints,
    newPoints,
    receiptId,
    purchaseAmount,
    rate,
    createdBy,
  )

  log.info("[v0] ポイント付与完了", { playerId: validatedId, 前: currentPoints, 後: newPoints })
}

export const deductRewardPoints = async (
  playerId: string,
  points: number,
  reason: string,
  receiptId?: string,
  createdBy = "system",
): Promise<void> => {
  if (!isFirebaseConfigured()) {
    log.info("[v0] モック環境: ポイント消費をシミュレート", { playerId, points, reason })
    return
  }

  const db = checkFirebaseConfig()
  const validatedId = validateId(playerId, "プレイヤーID")
  const validatedPoints = Math.max(0, Math.floor(points))

  log.info("[v0] ポイント消費開始", { playerId: validatedId, points: validatedPoints, reason })

  const playerRef = doc(getPlayersCollection(), validatedId)
  const playerSnap = await getDoc(playerRef)

  if (!playerSnap.exists()) {
    throw new Error(`プレイヤーが見つかりません: ${validatedId}`)
  }

  const playerData = playerSnap.data()
  const currentPoints = playerData.rewardPoints || 0

  if (currentPoints < validatedPoints) {
    throw new Error(`ポイントが不足しています（保有: ${currentPoints}P, 使用: ${validatedPoints}P）`)
  }

  const newPoints = currentPoints - validatedPoints

  await updateDoc(playerRef, {
    rewardPoints: newPoints,
    updatedAt: serverTimestamp(),
  })

  await recordPointHistory(
    validatedId,
    playerData.name || playerData.pokerName || "不明",
    "use",
    validatedPoints,
    reason,
    currentPoints,
    newPoints,
    receiptId,
    undefined,
    undefined,
    createdBy,
  )

  log.info("[v0] ポイント消費完了", { playerId: validatedId, 前: currentPoints, 後: newPoints })
}

export const subscribeToPointHistory = (playerId: string, callback: (history: any[]) => void): (() => void) => {
  if (!isFirebaseConfigured()) {
    log.warn("[v0] モック環境: ポイント履歴リスナーをスキップ")
    callback([])
    return () => {}
  }

  const historyCollection = getPointHistoryCollection()
  if (!historyCollection) {
    callback([])
    return () => {}
  }

  const q = query(historyCollection, where("playerId", "==", playerId), orderBy("createdAt", "desc"), limit(50))

  return onSnapshot(q, (snapshot) => {
    const history = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate() || new Date(),
    }))
    callback(history)
  })
}

// --- User Functions ---

export const createOrUpdateUser = async (name: string): Promise<string> => {
  if (!isFirebaseConfigured()) {
    log.info("[v0] モック環境: ユーザー作成をシミュレート", { name })
    return `mock_user_${Date.now()}`
  }

  const db = checkFirebaseConfig()
  const usersCollection = getUsersCollection()

  const q = query(usersCollection, where("name", "==", name), limit(1))
  const snapshot = await getDocs(q)

  if (!snapshot.empty) {
    const existingUser = snapshot.docs[0]
    await updateDoc(doc(usersCollection, existingUser.id), {
      lastLoginAt: serverTimestamp(),
      isOnline: true,
    })
    return existingUser.id
  }

  const newUserRef = await addDoc(usersCollection, {
    name,
    isOnline: true,
    createdAt: serverTimestamp(),
    lastLoginAt: serverTimestamp(),
  })

  return newUserRef.id
}

export const updateUserOnlineStatus = async (userId: string, isOnline: boolean): Promise<void> => {
  if (!isFirebaseConfigured()) {
    log.info("[v0] モック環境: オンライン状態更新をシミュレート", { userId, isOnline })
    return
  }

  const db = checkFirebaseConfig()
  const validatedId = validateId(userId, "ユーザーID")
  const userRef = doc(getUsersCollection(), validatedId)

  await updateDoc(userRef, {
    isOnline,
    lastSeenAt: serverTimestamp(),
  })
}

export const subscribeToUsers = (callback: (users: any[]) => void): (() => void) => {
  if (!isFirebaseConfigured()) {
    callback(mockUsers)
    return () => {}
  }
  const usersCollection = getUsersCollection()
  if (!usersCollection) return () => {}

  const q = query(usersCollection, orderBy("lastLoginAt", "desc"), limit(20))
  return onSnapshot(q, (snapshot) => {
    const users = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }))
    callback(users)
  })
}

export const deleteUser = async (userId: string): Promise<void> => {
  if (!isFirebaseConfigured()) return
  const db = checkFirebaseConfig()
  await deleteDoc(doc(getUsersCollection(), userId))
}

// --- Player Functions ---

export const subscribeToPlayers = (
  onUpdate: (players: Player[]) => void,
  onError?: (error: Error) => void,
): (() => void) => {
  if (!isFirebaseConfigured()) {
    onUpdate(mockPlayers)
    return () => {}
  }
  const playersCollection = getPlayersCollection()
  if (!playersCollection) return () => {}

  const q = query(playersCollection, orderBy("name"))
  return onSnapshot(
    q,
    (snapshot) => {
      const players = snapshot.docs.map((doc) => {
        const data = doc.data()
        return {
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : new Date(data.createdAt || Date.now()),
          updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate() : new Date(data.updatedAt || Date.now()),
          subscriptionEndDate: data.subscriptionEndDate?.toDate
            ? data.subscriptionEndDate.toDate()
            : data.subscriptionEndDate
              ? new Date(data.subscriptionEndDate)
              : undefined,
        } as Player
      })
      onUpdate(players)
    },
    onError,
  )
}

export const addPlayer = async (playerData: Partial<Player>): Promise<string> => {
  if (!isFirebaseConfigured()) return `mock_player_${Date.now()}`
  const playersCollection = getPlayersCollection()
  const docRef = await addDoc(playersCollection, {
    ...playerData,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  })
  return docRef.id
}

export const updatePlayer = async (playerId: string, data: Partial<Player>): Promise<void> => {
  if (!isFirebaseConfigured()) return
  const playerRef = doc(getPlayersCollection(), playerId)
  await updateDoc(playerRef, {
    ...data,
    updatedAt: serverTimestamp(),
  })
}

export const deletePlayer = async (playerId: string): Promise<void> => {
  if (!isFirebaseConfigured()) return

  try {
    const db = checkFirebaseConfig()
    const batch = writeBatch(checkFirebaseConfig())

    // Delete player
    batch.delete(doc(getPlayersCollection(), playerId))

    // Delete point history
    const pointHistoryRef = getPointHistoryCollection()
    const pointHistoryQuery = query(pointHistoryRef, where("playerId", "==", playerId))
    const pointHistorySnap = await getDocs(pointHistoryQuery)
    pointHistorySnap.docs.forEach((doc) => batch.delete(doc.ref))

    // Delete receipts
    const receiptsRef = getReceiptsCollection()
    const receiptsQuery = query(receiptsRef, where("playerId", "==", playerId))
    const receiptsSnap = await getDocs(receiptsQuery)
    receiptsSnap.docs.forEach((doc) => batch.delete(doc.ref))

    // Delete transactions
    const transactionsRef = getTransactionsCollection()
    const transactionsQuery = query(transactionsRef, where("playerId", "==", playerId))
    const transactionsSnap = await getDocs(transactionsQuery)
    transactionsSnap.docs.forEach((doc) => batch.delete(doc.ref))

    await batch.commit()
    console.log(`[v0] Player ${playerId} and related data deleted successfully`)
  } catch (error) {
    console.error(`[v0] Error deleting player ${playerId}:`, error)
    throw error
  }
}

export const deleteAllPlayers = async (): Promise<void> => {
  if (!isFirebaseConfigured()) return
  const playersCollection = getPlayersCollection()
  const snapshot = await getDocs(playersCollection)
  const batch = writeBatch(checkFirebaseConfig())
  snapshot.docs.forEach((doc) => {
    batch.delete(doc.ref)
  })
  await batch.commit()
}

export const getPlayer = async (playerId: string): Promise<Player | null> => {
  if (!isFirebaseConfigured()) return mockPlayers.find((p) => p.id === playerId) || null
  const playerRef = doc(getPlayersCollection(), playerId)
  const snapshot = await getDoc(playerRef)
  if (!snapshot.exists()) return null
  return { id: snapshot.id, ...snapshot.data() } as Player
}

export const togglePlayerStatus = async (
  playerId: string,
  status: "normal" | "special" | "deduction",
  updatedBy: string,
): Promise<void> => {
  if (!isFirebaseConfigured()) return
  const playerRef = doc(getPlayersCollection(), playerId)
  await updateDoc(playerRef, {
    isSpecial: status === "special",
    isDeduction: status === "deduction",
    updatedAt: serverTimestamp(),
  })
}

export const updatePlayerBalance = async (
  playerId: string,
  amount: number,
  reason: string,
  updatedBy: string,
): Promise<void> => {
  if (!isFirebaseConfigured()) return
  const playerRef = doc(getPlayersCollection(), playerId)
  const player = await getDoc(playerRef)
  if (!player.exists()) throw new Error("Player not found")
  const currentBalance = player.data().systemBalance || 0
  await updateDoc(playerRef, {
    systemBalance: currentBalance + amount,
    updatedAt: serverTimestamp(),
  })
}

export const resetPlayerStatistics = async (): Promise<void> => {
  if (!isFirebaseConfigured()) return
  const playersCollection = getPlayersCollection()
  const snapshot = await getDocs(playersCollection)
  const batch = writeBatch(checkFirebaseConfig())
  snapshot.docs.forEach((doc) => {
    batch.update(doc.ref, {
      totalBuyIn: 0,
      totalStack: 0,
      gameCount: 0,
      lastPlayedAt: null,
    })
  })
  await batch.commit()
}

// --- Game Functions ---

export const createGame = async (name: string): Promise<string> => {
  if (!isFirebaseConfigured()) return `mock_game_${Date.now()}`
  const gamesCollection = getGamesCollection()
  const docRef = await addDoc(gamesCollection, {
    name,
    isActive: true,
    participants: [],
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  })
  return docRef.id
}

export const subscribeToActiveGames = (callback: (games: Game[]) => void): (() => void) => {
  if (!isFirebaseConfigured()) {
    callback(mockGames)
    return () => {}
  }
  const gamesCollection = getGamesCollection()
  const q = query(gamesCollection, where("isActive", "==", true), orderBy("createdAt", "desc"))
  return onSnapshot(q, (snapshot) => {
    const games = snapshot.docs.map((doc) => {
      const data = doc.data()
      return {
        id: doc.id,
        ...data,
        createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : new Date(data.createdAt || Date.now()),
        updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate() : new Date(data.updatedAt || Date.now()),
        participants: (data.participants || []).map((p: any) => ({
          ...p,
          joinedAt: p.joinedAt?.toDate ? p.joinedAt.toDate() : new Date(p.joinedAt || Date.now()),
        })),
      } as Game
    })
    callback(games)
  })
}

export const subscribeToGames = (callback: (games: Game[]) => void): (() => void) => {
  if (!isFirebaseConfigured()) {
    callback(mockGames)
    return () => {}
  }
  const gamesCollection = getGamesCollection()
  const q = query(gamesCollection, orderBy("createdAt", "desc"), limit(50))
  return onSnapshot(q, (snapshot) => {
    const games = snapshot.docs.map((doc) => {
      const data = doc.data()
      return {
        id: doc.id,
        ...data,
        createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : new Date(data.createdAt || Date.now()),
        updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate() : new Date(data.updatedAt || Date.now()),
        participants: (data.participants || []).map((p: any) => ({
          ...p,
          joinedAt: p.joinedAt?.toDate ? p.joinedAt.toDate() : new Date(p.joinedAt || Date.now()),
        })),
      } as Game
    })
    callback(games)
  })
}

export const addPlayerToGame = async (
  gameId: string,
  playerId: string,
  playerName: string,
  buyInAmount: number,
  addedBy: string,
): Promise<void> => {
  if (!isFirebaseConfigured()) return
  const gameRef = doc(getGamesCollection(), gameId)
  const gameSnap = await getDoc(gameRef)
  if (!gameSnap.exists()) throw new Error("Game not found")

  const gameData = gameSnap.data() as Game
  const participants = gameData.participants || []

  participants.push({
    playerId,
    playerName,
    buyInAmount,
    currentStack: buyInAmount,
    additionalBuyIns: 0,
    joinedAt: new Date(),
  })

  await updateDoc(gameRef, { participants, updatedAt: serverTimestamp() })
  await updatePlayer(playerId, { isPlaying: true, currentGameId: gameId })
}

export const updateGameParticipantStack = async (
  gameId: string,
  playerId: string,
  amount: number,
  reason: string,
  updatedBy: string,
): Promise<void> => {
  if (!isFirebaseConfigured()) return

  try {
    const gameRef = doc(getGamesCollection(), gameId)
    const gameSnap = await getDoc(gameRef)
    if (!gameSnap.exists()) throw new Error("Game not found")

    const gameData = gameSnap.data() as Game
    const participants = gameData.participants || []
    
    // Find participant
    const participantIndex = participants.findIndex((p) => p.playerId === playerId)
    if (participantIndex === -1) {
      throw new Error(`Participant ${playerId} not found in game ${gameId}`)
    }

    const participant = participants[participantIndex]
    const oldStack = participant.currentStack
    const newStack = oldStack + amount

    participants[participantIndex] = {
      ...participant,
      currentStack: newStack,
    }

    await updateDoc(gameRef, { participants, updatedAt: serverTimestamp() })
    console.log(`[v0] Game participant stack updated: ${playerId} ${oldStack} -> ${newStack}`)
  } catch (error) {
    console.error(`[v0] Error updating game participant stack:`, error)
    throw error
  }
}

export const endGameWithFinalStacks = async (
  gameId: string,
  finalStacks: { playerId: string; finalStack: number }[],
  endedBy: string,
): Promise<void> => {
  if (!isFirebaseConfigured()) return
  const gameRef = doc(getGamesCollection(), gameId)
  await updateDoc(gameRef, { isActive: false, updatedAt: serverTimestamp() })

  for (const stack of finalStacks) {
    await updatePlayer(stack.playerId, { isPlaying: false, currentGameId: undefined })
  }

  console.log("[v0] Game ended, updating rankings")
  await updateProvisionalRankingForToday()
}

// --- Receipt Functions ---

export const createReceipt = async (
  playerId: string,
  playerName: string,
  gameId: string,
  createdBy: string,
): Promise<string> => {
  if (!isFirebaseConfigured()) return `mock_receipt_${Date.now()}`
  const receiptsCollection = getReceiptsCollection()
  const docRef = await addDoc(receiptsCollection, {
    playerId,
    playerName,
    gameId,
    status: "active",
    createdAt: serverTimestamp(),
    createdBy,
  })
  return docRef.id
}

export const createStandaloneReceipt = async (
  playerId: string,
  playerName: string,
  createdBy: string,
): Promise<string> => {
  if (!isFirebaseConfigured()) return `mock_receipt_${Date.now()}`
  const receiptsCollection = getReceiptsCollection()
  const docRef = await addDoc(receiptsCollection, {
    playerId,
    playerName,
    status: "active",
    createdAt: serverTimestamp(),
    createdBy,
  })
  return docRef.id
}

export const addReceiptItem = async (receiptId: string, item: Omit<ReceiptItem, "id">): Promise<void> => {
  if (!isFirebaseConfigured()) return
  const itemsCollection = getReceiptItemsCollection()
  await addDoc(itemsCollection, { ...item, receiptId })
}

export const deleteReceiptItem = async (itemId: string): Promise<void> => {
  if (!isFirebaseConfigured()) return
  await deleteDoc(doc(getReceiptItemsCollection(), itemId))
}

export const subscribeToReceipts = (callback: (receipts: Receipt[]) => void): (() => void) => {
  if (!isFirebaseConfigured()) {
    callback(mockReceipts)
    return () => {}
  }
  const receiptsCollection = getReceiptsCollection()
  const q = query(receiptsCollection, orderBy("createdAt", "desc"), limit(50))
  return onSnapshot(q, (snapshot) => {
    const receipts = snapshot.docs.map((doc) => {
      const data = doc.data()
      return {
        id: doc.id,
        ...data,
        createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : new Date(data.createdAt || Date.now()),
        updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate() : new Date(data.updatedAt || Date.now()),
        settledAt: data.settledAt?.toDate
          ? data.settledAt.toDate()
          : data.settledAt
            ? new Date(data.settledAt)
            : undefined,
      } as Receipt
    })
    callback(receipts)
  })
}

export const subscribeToReceiptItems = (receiptId: string, callback: (items: ReceiptItem[]) => void): (() => void) => {
  if (!isFirebaseConfigured()) {
    callback([])
    return () => {}
  }
  const itemsCollection = getReceiptItemsCollection()
  const q = query(itemsCollection, where("receiptId", "==", receiptId))
  return onSnapshot(q, (snapshot) => {
    const items = snapshot.docs.map((doc) => {
      const data = doc.data()
      return {
        id: doc.id,
        ...data,
        createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : new Date(data.createdAt || Date.now()),
      } as ReceiptItem
    })
    callback(items)
  })
}

export const completeReceipt = async (
  receiptId: string,
  receivedAmount: number,
  changeAmount: number,
  pointsUsed: number,
  completedBy: string,
): Promise<void> => {
  if (!isFirebaseConfigured()) return

  try {
    const receiptRef = doc(getReceiptsCollection(), receiptId)
    const receiptSnap = await getDoc(receiptRef)
    if (!receiptSnap.exists()) throw new Error("Receipt not found")

    const receiptData = receiptSnap.data()
    const playerId = receiptData.playerId

    // Deduct points if used
    if (pointsUsed > 0) {
      await deductRewardPoints(playerId, pointsUsed, "会計での使用", receiptId, completedBy)
    }

    // Award points
    const settings = await getStoreRankingSettings()
    const baseRate = settings?.cashbackPointsSettings?.baseRate || 5
    const today = new Date().toISOString().split("T")[0]
    const dailyRate = settings?.cashbackPointsSettings?.dailyRates?.[today]
    const rateToUse = dailyRate !== undefined ? dailyRate : baseRate

    // Calculate eligible amount for points
    let eligibleAmount = receivedAmount
    if (settings?.cashbackPointsSettings?.usageScope === "stack_only") {
      // Get receipt items and sum stack purchases
      const receiptItemsRef = getReceiptItemsCollection()
      const itemsQuery = query(receiptItemsRef, where("receiptId", "==", receiptId))
      const itemsSnap = await getDocs(itemsQuery)
      
      eligibleAmount = 0
      itemsSnap.docs.forEach((doc) => {
        const item = doc.data()
        // Only count stack purchases
        if (item.type === "stack_purchase") {
          eligibleAmount += item.amount || 0
        }
      })
    }

    const pointsToAward = Math.floor(eligibleAmount * (rateToUse / 100))
    if (pointsToAward > 0) {
      await addRewardPoints(
        playerId,
        pointsToAward,
        `会計ポイント付与 (${rateToUse}%)`,
        receiptId,
        eligibleAmount,
        rateToUse,
        completedBy,
      )
    }

    await updateDoc(receiptRef, {
      status: "completed",
      receivedAmount,
      changeAmount,
      pointsUsed,
      completedAt: serverTimestamp(),
      completedBy,
    })

    console.log(`[v0] Receipt ${receiptId} completed successfully`)
  } catch (error) {
    console.error(`[v0] Error completing receipt ${receiptId}:`, error)
    throw error
  }
}

export const deleteReceipt = async (receiptId: string): Promise<void> => {
  if (!isFirebaseConfigured()) return

  try {
    const db = checkFirebaseConfig()
    const batch = writeBatch(checkFirebaseConfig())

    // Delete receipt
    batch.delete(doc(getReceiptsCollection(), receiptId))

    // Delete receipt items
    const receiptItemsRef = getReceiptItemsCollection()
    const receiptItemsQuery = query(receiptItemsRef, where("receiptId", "==", receiptId))
    const receiptItemsSnap = await getDocs(receiptItemsQuery)
    receiptItemsSnap.docs.forEach((doc) => batch.delete(doc.ref))

    await batch.commit()
    console.log(`[v0] Receipt ${receiptId} and items deleted successfully`)
  } catch (error) {
    console.error(`[v0] Error deleting receipt ${receiptId}:`, error)
    throw error
  }
}

// --- Admin Functions ---

export const getAdminPassword = async (): Promise<string | null> => {
  if (!isFirebaseConfigured()) return "0000"
  const db = checkFirebaseConfig()
  const docRef = doc(db, "settings", "admin")
  const snapshot = await getDoc(docRef)
  if (!snapshot.exists()) return "0000"
  return snapshot.data().password || "0000"
}

export const saveAdminPassword = async (password: string): Promise<void> => {
  if (!isFirebaseConfigured()) return
  const db = checkFirebaseConfig()
  const docRef = doc(db, "settings", "admin")
  await setDoc(docRef, { password, updatedAt: serverTimestamp() })
}

// --- Ranking & Sales Functions ---

export const subscribeToDailyRankings = (callback: (rankings: any[]) => void): (() => void) => {
  if (!isFirebaseConfigured()) {
    callback(mockDailyRankings)
    return () => {}
  }
  const rankingsCollection = getDailyRankingsCollection()
  const q = query(rankingsCollection, orderBy("date", "desc"), limit(30))
  return onSnapshot(q, (snapshot) => {
    const rankings = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }))
    callback(rankings)
  })
}

export const subscribeToMonthlyPoints = (year: number, month: number, callback: (points: any[]) => void): (() => void) => {
  if (!isFirebaseConfigured()) {
    callback(mockMonthlyPoints)
    return () => {}
  }
  const pointsCollection = getMonthlyPointsCollection()
  const q = query(pointsCollection, orderBy("month", "desc"), limit(12))
  return onSnapshot(q, (snapshot) => {
    const points = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }))
    callback(points)
  })
}

export const subscribeToMonthlyRankings = (callback: (rankings: any[]) => void): (() => void) => {
  if (!isFirebaseConfigured()) {
    callback(mockMonthlyRankings)
    return () => {}
  }
  const rankingsCollection = getMonthlyRankingsCollection()
  const q = query(rankingsCollection, orderBy("month", "desc"), limit(12))
  return onSnapshot(q, (snapshot) => {
    const rankings = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }))
    callback(rankings)
  })
}

export const subscribeToDailySales = (callback: (sales: DailySales[]) => void): (() => void) => {
  if (!isFirebaseConfigured()) {
    callback([])
    return () => {}
  }
  const salesCollection = getDailySalesCollection()
  const q = query(salesCollection, orderBy("date", "desc"), limit(30))
  return onSnapshot(q, (snapshot) => {
    const sales = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }) as DailySales)
    callback(sales)
  })
}

export const deleteDailySales = async (salesId: string): Promise<void> => {
  if (!isFirebaseConfigured()) return
  await deleteDoc(doc(getDailySalesCollection(), salesId))
}

export const settleDailySales = async (date: string, salesData: any): Promise<void> => {
  if (!isFirebaseConfigured()) return
  const salesCollection = getDailySalesCollection()
  const docRef = doc(salesCollection, date)
  await setDoc(docRef, {
    ...salesData,
    date,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  })
}

export const confirmDailyRanking = async (date: string): Promise<void> => {
  if (!isFirebaseConfigured()) return
  const rankingRef = doc(getDailyRankingsCollection(), date)
  const rankingSnap = await getDoc(rankingRef)

  if (!rankingSnap.exists()) return

  const rankingData = rankingSnap.data()
  const rankings = rankingData.rankings || []

  // 月間ポイントへの反映
  const month = date.substring(0, 7) // YYYY-MM
  await updateMonthlyPoints(month)

  await updateDoc(rankingRef, {
    isConfirmed: true,
    confirmedAt: serverTimestamp(),
  })
}

export const updateMonthlyPoints = async (month: string): Promise<void> => {
  if (!isFirebaseConfigured()) return

  try {
    console.log(`[v0] Updating monthly points for ${month}`)

    const startDate = `${month}-01`
    const endDate = `${month}-31`

    const dailyRankingsRef = getDailyRankingsCollection()
    const q = query(
      dailyRankingsRef,
      where("date", ">=", startDate),
      where("date", "<=", endDate),
      where("isConfirmed", "==", true),
    )

    const snapshot = await getDocs(q)
    const playerPoints: Record<string, { playerId: string; name: string; pokerName?: string; points: number; games: number }> = {}

    snapshot.docs.forEach((doc) => {
      const data = doc.data()
      const rankings = data.rankings || []
      rankings.forEach((r: any) => {
        if (!playerPoints[r.playerId]) {
          playerPoints[r.playerId] = { playerId: r.playerId, name: r.playerName, pokerName: r.pokerName, points: 0, games: 0 }
        }
        playerPoints[r.playerId].points += r.points || 0
        playerPoints[r.playerId].games += 1
      })
    })

    const monthlyPointsRef = doc(getMonthlyPointsCollection(), month)
    await setDoc(monthlyPointsRef, {
      month,
      points: playerPoints,
      updatedAt: serverTimestamp(),
    })

    console.log(`[v0] Monthly points updated for ${month}: ${Object.keys(playerPoints).length} players`)
  } catch (error) {
    console.error(`[v0] Error updating monthly points for ${month}:`, error)
    throw error
  }
}


export const resetAllRankings = async (): Promise<void> => {
  if (!isFirebaseConfigured()) return

  try {
    console.log("[v0] Reset all rankings started")

    // Delete all daily rankings
    const dailyRankingsRef = getDailyRankingsCollection()
    const dailySnapshot = await getDocs(dailyRankingsRef)
    const dailyBatch = writeBatch(checkFirebaseConfig())
    dailySnapshot.docs.forEach((doc) => {
      dailyBatch.delete(doc.ref)
    })
    await dailyBatch.commit()
    console.log(`[v0] Daily rankings deleted: ${dailySnapshot.size} records`)

    // Delete all monthly points
    const monthlyPointsRef = getMonthlyPointsCollection()
    const monthlySnapshot = await getDocs(monthlyPointsRef)
    const monthlyBatch = writeBatch(checkFirebaseConfig())
    monthlySnapshot.docs.forEach((doc) => {
      monthlyBatch.delete(doc.ref)
    })
    await monthlyBatch.commit()
    console.log(`[v0] Monthly points deleted: ${monthlySnapshot.size} records`)

    console.log("[v0] All rankings reset completed")
  } catch (error) {
    console.error("[v0] Error resetting rankings:", error)
    throw error
  }
}

export const updateProvisionalRankingForToday = async (): Promise<void> => {
  if (!isFirebaseConfigured()) return

  try {
    const today = new Date().toISOString().split("T")[0] // YYYY-MM-DD format
    const players = await getDocs(getPlayersCollection())
    const storeSettings = await getStoreRankingSettings()

    if (!storeSettings) return

    // プレイヤーの収支を計算
    const playerStats: Array<{
      playerId: string
      playerName: string
      pokerName?: string
      profit: number
    }> = []

    for (const playerDoc of players.docs) {
      const playerData = playerDoc.data() as Player
      const playerId = playerDoc.id

      // 取引履歴から本日の収支を計算
      const transactionsRef = collection(checkFirebaseConfig(), "transactions")
      const q = query(
        transactionsRef,
        where("playerId", "==", playerId),
        where("createdAt", ">=", Timestamp.fromDate(new Date(today))),
        where("createdAt", "<", Timestamp.fromDate(new Date(new Date(today).getTime() + 24 * 60 * 60 * 1000))),
      )
      const transactionsSnapshot = await getDocs(q)

      let profit = 0
      for (const txDoc of transactionsSnapshot.docs) {
        const tx = txDoc.data() as any
        // ゲーム関連の取引から収支を計算
        if (tx.type === "game_cashout" || tx.type === "game_buy_in" || tx.type === "game_additional") {
          profit += tx.amount
        }
      }

      if (profit !== 0) {
        playerStats.push({
          playerId,
          playerName: playerData.name,
          pokerName: playerData.pokerName,
          profit,
        })
      }
    }

    // 収支でソート（高い順）
    playerStats.sort((a, b) => b.profit - a.profit)

    // ポイント倍率を確認（2倍デーかどうか）
    const pointMultiplier = storeSettings.doublePointDays?.includes(today) ? 2 : 1

    // ランキングを生成
    const rankings: PlayerRanking[] = playerStats.map((stat, index) => {
      let points = 0
      const rank = index + 1

      // ランク別ポイント配分
      if (rank === 1) points = storeSettings.pointSystem.first
      else if (rank === 2) points = storeSettings.pointSystem.second
      else if (rank === 3) points = storeSettings.pointSystem.third
      else if (rank === 4) points = storeSettings.pointSystem.fourth
      else if (rank === 5) points = storeSettings.pointSystem.fifth
      else points = 0

      // 倍率を適用
      points = Math.floor(points * pointMultiplier)

      return {
        playerId: stat.playerId,
        playerName: stat.playerName,
        pokerName: stat.pokerName,
        rank,
        profit: stat.profit,
        points,
      }
    })

    // 日別ランキングを更新
    const dailyRankingsRef = getDailyRankingsCollection()
    const rankingDocRef = doc(dailyRankingsRef, today)

    await setDoc(rankingDocRef, {
      date: today,
      rankings,
      isConfirmed: false,
      pointMultiplier,
      createdAt: new Date().toISOString(),
    })

    console.log(`[v0] ✅ 日別ランキング更新完了: ${today}`, { ランキング数: rankings.length })
  } catch (error) {
    console.error("[v0] ❌ ランキング更新エラー:", error)
  }
}

// --- Store Settings ---

export const getStoreRankingSettings = async (): Promise<StoreRankingSettings | null> => {
  if (!isFirebaseConfigured()) return mockStoreRankingSettings
  const settingsCollection = getStoreRankingSettingsCollection()
  const snapshot = await getDocs(settingsCollection)
  if (snapshot.empty) return null
  return { id: snapshot.docs[0].id, ...snapshot.docs[0].data() } as StoreRankingSettings
}

export const updateStoreRankingSettings = async (settings: Partial<StoreRankingSettings>): Promise<void> => {
  if (!isFirebaseConfigured()) return
  const settingsCollection = getStoreRankingSettingsCollection()
  const snapshot = await getDocs(settingsCollection)
  if (snapshot.empty) {
    await addDoc(settingsCollection, { ...settings, updatedAt: serverTimestamp() })
  } else {
    await updateDoc(doc(settingsCollection, snapshot.docs[0].id), { ...settings, updatedAt: serverTimestamp() })
  }
}

export const subscribeToStoreRankingSettings = (
  callback: (settings: StoreRankingSettings | null) => void,
): (() => void) => {
  if (!isFirebaseConfigured()) {
    callback(mockStoreRankingSettings)
    return () => {}
  }
  const settingsCollection = getStoreRankingSettingsCollection()
  return onSnapshot(settingsCollection, (snapshot) => {
    if (snapshot.empty) {
      callback(null)
    } else {
      callback({ id: snapshot.docs[0].id, ...snapshot.docs[0].data() } as StoreRankingSettings)
    }
  })
}

// --- Customer & Subscription ---

export const getCustomerByEmail = async (email: string): Promise<CustomerAccount | null> => {
  if (!isFirebaseConfigured()) return null
  const customersCollection = getCustomerAccountsCollection()
  const q = query(customersCollection, where("email", "==", email), limit(1))
  const snapshot = await getDocs(q)
  if (snapshot.empty) return null
  return { id: snapshot.docs[0].id, ...snapshot.docs[0].data() } as CustomerAccount
}

export const createCustomerAccount = async (data: Partial<CustomerAccount>): Promise<string> => {
  if (!isFirebaseConfigured()) return `mock_customer_${Date.now()}`
  const customersCollection = getCustomerAccountsCollection()
  const docRef = await addDoc(customersCollection, { ...data, createdAt: serverTimestamp() })
  return docRef.id
}

export const updateCustomerAccount = async (customerId: string, data: Partial<CustomerAccount>): Promise<void> => {
  if (!isFirebaseConfigured()) return
  await updateDoc(doc(getCustomerAccountsCollection(), customerId), { ...data, updatedAt: serverTimestamp() })
}

export const linkPlayerToCustomer = async (playerId: string, customerId: string): Promise<void> => {
  if (!isFirebaseConfigured()) return
  await updatePlayer(playerId, { uniqueId: customerId }) // Using uniqueId to link for now
}

export const subscribeToCustomerAccounts = (callback: (customers: CustomerAccount[]) => void): (() => void) => {
  if (!isFirebaseConfigured()) {
    callback([])
    return () => {}
  }
  const customersCollection = getCustomerAccountsCollection()
  return onSnapshot(customersCollection, (snapshot) => {
    const customers = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }) as CustomerAccount)
    callback(customers)
  })
}

export const updateCustomerSubscription = async (customerId: string, status: string): Promise<void> => {
  if (!isFirebaseConfigured()) return
  await updateCustomerAccount(customerId, { subscriptionStatus: status as any })
}

export const updateCustomerPayment = async (customerId: string, paymentData: any): Promise<void> => {
  if (!isFirebaseConfigured()) return
  // 支払い情報の更新
  await updateCustomerAccount(customerId, {
  })
}

export const createPaymentHistory = async (data: Partial<PaymentHistory>): Promise<void> => {
  if (!isFirebaseConfigured()) return
  const historyCollection = getPaymentHistoryCollection()
  await addDoc(historyCollection, { ...data, createdAt: serverTimestamp() })
}

// --- Posts ---

export const subscribeToPosts = (callback: (posts: Post[]) => void): (() => void) => {
  if (!isFirebaseConfigured()) {
    callback([])
    return () => {}
  }
  const postsCollection = getPostsCollection()
  const q = query(postsCollection, orderBy("createdAt", "desc"))
  return onSnapshot(q, (snapshot) => {
    const posts = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }) as Post)
    callback(posts)
  })
}

export const subscribeToUserPosts = (userId: string, callback: (posts: Post[]) => void): (() => void) => {
  if (!isFirebaseConfigured()) {
    callback([])
    return () => {}
  }
  const postsCollection = getPostsCollection()
  const q = query(postsCollection, where("authorId", "==", userId), orderBy("createdAt", "desc"))
  return onSnapshot(q, (snapshot) => {
    const posts = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }) as Post)
    callback(posts)
  })
}

export const subscribeToPost = (postId: string, callback: (post: Post | null) => void): (() => void) => {
  if (!isFirebaseConfigured()) {
    callback(null)
    return () => {}
  }
  return onSnapshot(doc(getPostsCollection(), postId), (snapshot) => {
    if (!snapshot.exists()) {
      callback(null)
    } else {
      callback({ id: snapshot.id, ...snapshot.data() } as Post)
    }
  })
}

export const createPost = async (data: Partial<Post>): Promise<string> => {
  if (!isFirebaseConfigured()) return `mock_post_${Date.now()}`
  const postsCollection = getPostsCollection()
  const docRef = await addDoc(postsCollection, { ...data, createdAt: serverTimestamp() })
  return docRef.id
}

export const deletePost = async (postId: string): Promise<void> => {
  if (!isFirebaseConfigured()) return
  await deleteDoc(doc(getPostsCollection(), postId))
}

export const getPostById = async (postId: string): Promise<Post | null> => {
  if (!isFirebaseConfigured()) return null
  const postRef = doc(getPostsCollection(), postId)
  const snapshot = await getDoc(postRef)
  if (!snapshot.exists()) return null
  return { id: snapshot.id, ...snapshot.data() } as Post
}

// --- History Subscriptions ---

export const subscribeToPlayerPurchaseHistory = (callback: (history: Record<string, number>) => void): (() => void) => {
  if (!isFirebaseConfigured()) {
    callback({})
    return () => {}
  }
  // 購入履歴の集計ロジック
  const receiptsCollection = getReceiptsCollection()
  const q = query(receiptsCollection, where("status", "==", "completed"))

  return onSnapshot(q, (snapshot) => {
    const history: Record<string, number> = {}
    snapshot.docs.forEach((doc) => {
      const data = doc.data()
      if (data.playerId && data.receivedAmount) {
        history[data.playerId] = (history[data.playerId] || 0) + data.receivedAmount
      }
    })
    callback(history)
  })
}

export const subscribeToRakeHistory = (callback: (history: any[]) => void): (() => void) => {
  if (!isFirebaseConfigured()) {
    callback(mockRakeHistory)
    return () => {}
  }
  const rakeCollection = getRakeHistoryCollection()
  const q = query(rakeCollection, orderBy("createdAt", "desc"), limit(50))
  return onSnapshot(q, (snapshot) => {
    const history = snapshot.docs.map((doc) => {
      const data = doc.data()
      return {
        id: doc.id,
        ...data,
        createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : new Date(data.createdAt || Date.now()),
      }
    })
    callback(history)
  })
}

// --- Deprecated / Alias Functions ---

export const createPlayer = addPlayer

// --- Store Functions ---

export const getStoresCollection = () => {
  const db = getDb()
  if (!db) throw new Error("Firebase is not configured")
  return collection(db, "stores")
}

export const subscribeToStores = (callback: (stores: any[]) => void): (() => void) => {
  if (!isFirebaseConfigured()) {
    // モックデータを返す
    callback([
      { id: "store1", name: "StackManKai 渋谷店", slug: "shibuya", createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
      { id: "store2", name: "StackManKai 新宿店", slug: "shinjuku", createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    ])
    return () => {}
  }
  const storesCollection = getStoresCollection()
  const q = query(storesCollection, orderBy("name", "asc"))
  return onSnapshot(q, (snapshot) => {
    const stores = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }))
    callback(stores)
  })
}

export const updatePlayerStore = async (playerId: string, storeId: string, storeName: string) => {
  if (!isFirebaseConfigured()) {
    log.warn("Firebase is not configured, skipping updatePlayerStore")
    return
  }
  const playerDoc = doc(getDb()!, "players", playerId)
  await updateDoc(playerDoc, {
    storeId,
    storeName,
    updatedAt: serverTimestamp(),
  })
}

/**
 * プレイヤーの会員ランクを判定・更新する
 */
export const updatePlayerMembershipRank = async (playerId: string): Promise<void> => {
  if (!isFirebaseConfigured()) return

  try {
    // プレイヤー情報を取得
    const playerRef = doc(getPlayersCollection(), playerId)
    const playerSnap = await getDoc(playerRef)
    
    if (!playerSnap.exists()) {
      console.warn(`Player not found: ${playerId}`)
      return
    }

    const playerData = playerSnap.data()
    const totalCPEarned = playerData.totalCPEarned || 0

    // 店舗設定を取得
    const storeSettings = await getStoreRankingSettings()
    if (!storeSettings?.membershipRankSettings?.enabled) {
      // ランク制度が無効の場合は何もしない
      return
    }

    const ranks = storeSettings.membershipRankSettings.ranks

    // 現在のランクを判定
    let newRank: "none" | "silver" | "gold" | "platinum" = "none"

    if (totalCPEarned >= ranks.platinum.requiredCP) {
      newRank = "platinum"
    } else if (totalCPEarned >= ranks.gold.requiredCP) {
      newRank = "gold"
    } else if (totalCPEarned >= ranks.silver.requiredCP) {
      newRank = "silver"
    }

    // ランクが変更された場合のみ更新
    const currentRank = playerData.membershipRank || "none"
    if (newRank !== currentRank) {
      await updateDoc(playerRef, {
        membershipRank: newRank,
        updatedAt: serverTimestamp(),
      })
      console.log(`Player ${playerId} rank updated: ${currentRank} -> ${newRank}`)
    }
  } catch (error) {
    console.error("Error updating player membership rank:", error)
  }
}

/**
 * プレイヤーのCP累積を更新し、ランクを再判定する
 */
export const addPlayerCP = async (playerId: string, cpAmount: number): Promise<void> => {
  if (!isFirebaseConfigured()) return

  try {
    const playerRef = doc(getPlayersCollection(), playerId)
    const playerSnap = await getDoc(playerRef)
    
    if (!playerSnap.exists()) {
      console.warn(`Player not found: ${playerId}`)
      return
    }

    const playerData = playerSnap.data()
    const currentCP = playerData.rewardPoints || 0
    const currentTotalCP = playerData.totalCPEarned || 0

    // CP残高と累積CPを更新
    await updateDoc(playerRef, {
      rewardPoints: currentCP + cpAmount,
      totalCPEarned: currentTotalCP + cpAmount,
      updatedAt: serverTimestamp(),
    })

    // ランクを再判定
    await updatePlayerMembershipRank(playerId)
  } catch (error) {
    console.error("Error adding player CP:", error)
  }
}

/**
 * プレイヤーアカウントを解約（CP・累積CP・ランクをリセット）
 */
export const cancelPlayerAccount = async (playerId: string): Promise<void> => {
  if (!isFirebaseConfigured()) return

  try {
    const playerRef = doc(getPlayersCollection(), playerId)
    const playerSnap = await getDoc(playerRef)
    
    if (!playerSnap.exists()) {
      console.warn(`Player not found: ${playerId}`)
      return
    }

    // CP残高、累積CP、会員ランクをリセット
    await updateDoc(playerRef, {
      rewardPoints: 0,
      totalCPEarned: 0,
      membershipRank: "none",
      updatedAt: serverTimestamp(),
    })

    console.log(`Player ${playerId} account cancelled: CP and rank reset`)
  } catch (error) {
    console.error("Error cancelling player account:", error)
    throw error
  }
}

/**
 * 全プレイヤーの会員ランクデータをリセット（獲得CP総額とランクを0/"none"に）
 */
export const resetAllPlayersMembershipData = async (): Promise<void> => {
  if (!isFirebaseConfigured()) return

  try {
    const playersRef = getPlayersCollection()
    const snapshot = await getDocs(playersRef)
    
    const batch = writeBatch(checkFirebaseConfig())
    let count = 0

    snapshot.docs.forEach((doc) => {
      batch.update(doc.ref, {
        totalCPEarned: 0,
        membershipRank: "none",
        updatedAt: serverTimestamp(),
      })
      count++
    })

    await batch.commit()
    console.log(`Reset membership data for ${count} players`)
  } catch (error) {
    console.error("Error resetting all players membership data:", error)
    throw error
  }
}
