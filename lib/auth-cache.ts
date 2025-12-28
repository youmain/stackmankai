/**
 * Firebase Authenticationの認証キャッシュヘルパー
 * 
 * Firebase Authは毎回サーバーに認証情報の有効性を確認するため、
 * 初回ログイン時に時間がかかる（約75秒）。
 * 
 * このヘルパーは、localStorageに認証状態をキャッシュし、
 * サーバーチェックをスキップすることでUXを改善する。
 */

const AUTH_CACHE_KEY = "firebase_auth_cache"
const CACHE_DURATION_MS = 24 * 60 * 60 * 1000 // 24時間

interface AuthCache {
  isAuthenticated: boolean
  email: string
  uid: string
  lastLoginTime: number
}

/**
 * 認証キャッシュを保存
 */
export function saveAuthCache(email: string, uid: string): void {
  const cache: AuthCache = {
    isAuthenticated: true,
    email,
    uid,
    lastLoginTime: Date.now(),
  }
  
  try {
    localStorage.setItem(AUTH_CACHE_KEY, JSON.stringify(cache))
    console.log("[AuthCache] 💾 認証キャッシュを保存:", email)
  } catch (error) {
    console.error("[AuthCache] ❌ 認証キャッシュの保存に失敗:", error)
  }
}

/**
 * 認証キャッシュを取得
 */
export function getAuthCache(): AuthCache | null {
  try {
    const cacheStr = localStorage.getItem(AUTH_CACHE_KEY)
    if (!cacheStr) {
      console.log("[AuthCache] ℹ️ 認証キャッシュが見つかりません")
      return null
    }
    
    const cache: AuthCache = JSON.parse(cacheStr)
    
    // キャッシュの有効期限をチェック
    const elapsed = Date.now() - cache.lastLoginTime
    if (elapsed > CACHE_DURATION_MS) {
      console.log("[AuthCache] ⏰ 認証キャッシュの有効期限切れ")
      clearAuthCache()
      return null
    }
    
    console.log("[AuthCache] ✅ 認証キャッシュを取得:", cache.email)
    return cache
  } catch (error) {
    console.error("[AuthCache] ❌ 認証キャッシュの取得に失敗:", error)
    return null
  }
}

/**
 * 認証キャッシュをクリア
 */
export function clearAuthCache(): void {
  try {
    localStorage.removeItem(AUTH_CACHE_KEY)
    console.log("[AuthCache] 🗑️ 認証キャッシュをクリア")
  } catch (error) {
    console.error("[AuthCache] ❌ 認証キャッシュのクリアに失敗:", error)
  }
}

/**
 * 認証キャッシュが有効かチェック
 */
export function isAuthCacheValid(): boolean {
  const cache = getAuthCache()
  return cache !== null && cache.isAuthenticated
}
