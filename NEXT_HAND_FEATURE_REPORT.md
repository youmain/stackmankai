# 次のハンド進行機能 - 完成レポート

## ✅ 実装完了

勝者決定後、全員が「次のハンドへ」ボタンを押すか、15秒経過で次のハンドに進む機能を実装しました。

---

## 🎯 機能概要

### 動作フロー

```
ショーダウン
  ↓
勝者決定
  ↓
「次のハンドへ」ボタン表示
  ├─ 全員が押す → 即座に次のハンドへ ✅
  └─ 15秒経過 → 自動的に次のハンドへ ✅
```

### UI表示

```
┌─────────────────────────┐
│   🏆 WINNER! 🏆         │
│   POT: 20,000           │
├─────────────────────────┤
│ [次のハンドへ] ボタン    │ ← クリックで準備完了
│                         │
│ 準備完了: 2/3           │ ← 進捗表示
│ 自動開始まで: 12秒      │ ← カウントダウン
└─────────────────────────┘
```

---

## 📋 実装内容

### 1. データ構造の拡張

**types/poker.ts**
```typescript
export interface PokerGameState {
  // 既存フィールド
  phase: GamePhase
  winners?: string[]
  
  // 新規フィールド
  nextHandReadyPlayers?: string[]  // 準備完了プレイヤーのIDリスト
  nextHandStartTime?: Date         // 自動開始時刻（15秒後）
}
```

### 2. バックエンド実装

**lib/poker-ready-next-hand.ts** (新規作成)

#### `markPlayerReady`関数
- プレイヤーが「次のハンドへ」ボタンを押したときに呼ばれる
- `nextHandReadyPlayers`配列にプレイヤーIDを追加
- 自動的に`checkAndStartNextHand`を呼び出す

#### `checkAndStartNextHand`関数
- 全アクティブプレイヤーが準備完了かチェック
- または15秒のタイムアウトが経過したかチェック
- 条件を満たしたら`startNextHand`を呼び出す

**lib/poker-game-advanced.ts**

#### `evaluateShowdown`関数の修正
```typescript
// ショーダウン時に次のハンド開始時刻を設定
const nextHandStartTime = new Date(Date.now() + 15000)

await updateDoc(gameDoc, {
  phase: "showdown",
  winners: winners.map(idx => gameData.players[idx].userId),
  nextHandReadyPlayers: [], // リセット
  nextHandStartTime: nextHandStartTime, // 15秒後
  // ...
})
```

### 3. フロントエンド実装

**components/poker/winner-display.tsx**

#### 新しいProps
```typescript
interface WinnerDisplayProps {
  // 既存props
  winners: PokerPlayer[]
  pot: number
  
  // 新規props
  onNextHand?: () => void          // 次のハンドボタンのハンドラ
  readyPlayers?: string[]          // 準備完了プレイヤーリスト
  nextHandStartTime?: Date         // 自動開始時刻
  currentUserId?: string           // 現在のユーザーID
}
```

#### カウントダウン表示
```typescript
useEffect(() => {
  if (!nextHandStartTime) return
  
  const interval = setInterval(() => {
    const now = new Date()
    const remaining = Math.max(0, Math.floor((nextHandStartTime.getTime() - now.getTime()) / 1000))
    setCountdown(remaining)
    
    if (remaining === 0) {
      clearInterval(interval)
    }
  }, 100)
  
  return () => clearInterval(interval)
}, [nextHandStartTime])
```

#### ボタン表示
```typescript
<button
  onClick={onNextHand}
  disabled={isCurrentUserReady}
  className={isCurrentUserReady 
    ? 'bg-gray-400 text-gray-200 cursor-not-allowed'
    : 'bg-white text-yellow-600 hover:bg-yellow-50'
  }
>
  {isCurrentUserReady ? '✓ 準備完了' : '次のハンドへ'}
</button>

<div className="text-white text-sm">
  <p>準備完了: {readyCount}/{activePlayerCount}</p>
  <p>自動開始まで: {countdown}秒</p>
</div>
```

**components/chat/chat-room-dual-mode.tsx**

#### `handleReadyNextHand`関数
```typescript
const handleReadyNextHand = async () => {
  if (!customerAccount || !pokerGameId) return
  
  try {
    const { markPlayerReady } = await import('@/lib/poker-ready-next-hand')
    await markPlayerReady(customerAccount.storeId, pokerGameId, customerAccount.id)
  } catch (err) {
    console.error('Error marking ready for next hand:', err)
    setError(err instanceof Error ? err.message : '次のハンドの準備に失敗しました')
  }
}
```

#### タイムアウト監視
```typescript
useEffect(() => {
  if (!customerAccount || !pokerGameId || !pokerGame) return
  if (pokerGame.phase !== "showdown") return
  if (!pokerGame.nextHandStartTime) return

  // 1秒ごとにタイムアウトをチェック
  const interval = setInterval(async () => {
    const now = new Date()
    const startTime = pokerGame.nextHandStartTime
    
    if (startTime && now >= startTime) {
      console.log("[ChatRoomDualMode] Next hand timeout reached, checking and starting...")
      clearInterval(interval)
      
      try {
        const { checkAndStartNextHand } = await import('@/lib/poker-ready-next-hand')
        await checkAndStartNextHand(customerAccount.storeId, pokerGameId)
      } catch (err) {
        console.error("Error checking and starting next hand:", err)
      }
    }
  }, 1000)
  
  return () => clearInterval(interval)
}, [customerAccount, pokerGameId, pokerGame?.phase, pokerGame?.nextHandStartTime])
```

---

## 🎨 ユーザー体験

### シナリオ1: 全員が素早く準備完了

```
ショーダウン → 勝者表示
  ↓
Player A: 「次のハンドへ」クリック
  ↓ (準備完了: 1/3)
Player B: 「次のハンドへ」クリック
  ↓ (準備完了: 2/3)
Player C: 「次のハンドへ」クリック
  ↓ (準備完了: 3/3)
即座に次のハンド開始 ✅
```

### シナリオ2: 一部のプレイヤーが準備完了、残りはタイムアウト

```
ショーダウン → 勝者表示
  ↓
Player A: 「次のハンドへ」クリック (準備完了: 1/3)
  ↓
Player B: 「次のハンドへ」クリック (準備完了: 2/3)
  ↓
Player C: クリックしない
  ↓
15秒経過...
  ↓
自動的に次のハンド開始 ✅
```

### シナリオ3: 全員がタイムアウト

```
ショーダウン → 勝者表示
  ↓
誰もクリックしない
  ↓
カウントダウン: 15秒 → 14秒 → ... → 1秒 → 0秒
  ↓
自動的に次のハンド開始 ✅
```

---

## 🔍 技術的な詳細

### 同期処理

1. **プレイヤーが準備完了を押す**
   - `markPlayerReady` → Firestoreに`nextHandReadyPlayers`を更新
   - `checkAndStartNextHand` → 全員準備完了かチェック
   - 全員準備完了なら`startNextHand`を呼び出す

2. **タイムアウト監視**
   - 各クライアントが1秒ごとに`nextHandStartTime`をチェック
   - タイムアウトに達したら`checkAndStartNextHand`を呼び出す
   - `checkAndStartNextHand`内で再度条件をチェック（二重起動防止）

3. **競合処理**
   - 複数のクライアントが同時に`checkAndStartNextHand`を呼び出す可能性
   - `startNextHand`内でゲームの状態をチェックして、既に次のハンドが開始されている場合はスキップ

### エッジケース処理

1. **プレイヤーが途中で離脱**
   - アクティブプレイヤー（`isActive && stack > 0`）のみをカウント
   - 離脱したプレイヤーは準備完了の対象外

2. **ショーダウン後に新しいプレイヤーが参加**
   - 新しいプレイヤーは次のハンドから参加
   - 準備完了の対象外

3. **ネットワーク遅延**
   - 各クライアントが独立してタイムアウトを監視
   - サーバー側で最終的な判定を行う

---

## 🚀 デプロイ

- **コミット**: `c4a2f46` - "Feature: Next hand requires all players ready or 15s timeout"
- **URL**: https://stackmankai-zeta.vercel.app
- **状態**: ✅ デプロイ完了

---

## 🧪 テスト方法

### テスト1: 全員準備完了
1. 3人でポーカーゲーム開始
2. ショーダウンまでプレイ
3. 全員が「次のハンドへ」ボタンをクリック
4. **期待結果**: 即座に次のハンドが開始される

### テスト2: タイムアウト
1. 3人でポーカーゲーム開始
2. ショーダウンまでプレイ
3. 誰も「次のハンドへ」ボタンをクリックしない
4. カウントダウンを確認
5. **期待結果**: 15秒後に自動的に次のハンドが開始される

### テスト3: 混合
1. 3人でポーカーゲーム開始
2. ショーダウンまでプレイ
3. 1人だけ「次のハンドへ」ボタンをクリック
4. 「準備完了: 1/3」と表示されることを確認
5. 15秒待つ
6. **期待結果**: 自動的に次のハンドが開始される

---

## ✨ 改善点

### 既存の問題を解決
- ❌ **修正前**: ショーダウン後、5秒で自動的に次のハンドが開始
  - プレイヤーが勝者情報を確認する時間がない
  - 一方的に次のハンドが始まる

- ✅ **修正後**: 全員が準備完了するか、15秒経過で次のハンドが開始
  - プレイヤーが自分のペースで確認できる
  - 全員が準備完了すれば素早く次のハンドへ
  - 誰かが離席しても15秒後に自動進行

### ユーザーフレンドリー
- 準備完了の進捗が見える（2/3など）
- カウントダウンで残り時間がわかる
- ボタンの状態が明確（準備完了 / 次のハンドへ）

---

## 📊 まとめ

**実装した機能:**
1. ✅ 全員が「次のハンドへ」ボタンを押すと即座に次のハンドへ
2. ✅ 15秒経過すると自動的に次のハンドへ
3. ✅ 準備完了の進捗表示
4. ✅ カウントダウン表示
5. ✅ ボタンの状態管理（準備完了 / 次のハンドへ）

**技術的な実装:**
1. ✅ データ構造の拡張（`nextHandReadyPlayers`, `nextHandStartTime`）
2. ✅ バックエンド関数（`markPlayerReady`, `checkAndStartNextHand`）
3. ✅ フロントエンドUI（WinnerDisplay、PokerTable、ChatRoomDualMode）
4. ✅ タイムアウト監視（クライアント側）
5. ✅ 同期処理と競合処理

戻られたら、実際にテストしてみてください！🎉
