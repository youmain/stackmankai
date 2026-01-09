# StackMan Hand 稼働時間判定ロジック修正

## 問題の概要
- 店舗設定で保存した稼働時間が購入ページに反映されない
- 常に「21:00 - 23:50」という固定時間が表示される
- サーバーが米国東部時間（EST）で動作しており、日本時間（JST）との9時間の差が生じていた

## 修正内容

### 修正1: `lib/utils.ts` - 時間判定ロジックの日本時間対応

**ファイル**: `/home/ubuntu/stackmankai-repo/lib/utils.ts`

**変更内容**:
1. 新しいヘルパー関数 `getCurrentTimeInJST()` を追加
   - `new Date().toLocaleString('en-US', { timeZone: 'Asia/Tokyo' })` を使用して日本時間を取得
   - サーバーの場所に関わらず、常に日本時間（UTC+9）で時刻を取得

2. `isWithinOperationHours()` 関数を修正
   - `new Date().getHours()` の代わりに `getCurrentTimeInJST()` を使用
   - これにより、設定された稼働時間と日本時間が正確に比較される

3. `isWithinPurchaseWindow()` 関数を修正
   - 同様に `getCurrentTimeInJST()` を使用
   - 購入専用タイム（終了後1時間）の判定が日本時間ベースになる

**修正前**:
```typescript
const now = new Date()
const currentHour = now.getHours()
const currentMinute = now.getMinutes()
```

**修正後**:
```typescript
const getCurrentTimeInJST = (): { hours: number; minutes: number } => {
  const now = new Date()
  const jstTime = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Tokyo' }))
  return {
    hours: jstTime.getHours(),
    minutes: jstTime.getMinutes()
  }
}

const jstTime = getCurrentTimeInJST()
const currentHour = jstTime.hours
const currentMinute = jstTime.minutes
```

### 修正2: バリデーション確認

**ファイル**: `/home/ubuntu/stackmankai-repo/app/store-settings/page.tsx`

- フロントエンドの「5時間以内」バリデーションは既に実装済み（82-86行目）
- ユーザーが5時間を超える設定をしようとするとエラーメッセージが表示される

## 期待される動作

修正後、以下のように動作します：

1. **店舗管理者が稼働時間を設定**（例：13:00 - 18:00）
   ↓
2. **購入ページが日本時間で判定**
   - 現在時刻が13:00 - 18:00の間 → 購入可能
   - 現在時刻が18:00 - 19:00の間 → 購入専用タイム（購入のみ可能）
   - それ以外 → 購入時間外
   ↓
3. **プレイヤーが正しい時間に購入できる**

## デプロイ手順

1. GitHubにコミット・プッシュ
2. Vercelが自動的にデプロイ
3. 本番環境で修正が反映される

## テスト方法

1. 店舗管理者として現在時刻をカバーする稼働時間を設定（例：現在が15:00なら13:00-18:00）
2. プレイヤーとしてログイン
3. Stack Man Hand購入ページにアクセス
4. エラーが表示されず、購入ボタンが表示されることを確認

## 注意事項

- この修正により、サーバーの場所に関わらず、常に日本時間で判定が行われます
- 既存の設定（21:00 - 23:50など）は自動的に日本時間で解釈されます
