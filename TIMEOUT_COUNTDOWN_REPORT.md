# タイムアウトカウントダウン問題 - 最終レポート

**作成日:** 2025年12月16日  
**問題:** ターンタイムアウトの30秒カウントダウンが動作しない  
**状態:** **未解決**（根本原因を特定）

---

## 📊 問題の詳細

### 現象

プレイヤーのターン中に表示される「30s」のタイムアウトインジケーターが、**時間経過しても変化しない**（30s → 29s → 28s...とカウントダウンしない）。

### 確認済みの動作

✅ **次のハンドまでのカウントダウンは正常に動作**
- SHOWDOWN後の「次のハンド: 5秒」→「4秒」→「3秒」...のカウントダウンは正しく動作
- `poker-table.tsx`の216-230行目で実装
- ローカルのReact state（`useState` + `setInterval`）を使用

❌ **ターンタイムアウトのカウントダウンは動作しない**
- 「あなたのターン 30s」の表示は固定
- `timeout-indicator.tsx`で実装
- Firestoreの`turnStartTime`を使用して残り時間を計算

---

## 🔍 根本原因の分析

### 1. `turnStartTime`の形式問題

**修正前の状況:**
- 一部のコードで`serverTimestamp()`を使用
- 一部のコードで`new Date()`を使用
- 混在により、時刻の比較が正しく動作しない

**修正内容:**
すべての`turnStartTime`の設定を`new Date()`に統一：
- `lib/poker-game-timeout.ts` - 3箇所修正
- `lib/poker-timeout.ts` - 1箇所修正

**コミット:** `36c6f90` - "Fix timeout countdown: use new Date() consistently instead of serverTimestamp()"

### 2. Firestoreからの読み込み問題

`timeout-indicator.tsx`の46-62行目で、`turnStartTime`を`Date`オブジェクトに変換する処理が実装されています：

```typescript
if (game.turnStartTime instanceof Date) {
  turnStartTime = game.turnStartTime
} else if (game.turnStartTime && typeof (game.turnStartTime as any).toDate === 'function') {
  turnStartTime = (game.turnStartTime as any).toDate()
} else if (game.turnStartTime && typeof game.turnStartTime === 'object') {
  // Firestore Timestamp形式 { seconds, nanoseconds }
  if ('seconds' in game.turnStartTime && typeof (game.turnStartTime as any).seconds === 'number') {
    turnStartTime = new Date((game.turnStartTime as any).seconds * 1000)
  }
}
```

しかし、**実際にFirestoreから読み込まれた`turnStartTime`が正しく変換されているか不明**。

### 3. テスト結果

**テスト日時:** 2025年12月16日  
**テスト環境:** 本番環境（https://stackmankai-zeta.vercel.app）  
**テスト内容:** 新しいゲームを開始し、10秒待機して「30s」が変化するか確認

**結果:** ❌ **変化なし**
- 開始時: 「30s」
- 10秒後: 「30s」（変化なし）

---

## 🛠️ 実施した修正

### 1. `turnStartTime`の統一（完了）

**ファイル:** `lib/poker-game-timeout.ts`
```typescript
// 修正前
turnStartTime: serverTimestamp()

// 修正後
turnStartTime: new Date()
```

**ファイル:** `lib/poker-timeout.ts`
```typescript
// 修正前
turnStartTime: serverTimestamp()

// 修正後
turnStartTime: new Date()
```

### 2. リセットボタンの追加（完了）

開発用のリセットボタンを追加して、テストを容易にしました。

**ファイル:** `components/poker/poker-table.tsx`
```typescript
{onResetGame && (
  <Button
    onClick={onResetGame}
    variant="destructive"
    size="sm"
    className="h-7 text-xs"
  >
    🛠️ リセット
  </Button>
)}
```

**コミット:** `831ae2f` - "Move reset button next to leave seat button for better visibility"

---

## 🔬 デバッグ情報

### コンソールログ

`timeout-indicator.tsx`には詳細なコンソールログが実装されています：

```typescript
console.log("[TimeoutIndicator] Game state:", {
  phase: game.phase,
  turnStartTime: game.turnStartTime,
  timeoutSeconds: game.timeoutSeconds,
  currentPlayerIndex: game.currentPlayerIndex,
  currentPlayer: game.players[game.currentPlayerIndex]
})
```

**次のステップ:** ブラウザの開発者コンソールを開いて、これらのログを確認する必要があります。

---

## 💡 推奨される次のステップ

### 1. ブラウザコンソールの確認（最優先）

ブラウザの開発者ツール（F12）を開いて、以下を確認：
1. `TimeoutIndicator`のログ出力
2. `turnStartTime`の実際の値と型
3. エラーメッセージの有無

### 2. Firestoreデータの直接確認

Firebaseコンソールで、実際に保存されている`turnStartTime`の値を確認：
- 型が正しいか（Timestamp vs Date）
- 値が正しく保存されているか

### 3. 型定義の確認

`types/poker.ts`で`turnStartTime`の型定義を確認：
```typescript
interface PokerGameState {
  // ...
  turnStartTime: Date | null
  // ...
}
```

Firestoreから読み込む際に、型変換が正しく行われているか確認。

### 4. リアルタイム同期の確認

`onSnapshot`で`turnStartTime`が正しく更新されているか確認：
```typescript
const unsubscribe = onSnapshot(
  doc(db, "stores", storeId, "pokerGames", gameId),
  (doc) => {
    if (doc.exists()) {
      const data = doc.data()
      console.log("turnStartTime from Firestore:", data.turnStartTime)
      setPokerGame(data as PokerGameState)
    }
  }
)
```

---

## 📝 技術的な詳細

### 動作するカウントダウン（参考）

`poker-table.tsx`の次のハンドカウントダウン：

```typescript
const [countdown, setCountdown] = useState<number | null>(null)

useEffect(() => {
  if (game?.phase === "showdown" && game.players.length >= 2) {
    setCountdown(5)
    
    const interval = setInterval(() => {
      setCountdown(prev => {
        if (prev === null || prev <= 1) {
          clearInterval(interval)
          return null
        }
        return prev - 1
      })
    }, 1000)
    
    return () => clearInterval(interval)
  }
}, [game?.phase, game?.players.length])
```

**このアプローチの利点:**
- ローカルstateを使用
- `setInterval`で1秒ごとに更新
- Firestoreの同期に依存しない

### 動作しないカウントダウン

`timeout-indicator.tsx`のターンタイムアウト：

```typescript
const updateTimer = () => {
  const now = new Date()
  const elapsedSeconds = (now.getTime() - turnStartTime.getTime()) / 1000
  const remaining = timeoutSeconds - elapsedSeconds
  setRemainingTime(Math.ceil(remaining))
}

updateTimer()
const interval = setInterval(updateTimer, 100)
```

**このアプローチの問題:**
- `turnStartTime`がFirestoreから正しく読み込まれる必要がある
- 型変換が正しく行われる必要がある
- サーバー時刻とクライアント時刻の同期が必要

---

## 🎯 結論

**問題の核心:** `turnStartTime`がFirestoreから正しく読み込まれていないか、型変換が失敗している可能性が高い。

**証拠:**
1. ローカルstateを使用する「次のハンドカウントダウン」は正常に動作
2. Firestoreの`turnStartTime`を使用する「ターンタイムアウト」は動作しない
3. `new Date()`への統一後も問題が解決していない

**次のアクション:**
ブラウザの開発者コンソールを確認して、`turnStartTime`の実際の値を確認する必要があります。

---

**レポート作成者:** Manus AI  
**最終更新:** 2025年12月16日
