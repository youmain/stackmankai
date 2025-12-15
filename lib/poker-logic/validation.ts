/**
 * Validation and error handling for poker actions
 */

import type { PokerGameState, PokerPlayer, PlayerAction } from "@/types/poker"

export class PokerValidationError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "PokerValidationError"
  }
}

/**
 * Validate if a player can perform an action
 */
export function validatePlayerAction(
  game: PokerGameState,
  userId: string,
  action: PlayerAction,
  amount?: number
): void {
  // Find player
  const playerIndex = game.players.findIndex(p => p.userId === userId)
  if (playerIndex === -1) {
    throw new PokerValidationError("プレイヤーが見つかりません")
  }

  const player = game.players[playerIndex]

  // Check if it's player's turn
  if (playerIndex !== game.currentPlayerIndex) {
    throw new PokerValidationError("あなたのターンではありません")
  }

  // Check if player has already folded
  if (player.isFolded) {
    throw new PokerValidationError("既にフォールドしています")
  }

  // Check if player is all-in
  if (player.isAllIn) {
    throw new PokerValidationError("既にオールインしています")
  }

  // Check game phase
  if (game.phase === "waiting") {
    throw new PokerValidationError("ゲームが開始されていません")
  }

  if (game.phase === "showdown") {
    throw new PokerValidationError("ショーダウン中はアクションできません")
  }

  // Validate specific actions
  switch (action) {
    case "fold":
      // Fold is always allowed
      break

    case "check":
      if (player.currentBet < game.currentBet) {
        throw new PokerValidationError(
          `チェックできません。¥${(game.currentBet - player.currentBet).toLocaleString()}をコールする必要があります`
        )
      }
      break

    case "call":
      const callAmount = game.currentBet - player.currentBet
      if (callAmount <= 0) {
        throw new PokerValidationError("コールする必要がありません。チェックしてください")
      }
      if (callAmount > player.stack) {
        throw new PokerValidationError("スタックが不足しています。オールインしてください")
      }
      break

    case "bet":
      if (game.currentBet > 0) {
        throw new PokerValidationError("既にベットがあります。レイズしてください")
      }
      if (!amount || amount <= 0) {
        throw new PokerValidationError("ベット額を指定してください")
      }
      if (amount < game.minRaise) {
        throw new PokerValidationError(
          `最小ベット額は¥${game.minRaise.toLocaleString()}です`
        )
      }
      if (amount > player.stack) {
        throw new PokerValidationError("スタックが不足しています")
      }
      break

    case "raise":
      if (game.currentBet === 0) {
        throw new PokerValidationError("ベットがありません。ベットしてください")
      }
      if (!amount || amount <= 0) {
        throw new PokerValidationError("レイズ額を指定してください")
      }
      const totalRaise = game.currentBet - player.currentBet + amount
      if (amount < game.minRaise) {
        throw new PokerValidationError(
          `最小レイズ額は¥${game.minRaise.toLocaleString()}です`
        )
      }
      if (totalRaise > player.stack) {
        throw new PokerValidationError("スタックが不足しています")
      }
      break

    case "allin":
      if (player.stack <= 0) {
        throw new PokerValidationError("スタックがありません")
      }
      break

    default:
      throw new PokerValidationError(`不正なアクション: ${action}`)
  }
}

/**
 * Validate game state before starting a hand
 */
export function validateGameStart(game: PokerGameState): void {
  if (game.phase !== "waiting") {
    throw new PokerValidationError("ゲームは既に開始されています")
  }

  const activePlayers = game.players.filter(p => p.stack > 0)
  if (activePlayers.length < 2) {
    throw new PokerValidationError("最低2人のプレイヤーが必要です")
  }

  // Check if all players have enough chips for blinds
  const sbPlayer = game.players.find(p => p.seatIndex === game.smallBlindIndex)
  const bbPlayer = game.players.find(p => p.seatIndex === game.bigBlindIndex)

  if (!sbPlayer || sbPlayer.stack <= 0) {
    throw new PokerValidationError("スモールブラインドのプレイヤーにチップがありません")
  }

  if (!bbPlayer || bbPlayer.stack <= 0) {
    throw new PokerValidationError("ビッグブラインドのプレイヤーにチップがありません")
  }
}

/**
 * Validate seat selection
 */
export function validateSeatSelection(
  game: PokerGameState,
  userId: string,
  seatIndex: number,
  buyIn: number
): void {
  // Check if seat index is valid
  if (seatIndex < 0 || seatIndex >= 10) {
    throw new PokerValidationError("無効な座席番号です")
  }

  // Check if seat is already taken
  if (game.players.some(p => p.seatIndex === seatIndex)) {
    throw new PokerValidationError("この座席は既に使用されています")
  }

  // Check if player is already seated
  if (game.players.some(p => p.userId === userId)) {
    throw new PokerValidationError("既に座席に着いています")
  }

  // Check buy-in amount
  if (buyIn <= 0) {
    throw new PokerValidationError("バイイン額は0より大きい必要があります")
  }

  const minBuyIn = game.bigBlind * 20 // 20 big blinds minimum
  const maxBuyIn = game.bigBlind * 200 // 200 big blinds maximum

  if (buyIn < minBuyIn) {
    throw new PokerValidationError(
      `最小バイイン額は¥${minBuyIn.toLocaleString()}です`
    )
  }

  if (buyIn > maxBuyIn) {
    throw new PokerValidationError(
      `最大バイイン額は¥${maxBuyIn.toLocaleString()}です`
    )
  }
}

/**
 * Safe wrapper for async operations with error handling
 */
export async function withErrorHandling<T>(
  operation: () => Promise<T>,
  errorMessage: string = "操作に失敗しました"
): Promise<T> {
  try {
    return await operation()
  } catch (error) {
    if (error instanceof PokerValidationError) {
      throw error
    }

    // Network or Firebase errors
    if (error instanceof Error) {
      if (error.message.includes("offline") || error.message.includes("network")) {
        throw new PokerValidationError("ネットワークエラー: インターネット接続を確認してください")
      }

      if (error.message.includes("permission")) {
        throw new PokerValidationError("権限エラー: この操作を実行する権限がありません")
      }

      if (error.message.includes("not found")) {
        throw new PokerValidationError("ゲームが見つかりません")
      }
    }

    // Unknown error
    console.error("Unexpected error:", error)
    throw new PokerValidationError(`${errorMessage}: ${error instanceof Error ? error.message : "不明なエラー"}`)
  }
}
