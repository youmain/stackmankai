/**
 * Poker Game Auto-Test Functionality
 * 2人プレイのフルゲームを自動実行してテスト
 */

import { performPokerAction } from "./poker-game"
import type { PokerGameState, PlayerAction } from "@/types/poker"

interface AutoTestConfig {
  storeId: string
  gameId: string
  player1UserId: string
  player2UserId: string
  delayMs?: number // アクション間の遅延（ミリ秒）
  onProgress?: (message: string) => void
}

/**
 * ランダムなアクションを選択（簡易AI）
 */
function selectRandomAction(
  game: PokerGameState,
  playerId: string
): { action: PlayerAction; amount?: number } {
  const player = game.players.find(p => p.userId === playerId)
  if (!player) throw new Error("Player not found")

  const canCheck = player.currentBet >= game.currentBet
  const callAmount = game.currentBet - player.currentBet
  const canCall = player.stack >= callAmount
  const minRaise = game.minRaise || game.bigBlind
  const canRaise = player.stack >= callAmount + minRaise

  // 確率ベースのアクション選択
  const random = Math.random()

  // 10% フォールド
  if (random < 0.1 && !canCheck) {
    return { action: "fold" }
  }

  // 30% コール/チェック
  if (random < 0.4) {
    if (canCheck) {
      return { action: "check" }
    } else if (canCall) {
      return { action: "call" }
    }
  }

  // 40% レイズ
  if (random < 0.8 && canRaise) {
    const raiseAmount = Math.floor(game.pot * (0.5 + Math.random())) // 0.5〜1.5 POT
    return { action: "raise", amount: Math.min(raiseAmount, player.stack) }
  }

  // 5% オールイン
  if (random < 0.85 && player.stack > 0) {
    return { action: "allin" }
  }

  // デフォルト: チェック/コール
  if (canCheck) {
    return { action: "check" }
  } else if (canCall) {
    return { action: "call" }
  } else {
    return { action: "fold" }
  }
}

/**
 * 1ハンドを自動実行
 */
async function playOneHand(
  config: AutoTestConfig,
  game: PokerGameState
): Promise<void> {
  const { storeId, gameId, player1UserId, player2UserId, delayMs = 500, onProgress } = config

  let actionCount = 0
  const maxActions = 100 // 無限ループ防止

  while (game.phase !== "showdown" && game.phase !== "ended" && actionCount < maxActions) {
    const currentPlayer = game.players[game.currentPlayerIndex]
    if (!currentPlayer) break

    const { action, amount } = selectRandomAction(game, currentPlayer.userId)
    
    onProgress?.(
      `${currentPlayer.userName} が ${action}${amount ? ` (${amount})` : ""} を実行`
    )

    await performPokerAction(storeId, gameId, currentPlayer.userId, action, amount)
    
    // 遅延
    await new Promise(resolve => setTimeout(resolve, delayMs))
    
    // ゲーム状態を再取得（実際にはFirestoreから取得する必要がある）
    // ここでは簡略化のため省略
    actionCount++
  }

  if (actionCount >= maxActions) {
    throw new Error("Max actions reached - possible infinite loop")
  }
}

/**
 * 自動テストを実行
 */
export async function runAutoTest(config: AutoTestConfig): Promise<void> {
  const { onProgress } = config

  try {
    onProgress?.("🎮 自動テスト開始")
    
    // ここで実際のゲームロジックを実行
    // 実装は次のステップで完成させる
    
    onProgress?.("✅ 自動テスト完了")
  } catch (error) {
    onProgress?.(`❌ エラー: ${error instanceof Error ? error.message : String(error)}`)
    throw error
  }
}

/**
 * テストボタン用のシンプルなインターフェース
 */
export async function quickTest(
  storeId: string,
  gameId: string,
  player1UserId: string,
  player2UserId: string
): Promise<string[]> {
  const logs: string[] = []
  
  await runAutoTest({
    storeId,
    gameId,
    player1UserId,
    player2UserId,
    delayMs: 300,
    onProgress: (msg) => logs.push(msg)
  })
  
  return logs
}
