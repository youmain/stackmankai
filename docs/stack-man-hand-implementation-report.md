# Stack Man Hand システム実装完了レポート

## 概要

Stack Man Handシステムの実装が完了しました。プレイヤーがアプリチップでランダムなポーカーハンドを購入し、店舗で使用できるシステムです。

## 実装内容

### Phase 1: データベーススキーマ設計

**ファイル**: `docs/stack-man-hand-schema.md`

- Store拡張（Stack Man Hand設定、レーキ設定、スタックリセット設定）
- StackManHandコレクション
- RakeCollectionコレクション
- StackResetコレクション

### Phase 2: 型定義

**ファイル**: `types/stack-man-hand.ts`

- `StackManHandSettings`
- `RakeSettings`
- `StackResetSettings`
- `StackManHand`
- `RakeCollection`
- `StackReset`

### Phase 3: 店舗設定ページ

**ファイル**: `app/store-settings/page.tsx`

**機能**:
- Stack Man Hand設定（購入価格、報酬額、営業時間）
- レーキ設定（レーキ率、回収時刻）
- スタックリセット設定（リセット時刻、最低保証額）
- 各機能の有効/無効切り替え

**アクセス**: `/store-settings` （オーナーのみ）

### Phase 4: Stack Man Hand購入機能

**ファイル**: 
- `lib/stack-man-hand.ts` （ヘルパー関数）
- `app/stack-man-hand/purchase/page.tsx` （購入ページ）

**機能**:
- ランダムハンド生成
- アプリチップ消費
- 1日1回の購入制限
- 有効期限設定（当日23:59:59まで）

**アクセス**: `/stack-man-hand/purchase` （プレイヤー）

### Phase 5: Stack Man Hand表示画面

**ファイル**: `app/stack-man-hand/display/[handId]/page.tsx`

**機能**:
- カードのビジュアル表示
- **リアルタイム時計**（スクリーンショット再利用防止）
- ハンドランク表示
- 有効期限表示
- ステータス表示（有効/使用済み/期限切れ）

**アクセス**: `/stack-man-hand/display/[handId]` （プレイヤー）

### Phase 6-7: 自動レーキ回収・スタックリセット

**ファイル**: 
- `lib/scheduled-tasks.ts` （スケジュールタスク）
- `components/scheduled-tasks-runner.tsx` （実行コンポーネント）
- `app/layout.tsx` （統合）

**機能**:
- **レーキ回収**: 指定時刻に全プレイヤーのスタックから徴収
- **スタックリセット**: 指定時刻に最低保証額未満のプレイヤーをリセット
- **重複実行防止**: Firestoreトランザクション使用
- **自動実行**: アプリ起動時 + 5分ごとにチェック

**実装方式**: クライアントサイド（ハイブリッド方式のPhase 1）

### Phase 8: 管理画面

**ファイル**: `app/store-stack-man-hand-admin/page.tsx`

**機能**:
- 手動レーキ回収
- 手動スタックリセット
- 最近のStack Man Hand一覧
- 最終回収/リセット情報表示

**アクセス**: `/store-stack-man-hand-admin` （オーナーのみ）

## システムフロー

### 1. Stack Man Hand購入フロー

```
プレイヤー
  ↓
購入ページ (/stack-man-hand/purchase)
  ↓
アプリチップ消費
  ↓
ランダムハンド生成
  ↓
Firestoreに保存
  ↓
表示ページにリダイレクト (/stack-man-hand/display/[handId])
```

### 2. Stack Man Hand使用フロー

```
プレイヤー
  ↓
表示ページを店舗スタッフに提示
  ↓
スタッフが勝敗を判定
  ↓
勝利の場合: 店舗チップを獲得
敗北の場合: 何も獲得できない
```

### 3. レーキ回収フロー

```
指定時刻（例: 3:00）
  ↓
アプリ起動時にチェック
  ↓
前回実行から24時間以上経過？
  ↓ YES
全プレイヤーのスタックから徴収
  ↓
Firestoreに記録
```

### 4. スタックリセットフロー

```
指定時刻（例: 4:00）
  ↓
アプリ起動時にチェック
  ↓
前回実行から24時間以上経過？
  ↓ YES
最低保証額未満のプレイヤーをリセット
  ↓
Firestoreに記録
```

## データベース構造

### stores/{storeId}

```typescript
{
  // 既存フィールド
  id: string
  name: string
  // ...
  
  // 新規フィールド
  stackManHandSettings: {
    enabled: boolean
    purchasePrice: number
    rewardAmount: number
    businessHours: {
      open: string  // "10:00"
      close: string // "22:00"
    }
  }
  
  rakeSettings: {
    enabled: boolean
    rakePercentage: number  // 0-100
    collectionTime: string  // "03:00"
  }
  
  stackResetSettings: {
    enabled: boolean
    resetTime: string       // "04:00"
    minimumStack: number    // 10000
  }
}
```

### stores/{storeId}/stackManHands/{handId}

```typescript
{
  id: string
  userId: string
  userName: string
  storeId: string
  cards: Card[]
  handRank: string
  purchasePrice: number
  rewardAmount: number
  purchasedAt: Timestamp
  validUntil: Timestamp
  status: "active" | "used" | "expired"
  usedAt?: Timestamp
  result?: "win" | "lose"
}
```

### stores/{storeId}/rakeCollections/{collectionId}

```typescript
{
  id: string
  storeId: string
  collectedAt: Timestamp
  totalAmount: number
  playerRakes: Array<{
    userId: string
    userName: string
    amount: number
    stackBefore: number
    stackAfter: number
  }>
}
```

### stores/{storeId}/stackResets/{resetId}

```typescript
{
  id: string
  storeId: string
  resetAt: Timestamp
  playerResets: Array<{
    userId: string
    userName: string
    stackBefore: number
    stackAfter: number
    wasReset: boolean
  }>
}
```

## セキュリティ機能

### 1. 重複実行防止

- Firestoreトランザクション使用
- 日付ベースのチェック
- ローカルストレージでの最終実行時刻記録

### 2. スクリーンショット再利用防止

- リアルタイム時計表示（1秒ごとに更新）
- 日時が常に表示されるため、古いスクリーンショットは無効

### 3. 権限管理

- 店舗設定: オーナーのみ
- 管理画面: オーナーのみ
- 購入・表示: プレイヤーのみ（自分のハンドのみ）

## テスト項目

### 店舗設定

- [ ] 設定ページにアクセスできる（オーナー）
- [ ] Stack Man Hand設定を保存できる
- [ ] レーキ設定を保存できる
- [ ] スタックリセット設定を保存できる
- [ ] 各機能の有効/無効を切り替えられる

### Stack Man Hand購入

- [ ] 購入ページにアクセスできる（プレイヤー）
- [ ] アプリチップが十分な場合、購入できる
- [ ] アプリチップが不足している場合、購入できない
- [ ] 1日1回の制限が機能する
- [ ] ランダムなハンドが生成される

### Stack Man Hand表示

- [ ] 表示ページにアクセスできる（プレイヤー）
- [ ] カードが正しく表示される
- [ ] リアルタイム時計が動作する
- [ ] 有効期限が正しく表示される
- [ ] ステータスが正しく表示される

### レーキ回収

- [ ] 指定時刻に自動実行される
- [ ] 全プレイヤーのスタックから徴収される
- [ ] 重複実行が防止される
- [ ] Firestoreに記録される
- [ ] 手動実行できる（管理画面）

### スタックリセット

- [ ] 指定時刻に自動実行される
- [ ] 最低保証額未満のプレイヤーがリセットされる
- [ ] 重複実行が防止される
- [ ] Firestoreに記録される
- [ ] 手動実行できる（管理画面）

### 管理画面

- [ ] 管理画面にアクセスできる（オーナー）
- [ ] 手動レーキ回収が実行できる
- [ ] 手動スタックリセットが実行できる
- [ ] 最近のStack Man Handが表示される
- [ ] 最終回収/リセット情報が表示される

## 今後の拡張（Phase 2: Cloud Functions）

### Cloud Functions実装時の追加項目

1. **Firebase Functions設定**
   - `functions/src/index.ts`
   - Pub/Subスケジューラー設定

2. **確実な実行**
   - 指定時刻に必ず実行
   - クライアント依存なし

3. **セキュリティ強化**
   - クライアント側から操作不可

### 移行タイミング

- ユーザー数が増加したら
- 正確なタイミングが重要になったら
- セキュリティ要件が厳しくなったら

## デプロイ情報

- **リポジトリ**: youmain/stackmankai
- **ブランチ**: main
- **最終コミット**: e2c0453
- **デプロイ先**: Vercel

## 実装ファイル一覧

### ドキュメント
- `docs/stack-man-hand-schema.md`
- `docs/stack-man-hand-implementation-report.md`

### 型定義
- `types/stack-man-hand.ts`

### ライブラリ
- `lib/stack-man-hand.ts`
- `lib/scheduled-tasks.ts`

### コンポーネント
- `components/scheduled-tasks-runner.tsx`

### ページ
- `app/store-settings/page.tsx`
- `app/stack-man-hand/purchase/page.tsx`
- `app/stack-man-hand/display/[handId]/page.tsx`
- `app/store-stack-man-hand-admin/page.tsx`

### 更新ファイル
- `app/layout.tsx`
- `app/store-dashboard/page.tsx`

## まとめ

Stack Man Handシステムの実装が完了しました。

**主要機能**:
✅ 店舗設定ページ
✅ Stack Man Hand購入機能
✅ Stack Man Hand表示画面
✅ 自動レーキ回収システム
✅ 自動スタックリセットシステム
✅ 管理画面

**実装方式**: ハイブリッド方式（Phase 1: クライアントサイド）

**次のステップ**: 動作確認とテスト
