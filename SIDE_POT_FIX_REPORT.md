# サイドポット計算の修正レポート

## 🔍 発見された問題

### 問題1: `currentBet`のリセットによるサイドポット計算の失敗

**症状:**
異なる額でオールインした場合、ショーダウン時にサイドポットが正しく計算されない。

**原因:**
```typescript
// advancePhase関数（158-162行目）
const updatedPlayers = gameData.players.map(p => ({
  ...p,
  currentBet: 0,  // ← フェーズ進行時にリセット
  lastAction: undefined,
}))
```

各フェーズ（プリフロップ→フロップ→ターン→リバー）に進む際、`currentBet`を0にリセットしていました。しかし、`calculateSidePots`関数は`currentBet`を使用してサイドポットを計算するため、ショーダウン時に全員の`currentBet = 0`となり、サイドポットが計算できませんでした。

### テストケースでの確認

**シナリオ:**
- プリフロップ: Player A = 5,000, Player B = 10,000, Player C = 15,000
- フロップに進む: 全員の`currentBet = 0`にリセット
- ショーダウン: サイドポット計算 → **失敗**（ポット数 = 0）

```bash
$ npx tsx test-side-pot-bug.ts
Calculated pots:
  ❌ ERROR: No pots calculated!
  This is because currentBet was reset to 0 for all players.
```

## ✅ 実装した解決策

### Solution: `totalBet`フィールドの追加

各プレイヤーに**ハンド全体での累積ベット額**を記録する`totalBet`フィールドを追加しました。

#### 1. 型定義の更新 (`types/poker.ts`)

```typescript
export interface PokerPlayer {
  userId: string
  userName: string
  seatIndex: number
  stack: number
  currentBet: number // Current betting round bet amount
  totalBet?: number  // Total bet amount for the entire hand ← 新規追加
  cards: Card[]
  isFolded: boolean
  isAllIn: boolean
  isActive: boolean
  lastAction?: PlayerAction
  consecutiveTimeouts?: number
}
```

#### 2. サイドポット計算の修正 (`lib/poker-logic/side-pot.ts`)

```typescript
export function calculateSidePots(players: PokerPlayer[]): Pot[] {
  // Use totalBet if available, otherwise use currentBet
  const playersWithBets = players
    .map((player, index) => ({ player, index }))
    .filter(({ player }) => (player.totalBet ?? player.currentBet) > 0)
    .sort((a, b) => 
      (a.player.totalBet ?? a.player.currentBet) - 
      (b.player.totalBet ?? b.player.currentBet)
    )
  
  // ... 計算ロジック内でも totalBet ?? currentBet を使用
}
```

#### 3. アクション時の`totalBet`更新 (`lib/poker-game.ts`)

```typescript
case "call":
  const callAmount = gameData.currentBet - player.currentBet
  player.stack -= callAmount
  player.currentBet += callAmount
  player.totalBet = (player.totalBet || 0) + callAmount  // ← 累積
  newPot += callAmount
  break

case "bet":
case "raise":
  player.stack -= amount
  player.currentBet += amount
  player.totalBet = (player.totalBet || 0) + amount  // ← 累積
  newPot += amount
  break

case "allin":
  const allinAmount = player.stack
  player.stack = 0
  player.currentBet += allinAmount
  player.totalBet = (player.totalBet || 0) + allinAmount  // ← 累積
  player.isAllIn = true
  newPot += allinAmount
  break
```

#### 4. 新しいハンド開始時の`totalBet`リセット (`lib/poker-game-advanced.ts`)

```typescript
// startNextHand関数
const updatedPlayers = activePlayers.map(player => ({
  ...player,
  cards: deck.dealMultiple(2),
  currentBet: 0,
  totalBet: 0,  // ← 新しいハンドでリセット
  isFolded: false,
  isAllIn: false,
  isActive: true,
  lastAction: undefined,
}))

// ブラインド投入時にtotalBetを初期化
if (sbPlayer) {
  const sbAmount = Math.min(sbPlayer.stack, gameData.smallBlind)
  sbPlayer.currentBet = sbAmount
  sbPlayer.totalBet = sbAmount  // ← 初期化
  sbPlayer.stack -= sbAmount
}
```

## 📊 テスト結果

### 修正後のテスト

```bash
$ npx tsx test-side-pot-fixed.ts

=== Test: Side Pot with totalBet (After Phase Advance) ===
Player states after phase advance:
  Player A: currentBet = 0, totalBet = 5000, isAllIn = true
  Player B: currentBet = 0, totalBet = 10000, isAllIn = true
  Player C: currentBet = 0, totalBet = 15000, isAllIn = true

Calculated pots:
  Main Pot: 15,000 (Player A, Player B, Player C)
  Side Pot 1: 10,000 (Player B, Player C)
  Side Pot 2: 5,000 (Player C)

✅ SUCCESS: Side pots calculated correctly!
```

### 配分テスト

**Player C勝利の場合:**
```
Before: A=0, B=0, C=0
After:  A=0, B=0, C=30,000 ✅
```

**Player A勝利の場合:**
```
Before: A=0, B=0, C=0
After:  A=15,000, B=0, C=0 ✅
(Aはメインポットのみ獲得、サイドポットはB/Cで競争)
```

## 🎯 動作フロー

### 修正後の正しい動作

```
プリフロップ:
  Player A: 5,000オールイン
    → currentBet = 5000, totalBet = 5000
  Player B: 10,000オールイン
    → currentBet = 10000, totalBet = 10000
  Player C: 15,000オールイン
    → currentBet = 15000, totalBet = 15000

フロップに進む:
  全プレイヤー:
    → currentBet = 0 (リセット)
    → totalBet = 保持 (5000, 10000, 15000)

ターン、リバーに進む:
  全プレイヤー:
    → currentBet = 0 (維持)
    → totalBet = 保持 (5000, 10000, 15000)

ショーダウン:
  calculateSidePots(players)
    → totalBetを使用してサイドポット計算
    → Main Pot: 15,000 (全員)
    → Side Pot 1: 10,000 (B, C)
    → Side Pot 2: 5,000 (C)
  
  distributePots(pots, players, winners)
    → 各ポットを適格な勝者に配分
```

## 📋 テストケース一覧

### ケース1: 3人、異なる額でオールイン
- **Player A**: 5,000
- **Player B**: 10,000
- **Player C**: 15,000
- **期待されるポット**:
  - メインポット: 15,000 (全員)
  - サイドポット1: 10,000 (B, C)
  - サイドポット2: 5,000 (C)

### ケース2: Player C勝利
- **配分**: C = 30,000 (全ポット獲得)

### ケース3: Player A勝利
- **配分**: 
  - A = 15,000 (メインポットのみ)
  - サイドポット1, 2はB/Cで競争（役の強さで決定）

### ケース4: 2人、同額でオールイン
- **Player A**: 10,000
- **Player B**: 10,000
- **期待されるポット**: メインポット 20,000 (両者)
- **配分**: 引き分けの場合、各10,000

## 🚀 デプロイ情報

- **コミット**: `fa210cb` - "Fix side pot calculation: add totalBet field to track cumulative bets across phases"
- **URL**: https://stackmankai-zeta.vercel.app
- **変更ファイル**:
  - `types/poker.ts` - `totalBet`フィールド追加
  - `lib/poker-logic/side-pot.ts` - `totalBet`使用に変更
  - `lib/poker-game.ts` - アクション時に`totalBet`更新
  - `lib/poker-game-advanced.ts` - 新ハンド時に`totalBet`リセット

## 🧪 実際のゲームでのテスト方法

1. 3人以上でポーカーゲーム開始
2. プリフロップで異なる額でオールイン
   - 例: Player A = 5,000, Player B = 10,000, Player C = 15,000
3. フロップ、ターン、リバーが自動的に開かれる
4. ショーダウンで勝者表示を確認
5. **期待される結果**:
   - 勝者が正しいポット額を獲得
   - サイドポットが適切に配分される
   - コンソールログで各ポットの詳細を確認可能

## 📝 技術的な詳細

### なぜ`totalBet`が必要か

ポーカーでは、各ベッティングラウンド（プリフロップ、フロップ、ターン、リバー）で新しいベットが始まります。そのため、`currentBet`は各ラウンドでリセットされます。

しかし、サイドポット計算には**ハンド全体での累積ベット額**が必要です。プレイヤーAが5,000でオールインし、プレイヤーBが10,000でオールインした場合、ショーダウン時にこの情報が必要です。

### 後方互換性

`totalBet`はオプショナルフィールド（`totalBet?: number`）として定義されているため、既存のゲームデータには影響しません。`totalBet`が未定義の場合は`currentBet`にフォールバックします。

```typescript
player.totalBet ?? player.currentBet
```

これにより、既存のゲームでも動作し、新しいゲームでは正しくサイドポットが計算されます。

## ✅ まとめ

- **問題**: フェーズ進行時に`currentBet`がリセットされ、サイドポット計算が失敗
- **解決**: `totalBet`フィールドを追加して累積ベット額を追跡
- **テスト**: 複数のテストケースで正しい動作を確認
- **デプロイ**: 本番環境にプッシュ済み

これで、異なる額でオールインした場合のサイドポット計算と配分が正しく行われます！
