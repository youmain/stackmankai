# オールイン対オールイン フリーズ問題 - 最終修正レポート

## 問題の詳細

**症状**: プレイヤーAがオールイン → プレイヤーBもオールイン → ゲームがフリーズして進まない

## 根本原因の特定

### 原因1: Firestoreキャッシュによる古いデータの読み取り

`performAction`関数の処理フロー：

```typescript
// 1. Firestoreからゲームデータを読み取る
const gameData = gameSnap.data() as PokerGameState

// 2. ローカルでデータを変更（例: player.isAllIn = true）
player.isAllIn = true

// 3. Firestoreに更新を書き込む
await updateDoc(gameDoc, { players: gameData.players, ... })

// 4. すぐにcheckAndAdvancePhaseを呼び出す
await checkAndAdvancePhase(storeId, gameId)

// 5. checkAndAdvancePhase内で再度Firestoreから読み取る
const gameSnap = await getDoc(gameDoc)  // ← ここで古いデータを読む可能性！
```

**問題点**:
- Firestoreの`updateDoc`は非同期で、更新が完全に反映されるまでに時間がかかる
- 同じ関数内で連続して`updateDoc` → `getDoc`を実行すると、キャッシュにより古いデータを読み取る可能性がある
- 特に、プレイヤーBがオールインした直後、`checkAndAdvancePhase`が**プレイヤーBの`isAllIn`がまだ`false`の状態**を読み取る可能性がある

### 原因2: 無限ループの可能性（既に修正済み）

`advancePhase`関数で次のプレイヤーを探す際、ループカウンターがなかったため、全員がオールインの場合に無限ループに陥る可能性があった。

## 実施した修正

### 修正1: 更新済みデータを直接渡す ⭐ **メイン修正**

**`poker-game.ts` (performAction関数)**

```typescript
// データベース更新後、更新済みのゲームデータを作成
const updatedGameData: PokerGameState = {
  ...gameData,
  pot: newPot,
  currentBet: newCurrentBet,
  currentPlayerIndex: nextPlayerIndex,
  actionHistory: actionHistory,
}

// 更新済みデータを直接渡す
await checkAndAdvancePhase(storeId, gameId, updatedGameData)
```

**`poker-game-advanced.ts` (checkAndAdvancePhase関数)**

```typescript
export const checkAndAdvancePhase = async (
  storeId: string,
  gameId: string,
  providedGameData?: PokerGameState  // ← 新しいパラメータ
): Promise<void> => {
  let gameData: PokerGameState
  
  if (providedGameData) {
    // 提供されたデータを使用（Firestoreから読み取らない）
    gameData = providedGameData
  } else {
    // 通常通りFirestoreから読み取る
    const gameSnap = await getDoc(gameDoc)
    gameData = gameSnap.data() as PokerGameState
  }
  
  // 以降の処理は同じ
}
```

**効果**:
- Firestoreのキャッシュ問題を完全に回避
- `performAction`で変更した最新の状態が確実に`checkAndAdvancePhase`に渡される
- プレイヤーBがオールインした直後、正しく`isAllIn = true`の状態で判定される

### 修正2: 無限ループ防止（前回修正）

**`poker-game-advanced.ts` (advancePhase関数)**

```typescript
let nextPlayerIndex = (gameData.dealerIndex + 1) % gameData.players.length
let loopCount = 0
const maxLoops = gameData.players.length

while (
  loopCount < maxLoops &&
  (gameData.players[nextPlayerIndex].isFolded || gameData.players[nextPlayerIndex].isAllIn)
) {
  nextPlayerIndex = (nextPlayerIndex + 1) % gameData.players.length
  loopCount++
}

if (loopCount >= maxLoops) {
  nextPlayerIndex = gameData.currentPlayerIndex
}
```

### 修正3: 自動進行処理（前回修正）

**`poker-game-advanced.ts` (advancePhase関数)**

```typescript
// フェーズ更新後、アクション可能なプレイヤーがいない場合は自動的に次へ
const actionablePlayers = updatedPlayers.filter(p => !p.isFolded && !p.isAllIn)
if (actionablePlayers.length === 0) {
  await checkAndAdvancePhase(storeId, gameId)
}
```

### 修正4: デバッグログ追加

詳細なログを追加して、問題の診断を容易にしました：

- `isRoundComplete`: ラウンド完了判定の詳細
- `checkAndAdvancePhase`: 呼び出しタイミングと判定結果
- プレイヤーの状態（isFolded, isAllIn, currentBet, lastAction）

## 期待される動作フロー

### 修正後のシナリオ

1. **プレイヤーAがオールイン**
   - `player.isAllIn = true`に設定
   - 次のプレイヤー（プレイヤーB）を探す
   - データベース更新
   - `checkAndAdvancePhase`呼び出し → アクション可能なプレイヤーがいるので待機

2. **プレイヤーBがオールイン**
   - `player.isAllIn = true`に設定
   - 次のプレイヤーを探す → 全員オールイン → `currentPlayerIndex`を維持
   - データベース更新
   - **更新済みデータを直接`checkAndAdvancePhase`に渡す** ✅
   - `isRoundComplete`が`true`を返す（actionablePlayers.length === 0）
   - `advancePhase`が呼ばれてフロップが開く

3. **フロップ後**
   - 全員オールイン → アクション可能なプレイヤーが0人
   - 自動的に`checkAndAdvancePhase`を再帰呼び出し
   - `advancePhase`が呼ばれてターンが開く

4. **ターン後**
   - 同様に自動進行
   - `advancePhase`が呼ばれてリバーが開く

5. **リバー後**
   - 同様に自動進行
   - `evaluateShowdown`が呼ばれてショーダウン ✅

## デプロイ情報

### コミット履歴

1. `d3fdab6` - "Fix all-in freeze: auto-advance when all players are all-in"
   - 無限ループ防止 + 自動進行処理

2. `27253ec` - "Add debug logs to diagnose all-in freeze issue"
   - デバッグログ追加

3. `24e1fa7` - "Fix: Pass updated game data directly to checkAndAdvancePhase to avoid stale reads" ⭐
   - **メイン修正**: Firestoreキャッシュ問題の解決

### デプロイ先

- **URL**: https://stackmankai-zeta.vercel.app
- **状態**: Vercel自動デプロイ完了待ち

## テスト方法

1. ポーカーゲームを2人で開始
2. プリフロップでプレイヤーAがオールイン
3. プレイヤーBもオールイン
4. **期待される結果**: 
   - フロップ、ターン、リバーが連続して自動的に開かれる
   - ショーダウンで勝者が決定される
   - フリーズしない ✅

## ブラウザコンソールでの確認

デバッグログが出力されるので、以下を確認してください：

```
[isRoundComplete] Check: { phase: "preflop", ... }
[isRoundComplete] Actionable players: 0
[isRoundComplete] No actionable players, round complete
[checkAndAdvancePhase] Called: { phase: "preflop", ... }
[checkAndAdvancePhase] Round complete? true
[checkAndAdvancePhase] Advancing phase...
[isRoundComplete] Check: { phase: "flop", ... }
...
```

## 技術的な学び

### Firestoreの非同期性

- `updateDoc`は更新リクエストを送信するが、即座に他のクライアントが最新データを読み取れるわけではない
- 同じ関数内で`updateDoc` → `getDoc`を連続実行すると、キャッシュにより古いデータを読む可能性がある
- **解決策**: 更新したデータをローカルで保持し、必要に応じて直接渡す

### 再帰呼び出しの注意点

- `advancePhase`内で`checkAndAdvancePhase`を再帰呼び出ししているが、`isRoundComplete`と`advancePhase`のロジックにより、必ずショーダウンで停止するため安全
- ただし、無限再帰を防ぐため、各ステップで適切な終了条件を設けることが重要

## 関連ファイル

- `/home/ubuntu/stackmankai/lib/poker-game.ts` - `performAction`関数の修正
- `/home/ubuntu/stackmankai/lib/poker-game-advanced.ts` - `checkAndAdvancePhase`, `advancePhase`, `isRoundComplete`の修正
