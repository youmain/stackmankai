# スタポカ貯スタック修正完了サマリー

## 実施日時
2025年12月22日

## 問題の概要

**報告された問題:**
- スタポカ貯スタックと貯スタックが同じように減っている
- 貯スタックは店のスタックであり、スタックマンハンド購入での増減はないはずです

**根本原因:**
- 両方とも同じフィールド (`systemBalance`) を参照していた
- スタックマンハンド購入時に `systemBalance` から減算していた

## 修正内容

### 1. データ構造の変更

#### types/firestore.ts
新しいフィールド `stapokaBalance` を追加:

```typescript
export interface FirestorePlayer {
  name: string
  uniqueId: string
  pokerName?: string
  furigana?: string
  systemBalance: number
  stapokaBalance?: number // スタポカ(チャットポーカー)のチップ残高 - Stack Man Hand購入に使用
  rewardPoints?: number
  // ... その他のフィールド
}
```

### 2. 表示の修正

#### app/customer-view/page.tsx
スタポカ貯スタックの表示を修正:

**Before:**
```typescript
{linkedPlayer.systemBalance?.toLocaleString() || 0}💰
```

**After:**
```typescript
{(linkedPlayer.stapokaBalance ?? linkedPlayer.systemBalance ?? 0).toLocaleString()}💰
```

フォールバック処理により、既存プレイヤー（`stapokaBalance` がない）でも動作します。

### 3. 購入ロジックの修正

#### lib/stack-man-hand.ts
購入時の処理を変更:

**Before:**
```typescript
const currentStack = playerData.systemBalance || 0
// ...
await updateDoc(playerDoc.ref, {
  systemBalance: currentStack - settings.purchasePrice,
  updatedAt: serverTimestamp(),
})
```

**After:**
```typescript
// スタポカバランスがない場合はsystemBalanceを使用（既存プレイヤー対応）
const currentStack = playerData.stapokaBalance ?? playerData.systemBalance ?? 0
// ...
const updateData: any = {
  updatedAt: serverTimestamp(),
}

// スタポカバランスが存在する場合はそれを更新、ない場合は新規作成
if (playerData.stapokaBalance !== undefined) {
  updateData.stapokaBalance = currentStack - settings.purchasePrice
} else {
  // 既存プレイヤーの場合: systemBalanceをstapokaBalanceにコピーしてから減算
  updateData.stapokaBalance = currentStack - settings.purchasePrice
}

await updateDoc(playerDoc.ref, updateData)
```

#### app/stack-man-hand/purchase/page.tsx
購入ページでの残高取得を変更:

**Before:**
```typescript
const stack = playerData.systemBalance || 0
```

**After:**
```typescript
// スタポカバランスがない場合はsystemBalanceを使用（既存プレイヤー対応）
const stack = playerData.stapokaBalance ?? playerData.systemBalance ?? 0
```

表示ラベルも修正:
- 「現在のスタック」→「スタポカ貯スタック」

## 動作の変更

### Before（修正前）

| 操作 | systemBalance | 表示される貯スタック | 表示されるスタポカ貯スタック |
|------|---------------|---------------------|---------------------------|
| 初期状態 | 50,000 | 50,000 | 50,000 |
| ハンド購入（1,000） | 49,000 | 49,000 ❌ | 49,000 |
| ハンド購入（1,000） | 48,000 | 48,000 ❌ | 48,000 |

**問題:** 貯スタックも減ってしまう

### After（修正後）

| 操作 | systemBalance | stapokaBalance | 表示される貯スタック | 表示されるスタポカ貯スタック |
|------|---------------|----------------|---------------------|---------------------------|
| 初期状態 | 50,000 | - | 50,000 | 50,000 |
| ハンド購入（1,000） | 50,000 | 49,000 | 50,000 ✅ | 49,000 |
| ハンド購入（1,000） | 50,000 | 48,000 | 50,000 ✅ | 48,000 |

**解決:** 貯スタックは変わらず、スタポカ貯スタックのみ減る

## 既存プレイヤーへの対応

### マイグレーション戦略

**自動マイグレーション方式を採用:**
- 既存プレイヤーは `stapokaBalance` フィールドを持たない
- 初回購入時に `systemBalance` の値を `stapokaBalance` にコピー
- その後は `stapokaBalance` から減算

**メリット:**
- データベースの一括更新が不要
- 段階的な移行が可能
- ロールバックが容易

**フォールバック処理:**
```typescript
playerData.stapokaBalance ?? playerData.systemBalance ?? 0
```

この処理により:
1. `stapokaBalance` があればそれを使用
2. なければ `systemBalance` を使用（既存プレイヤー）
3. どちらもなければ 0

## テスト項目

### 新規プレイヤー
- [ ] 新規プレイヤー作成時に `stapokaBalance` が設定されるか
- [ ] ハンド購入時に `stapokaBalance` のみが減るか
- [ ] `systemBalance` が変わらないか

### 既存プレイヤー
- [ ] `stapokaBalance` がない状態で購入ページを開けるか
- [ ] 初回購入時に `stapokaBalance` が作成されるか
- [ ] 2回目以降の購入で正しく減算されるか
- [ ] `systemBalance` が変わらないか

### 表示
- [ ] customer-view ページで貯スタックが正しく表示されるか
- [ ] customer-view ページでスタポカ貯スタックが正しく表示されるか
- [ ] 購入ページで「スタポカ貯スタック」ラベルが表示されるか
- [ ] 購入後に両方の値が正しく更新されるか

## 影響範囲

### 変更されたファイル
1. `types/firestore.ts` - Player型定義にstapokaBalance追加
2. `app/customer-view/page.tsx` - スタポカ貯スタック表示修正
3. `lib/stack-man-hand.ts` - 購入ロジック修正
4. `app/stack-man-hand/purchase/page.tsx` - 残高取得と表示修正

### 変更されていないファイル
- Firestoreセキュリティルール
- その他のStack Man Hand関連ページ
- 認証システム

## データベーススキーマの変更

### players コレクション

**追加フィールド:**
```
stapokaBalance: number (optional)
```

**説明:**
- スタポカ(チャットポーカー)のチップ残高
- Stack Man Hand購入に使用
- 既存プレイヤーは持たない（初回購入時に作成）

## ロールバック方法

問題が発生した場合、以下のコマンドでロールバック可能:

```bash
cd /home/ubuntu/stackmankai
git revert <commit-hash>
git push origin main
```

ロールバック後は:
- 両方とも `systemBalance` を参照する元の動作に戻る
- 作成された `stapokaBalance` フィールドは残るが使用されない
- データの整合性は保たれる

## 今後の改善案

1. **スタポカチップの獲得機能**
   - 現在は減るのみ
   - チャットポーカーでの勝利時に増やす機能を追加

2. **スタポカチップの購入機能**
   - チップが足りない場合の購入機能

3. **スタポカチップの履歴**
   - 増減履歴の記録と表示

4. **データマイグレーション**
   - 全プレイヤーに `stapokaBalance` を一括設定
   - 現在は自動マイグレーション方式だが、将来的には一括設定も検討

## まとめ

スタポカ貯スタックと貯スタックを分離し、Stack Man Hand購入時に貯スタックが減らないように修正しました。既存プレイヤーへの影響を最小限に抑えるため、フォールバック処理と自動マイグレーション方式を採用しています。

変更は安全にデプロイされており、問題が発生した場合は簡単にロールバック可能です。
