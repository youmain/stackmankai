# タイムアウト自動フォールド機能 - 実装レポート

**作成日:** 2025年12月17日  
**状態:** 完了・デプロイ済み

---

## 📋 問題

**ユーザーからの報告:**
> 秒数は進むようになったが0秒になってもフォールドにならない。

**根本原因:**
カウントダウン表示は動作していたが、タイムアウト時の自動フォールド処理が実装されていなかった。以前、`chat-room-dual-mode.tsx`のタイムアウト監視ロジックをコメントアウトしたため、タイムアウト処理が実行されなくなっていた。

---

## ✅ 実装内容

### 1. `timeout-indicator.tsx`の修正

**変更箇所:** 6-12行目、35-50行目

**追加内容:**
- `onTimeout?: () => void`プロップを追加
- カウントダウンが0になったときに`onTimeout`コールバックを呼び出す

```typescript
interface TimeoutIndicatorProps {
  game: PokerGameState
  currentUserId: string
  onTimeout?: () => void  // 追加
}

export function TimeoutIndicator({ game, currentUserId, onTimeout }: TimeoutIndicatorProps) {
  // ...
  
  const interval = setInterval(() => {
    setCountdown(prev => {
      if (prev === null || prev <= 1) {
        clearInterval(interval)
        // タイムアウトコールバックを呼び出す
        if (onTimeout) {
          console.log('[TimeoutIndicator] Timeout reached, calling onTimeout')
          onTimeout()
        }
        return 0
      }
      return prev - 1
    })
  }, 1000)
}
```

---

### 2. `poker-table.tsx`の修正

**変更箇所:** 14-23行目、204行目、281行目

**追加内容:**
- `onTimeout?: () => void`プロップを追加
- `TimeoutIndicator`に`onTimeout`を渡す

```typescript
interface PokerTableProps {
  game: PokerGameState | null
  currentUserId: string
  onAction: (action: string, amount?: number) => void
  onJoinSeat: (seatIndex: number) => void
  onLeaveSeat: () => void
  onStartGame: () => void
  onResetGame?: () => void
  onTimeout?: () => void  // 追加
}

export function PokerTable({ 
  game, 
  currentUserId, 
  onAction, 
  onJoinSeat, 
  onLeaveSeat, 
  onStartGame, 
  onResetGame, 
  onTimeout  // 追加
}: PokerTableProps) {
  // ...
  
  <TimeoutIndicator 
    game={game} 
    currentUserId={currentUserId} 
    onTimeout={onTimeout}  // 追加
  />
}
```

---

### 3. `chat-room-dual-mode.tsx`の修正

**変更箇所:** 306-319行目、519行目

**追加内容:**
- `handleTimeout`関数を実装
- 自分のターンかどうかを確認
- `handlePlayerTimeout`を呼び出して自動フォールド
- `PokerTable`に`onTimeout`プロップを渡す

```typescript
const handleTimeout = async () => {
  if (!customerAccount || !pokerGameId || !pokerGame) return
  
  const currentPlayer = pokerGame.players[pokerGame.currentPlayerIndex]
  if (!currentPlayer || currentPlayer.userId !== customerAccount.id) return
  
  console.log('[ChatRoomDualMode] Timeout detected, auto-folding')
  
  try {
    await handlePlayerTimeout(customerAccount.storeId, pokerGameId, customerAccount.id)
  } catch (err) {
    console.error('Error handling timeout:', err)
  }
}

// ...

<PokerTable
  game={pokerGame}
  currentUserId={customerAccount.id}
  onAction={handlePokerAction}
  onJoinSeat={handleJoinSeat}
  onLeaveSeat={handleLeaveSeat}
  onStartGame={handleStartGame}
  onResetGame={handleResetGame}
  onTimeout={handleTimeout}  // 追加
/>
```

---

## 🔍 動作フロー

1. **カウントダウン開始**
   - プレイヤーのターンが開始
   - `TimeoutIndicator`が30秒からカウントダウンを開始

2. **カウントダウン進行**
   - 1秒ごとに数字が減少（30s → 29s → 28s...）
   - 5秒以下になると赤色で点滅

3. **タイムアウト到達**
   - カウントダウンが0になる
   - `TimeoutIndicator`が`onTimeout`コールバックを呼び出す

4. **自動フォールド処理**
   - `chat-room-dual-mode.tsx`の`handleTimeout`が実行される
   - 自分のターンかどうかを確認
   - `handlePlayerTimeout`を呼び出してFirestoreを更新
   - プレイヤーが自動的にフォールド

5. **次のプレイヤーへ**
   - ゲームが次のプレイヤーのターンに進む

---

## 🎯 テスト結果

### ビルドテスト
✅ ローカルビルド成功
```bash
$ pnpm build
✓ Compiled successfully
```

### デプロイテスト
✅ Vercelデプロイ成功
- コミット: `d6ce7be`
- コミットメッセージ: "Implement auto-fold on timeout: add onTimeout callback to TimeoutIndicator and PokerTable"
- デプロイURL: https://stackmankai-zeta.vercel.app

---

## 📊 変更ファイル

1. ✅ `components/poker/timeout-indicator.tsx` - タイムアウトコールバック追加
2. ✅ `components/poker/poker-table.tsx` - onTimeoutプロップ追加
3. ✅ `components/chat/chat-room-dual-mode.tsx` - handleTimeout関数実装
4. ✅ `FINAL_FIXES_REPORT.md` - 前回の修正レポート（新規作成）

---

## 🔧 技術的な詳細

### タイムアウト処理の仕組み

**修正前:**
- カウントダウン表示のみ
- タイムアウト処理なし

**修正後:**
- カウントダウン表示 + タイムアウト処理
- コールバックチェーンで実装

**コールバックチェーン:**
```
TimeoutIndicator (0秒到達)
  ↓ onTimeout()
PokerTable (プロップを中継)
  ↓ onTimeout()
ChatRoomDualMode (handleTimeout)
  ↓ handlePlayerTimeout()
Firestore (ゲーム状態更新)
```

### 安全性の確保

1. **自分のターンかどうかを確認**
   ```typescript
   const currentPlayer = pokerGame.players[pokerGame.currentPlayerIndex]
   if (!currentPlayer || currentPlayer.userId !== customerAccount.id) return
   ```

2. **エラーハンドリング**
   ```typescript
   try {
     await handlePlayerTimeout(...)
   } catch (err) {
     console.error('Error handling timeout:', err)
   }
   ```

3. **ログ出力**
   - タイムアウト検出時にログを出力
   - デバッグが容易

---

## 🎉 完了した機能

1. ✅ **30秒カウントダウン表示** - 正しく動作
2. ✅ **タイムアウト時の自動フォールド** - 実装完了
3. ✅ **ポットベットボタンの色改善** - 見やすくなった
4. ✅ **ベット額入力の文字色改善** - 見やすくなった

---

## 📝 今後の改善案（オプション）

### 優先度: 低

1. **デバッグログの削除**
   - `console.log`を本番環境では無効化

2. **タイムアウト警告音**
   - 5秒前に警告音を鳴らす

3. **タイムアウト履歴**
   - タイムアウトした回数を記録

4. **タイムアウト設定**
   - ゲームごとにタイムアウト時間を変更可能に

---

## 🔍 動作確認方法

1. ポーカーゲームに参加
2. 自分のターンになるまで待つ
3. **何もアクションせずに30秒待つ**
4. カウントダウンが0になったら自動的にフォールドされる
5. 次のプレイヤーのターンに進む

---

**レポート作成者:** Manus AI  
**最終更新:** 2025年12月17日
