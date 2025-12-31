/**
 * 認証状態が反映されるまで待機する関数（改善版）
 * @param expectedUid 期待するUID（指定した場合、そのUIDのユーザーがログインするまで待機）
 * @param timeoutMs タイムアウト時間（ミリ秒）
 * @returns ログイン中のユーザー、またはnull
 */
export async function waitForAuthStateImproved(expectedUid?: string, timeoutMs: number = 30000): Promise<any | null> {
  const auth = require("firebase/auth").getAuth()
  if (!auth) {
    throw new Error("Firebase Authが初期化されていません")
  }

  const startTime = Date.now()
  const pollInterval = 100 // 100msごとにポーリング
  
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      reject(new Error(`認証状態の待機がタイムアウトしました (${timeoutMs}ms)`))
    }, timeoutMs)

    const checkAuth = () => {
      const currentUser = auth.currentUser
      const elapsed = Date.now() - startTime
      
      if (expectedUid) {
        if (currentUser && currentUser.uid === expectedUid) {
          clearTimeout(timeout)
          console.log(`[waitForAuthState] 認証状態確認: ログイン中 (${currentUser.email}, UID: ${currentUser.uid}, 経過時間: ${elapsed}ms)`)
          resolve(currentUser)
        } else if (elapsed < timeoutMs) {
          // まだタイムアウトに達していない場合、次のポーリングをスケジュール
          setTimeout(checkAuth, pollInterval)
        } else {
          clearTimeout(timeout)
          reject(new Error(`認証状態の待機がタイムアウトしました (${timeoutMs}ms)`))
        }
      } else {
        if (currentUser || elapsed >= timeoutMs) {
          clearTimeout(timeout)
          console.log(`[waitForAuthState] 認証状態確認: ${currentUser ? `ログイン中 (${currentUser.email})` : "未ログイン"}, 経過時間: ${elapsed}ms`)
          resolve(currentUser)
        } else {
          setTimeout(checkAuth, pollInterval)
        }
      }
    }
    
    checkAuth()
  })
}
