# オールインフリーズ問題の修正

## 問題の説明

プレイヤーAがオールイン → プレイヤーBもオールイン → ゲームがフリーズして進まなくなる

## 根本原因

1. **無限ループの可能性**: `advancePhase`関数で次のプレイヤーを探す際、全員がオールインまたはフォールドの場合に無限ループに陥る可能性があった
2. **自動進行の欠如**: 全員がオールインした後、次のフェーズに進んでも再度`checkAndAdvancePhase`が呼ばれないため、ショーダウンまで自動進行しない

## 実施した修正

### 1. 無限ループ防止 (`poker-game-advanced.ts` 146-162行目)

```typescript
// Find first active player after dealer
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

// If all players are folded or all-in, keep current index (no actions needed)
if (loopCount >= maxLoops) {
  nextPlayerIndex = gameData.currentPlayerIndex
}
```

**効果**: ループカウンターを追加することで、全員がオールインまたはフォールドの場合でも無限ループを防止

### 2. 自動進行処理 (`poker-game-advanced.ts` 174-179行目)

```typescript
// If all remaining players are all-in, continue advancing automatically
const actionablePlayers = updatedPlayers.filter(p => !p.isFolded && !p.isAllIn)
if (actionablePlayers.length === 0) {
  // Recursively advance to next phase
  await checkAndAdvancePhase(storeId, gameId)
}
```

**効果**: 全員がオールインの場合、自動的に次のフェーズに進み、ショーダウンまで連続して進行

## 動作フロー

### 修正前
1. プレイヤーAがオールイン → プレイヤーBにターン移動
2. プレイヤーBもオールイン → `isRoundComplete`が`true`を返す
3. `advancePhase`が呼ばれてフロップが開く
4. **次のプレイヤーを探すwhileループが無限ループ** → フリーズ

### 修正後
1. プレイヤーAがオールイン → プレイヤーBにターン移動
2. プレイヤーBもオールイン → `isRoundComplete`が`true`を返す
3. `advancePhase`が呼ばれてフロップが開く
4. ループカウンターにより無限ループを防止
5. アクション可能なプレイヤーが0人 → `checkAndAdvancePhase`を再帰呼び出し
6. ターン、リバー、ショーダウンまで自動進行 ✅

## デプロイ情報

- **コミット**: `d3fdab6` - "Fix all-in freeze: auto-advance when all players are all-in"
- **デプロイ先**: Vercel (https://stackmankai-zeta.vercel.app)
- **デプロイ状態**: プッシュ完了、Vercelが自動ビルド中

## テスト方法

1. 2人のプレイヤーでゲームを開始
2. プレイヤーAがオールイン
3. プレイヤーBもオールイン
4. **期待される動作**: フロップ、ターン、リバーが自動的に開かれ、ショーダウンまで進む
5. **以前の問題**: ステップ3の後にフリーズ

## 注意事項

- この修正は`poker-game-advanced.ts`のみに適用
- `poker-game.ts`の`performAction`関数も同様のループロジックを持っているが、そちらは既に修正済み（前回のコミット）
- 再帰呼び出しを使用しているため、理論上は無限再帰の可能性があるが、`isRoundComplete`と`advancePhase`のロジックにより、必ずショーダウンで停止する

## 関連ファイル

- `/home/ubuntu/stackmankai/lib/poker-game-advanced.ts` - メイン修正ファイル
- `/home/ubuntu/stackmankai/lib/poker-game.ts` - 前回修正済み
