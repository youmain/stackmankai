# カードアニメーション演出の追加

## 実装内容

全員がオールインした際のカード公開に、適切な遅延とアニメーションを追加しました。

## 変更点

### 1. サーバーサイド: 自動進行の遅延 (`poker-game-advanced.ts`)

```typescript
// If all remaining players are all-in, continue advancing automatically
const actionablePlayers = updatedPlayers.filter(p => !p.isFolded && !p.isAllIn)
if (actionablePlayers.length === 0) {
  // Add delay before auto-advancing to next phase for better UX
  let delay = 0
  
  switch (newPhase) {
    case "flop":
      // Flop: 3 cards revealed at 0.5s intervals = 1.5s total
      // Add extra 0.5s for the last card to be visible
      delay = 2000 // 2 seconds
      break
    case "turn":
      // Turn: 2 seconds after flop
      delay = 2000
      break
    case "river":
      // River: 3 seconds after turn
      delay = 3000
      break
    default:
      delay = 0
  }
  
  console.log(`[advancePhase] Auto-advancing after ${delay}ms delay (phase: ${newPhase})`)
  
  // Wait before advancing to next phase
  await new Promise(resolve => setTimeout(resolve, delay))
  
  // Recursively advance to next phase
  await checkAndAdvancePhase(storeId, gameId)
}
```

**効果:**
- フロップ表示後、2秒待ってからターンに進む
- ターン表示後、2秒待ってからリバーに進む
- リバー表示後、3秒待ってからショーダウンに進む

### 2. クライアントサイド: カードの段階的表示 (`poker-table.tsx`)

```typescript
const [visibleCommunityCards, setVisibleCommunityCards] = useState<number>(0)

// コミュニティカードの段階的表示
useEffect(() => {
  if (!game) return
  
  const totalCards = game.communityCards.length
  
  // フロップ（3枚）の場合: 0.5秒ずつ表示
  if (game.phase === "flop" && totalCards === 3) {
    setVisibleCommunityCards(0)
    setTimeout(() => setVisibleCommunityCards(1), 0)
    setTimeout(() => setVisibleCommunityCards(2), 500)
    setTimeout(() => setVisibleCommunityCards(3), 1000)
  }
  // ターン（4枚目）の場合: すぐに表示
  else if (game.phase === "turn" && totalCards === 4) {
    setVisibleCommunityCards(4)
  }
  // リバー（5枚目）の場合: すぐに表示
  else if (game.phase === "river" && totalCards === 5) {
    setVisibleCommunityCards(5)
  }
  // その他の場合: 全て表示
  else {
    setVisibleCommunityCards(totalCards)
  }
}, [game?.phase, game?.communityCards.length])
```

**効果:**
- フロップ: 1枚目が即座に表示 → 0.5秒後に2枚目 → 1秒後に3枚目
- ターン・リバー: 即座に表示（サーバー側で遅延済み）

### 3. UI: カードの表示とアニメーション

```tsx
{game.communityCards.map((card, idx) => (
  idx < visibleCommunityCards ? (
    <CardDisplay key={`card-${idx}`} card={card} size="normal" animate={true} />
  ) : (
    <div key={`empty-${idx}`} className="w-12 h-16 border-2 border-dashed border-white/30 rounded" />
  )
))}
```

**効果:**
- まだ表示されていないカードは点線の枠で表示
- 表示されるカードには`dealCard`アニメーション（0.5秒）が適用される

## タイムライン

### オールイン後の自動進行

```
プリフロップ: 両プレイヤーがオールイン
    ↓
フロップ: 3枚のカードが開かれる
    ├─ 0.0秒: 1枚目表示（アニメーション0.5秒）
    ├─ 0.5秒: 2枚目表示（アニメーション0.5秒）
    └─ 1.0秒: 3枚目表示（アニメーション0.5秒）
    ↓ 2秒待機
ターン: 4枚目のカードが開かれる
    └─ 即座に表示（アニメーション0.5秒）
    ↓ 2秒待機
リバー: 5枚目のカードが開かれる
    └─ 即座に表示（アニメーション0.5秒）
    ↓ 3秒待機
ショーダウン: 勝者決定
```

### 合計時間

- フロップ表示: 1.5秒（3枚 × 0.5秒）
- フロップ待機: 2秒
- ターン表示: 0.5秒
- ターン待機: 2秒
- リバー表示: 0.5秒
- リバー待機: 3秒
- **合計: 約10秒**

## 既存のアニメーション

`animations.css`に定義されている`dealCard`アニメーション：

```css
@keyframes dealCard {
  from {
    opacity: 0;
    transform: translateY(-100px) scale(0.5) rotate(-10deg);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1) rotate(0deg);
  }
}

.card-deal {
  animation: dealCard 0.5s ease-out forwards;
}
```

**効果:**
- カードが上から降りてくるように表示される
- 回転しながらスケールアップ
- 0.5秒のアニメーション

## テスト方法

1. 2人でポーカーゲーム開始
2. プリフロップで両プレイヤーがオールイン
3. **期待される動作:**
   - フロップの3枚が0.5秒ずつ順番に開く
   - 2秒後にターンが開く
   - 2秒後にリバーが開く
   - 3秒後にショーダウン

## デプロイ情報

- **コミット**: `58c2fe4` - "Add card reveal animation delays: flop 0.5s intervals, turn 2s, river 3s"
- **URL**: https://stackmankai-zeta.vercel.app
- **変更ファイル**:
  - `lib/poker-game-advanced.ts` - サーバー側の遅延処理
  - `components/poker/poker-table.tsx` - クライアント側のカード表示制御

## 今後の改善案

1. **カスタマイズ可能な遅延**: 管理者が遅延時間を設定できるようにする
2. **スキップ機能**: ユーザーがアニメーションをスキップできるボタンを追加
3. **サウンド効果**: カードが開かれる際の効果音を追加
4. **より洗練されたアニメーション**: カードが裏返る（flip）アニメーションを追加
