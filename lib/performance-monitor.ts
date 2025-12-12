/**
 * パフォーマンス監視ユーティリティ
 * 
 * プレイヤーリストの読み込みやソート処理のパフォーマンスを監視し、
 * 将来的なスケーラビリティの問題を早期に発見します。
 */

interface PerformanceMetric {
  operation: string
  duration: number
  timestamp: number
  metadata?: Record<string, any>
}

class PerformanceMonitor {
  private metrics: PerformanceMetric[] = []
  private readonly maxMetrics = 100 // 最大100件のメトリクスを保持
  private readonly warningThreshold = 100 // 100ms以上で警告
  private readonly errorThreshold = 1000 // 1秒以上でエラー

  /**
   * 処理時間を計測
   */
  measure<T>(operation: string, fn: () => T, metadata?: Record<string, any>): T {
    const startTime = performance.now()
    const result = fn()
    const endTime = performance.now()
    const duration = endTime - startTime

    this.recordMetric(operation, duration, metadata)
    this.logIfSlow(operation, duration, metadata)

    return result
  }

  /**
   * 非同期処理の時間を計測
   */
  async measureAsync<T>(
    operation: string,
    fn: () => Promise<T>,
    metadata?: Record<string, any>,
  ): Promise<T> {
    const startTime = performance.now()
    const result = await fn()
    const endTime = performance.now()
    const duration = endTime - startTime

    this.recordMetric(operation, duration, metadata)
    this.logIfSlow(operation, duration, metadata)

    return result
  }

  /**
   * メトリクスを記録
   */
  private recordMetric(operation: string, duration: number, metadata?: Record<string, any>) {
    const metric: PerformanceMetric = {
      operation,
      duration,
      timestamp: Date.now(),
      metadata,
    }

    this.metrics.push(metric)

    // 最大件数を超えたら古いものから削除
    if (this.metrics.length > this.maxMetrics) {
      this.metrics.shift()
    }
  }

  /**
   * 遅い処理をログ出力
   */
  private logIfSlow(operation: string, duration: number, metadata?: Record<string, any>) {
    if (duration >= this.errorThreshold) {
      console.error(
        `🔴 [Performance Error] ${operation}: ${duration.toFixed(2)}ms`,
        metadata || {},
      )
    } else if (duration >= this.warningThreshold) {
      console.warn(
        `⚠️ [Performance Warning] ${operation}: ${duration.toFixed(2)}ms`,
        metadata || {},
      )
    } else {
      console.log(`✅ [Performance] ${operation}: ${duration.toFixed(2)}ms`, metadata || {})
    }
  }

  /**
   * 特定の操作の統計情報を取得
   */
  getStats(operation: string) {
    const operationMetrics = this.metrics.filter((m) => m.operation === operation)

    if (operationMetrics.length === 0) {
      return null
    }

    const durations = operationMetrics.map((m) => m.duration)
    const sum = durations.reduce((a, b) => a + b, 0)
    const avg = sum / durations.length
    const min = Math.min(...durations)
    const max = Math.max(...durations)

    return {
      count: operationMetrics.length,
      average: avg,
      min,
      max,
      latest: operationMetrics[operationMetrics.length - 1].duration,
    }
  }

  /**
   * 全メトリクスを取得
   */
  getAllMetrics() {
    return [...this.metrics]
  }

  /**
   * メトリクスをクリア
   */
  clear() {
    this.metrics = []
  }

  /**
   * サマリーレポートを出力
   */
  printSummary() {
    const operations = [...new Set(this.metrics.map((m) => m.operation))]

    console.log('\n📊 Performance Summary:')
    console.log('━'.repeat(60))

    operations.forEach((operation) => {
      const stats = this.getStats(operation)
      if (stats) {
        console.log(`\n${operation}:`)
        console.log(`  Count: ${stats.count}`)
        console.log(`  Average: ${stats.average.toFixed(2)}ms`)
        console.log(`  Min: ${stats.min.toFixed(2)}ms`)
        console.log(`  Max: ${stats.max.toFixed(2)}ms`)
        console.log(`  Latest: ${stats.latest.toFixed(2)}ms`)
      }
    })

    console.log('\n' + '━'.repeat(60))
  }
}

// シングルトンインスタンス
export const performanceMonitor = new PerformanceMonitor()

// 開発環境でのみグローバルに公開
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  ;(window as any).performanceMonitor = performanceMonitor
}
