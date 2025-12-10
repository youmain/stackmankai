import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  type User,
  type UserCredential,
} from "firebase/auth"
import { getAuthInstance } from "./firebase"
import { createModuleLogger } from "./logger"

const log = createModuleLogger("FirebaseAuth")

/**
 * メールアドレスとパスワードで新規ユーザーを作成
 */
export async function createUser(email: string, password: string): Promise<UserCredential> {
  const auth = getAuthInstance()
  if (!auth) {
    throw new Error("Firebase Authが初期化されていません")
  }

  try {
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
 */
export async function signIn(email: string, password: string): Promise<UserCredential> {
  const auth = getAuthInstance()
  if (!auth) {
    throw new Error("Firebase Authが初期化されていません")
  }

  try {
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
