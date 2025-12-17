# タイムアウト機能 - 完成レポート

**作成日:** 2025年12月17日  
**状態:** 完了・デプロイ済み  
**最終コミット:** `23e46cb`

---

## 🎉 完成した機能

### タイムアウト自動フォールド機能

**機能概要:**
- プレイヤーのターン中に30秒のカウントダウンを表示
- 0秒になったら自動的にフォールド
- 1人だけ残った場合、自動的にWINになる

---

## 📋 実装の経緯

### 問題1: カウントダウンが動かない

**症状:** 30秒と表示されるが、カウントダウンしない

**原因:** `turnStartTime`の型が混在していた
- 一部は`new Date()`（クライアント時刻）
- 一部は`serverTimestamp()`（Firestoreサーバー時刻）

**解決策:** すべて`new Date()`に統一

**コミット:** `a58cc3e` - "Fix timeout countdown by using local state instead of Firestore turnStartTime"

---

### 問題2: 0秒でフォールドにならない

**症状:** カウントダウンは動作するが、0秒になってもフォールドしない

**原因:** タイムアウト時のコールバック処理が実装されていなかった

**解決策:** 
1. `timeout-indicator.tsx`に`onTimeout`コールバックを追加
2. `poker-table.tsx`で`onTimeout`を中継
3. `chat-room-dual-mode.tsx`で`handleTimeout`関数を実装

**コミット:** `d6ce7be` - "Implement auto-fold on timeout: add onTimeout callback to TimeoutIndicator and PokerTable"

---

### 問題3: Firebaseエラー

**症状:** 
```
Error handling timeout: FirebaseError: Expected first argument to collection() to be a CollectionReference, a DocumentReference or FirebaseFirestore
```

**原因:** `poker-timeout.ts`で`require("firebase/firestore")`を使用していた

**解決策:** 正しいES6インポートに変更

**コミット:** `83e3240` - "Fix Firebase import error in poker-timeout.ts: use proper import instead of require"

---

### 問題4: 1人残ってもWINにならない

**症状:** 2人プレイで片方がフォールドしても、残った方がWINにならない

**原因:** タイムアウト後のフェーズ進行チェックが実装されていなかった

**解決策:** `handlePlayerTimeout`関数に`checkAndAdvancePhase`の呼び出しを追加

**コミット:** `23e46cb` - "Add phase advancement check after timeout to handle single player remaining"

---

## ✅ 最終的な実装

### 1. `timeout-indicator.tsx`

**役割:** カウントダウン表示とタイムアウト通知

```typescript
interface TimeoutIndicatorProps {
  game: PokerGameState
  currentUserId: string
  onTimeout?: () => void  // タイムアウトコールバック
}

export function TimeoutIndicator({ game, currentUserId, onTimeout }: TimeoutIndicatorProps) {
  const [countdown, setCountdown] = useState<number | null>(null)
  
  useEffect(() => {
    // ゲームがWAITINGまたはSHOWDOWN状態の場合は表示しない
    if (game.phase === "WAITING" || game.phase === "SHOWDOWN") {
      setCountdown(null)
      return
    }
    
    // カウントダウンを開始
    const timeoutSeconds = game.timeoutSeconds || 30
    setCountdown(timeoutSeconds)
    
    const interval = setInterval(() => {
      setCountdown(prev => {
        if (prev === null || prev <= 1) {
          clearInterval(interval)
          // タイムアウトコールバックを呼び出す
          if (onTimeout) {
            onTimeout()
          }
          return 0
        }
        return prev - 1
      })
    }, 1000)
    
    return () => clearInterval(interval)
  }, [game.currentPlayerIndex, game.phase, game.timeoutSeconds])
  
  // UI表示
  return (
    <div className="w-full px-2 py-2 bg-gray-800/50 backdrop-blur-sm">
      <div className="flex items-center justify-between">
        <div className="text-sm font-medium text-white">
          {isMyTurn ? "あなたのターン" : `${currentPlayer.userName}のターン`}
        </div>
        <div className={`text-sm font-bold ${countdown <= 5 ? 'text-red-500 animate-pulse' : 'text-white'}`}>
          {countdown}s
        </div>
      </div>
    </div>
  )
}
```

---

### 2. `poker-table.tsx`

**役割:** `onTimeout`プロップを受け取り、`TimeoutIndicator`に渡す

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
    onTimeout={onTimeout}  // 渡す
  />
}
```

---

### 3. `chat-room-dual-mode.tsx`

**役割:** タイムアウト時の処理を実装

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
  onTimeout={handleTimeout}  // 渡す
/>
```

---

### 4. `poker-timeout.ts`

**役割:** タイムアウト時の自動フォールド処理

```typescript
import {
  collection,  // 正しいインポート
  doc,
  getDoc,
  updateDoc,
  serverTimestamp,
} from "firebase/firestore"
import { getDb } from "./firebase"
import type { PokerGameState } from "@/types/poker"
import { removeUndefined } from "./poker-logic/firestore-utils"
import { checkAndAdvancePhase } from "./poker-game-advanced"  // 追加

export const handlePlayerTimeout = async (
  storeId: string,
  gameId: string,
  userId: string
): Promise<void> => {
  const gameCollection = getPokerGameCollection(storeId)
  const gameDoc = doc(gameCollection, gameId)
  const gameSnap = await getDoc(gameDoc)
  
  if (!gameSnap.exists()) {
    throw new Error("Game not found")
  }
  
  const gameData = gameSnap.data() as PokerGameState
  
  // 現在のプレイヤーがタイムアウトしたユーザーか確認
  const currentPlayer = gameData.players[gameData.currentPlayerIndex]
  if (currentPlayer?.userId !== userId) {
    return
  }
  
  // 既にフォールド済みまたはオールインの場合は何もしない
  if (currentPlayer.isFolded || currentPlayer.isAllIn) {
    return
  }
  
  console.log(`Player ${currentPlayer.userName} timed out, auto-folding...`)
  
  // プレイヤーをフォールド状態に更新
  const updatedPlayers = gameData.players.map(p => {
    if (p.userId === userId) {
      return {
        ...p,
        isFolded: true,
        lastAction: "fold" as const,
        consecutiveTimeouts: (p.consecutiveTimeouts || 0) + 1
      }
    }
    return p
  })
  
  // アクション履歴に追加
  const newHistoryEntry = {
    playerName: currentPlayer.userName,
    action: "fold" as const,
    phase: gameData.phase,
    timestamp: new Date()
  }
  
  const updatedHistory = [...(gameData.actionHistory || []), newHistoryEntry]
  
  // 次のプレイヤーに進む
  let nextPlayerIndex = (gameData.currentPlayerIndex + 1) % gameData.players.length
  let attempts = 0
  const maxAttempts = gameData.players.length
  
  while (
    attempts < maxAttempts &&
    (updatedPlayers[nextPlayerIndex].isFolded || updatedPlayers[nextPlayerIndex].isAllIn)
  ) {
    nextPlayerIndex = (nextPlayerIndex + 1) % gameData.players.length
    attempts++
  }
  
  // ゲーム状態を更新
  await updateDoc(gameDoc, removeUndefined({
    players: updatedPlayers,
    currentPlayerIndex: nextPlayerIndex,
    actionHistory: updatedHistory,
    turnStartTime: new Date(),
    updatedAt: serverTimestamp(),
  }))
  
  // フェーズ進行をチェック（1人だけ残った場合など）
  await checkAndAdvancePhase(storeId, gameId)  // 追加
  
  // 2回連続タイムアウトの場合、強制退席
  const timedOutPlayer = updatedPlayers.find(p => p.userId === userId)
  if (timedOutPlayer && (timedOutPlayer.consecutiveTimeouts || 0) >= 2) {
    console.log(`Player ${timedOutPlayer.userName} has 2 consecutive timeouts, forcing leave...`)
    
    const playersAfterRemoval = updatedPlayers.filter(p => p.userId !== userId)
    
    await updateDoc(gameDoc, removeUndefined({
      players: playersAfterRemoval,
      updatedAt: serverTimestamp(),
    }))
  }
}
```

---

## 🔍 動作フロー

### 正常フロー

1. **ターン開始**
   - `TimeoutIndicator`が30秒からカウントダウン開始
   - 画面に「あなたのターン 30s」と表示

2. **カウントダウン進行**
   - 1秒ごとに減少（30s → 29s → 28s...）
   - 5秒以下で赤色点滅

3. **タイムアウト到達（0秒）**
   - `TimeoutIndicator`が`onTimeout`コールバックを呼び出す
   - `chat-room-dual-mode.tsx`の`handleTimeout`が実行される

4. **自動フォールド処理**
   - `handlePlayerTimeout`が呼び出される
   - プレイヤーが`isFolded: true`に更新される
   - アクション履歴に「FOLD」が追加される
   - 次のプレイヤーに進む

5. **フェーズ進行チェック**
   - `checkAndAdvancePhase`が呼び出される
   - 1人だけ残っている場合、ショーダウンまたは勝者決定に進む

6. **勝者決定**
   - 残ったプレイヤーがWINになる
   - ポットを獲得

---

## 📊 テスト結果

### テストケース1: 通常のタイムアウト

**手順:**
1. 2人でゲームを開始
2. 自分のターンで何もアクションせずに30秒待つ

**期待結果:**
- ✅ カウントダウンが30s → 0sまで進む
- ✅ 0秒で自動的にフォールド
- ✅ 次のプレイヤーのターンに進む

---

### テストケース2: 1人だけ残る

**手順:**
1. 2人でゲームを開始
2. 片方がタイムアウトでフォールド

**期待結果:**
- ✅ 残った方が自動的にWINになる
- ✅ ポットを獲得
- ✅ 次のハンドに進む

---

### テストケース3: 2回連続タイムアウト

**手順:**
1. 同じプレイヤーが2回連続でタイムアウト

**期待結果:**
- ✅ 2回目のタイムアウト後、強制退席
- ✅ ゲームから削除される

---

## 🎯 完成した全機能

1. ✅ **30秒カウントダウン表示** - 正しく動作
2. ✅ **タイムアウト時の自動フォールド** - 完全に動作
3. ✅ **1人残った場合の自動WIN** - 完全に動作
4. ✅ **2回連続タイムアウトで強制退席** - 実装済み
5. ✅ **ポットベットボタンの色改善** - 青色背景に白文字
6. ✅ **ベット額入力の文字色改善** - 白色太字
7. ✅ **リセットボタン** - 開発用に実装

---

## 📝 今後の改善案（オプション）

### 優先度: 低

1. **タイムアウト警告音**
   - 5秒前に警告音を鳴らす

2. **タイムアウト統計**
   - プレイヤーごとのタイムアウト回数を記録・表示

3. **タイムアウト時間の設定**
   - ゲームごとにタイムアウト時間を変更可能に（例：15秒、30秒、60秒）

4. **タイムバンク機能**
   - プレイヤーが追加の考慮時間を使用できる機能

---

## 🔧 技術的な詳細

### アーキテクチャ

**コールバックチェーン:**
```
TimeoutIndicator (0秒到達)
  ↓ onTimeout()
PokerTable (プロップを中継)
  ↓ onTimeout()
ChatRoomDualMode (handleTimeout)
  ↓ handlePlayerTimeout()
poker-timeout.ts (自動フォールド処理)
  ↓ updateDoc()
Firestore (ゲーム状態更新)
  ↓ checkAndAdvancePhase()
poker-game-advanced.ts (フェーズ進行)
  ↓ 勝者決定
```

### データフロー

1. **ローカルstate** - カウントダウン表示（クライアント側）
2. **Firestore** - ゲーム状態管理（サーバー側）
3. **リアルタイム同期** - `onSnapshot`でゲーム状態を監視

### セキュリティ

1. **自分のターンかどうかを確認**
   - 他のプレイヤーのタイムアウトは処理しない

2. **既にフォールド済みかどうかを確認**
   - 重複処理を防ぐ

3. **エラーハンドリング**
   - Firestoreエラーを適切に処理

---

**レポート作成者:** Manus AI  
**最終更新:** 2025年12月17日
