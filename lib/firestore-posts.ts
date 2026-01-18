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

// --- ハンド記録・投稿・チャット関連操作 ---

export const addPost = async (post: Omit<Post, "id">): Promise<string> => {
  if (!isFirebaseConfigured) {
    log.info("[v0] モック環境: 投稿追加をシミュレート", { post })
    return `mock_post_${Date.now()}`
  }
  const postsCollection = getPostsCollection()
  const docRef = await addDoc(postsCollection, {
    ...post,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  })
  return docRef.id
}

export const updatePost = async (id: string, updates: Partial<Post>): Promise<void> => {
  if (!isFirebaseConfigured) {
    log.info("[v0] モック環境: 投稿更新をシミュレート", { id, updates })
    return
  }
  const postRef = doc(getPostsCollection(), id)
  await updateDoc(postRef, { ...updates, updatedAt: serverTimestamp() })
}

export const deletePost = async (id: string): Promise<void> => {
  if (!isFirebaseConfigured) {
    log.info("[v0] モック環境: 投稿削除をシミュレート", { id })
    return
  }
  await deleteDoc(doc(getPostsCollection(), id))
}

// --- Chat Functions ---

export const subscribeToChatMessages = (
  storeId: string,
  callback: (messages: any[]) => void,
): (() => void) => {
  if (!isFirebaseConfigured) {
    callback([])
    return () => {}
  }
  const messagesCollection = collection(getDb(), `stores/${storeId}/chatMessages`)
  const q = query(messagesCollection, orderBy("createdAt", "asc"))
  return onSnapshot(q, (snapshot) => {
    const messages = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate(),
    }))
    callback(messages)
  })
}

export const addChatMessage = async (message: string, userId: string, userName: string, storeId: string): Promise<void> => {
  if (!isFirebaseConfigured) {
    log.info("[v0] モック環境: チャットメッセージ追加をシミュレート", { storeId, message, userId, userName })
    return
  }
  const messagesCollection = collection(getDb(), `stores/${storeId}/chatMessages`)
  await addDoc(messagesCollection, {
    message,
    userId,
    userName,
    type: 'user',
    createdAt: serverTimestamp(),
  })
}

// --- Active Users Functions ---

export const subscribeToActiveUsers = (
  storeId: string,
  callback: (users: any[]) => void,
): (() => void) => {
  if (!isFirebaseConfigured) {
    callback([])
    return () => {}
  }
  const activeUsersCollection = collection(getDb(), `stores/${storeId}/activeUsers`)
  return onSnapshot(activeUsersCollection, (snapshot) => {
    const users = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }))
    callback(users)
  })
}

export const setActiveUser = async (gameId: string, userId: string, userData: any): Promise<void> => {
  if (!isFirebaseConfigured) {
    log.info("[v0] モック環境: アクティブユーザー設定をシミュレート", { gameId, userId })
    return
  }
  const userRef = doc(getDb(), `games/${gameId}/activeUsers`, userId)
  await setDoc(userRef, userData, { merge: true })
}

export const removeActiveUser = async (gameId: string, userId: string): Promise<void> => {
  if (!isFirebaseConfigured) {
    log.info("[v0] モック環境: アクティブユーザー削除をシミュレート", { gameId, userId })
    return
  }
  const userRef = doc(getDb(), `games/${gameId}/activeUsers`, userId)
  await deleteDoc(userRef)
}

// --- Mock Data Initialization ---



// --- Other Functions ---


export const subscribeToUserPosts = (
  userId: string,
  callback: (posts: Post[]) => void
): (() => void) => {
  if (!isFirebaseConfigured) {
    console.log("[v0] Mock environment: Skipping user posts subscription");
    callback([]);
    return () => {};
  }

  const postsCollection = getPostsCollection();
  const q = query(postsCollection, where("authorId", "==", userId), orderBy("createdAt", "desc"));

  return onSnapshot(q, (snapshot) => {
    const posts = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate() || new Date(),
    })) as Post[];
    callback(posts);
  }, (error) => {
    console.error("Error subscribing to user posts:", error);
    callback([]);
  });
};


export const createPost = async (postData: Omit<Post, 'id' | 'createdAt'>): Promise<string> => {
  if (!isFirebaseConfigured) {
    console.log("[v0] Mock environment: Simulating post creation");
    const newId = `mock_post_${Date.now()}`;
    return newId;
  }
  const postsCollection = getPostsCollection();
  const docRef = await addDoc(postsCollection, {
    ...postData,
    createdAt: serverTimestamp(),
  });
  return docRef.id;
};


export const sendChatMessage = async (message: string, userId: string, userName: string, storeId: string): Promise<void> => {
  return addChatMessage(message, userId, userName, storeId);
};


export const setUserPresence = async (storeId: string, userId: string, displayName: string): Promise<void> => {
  if (!isFirebaseConfigured) {
    log.info("[v0] モック環境: ユーザープレゼンス設定をシミュレート", { storeId, userId, displayName });
    return;
  }

  const db = checkFirebaseConfig();
  const presenceRef = doc(db, "stores", storeId, "activeUsers", userId);

  await setDoc(presenceRef, {
    userId,
    displayName,
    lastSeen: serverTimestamp(),
  }, { merge: true });

  log.info("[v0] ユーザープレゼンス設定完了", { storeId, userId, displayName });
};


export const removeUserPresence = async (storeId: string, userId: string): Promise<void> => {
  if (!isFirebaseConfigured) {
    log.info("[v0] モック環境: ユーザープレゼンス削除をシミュレート", { storeId, userId });
    return;
  }

  const db = checkFirebaseConfig();
  const presenceRef = doc(db, "stores", storeId, "activeUsers", userId);

  await deleteDoc(presenceRef);

  log.info("[v0] ユーザープレゼンス削除完了", { storeId, userId });
};


export const getPostById = async (postId: string): Promise<Post | null> => {
  if (!isFirebaseConfigured) {
    return null;
  }
  const postRef = doc(getPostsCollection(), postId);
  const postSnap = await getDoc(postRef);
  if (!postSnap.exists()) return null;
  return { id: postSnap.id, ...postSnap.data() } as Post;
};


export const subscribeToStorePosts = (
  callback: (posts: Post[]) => void,
  storeId?: string | null,
): (() => void) => {
  if (!isFirebaseConfigured) {
    callback([])
    return () => {}
  }
  const postsCollection = getPostsCollection()
  let q = query(postsCollection, orderBy("createdAt", "desc"))

  if (storeId) {
    q = query(postsCollection, where("storeId", "==", storeId), orderBy("createdAt", "desc"))
  }

  return onSnapshot(q, (snapshot) => {
    const posts = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }) as Post)
    callback(posts)
  })
}


export const deleteAllPosts = async (storeId: string): Promise<void> => {
  if (!isFirebaseConfigured) return
  const postsCollection = getPostsCollection()
  const q = query(postsCollection, where("storeId", "==", storeId))
  const snapshot = await getDocs(q)
  const batch = writeBatch(checkFirebaseConfig())
  snapshot.docs.forEach((doc) => {
    batch.delete(doc.ref)
  })
  await batch.commit()
}
