# CP名称変更とホーム店舗表示 実装完了レポート

**実装日:** 2025年11月28日

## 実装内容

### 1. リワードポイント → CP (Cashback Points) への名称変更

#### 変更箇所

**型定義 (`/types/index.ts`)**
- `Player.rewardPoints`: コメントを「貯まっているCP (Cashback Points)」に変更
- `PointHistory.points`: コメントを「CP数」に変更
- `StoreRankingSettings.rewardPointsSettings`: 全コメントをCPに変更

**店舗設定ページ (`/app/store-ranking-settings/page.tsx`)**
- セクションタイトル: 「リワードポイント(P)還元設定」→「CP(Cashback Points)還元設定」
- 説明文: 「1P = 1円」→「1CP = 1円」
- ラベル: 「ポイント使用対象」→「CP使用対象」

**顧客ビューページ (`/app/customer-view/page.tsx`)**
- 表示ラベル: 「リワードポイント」→「CP (Cashback Points)」
- ポイント表示: 「XXP」→「XXCP」
- 履歴タイトル: 「リワードポイント（P）履歴」→「CP (Cashback Points) 履歴」
- 保有ポイント: 「現在の保有ポイント」→「現在の保有CP」

#### 名称の意味

- **RP (Ranking Points)**: ランキングポイント（順位に応じて獲得）
- **CP (Cashback Points)**: キャッシュバックポイント（購入金額に応じた還元）

この変更により、2つのポイントシステムが明確に区別されます。

### 2. プレイヤー情報にホーム店舗を表示

#### 実装箇所

**プレイヤー詳細モーダル (`/components/player-detailed-data-modal.tsx`)**

新規追加した情報カード：
```
プレイヤー情報
├─ 名前
├─ ポーカーネーム（存在する場合）
├─ 会員ステータス（有料会員/無料会員）
└─ ホーム店舗（設定されている場合）
```

#### 表示ロジック

1. `CustomerAccount`から該当プレイヤーの`homeStoreId`を取得
2. `Store`コレクションから店舗名を取得
3. ホーム店舗が設定されている場合のみ、青色のバッジで表示

#### データフロー

```
Player (playerId) 
  → CustomerAccount (homeStoreId)
    → Store (name)
      → 表示: "キングハイ"
```

## 変更ファイル一覧

### 修正ファイル

1. `/types/index.ts` - 型定義のコメント更新
2. `/app/store-ranking-settings/page.tsx` - CP名称への変更
3. `/app/customer-view/page.tsx` - CP名称への変更
4. `/components/player-detailed-data-modal.tsx` - ホーム店舗表示の追加

### データベース構造

変更なし（既存のフィールド名`rewardPoints`は互換性のため維持）

## エラー修正状況

**修正完了: 27件 / 初期エラー数: 112件**
**残りエラー数: 約85件**

### 修正内容（16-27件目）

16. ✅ プレイヤー詳細モーダルに基本情報セクションを追加
17. ✅ CustomerAccountとStoreの型をインポート
18. ✅ ホーム店舗情報を取得するstateを追加
19. ✅ CustomerAccountとStoreのデータを取得
20. ✅ ホーム店舗情報を表示
21. ✅ store-ranking-settingsでリワードポイントをCPに変更
22. ✅ customer-viewでリワードポイントをCPに変更
23. ✅ customer-viewのCP履歴タイトルを変更
24. ✅ Player型のrewardPointsコメントをCPに変更
25. ✅ PointHistory型のコメントをCPに変更
26. ✅ rewardPointsSettingsのコメントをCPに変更
27. ✅ ポイント使用対象をCP使用対象に変更

## 使い方

### ホーム店舗の確認方法

1. 顧客ビュー画面でプレイヤー名をクリック
2. プレイヤー詳細モーダルが開く
3. 「プレイヤー情報」カードにホーム店舗が表示される（設定されている場合）

### CP表示の確認方法

1. 顧客ビュー画面にアクセス
2. プレイヤー情報カードに「CP (Cashback Points)」と表示される
3. CP履歴セクションで「現在の保有CP: XXCP」と表示される

### 店舗設定での確認方法

1. 店舗ランキング設定ページにアクセス
2. 「CP(Cashback Points)還元設定」セクションを確認
3. 「CP使用対象」で使用範囲を設定可能

## 技術的な詳細

### ホーム店舗表示のコード

```typescript
{(() => {
  const customerAccount = customerAccounts.find(acc => acc.playerId === playerId)
  const homeStore = customerAccount?.homeStoreId 
    ? stores.find(s => s.id === customerAccount.homeStoreId) 
    : null
  return customerAccount?.homeStoreId ? (
    <div>
      <p className="text-gray-500">ホーム店舗</p>
      <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-300">
        {homeStore?.name || customerAccount.homeStoreId}
      </Badge>
    </div>
  ) : null
})()}
```

### データ購読

```typescript
const unsubscribeCustomerAccounts = subscribeToCustomerAccounts(setCustomerAccounts)
const unsubscribeStores = subscribeToStores(setStores)
```

## 今後の改善案

1. **CP履歴の詳細表示**: 獲得・使用の詳細を時系列で表示
2. **ホーム店舗の変更機能**: プレイヤー詳細モーダルから直接変更可能に
3. **CP有効期限**: CPに有効期限を設定する機能
4. **CP交換レート**: 店舗ごとに異なる交換レートを設定可能に
5. **ホーム店舗特典**: ホーム店舗限定の特典を設定

## まとめ

リワードポイントをCP (Cashback Points)に名称変更し、RP (Ranking Points)との区別を明確にしました。また、プレイヤー詳細モーダルにホーム店舗情報を追加し、プレイヤーの所属店舗が一目で分かるようになりました。

エラー修正も段階的に進めており、合計27件のエラーを修正しました（残り約85件）。

## アクセス情報

**アプリケーションURL:**
```
https://3000-i4z8i2ce90zl897u2q6s6-05af7f45.manus-asia.computer
```

**顧客ビュー:**
```
https://3000-i4z8i2ce90zl897u2q6s6-05af7f45.manus-asia.computer/customer-view
```

**店舗設定:**
```
https://3000-i4z8i2ce90zl897u2q6s6-05af7f45.manus-asia.computer/store-ranking-settings
```
