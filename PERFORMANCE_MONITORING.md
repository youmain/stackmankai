# パフォーマンス監視機能

StackManKaiシステムに実装されたパフォーマンス監視機能の説明です。

---

## 概要

プレイヤーリストの読み込みやソート処理のパフォーマンスを自動的に監視し、将来的なスケーラビリティの問題を早期に発見します。

---

## 監視対象

### 1. Firestoreドキュメントのマッピング
**操作名:** `Firestore: Map player documents`

プレイヤーデータをFirestoreから取得し、アプリケーション内で使用可能な形式に変換する処理の時間を計測します。

**メタデータ:**
- `documentCount`: 取得したドキュメント数

**想定される処理時間:**
- 10件: 1-5ms
- 100件: 5-20ms
- 1,000件: 20-100ms
- 10,000件: 100-500ms

---

### 2. クライアント側でのソート
**操作名:** `Client: Sort players by name`

プレイヤーリストを名前順にソートする処理の時間を計測します。

**メタデータ:**
- `playerCount`: ソート対象のプレイヤー数

**想定される処理時間:**
- 10件: <1ms
- 100件: 1-5ms
- 1,000件: 10-50ms
- 10,000件: 100-500ms

---

## ログ出力

パフォーマンス監視は、処理時間に応じて以下のようにログを出力します。

### 正常（100ms未満）
```
✅ [Performance] Client: Sort players by name: 2.45ms { playerCount: 3 }
```

### 警告（100ms以上）
```
⚠️ [Performance Warning] Client: Sort players by name: 125.67ms { playerCount: 1000 }
```

### エラー（1秒以上）
```
🔴 [Performance Error] Client: Sort players by name: 1234.56ms { playerCount: 10000 }
```

---

## 開発環境での使用方法

### ブラウザのコンソールで統計情報を確認

開発環境では、`performanceMonitor`がグローバルに公開されています。

```javascript
// 特定の操作の統計情報を取得
performanceMonitor.getStats('Client: Sort players by name')
// 出力例:
// {
//   count: 5,
//   average: 2.34,
//   min: 1.23,
//   max: 4.56,
//   latest: 2.45
// }

// 全メトリクスを取得
performanceMonitor.getAllMetrics()

// サマリーレポートを出力
performanceMonitor.printSummary()
// 出力例:
// 📊 Performance Summary:
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 
// Firestore: Map player documents:
//   Count: 5
//   Average: 3.45ms
//   Min: 2.10ms
//   Max: 5.67ms
//   Latest: 3.20ms
// 
// Client: Sort players by name:
//   Count: 5
//   Average: 2.34ms
//   Min: 1.23ms
//   Max: 4.56ms
//   Latest: 2.45ms
// 
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

// メトリクスをクリア
performanceMonitor.clear()
```

---

## 最適化のタイミング

### 警告レベル（100ms以上）
プレイヤー数が増加してソート処理が100ms以上かかるようになった場合、以下の最適化を検討してください。

1. **Firestoreインデックスの作成**
   - サーバー側でソートを実行
   - クライアント側の処理負荷を軽減

2. **ページネーション（ページ分割）の導入**
   - 一度に表示するプレイヤー数を制限
   - 例: 50件ずつ表示

3. **仮想スクロール（Virtual Scrolling）の導入**
   - 画面に表示されているプレイヤーのみをレンダリング
   - 大量のプレイヤーでもスムーズに表示

---

### エラーレベル（1秒以上）
処理時間が1秒以上かかる場合、ユーザー体験に深刻な影響があります。**即座に最適化が必要**です。

---

## 本番環境での監視

本番環境でパフォーマンス問題が発生した場合、以下のツールを使用して詳細な分析を行うことができます。

### 推奨ツール

1. **Vercel Analytics**
   - サーバーレス関数の実行時間を監視
   - https://vercel.com/docs/analytics

2. **Google Analytics 4**
   - ページ読み込み時間を追跡
   - カスタムイベントでパフォーマンスメトリクスを送信

3. **Sentry**
   - エラーとパフォーマンスを統合監視
   - https://sentry.io/

---

## 実装の詳細

### パフォーマンス監視ユーティリティ
**ファイル:** `lib/performance-monitor.ts`

主要なメソッド:
- `measure()`: 同期処理の時間を計測
- `measureAsync()`: 非同期処理の時間を計測
- `getStats()`: 特定の操作の統計情報を取得
- `getAllMetrics()`: 全メトリクスを取得
- `printSummary()`: サマリーレポートを出力

### 監視対象の実装
**ファイル:** `lib/firestore.ts`

`subscribeToPlayers()` 関数内で以下の処理を監視:
1. Firestoreドキュメントのマッピング
2. クライアント側でのソート

---

## まとめ

パフォーマンス監視機能により、以下のことが可能になります。

✅ プレイヤー数の増加に伴うパフォーマンス低下を早期に発見  
✅ 最適化のタイミングを適切に判断  
✅ ユーザー体験を維持しながらスケーラビリティを確保  
✅ コストを最適化（Firestoreの読み取り回数を削減）  

将来的なビジネスの成長を見据えて、パフォーマンス監視を継続的に実施することをお勧めします。
