# パフォーマンス監視機能のテスト手順

デプロイ後に、パフォーマンス監視機能が正常に動作していることを確認するための手順です。

---

## 1. ブラウザでプレイヤー管理ページにアクセス

1. https://stackmankai-zeta.vercel.app/store-login にアクセス
2. 店舗510でログイン
   - 店舗コード: `510`
   - ユーザー名: `山田太郎`
   - パスワード: `test1234`
3. プレイヤー管理ページに移動

---

## 2. ブラウザの開発者ツールを開く

**Chrome/Edge:**
- Windows: `F12` または `Ctrl + Shift + I`
- Mac: `Cmd + Option + I`

**Firefox:**
- Windows: `F12` または `Ctrl + Shift + I`
- Mac: `Cmd + Option + I`

---

## 3. コンソールタブでパフォーマンスログを確認

プレイヤーリストが読み込まれると、以下のようなログが表示されます。

### 正常な場合（プレイヤー数が少ない）
```
✅ [Performance] Firestore: Map player documents: 2.34ms { documentCount: 2 }
✅ [Performance] Client: Sort players by name: 0.45ms { playerCount: 2 }
```

### 警告が表示される場合（プレイヤー数が多い）
```
⚠️ [Performance Warning] Client: Sort players by name: 125.67ms { playerCount: 1000 }
```

---

## 4. パフォーマンス統計情報を確認

コンソールで以下のコマンドを実行して、統計情報を確認できます。

### 特定の操作の統計情報を取得
```javascript
performanceMonitor.getStats('Client: Sort players by name')
```

**出力例:**
```javascript
{
  count: 5,          // 計測回数
  average: 2.34,     // 平均処理時間（ミリ秒）
  min: 1.23,         // 最小処理時間（ミリ秒）
  max: 4.56,         // 最大処理時間（ミリ秒）
  latest: 2.45       // 最新の処理時間（ミリ秒）
}
```

---

### 全メトリクスを取得
```javascript
performanceMonitor.getAllMetrics()
```

**出力例:**
```javascript
[
  {
    operation: "Firestore: Map player documents",
    duration: 2.34,
    timestamp: 1702468800000,
    metadata: { documentCount: 2 }
  },
  {
    operation: "Client: Sort players by name",
    duration: 0.45,
    timestamp: 1702468800100,
    metadata: { playerCount: 2 }
  }
]
```

---

### サマリーレポートを出力
```javascript
performanceMonitor.printSummary()
```

**出力例:**
```
📊 Performance Summary:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Firestore: Map player documents:
  Count: 5
  Average: 3.45ms
  Min: 2.10ms
  Max: 5.67ms
  Latest: 3.20ms

Client: Sort players by name:
  Count: 5
  Average: 2.34ms
  Min: 1.23ms
  Max: 4.56ms
  Latest: 2.45ms

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

---

## 5. 新規プレイヤーを登録してパフォーマンスを再確認

1. 「新規プレイヤー登録」ボタンをクリック
2. プレイヤー情報を入力して登録
3. コンソールで新しいパフォーマンスログを確認

プレイヤー数が増えると、処理時間がどのように変化するかを確認できます。

---

## 6. 期待される結果

### プレイヤー数が少ない場合（1-100人）
- ドキュメントマッピング: **5ms以下**
- ソート処理: **1ms以下**
- ログレベル: ✅ 正常

### プレイヤー数が中程度の場合（100-1,000人）
- ドキュメントマッピング: **5-50ms**
- ソート処理: **1-50ms**
- ログレベル: ✅ 正常

### プレイヤー数が多い場合（1,000-10,000人）
- ドキュメントマッピング: **50-500ms**
- ソート処理: **50-500ms**
- ログレベル: ⚠️ 警告（最適化を検討）

### プレイヤー数が非常に多い場合（10,000人以上）
- ドキュメントマッピング: **500ms以上**
- ソート処理: **500ms以上**
- ログレベル: 🔴 エラー（即座に最適化が必要）

---

## 7. トラブルシューティング

### パフォーマンスログが表示されない
- ブラウザの開発者ツールが開いているか確認
- コンソールタブが選択されているか確認
- ページをリロードしてみる

### `performanceMonitor is not defined` エラーが表示される
- 本番環境では `performanceMonitor` はグローバルに公開されていません
- 開発環境（`npm run dev`）でテストしてください

### 処理時間が異常に長い
- ブラウザのキャッシュをクリア
- 他のタブやアプリケーションを閉じてリソースを解放
- ネットワーク接続を確認

---

## まとめ

パフォーマンス監視機能により、プレイヤー数の増加に伴うパフォーマンス低下を早期に発見できます。定期的にパフォーマンスログを確認し、必要に応じて最適化を実施してください。

詳細な情報は `PERFORMANCE_MONITORING.md` を参照してください。
