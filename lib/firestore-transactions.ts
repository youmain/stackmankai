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

// --- 取引・伝票・ポイント関連操作 ---

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
  if (!isFirebaseConfigured) {
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
  if (!isFirebaseConfigured) {
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
  if (!isFirebaseConfigured) {
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

export const subscribeToReceipts = (callback: (receipts: Receipt[]) => void, storeId?: string | null): (() => void) => {
  if (!isFirebaseConfigured) {
    callback(mockReceipts)
    return () => {}
  }
  const receiptsCollection = getReceiptsCollection()
  let q = query(receiptsCollection, orderBy("createdAt", "desc"))

  if (storeId) {
    q = query(receiptsCollection, where("storeId", "==", storeId), orderBy("createdAt", "desc"))
  }

  return onSnapshot(q, (snapshot) => {
    const receipts = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }) as Receipt)
    callback(receipts)
  })
}

export const subscribeToReceiptItems = (receiptId: string, callback: (items: ReceiptItem[]) => void): (() => void) => {
  if (!isFirebaseConfigured) {
    callback([])
    return () => {}
  }
  const itemsCollection = getReceiptItemsCollection()
  const q = query(itemsCollection, where("receiptId", "==", receiptId))
  return onSnapshot(q, (snapshot) => {
    const items = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }) as ReceiptItem)
    callback(items)
  })
}

export const getReceipt = async (id: string): Promise<Receipt | null> => {
  if (!isFirebaseConfigured) {
    const receipt = mockReceipts.find((r) => r.id === id)
    return receipt || null
  }
  const validatedId = validateId(id, "レシートID")
  const receiptRef = doc(getReceiptsCollection(), validatedId)
  const receiptSnap = await getDoc(receiptRef)
  if (!receiptSnap.exists()) {
    return null
  }
  return { id: receiptSnap.id, ...receiptSnap.data() } as Receipt
}

export const addReceipt = async (receipt: Omit<Receipt, "id">): Promise<string> => {
  if (!isFirebaseConfigured) {
    log.info("[v0] モック環境: レシート追加をシミュレート", { receipt })
    return `mock_receipt_${Date.now()}`
  }
  const receiptsCollection = getReceiptsCollection()
  const docRef = await addDoc(receiptsCollection, {
    ...receipt,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  })
  return docRef.id
}

export const updateReceipt = async (id: string, updates: Partial<Receipt>): Promise<void> => {
  if (!isFirebaseConfigured) {
    log.info("[v0] モック環境: レシート更新をシミュレート", { id, updates })
    return
  }
  const validatedId = validateId(id, "レシートID")
  const receiptRef = doc(getReceiptsCollection(), validatedId)
  await updateDoc(receiptRef, { ...updates, updatedAt: serverTimestamp() })
}

export const completeReceipt = async (
  receiptId: string,
  receivedAmount: number,
  changeAmount: number,
  pointsUsed: number,
  completedBy: string,
): Promise<void> => {
  if (!isFirebaseConfigured) {
    log.info("[v0] モック環境: レシート完了をシミュレート", { receiptId })
    return
  }

  try {
    const receiptRef = doc(getReceiptsCollection(), receiptId)
    const receiptSnap = await getDoc(receiptRef)
    if (!receiptSnap.exists()) {
      throw new Error(`Receipt with id ${receiptId} not found`)
    }
    const receiptData = receiptSnap.data()
    const playerId = receiptData.playerId
    const storeId = receiptData.storeId

    // ポイント付与ロジック
    const settings = await getStoreRankingSettings(storeId)
    const rateToUse = settings?.pointRate ?? 1 // デフォルト1%
    let eligibleAmount = receiptData.totalAmount

    // ポイント利用分はポイント付与対象外
    if (pointsUsed > 0) {
      eligibleAmount -= pointsUsed * (settings?.pointValue ?? 1) // 1P=1円換算
    }

    // SMH購入以外のアイテムはポイント付与対象外
    if (receiptData.items.some((item: any) => item.type !== "stack_purchase")) {
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
  if (!isFirebaseConfigured) return

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

export const deleteAllReceipts = async (storeId: string): Promise<void> => {
  if (!isFirebaseConfigured) return
  const receiptsCollection = getReceiptsCollection()
  const q = query(receiptsCollection, where("storeId", "==", storeId))
  const snapshot = await getDocs(q)
  const batch = writeBatch(checkFirebaseConfig())
  snapshot.docs.forEach((doc) => {
    batch.delete(doc.ref)
  })
  await batch.commit()
}


export const createReceipt = async (receipt: Omit<Receipt, "id">): Promise<string> => {
  return addReceipt(receipt);
};


export const createStandaloneReceipt = async (storeId: string, customerName: string, createdBy: string): Promise<string> => {
  return addReceipt({
    storeId,
    customerName,
    totalAmount: 0,
    status: "open",
    items: [],
    createdBy,
    updatedBy: createdBy,
  } as any);
};

// --- Missing Functions (Added by Manus AI) ---


export const addReceiptItem = async (receiptId: string, item: Omit<ReceiptItem, "id">): Promise<string> => {
  if (!isFirebaseConfigured) {
    return `mock_receipt_item_${Date.now()}`;
  }
  const itemsCollection = getReceiptItemsCollection();
  const docRef = await addDoc(itemsCollection, {
    receiptId,
    ...item,
    createdAt: serverTimestamp(),
  });
  return docRef.id;
};


export const deleteReceiptItem = async (receiptId: string, itemId: string): Promise<void> => {
  if (!isFirebaseConfigured) return;
  const itemRef = doc(getReceiptItemsCollection(), itemId);
  await deleteDoc(itemRef);
};
