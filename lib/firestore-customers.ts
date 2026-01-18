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

// --- 顧客アカウント関連操作 ---

export const subscribeToCustomerAccount = (uid: string, callback: (account: CustomerAccount | null) => void): (() => void) => {
  if (!isFirebaseConfigured) {
    log.warn("[v0] モック環境: CustomerAccountリスナーをスキップ");
    // モック環境ではダミーのcustomerAccountを返す
    // リスナーを登録し、現在のモックデータを即座にコールバック
    if (!mockCustomerAccountListeners[uid]) {
      mockCustomerAccountListeners[uid] = [];
    }
    mockCustomerAccountListeners[uid].push(callback);

    const currentMockAccount = mockCustomerAccounts[uid] || {
      id: uid,
      email: "mock.customer@example.com",
      stapokaBalance: 40000,
      systemBalance: 40000,
      playerName: "モックプレイヤー",
      playerId: "mockPlayerId",
      storeId: "mockStoreId",
      storeName: "モック店舗",
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    callback(currentMockAccount);

    // リスナー解除関数を返す
    return () => {
      mockCustomerAccountListeners[uid] = mockCustomerAccountListeners[uid].filter(l => l !== callback);
    };
  }

  const db = checkFirebaseConfig();
  const customerDocRef = doc(db, "customerAccounts", uid);

  return onSnapshot(customerDocRef, (docSnap) => {
    if (docSnap.exists()) {
      callback({ id: docSnap.id, ...docSnap.data() } as CustomerAccount);
    } else {
      callback(null);
    }
  }, (error) => {
    console.error("Error subscribing to customer account:", error);
    callback(null);
  });
}

export const createCustomerAccount = async (account: Omit<CustomerAccount, "id">): Promise<string> => {
  if (!isFirebaseConfigured) {
    log.info("[v0] モック環境: 顧客アカウント作成をシミュレート", { account })
    return `mock_customer_${Date.now()}`
  }
  try {
    const accountsCollection = getCustomerAccountsCollection()
    const docRef = await addDoc(accountsCollection, {
      ...account,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    })
    return docRef.id
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    log.error("[ERROR] 顧客アカウント作成に失敗しました", { error: errorMessage })
    throw error
  }
}

export const getCustomerAccount = async (id: string): Promise<CustomerAccount | null> => {
  if (!isFirebaseConfigured) {
    return null
  }
  try {
    const accountRef = doc(getCustomerAccountsCollection(), id)
    const accountSnap = await getDoc(accountRef)
    if (!accountSnap.exists()) {
      return null
    }
    return { id: accountSnap.id, ...accountSnap.data() } as CustomerAccount
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    log.error("[ERROR] 顧客アカウント取得に失敗しました", { error: errorMessage, id })
    return null
  }
}

export const updateCustomerAccount = async (id: string, updates: Partial<CustomerAccount>): Promise<void> => {
  if (!isFirebaseConfigured) return
  try {
    const accountRef = doc(getCustomerAccountsCollection(), id)
    await updateDoc(accountRef, { ...updates, updatedAt: serverTimestamp() })
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    log.error("[ERROR] 顧客アカウント更新に失敗しました", { error: errorMessage, id })
    throw error
  }
}

export const deleteCustomerAccount = async (id: string): Promise<void> => {
  if (!isFirebaseConfigured) return
  try {
    await deleteDoc(doc(getCustomerAccountsCollection(), id))
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    log.error("[ERROR] 顧客アカウント削除に失敗しました", { error: errorMessage, id })
    throw error
  }
}

export const subscribeToCustomerAccounts = (callback: (customers: CustomerAccount[]) => void): (() => void) => {
  if (!isFirebaseConfigured) {
    callback([])
    return () => {}
  }
  const accountsCollection = getCustomerAccountsCollection()
  const q = query(accountsCollection, orderBy("createdAt", "desc"))
  return onSnapshot(q, (snapshot) => {
    const customers = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }) as CustomerAccount)
    callback(customers)
  })
}

// --- Payment History Functions ---

export const addPaymentHistory = async (history: Omit<PaymentHistory, "id">): Promise<string> => {
  if (!isFirebaseConfigured) {
    log.info("[v0] モック環境: 支払い履歴追加をシミュレート", { history })
    return `mock_payment_history_${Date.now()}`
  }
  try {
    const historyCollection = getPaymentHistoryCollection()
    const docRef = await addDoc(historyCollection, {
      ...history,
      createdAt: serverTimestamp(),
    })
    return docRef.id
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    log.error("[ERROR] 支払い履歴追加に失敗しました", { error: errorMessage })
    throw error
  }
}

export const subscribeToPlayerPurchaseHistory = (
  playerId: string,
  callback: (history: PaymentHistory[]) => void,
): (() => void) => {
  if (!isFirebaseConfigured) {
    callback([])
    return () => {}
  }
  const historyCollection = getPaymentHistoryCollection()
  const q = query(historyCollection, where("playerId", "==", playerId), orderBy("createdAt", "desc"))
  return onSnapshot(q, (snapshot) => {
    const history = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }) as PaymentHistory)
    callback(history)
  })
}

// --- Rake History Functions ---


export const getCustomerByEmail = async (email: string): Promise<CustomerAccount | null> => {
  if (!isFirebaseConfigured) {
    return null;
  }
  try {
    const customersCollection = getCustomerAccountsCollection();
    const q = query(customersCollection, where("email", "==", email));
    const snapshot = await getDocs(q);
    if (snapshot.empty) return null;
    const doc = snapshot.docs[0];
    return { id: doc.id, ...doc.data() } as CustomerAccount;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    log.error("[ERROR] メールアドレスで顧客を検索に失敗しました", { error: errorMessage, email })
    return null
  }
};


export const linkPlayerToCustomer = async (playerId: string, customerId: string): Promise<void> => {
  await updatePlayer(playerId, {
    customerId,
  } as any);
};


export const createPaymentHistory = async (history: Omit<PaymentHistory, "id">): Promise<string> => {
  return addPaymentHistory(history);
};

export const createCustomerInFirestore = async (
  accountData: Partial<Omit<CustomerAccount, "id">>,
  email: string,
  uid?: string
): Promise<string> => {
  if (!isFirebaseConfigured) {
    log.info("[v0] モック環境: 顧客アカウント作成をシミュレート", { email })
    return uid || `mock_customer_${Date.now()}`
  }

  try {
    const accountsCollection = getCustomerAccountsCollection()
    
    // uid が指定されている場合は、そのIDで作成
    if (uid) {
      const docRef = doc(accountsCollection, uid)
      await setDoc(docRef, {
        ...accountData,
        email,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      })
      return uid
    }

    // uid が指定されていない場合は、自動生成
    const docRef = await addDoc(accountsCollection, {
      ...accountData,
      email,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    })
    return docRef.id
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    log.error("[ERROR] Firestore に顧客アカウント作成に失敗しました", { error: errorMessage, email })
    throw error
  }
}


export const updateCustomerPayment = async (customerId: string, amount: number): Promise<void> => {
  await updateCustomerAccount(customerId, {
    totalPayment: amount,
  } as any);
};
