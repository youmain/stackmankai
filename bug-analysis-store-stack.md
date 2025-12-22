# Bug Analysis: 貯スタック (Store Stack) Incorrectly Decreasing

## 問題の概要

ユーザーから報告された問題:
- **スタポカ貯スタック** と **貯スタック** が同じように減っている
- **貯スタック** は店のスタックであり、スタックマンハンド購入での増減はないはずです

## 現状の実装調査

### コード調査結果

#### 1. customer-view/page.tsx (行1190-1205)

```typescript
<div>
  <p className="text-sm text-gray-600">貯スタック</p>
  <p className="text-lg font-semibold text-blue-600">
    {linkedPlayer.systemBalance?.toLocaleString() || 0}💰
  </p>
</div>
<div>
  <p className="text-sm text-gray-600">スタポカ貯スタック</p>
  <p className="text-lg font-semibold text-green-600">
    {linkedPlayer.systemBalance?.toLocaleString() || 0}💰
  </p>
</div>
```

**問題発見**: 両方とも `linkedPlayer.systemBalance` を表示している！

#### 2. lib/stack-man-hand.ts (行252-255)

```typescript
// Deduct chips from player
await updateDoc(playerDoc.ref, {
  systemBalance: currentStack - settings.purchasePrice,
  updatedAt: serverTimestamp(),
})
```

スタックマンハンド購入時に `systemBalance` から購入価格を引いている。

## 問題の原因

### 誤った実装

現在の実装では:
- **貯スタック** = `systemBalance`
- **スタポカ貯スタック** = `systemBalance` (同じフィールド)

両方が同じデータソース (`systemBalance`) を参照しているため、スタックマンハンド購入時に両方とも減少してしまう。

### 正しい実装であるべき姿

ユーザーの説明によると:
- **貯スタック** = 店のスタック（店舗で管理されるチップ残高）
  - スタックマンハンド購入では**増減しない**
  - 店舗でのプレイで増減する
  
- **スタポカ貯スタック** = スタックマンハンド購入用のチップ
  - スタックマンハンド購入時に**減少する**
  - 別のフィールドで管理されるべき

## データ構造の確認が必要

### Player データ構造

現在のプレイヤーデータ構造を確認する必要がある:
- `systemBalance` - これは何を表しているのか？
- `storeChips` - これは何を表しているのか？
- 他にチップ関連のフィールドはあるか？

### 可能性のあるシナリオ

#### シナリオ1: 表示の問題のみ
- データ構造は正しい
- 表示だけが間違っている
- **貯スタック** は別のフィールド（例: `storeChips`）を表示すべき

#### シナリオ2: データ構造とロジックの問題
- `systemBalance` が両方の役割を兼ねている
- 新しいフィールド（例: `stackManHandBalance`）を追加する必要がある
- 購入ロジックを変更する必要がある

## 次のステップ

1. **データ構造の確認**
   - Firestoreのplayersコレクションのスキーマを確認
   - `systemBalance`, `storeChips`, その他のフィールドの意味を明確化

2. **ユーザーへの確認**
   - 「貯スタック」と「スタポカ貯スタック」の正確な定義
   - どのフィールドを使うべきか

3. **修正方針の決定**
   - 表示のみの修正で済むか
   - データ構造とロジックの変更が必要か

## 暫定的な推測

コード内のコメントと変数名から推測すると:
- `systemBalance` = システム全体で管理される残高（店のスタック）
- `storeChips` = 店舗固有のチップ（報酬などで獲得）

もしこの推測が正しければ:
- **貯スタック** = `systemBalance` (正しい)
- **スタポカ貯スタック** = `systemBalance` (間違い - 別のフィールドを使うべき)
- スタックマンハンド購入は `systemBalance` から引く (これは正しいかもしれない)

しかし、ユーザーの説明では「貯スタックはスタックマンハンド購入で増減しない」とのことなので、この推測も間違っている可能性がある。

## 結論

ユーザーへの確認が必要:
1. 「貯スタック」の正確な定義
2. 「スタポカ貯スタック」の正確な定義
3. それぞれどのデータフィールドを使うべきか
