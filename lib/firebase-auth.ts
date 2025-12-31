import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithRedirect,
  getRedirectResult,
  GoogleAuthProvider,
  signOut,
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
    // setPersistenceを削除: Firebase AuthはデフォルトでlocalStorageを使用
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
  const startTime = Date.now()
  console.log("[DEBUG] signIn started at", new Date().toISOString())
  
  const auth = getAuthInstance()
  if (!auth) {
    throw new Error("Firebase Authが初期化されていません")
  }
  console.log(`[DEBUG] getAuthInstance took ${Date.now() - startTime}ms`)

  try {
    // setPersistenceを削除: Firebase AuthはデフォルトでlocalStorageを使用
    const signInStart = Date.now()
    console.log("[DEBUG] Calling signInWithEmailAndPassword...")
    const userCredential = await signInWithEmailAndPassword(auth, email, password)
    console.log(`[DEBUG] signInWithEmailAndPassword took ${Date.now() - signInStart}ms`)
    log.info(`サインイン成功: ${email} (total: ${Date.now() - startTime}ms)`)
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
    
    // ブラウザのストレージをクリア
    localStorage.clear()
    sessionStorage.clear()
    
    // IndexedDBをクリア（Firebase Authのセッション情報が保存されている）
    try {
      // Firebase Authが使用するIndexedDBデータベースを削除
      const firebaseDbNames = [
        'firebaseLocalStorageDb',
        'firebase-app-check-database',
        'firebase-nonce-database',
        'firebase-heartbeat-database'
      ]
      
      for (const dbName of firebaseDbNames) {
        try {
          indexedDB.deleteDatabase(dbName)
        } catch (e) {
          // 各DBの削除に失敗しても続行
        }
      }
      
      // すべてのIndexedDBを削除（フォールバック）
      if (typeof (indexedDB as any).databases === 'function') {
        const dbNames = await (indexedDB as any).databases()
        for (const db of dbNames) {
          if (db.name) {
            indexedDB.deleteDatabase(db.name)
          }
        }
      }
    } catch (storageError) {
      log.warn(`IndexedDBクリア中にエラー: ${storageError}`)
    }
    
    log.info("サインアウト成功（ストレージクリア完了）")
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
 * Googleアカウントでサインイン（リダイレクト方式）
 * ページ全体をGoogleログインページにリダイレクトする
 */
export async function signInWithGoogle(): Promise<void> {
  const startTime = Date.now()
  console.log("[DEBUG] signInWithGoogle started at", new Date().toISOString())
  
  const auth = getAuthInstance()
  if (!auth) {
    throw new Error("Firebase Authが初期化されていません")
  }
  console.log(`[DEBUG] getAuthInstance took ${Date.now() - startTime}ms`)

  try {
    const provider = new GoogleAuthProvider()
    // Google認証の言語を日本語に設定
    provider.setCustomParameters({
      prompt: 'select_account'
    })
    
    console.log("[DEBUG] Calling signInWithRedirect...")
    await signInWithRedirect(auth, provider)
    // リダイレクトが開始されるため、この後のコードは実行されない
  } catch (error: any) {
    log.error(`Googleサインインエラー: ${error.message}`)
    throw error
  }
}

/**
 * Googleログインのリダイレクト結果を取得
 * ページ読み込み時に呼び出して、リダイレクト後の認証情報を取得する
 */
export async function getGoogleRedirectResult(): Promise<UserCredential | null> {
  const auth = getAuthInstance()
  if (!auth) {
    throw new Error("Firebase Authが初期化されていません")
  }

  try {
    console.log("[DEBUG] Checking redirect result...")
    const result = await getRedirectResult(auth)
    if (result) {
      log.info(`Googleサインイン成功（リダイレクト後）: ${result.user.email}`)
    }
    return result
  } catch (error: any) {
    log.error(`Googleリダイレクト結果取得エラー: ${error.message}`)
    throw error
  }
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
/**
 * 認証状態が反映されるまで待機する関数
 * @param expectedUid 期待するUID（指定した場合、そのUIDのユーザーがログインするまで待機）
 * @param timeoutMs タイムアウト時間（ミリ秒）
 * @returns ログイン中のユーザー、またはnull
 */
export async function waitForAuthState(expectedUid?: string, timeoutMs: number = 30000): Promise<User | null> {
  const auth = getAuthInstance()
  if (!auth) {
    throw new Error("Firebase Authが初期化されていません")
  }

  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      unsubscribe()
      reject(new Error(`認証状態の待機がタイムアウトしました (${timeoutMs}ms)`))
    }, timeoutMs)

    const { onAuthStateChanged: onAuthStateChangedFn } = require("firebase/auth")
    const unsubscribe = onAuthStateChangedFn(auth, (user: User | null) => {
      // 期待するUIDが指定されている場合
      if (expectedUid) {
        if (user && user.uid === expectedUid) {
          // 期待するUIDのユーザーがログインした
          clearTimeout(timeout)
          log.info(`[waitForAuthState] 認証状態確認: ログイン中 (${user.email}, UID: ${user.uid})`)
          unsubscribe()
          resolve(user)
        } else if (!user) {
          // まだログインしていない場合は待機を続ける
          log.info(`[waitForAuthState] 認証状態待機中... (期待するUID: ${expectedUid})`)
        } else {
          // 異なるUIDのユーザーがログインしている場合は待機を続ける
          log.warn(`[waitForAuthState] 異なるUIDのユーザーがログイン中 (期待: ${expectedUid}, 実際: ${user.uid})`)
        }
      } else {
        // UIDの指定がない場合は、任意のユーザーがログインしたら完了
        clearTimeout(timeout)
        log.info(`[waitForAuthState] 認証状態確認: ${user ? `ログイン中 (${user.email})` : "未ログイン"}`)
        unsubscribe()
        resolve(user)
      }
    })
  })
}
