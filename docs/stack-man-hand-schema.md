# Stack Man Hand システム - データベーススキーマ設計

## 概要

Stack Man Handシステムは、プレイヤーがアプリチップでランダムなポーカーハンドを購入し、店舗で使用できるシステムです。

## ビジネスルール

1. **アプリチップと店舗チップの分離**
   - アプリチップ: ポーカーゲームで使用
   - 店舗チップ（貯スタック）: 店舗でのみ使用、Stack Man Handの報酬として獲得

2. **Stack Man Hand**
   - プレイヤーはアプリチップで購入
   - ランダムにポーカーハンドを割り当て
   - 当日のみ有効（日付チェック）
   - 店舗で提示し、勝利すれば店舗チップを獲得

3. **レーキシステム**
   - ポーカーゲームの勝利金から一定率を徴収
   - 毎日指定時刻に自動回収
   - アプリチップの無限増殖を防ぐ

4. **毎日のスタックリセット**
   - 毎日指定時刻にスタックをリセット
   - 最低10,000チップを保証

## データベーススキーマ

### 1. Store（既存の拡張）

```typescript
interface Store {
  // 既存フィールド
  id: string
  name: string
  storeCode: string
  // ... 他の既存フィールド
  
  // 新規フィールド: Stack Man Hand設定
  stackManHandSettings?: {
    enabled: boolean                    // Stack Man Hand機能の有効/無効
    purchasePrice: number               // 購入価格（アプリチップ）
    rewardAmount: number                // 報酬額（店舗チップ）
    businessHours: {
      open: string                      // 営業開始時刻（例: "10:00"）
      close: string                     // 営業終了時刻（例: "22:00"）
    }
  }
  
  // 新規フィールド: レーキ設定
  rakeSettings?: {
    enabled: boolean                    // レーキ機能の有効/無効
    rakePercentage: number              // レーキ率（0-100）
    collectionTime: string              // 回収時刻（例: "03:00"）
  }
  
  // 新規フィールド: スタックリセット設定
  stackResetSettings?: {
    enabled: boolean                    // スタックリセット機能の有効/無効
    resetTime: string                   // リセット時刻（例: "04:00"）
    minimumStack: number                // 最低保証スタック（デフォルト: 10000）
  }
}
```

### 2. PokerPlayer（既存の拡張）

```typescript
interface PokerPlayer {
  // 既存フィールド
  userId: string
  userName: string
  seatIndex: number
  stack: number                         // アプリチップ（ポーカー用）
  // ... 他の既存フィールド
  
  // 新規フィールド
  storeChips?: number                   // 店舗チップ（貯スタック）
  lastStackReset?: Timestamp            // 最後のスタックリセット日時
  totalRakeCollected?: number           // 累計レーキ徴収額
}
```

### 3. StackManHand（新規コレクション）

**パス**: `stores/{storeId}/stackManHands/{handId}`

```typescript
interface StackManHand {
  id: string                            // ドキュメントID
  userId: string                        // プレイヤーID
  userName: string                      // プレイヤー名
  storeId: string                       // 店舗ID
  
  // ハンド情報
  cards: Card[]                         // 2枚のカード
  handRank: string                      // ハンドランク（例: "ワンペア"）
  
  // 購入・使用情報
  purchasePrice: number                 // 購入価格
  rewardAmount: number                  // 報酬額
  purchasedAt: Timestamp                // 購入日時
  validUntil: Timestamp                 // 有効期限（購入日の23:59:59）
  
  // ステータス
  status: "active" | "used" | "expired" // アクティブ/使用済み/期限切れ
  usedAt?: Timestamp                    // 使用日時
  result?: "win" | "lose"               // 結果
}
```

### 4. RakeCollection（新規コレクション）

**パス**: `stores/{storeId}/rakeCollections/{collectionId}`

```typescript
interface RakeCollection {
  id: string                            // ドキュメントID
  storeId: string                       // 店舗ID
  collectedAt: Timestamp                // 回収日時
  totalAmount: number                   // 合計回収額
  playerRakes: Array<{
    userId: string                      // プレイヤーID
    userName: string                    // プレイヤー名
    amount: number                      // 回収額
    stackBefore: number                 // 回収前スタック
    stackAfter: number                  // 回収後スタック
  }>
}
```

### 5. StackReset（新規コレクション）

**パス**: `stores/{storeId}/stackResets/{resetId}`

```typescript
interface StackReset {
  id: string                            // ドキュメントID
  storeId: string                       // 店舗ID
  resetAt: Timestamp                    // リセット日時
  playerResets: Array<{
    userId: string                      // プレイヤーID
    userName: string                    // プレイヤー名
    stackBefore: number                 // リセット前スタック
    stackAfter: number                  // リセット後スタック
    wasReset: boolean                   // リセットされたか（最低保証未満だったか）
  }>
}
```

## Firestoreセキュリティルール

```javascript
// Stack Man Hands
match /stores/{storeId}/stackManHands/{handId} {
  // プレイヤーは自分のハンドのみ読み取り可能
  allow read: if request.auth != null && 
                 resource.data.userId == request.auth.uid;
  
  // プレイヤーは自分のハンドのみ作成可能
  allow create: if request.auth != null && 
                   request.resource.data.userId == request.auth.uid;
  
  // 店舗スタッフはハンドの使用状態を更新可能
  allow update: if isStoreEmployee(storeId);
}

// Rake Collections（店舗スタッフのみ）
match /stores/{storeId}/rakeCollections/{collectionId} {
  allow read, write: if isStoreEmployee(storeId);
}

// Stack Resets（店舗スタッフのみ）
match /stores/{storeId}/stackResets/{resetId} {
  allow read, write: if isStoreEmployee(storeId);
}
```

## インデックス

### stackManHands
- `userId` + `status` + `validUntil` (複合インデックス)
- `storeId` + `purchasedAt` (複合インデックス)

### rakeCollections
- `storeId` + `collectedAt` (複合インデックス)

### stackResets
- `storeId` + `resetAt` (複合インデックス)

## 実装の優先順位

1. **Phase 1**: 店舗設定ページ（Store拡張）
2. **Phase 2**: Stack Man Hand購入機能
3. **Phase 3**: Stack Man Hand表示画面
4. **Phase 4**: 自動レーキ回収システム
5. **Phase 5**: 毎日のスタックリセットシステム

## 注意事項

- タイムゾーンは日本時間（JST）を使用
- 日付判定は`YYYY-MM-DD`形式で比較
- 自動処理はCloud Functionsまたはクライアント側のスケジューラーで実装
