import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  setPersistence,
  browserLocalPersistence,
  type User,
  type UserCredential,
} from "firebase/auth"
import { getAuthInstance } from "./firebase"
import { createModuleLogger } from "./logger"

const log = createModuleLogger("FirebaseAuth")

/**
 * メールアドレスとパスワードで新規ユーザーを作成
 * 永続ログインを有効化（登録後もログイン状態を維持）
 */
export async function createUser(email: string, password: string): Promise<UserCredential> {
  const auth = getAuthInstance()
  if (!auth) {
    throw new Error("Firebase Authが初期化されていません")
  }

  try {
    // 永続ログインを有効化（登録後もログイン状態を維持）
    try {
      await setPersistence(auth, browserLocalPersistence)
      log.info("永続ログイン設定成功")
    } catch (persistError: any) {
      // setPersistenceが失敗しても登録は続行
      log.warn(`永続ログイン設定失敗（続行）: ${persistError.message}`)
    }
    
    const userCredential = await createUserWithEmailAndPassword(auth, email, password)
    log.info(`ユーザー作成成功: ${email}`)
    return userCredential
  } catch (error: any) {
    log.error(`ユーザー作成エラー: ${error.message}`)
    throw error
  }
}

/**
 * メールアドレスとパスワードでサインイン
 * 永続ログインを有効化（ブラウザを閉じてもログイン状態を維持）
 */
export async function signIn(email: string, password: string): Promise<UserCredential> {
  const auth = getAuthInstance()
  if (!auth) {
    throw new Error("Firebase Authが初期化されていません")
  }

  try {
    // 永続ログインを有効化（ネイティブアプリと同じ動作）
    try {
      await setPersistence(auth, browserLocalPersistence)
      log.info("永続ログイン設定成功")
    } catch (persistError: any) {
      // setPersistenceが失敗してもログインは続行
      log.warn(`永続ログイン設定失敗（続行）: ${persistError.message}`)
    }
    
    const userCredential = await signInWithEmailAndPassword(auth, email, password)
    log.info(`サインイン成功: ${email}`)
    return userCredential
  } catch (error: any) {
    log.error(`サインインエラー: ${error.message}`)
    throw error
  }
}

/**
 * サインアウト
 */
export async function signOutUser(): Promise<void> {
  const auth = getAuthInstance()
  if (!auth) {
    throw new Error("Firebase Authが初期化されていません")
  }

  try {
    await signOut(auth)
    log.info("サインアウト成功")
  } catch (error: any) {
    log.error(`サインアウトエラー: ${error.message}`)
    throw error
  }
}

/**
 * 現在のユーザーを取得
 */
export function getCurrentUser(): User | null {
  const auth = getAuthInstance()
  if (!auth) {
    return null
  }
  return auth.currentUser
}

/**
 * 認証状態の変更を監視
 */
export function onAuthStateChanged(callback: (user: User | null) => void): () => void {
  const auth = getAuthInstance()
  if (!auth) {
    throw new Error("Firebase Authが初期化されていません")
  }

  const { onAuthStateChanged: onAuthStateChangedFn } = require("firebase/auth")
  return onAuthStateChangedFn(auth, callback)
}

// エイリアス: signInWithEmailAndPassword として signIn をエクスポート
export { signIn as signInWithEmailAndPassword }

/**
 * 認証状態が反映されるまで待機
 * Firebase Authの認証状態変更は非同期で伝播するため、
 * Firestoreへの書き込み前に認証状態が確実に反映されるまで待つ
 */
export async function waitForAuthState(): Promise<User | null> {
  const auth = getAuthInstance()
  if (!auth) {
    throw new Error("Firebase Authが初期化されていません")
  }

  return new Promise((resolve) => {
    const { onAuthStateChanged: onAuthStateChangedFn } = require("firebase/auth")
    const unsubscribe = onAuthStateChangedFn(auth, (user: User | null) => {
      log.info(`[waitForAuthState] 認証状態確認: ${user ? `ログイン中 (${user.email})` : "未ログイン"}`)
      unsubscribe()
      resolve(user)
    })
  })
}
