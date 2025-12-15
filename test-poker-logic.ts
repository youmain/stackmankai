// ポーカーロジックのテストスクリプト
import { Deck } from "./lib/poker-logic/deck"
import { HandEvaluator } from "./lib/poker-logic/hand-evaluator"
import { initializeGame, dealCards, dealFlop, dealTurn, dealRiver, determineWinners } from "./lib/poker-logic/game-helpers"
import { cardToString } from "./lib/poker-logic/card"
import { HandRankType } from "./lib/poker-logic/types"

console.log("=".repeat(60))
console.log("ポーカーロジック テスト開始")
console.log("=".repeat(60))

// テスト1: デッキのシャッフルとカード配布
console.log("\n【テスト1】デッキのシャッフルとカード配布")
console.log("-".repeat(60))
const deck1 = new Deck()
console.log(`✓ デッキ作成: ${deck1.remaining()}枚`)
deck1.shuffle()
console.log(`✓ シャッフル完了`)
const cards = deck1.dealMultiple(7)
console.log(`✓ 7枚配布: ${cards.map(cardToString).join(", ")}`)
console.log(`✓ 残り: ${deck1.remaining()}枚`)

// テスト2: ハンド評価
console.log("\n【テスト2】ハンド評価")
console.log("-".repeat(60))
const evaluator = new HandEvaluator()

// テストケース1: ロイヤルフラッシュ
const royalFlush = [
  { suit: "hearts" as const, rank: "A" as const },
  { suit: "hearts" as const, rank: "K" as const },
  { suit: "hearts" as const, rank: "Q" as const },
  { suit: "hearts" as const, rank: "J" as const },
  { suit: "hearts" as const, rank: "10" as const },
  { suit: "clubs" as const, rank: "2" as const },
  { suit: "diamonds" as const, rank: "3" as const },
]
const royalResult = evaluator.evaluateHand(royalFlush)
const rankNames = [
  "ハイカード",
  "ワンペア",
  "ツーペア",
  "スリーカード",
  "ストレート",
  "フラッシュ",
  "フルハウス",
  "フォーカード",
  "ストレートフラッシュ",
  "ロイヤルフラッシュ",
]
console.log(`カード: ${royalFlush.map(cardToString).join(", ")}`)
console.log(`✓ 判定: ${rankNames[royalResult.type]}`)
console.log(`  使用カード: ${royalResult.cards.map(cardToString).join(", ")}`)

// テストケース2: フォーカード
const fourOfAKind = [
  { suit: "hearts" as const, rank: "A" as const },
  { suit: "diamonds" as const, rank: "A" as const },
  { suit: "clubs" as const, rank: "A" as const },
  { suit: "spades" as const, rank: "A" as const },
  { suit: "hearts" as const, rank: "K" as const },
  { suit: "clubs" as const, rank: "2" as const },
  { suit: "diamonds" as const, rank: "3" as const },
]
const fourResult = evaluator.evaluateHand(fourOfAKind)
console.log(`\nカード: ${fourOfAKind.map(cardToString).join(", ")}`)
console.log(`✓ 判定: ${rankNames[fourResult.type]}`)
console.log(`  使用カード: ${fourResult.cards.map(cardToString).join(", ")}`)

// テストケース3: フルハウス
const fullHouse = [
  { suit: "hearts" as const, rank: "K" as const },
  { suit: "diamonds" as const, rank: "K" as const },
  { suit: "clubs" as const, rank: "K" as const },
  { suit: "spades" as const, rank: "Q" as const },
  { suit: "hearts" as const, rank: "Q" as const },
  { suit: "clubs" as const, rank: "2" as const },
  { suit: "diamonds" as const, rank: "3" as const },
]
const fullResult = evaluator.evaluateHand(fullHouse)
console.log(`\nカード: ${fullHouse.map(cardToString).join(", ")}`)
console.log(`✓ 判定: ${rankNames[fullResult.type]}`)
console.log(`  使用カード: ${fullResult.cards.map(cardToString).join(", ")}`)

// テスト3: ゲーム初期化
console.log("\n【テスト3】ゲーム初期化")
console.log("-".repeat(60))
const game = initializeGame(4, 10, 20, 1000)
const { game: initializedGame, deck } = dealCards(game)
console.log(`✓ プレイヤー数: ${initializedGame.players.length}人`)
console.log(`✓ ポット: ¥${initializedGame.pot}`)
console.log(`✓ 現在のベット: ¥${initializedGame.currentBet}`)
console.log(`✓ ディーラー: プレイヤー${initializedGame.dealerIndex + 1}`)
console.log(`✓ SB: プレイヤー${initializedGame.smallBlindIndex + 1} (¥${initializedGame.smallBlind})`)
console.log(`✓ BB: プレイヤー${initializedGame.bigBlindIndex + 1} (¥${initializedGame.bigBlind})`)

console.log("\nプレイヤーの手札:")
for (const player of initializedGame.players) {
  console.log(`  ${player.userName}: ${player.cards.map(cardToString).join(", ")} (スタック: ¥${player.stack})`)
}

// テスト4: フロップ、ターン、リバー
console.log("\n【テスト4】フロップ、ターン、リバー")
console.log("-".repeat(60))
dealFlop(deck, initializedGame)
console.log(`✓ フロップ: ${initializedGame.communityCards.map(cardToString).join(", ")}`)
console.log(`  フェーズ: ${initializedGame.phase}`)

dealTurn(deck, initializedGame)
console.log(`✓ ターン: ${initializedGame.communityCards.map(cardToString).join(", ")}`)
console.log(`  フェーズ: ${initializedGame.phase}`)

dealRiver(deck, initializedGame)
console.log(`✓ リバー: ${initializedGame.communityCards.map(cardToString).join(", ")}`)
console.log(`  フェーズ: ${initializedGame.phase}`)

// テスト5: ショーダウン
console.log("\n【テスト5】ショーダウン")
console.log("-".repeat(60))
const { winners, hands } = determineWinners(initializedGame)

console.log("各プレイヤーのハンド:")
for (const hand of hands) {
  const player = initializedGame.players[hand.seatIndex]
  console.log(`  ${player.userName}:`)
  console.log(`    手札: ${player.cards.map(cardToString).join(", ")}`)
  console.log(`    役: ${rankNames[hand.handRank.type]}`)
  console.log(`    最高の5枚: ${hand.handRank.cards.map(cardToString).join(", ")}`)
}

console.log(`\n✓ 勝者: ${winners.map(w => initializedGame.players[w].userName).join(", ")}`)

// テスト6: ランダムなゲームを複数回実行
console.log("\n【テスト6】ランダムゲーム（10回）")
console.log("-".repeat(60))
const rankCounts: Record<number, number> = {}
for (let i = 0; i < 10; i++) {
  const testDeck = new Deck()
  testDeck.shuffle()
  const testCards = testDeck.dealMultiple(7)
  const result = evaluator.evaluateHand(testCards)
  rankCounts[result.type] = (rankCounts[result.type] || 0) + 1
}

console.log("役の出現回数:")
for (const [rank, count] of Object.entries(rankCounts).sort((a, b) => Number(b[0]) - Number(a[0]))) {
  console.log(`  ${rankNames[Number(rank)]}: ${count}回`)
}

console.log("\n" + "=".repeat(60))
console.log("✅ 全テスト完了")
console.log("=".repeat(60))
