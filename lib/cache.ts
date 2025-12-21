/**
 * シンプルなメモリキャッシュユーティリティ
 * Firestoreの読み取り回数を削減するために使用
 */

interface CacheEntry<T> {
  data: T
  timestamp: number
}

class MemoryCache {
  private cache = new Map<string, CacheEntry<any>>()
  private defaultTTL = 60000 // デフォルト1分

  /**
   * キャッシュからデータを取得、または新規取得
   * @param key キャッシュキー
   * @param fetcher データ取得関数
   * @param ttl キャッシュ有効期間（ミリ秒）
   */
  async get<T>(
    key: string,
    fetcher: () => Promise<T>,
    ttl: number = this.defaultTTL
  ): Promise<T> {
    const cached = this.cache.get(key)
    
    // キャッシュが有効な場合
    if (cached && Date.now() - cached.timestamp < ttl) {
      console.log(`[Cache] ✅ HIT: ${key}`)
      return cached.data as T
    }
    
    // キャッシュミス、新規取得
    console.log(`[Cache] ❌ MISS: ${key}`)
    const data = await fetcher()
    this.cache.set(key, { data, timestamp: Date.now() })
    return data
  }

  /**
   * 同期版のget（既にキャッシュされているデータのみ取得）
   * @param key キャッシュキー
   * @param ttl キャッシュ有効期間（ミリ秒）
   */
  getSync<T>(key: string, ttl: number = this.defaultTTL): T | null {
    const cached = this.cache.get(key)
    
    if (cached && Date.now() - cached.timestamp < ttl) {
      console.log(`[Cache] ✅ SYNC HIT: ${key}`)
      return cached.data as T
    }
    
    return null
  }

  /**
   * データをキャッシュに直接設定
   * @param key キャッシュキー
   * @param data データ
   */
  set<T>(key: string, data: T): void {
    this.cache.set(key, { data, timestamp: Date.now() })
    console.log(`[Cache] 💾 SET: ${key}`)
  }

  /**
   * 特定のキャッシュを無効化
   * @param key キャッシュキー
   */
  invalidate(key: string): void {
    const deleted = this.cache.delete(key)
    if (deleted) {
      console.log(`[Cache] 🗑️ INVALIDATE: ${key}`)
    }
  }

  /**
   * パターンに一致するキャッシュを無効化
   * @param pattern 正規表現パターン
   */
  invalidatePattern(pattern: RegExp): void {
    let count = 0
    for (const key of this.cache.keys()) {
      if (pattern.test(key)) {
        this.cache.delete(key)
        count++
      }
    }
    console.log(`[Cache] 🗑️ INVALIDATE PATTERN: ${pattern} (${count} items)`)
  }

  /**
   * 全キャッシュをクリア
   */
  clear(): void {
    const size = this.cache.size
    this.cache.clear()
    console.log(`[Cache] 🧹 CLEAR ALL (${size} items)`)
  }

  /**
   * 期限切れのキャッシュを削除
   */
  cleanup(): void {
    const now = Date.now()
    let count = 0
    
    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > this.defaultTTL * 10) { // デフォルトTTLの10倍経過
        this.cache.delete(key)
        count++
      }
    }
    
    if (count > 0) {
      console.log(`[Cache] 🧹 CLEANUP: ${count} expired items removed`)
    }
  }

  /**
   * キャッシュの統計情報を取得
   */
  getStats(): { size: number; keys: string[] } {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys())
    }
  }
}

// シングルトンインスタンス
export const cache = new MemoryCache()

// 定期的なクリーンアップ（10分ごと）
if (typeof window !== 'undefined') {
  setInterval(() => {
    cache.cleanup()
  }, 10 * 60 * 1000)
}

/**
 * キャッシュキー生成ヘルパー
 */
export const CacheKeys = {
  storeSettings: (storeId?: string) => `storeSettings_${storeId || 'default'}`,
  rakeHistory: (limit: number = 100) => `rakeHistory_${limit}`,
  player: (playerId: string) => `player_${playerId}`,
  dailyRankings: (storeId?: string, date?: string) => 
    `dailyRankings_${storeId || 'all'}_${date || new Date().toISOString().split('T')[0]}`,
  monthlyPoints: (year: number, month: number) => `monthlyPoints_${year}_${month}`,
  pointHistory: (playerId: string) => `pointHistory_${playerId}`,
} as const
