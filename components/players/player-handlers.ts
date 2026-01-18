import type { Player } from "@/types"
import {
  deletePlayer,
  createGame,
  addPlayerToGame,
  updateGameParticipantStack,
  endGameWithFinalStacks,
  togglePlayerStatus,
  createReceipt,
  updatePlayer,
  addPlayer,
  deleteAllPlayers,
  updateCustomerAccount,
} from "@/lib/firestore"
import { handleError, handleSuccess } from "@/lib/error-handler"

export const getPlayerName = (player: any): string => {
  if (typeof player === "string") return player
  if (typeof player === "object" && player?.name) return player.name
  return "プレイヤー"
}

export const generateNumericId = () => {
  return Math.floor(100000 + Math.random() * 900000).toString()
}

export const calculateTotalRake = (
  rakeHistory: Array<{
    id: string
    playerId: string
    playerName: string
    gameId: string
    buyIn: number
    additionalStack: number
    finalStack: number
    rake: number
    createdAt: Date
  }>,
): number => {
  return rakeHistory.reduce((total, record) => total + (record.rake || 0), 0)
}

export const handleGeneratePlayerId = async (player: Player, userName: string | null) => {
  try {
    const newId = generateNumericId()
    await updatePlayer(player.id, { uniqueId: newId })
    handleSuccess(`プレイヤーID ${newId} を生成しました`)
  } catch (error) {
    console.error("[v0] ❌ プレイヤーID生成エラー:", error)
    handleError(error, "プレイヤーID生成")
  }
}

export const handleGenerateAllPlayerIds = async (players: Player[], userName: string | null) => {
  try {
    for (const player of players) {
      if (!player.uniqueId) {
        const newId = generateNumericId()
        await updatePlayer(player.id, { uniqueId: newId })
      }
    }
    handleSuccess(`すべてのプレイヤーIDを生成しました`)
  } catch (error) {
    console.error("[v0] ❌ 一括プレイヤーID生成エラー:", error)
    handleError(error, "一括プレイヤーID生成")
  }
}

export const handleBalanceManagement = async (
  player: Player,
  amount: number,
  type: "add" | "deduct",
  userName: string | null,
) => {
  try {
    console.log("[v0] 💰 システム残高調整:", {
      操作者: userName,
      プレイヤー: player.name,
      プレイヤーID: player.id,
      調整額: amount,
      操作タイプ: type,
      時刻: new Date().toLocaleString("ja-JP"),
    })

    const newBalance = type === "add" ? (player.systemBalance || 0) + amount : (player.systemBalance || 0) - amount

    await updatePlayer(player.id, { systemBalance: newBalance })

    handleSuccess(`${player.name}のシステム残高を${type === "add" ? "加算" : "減算"}しました`)
  } catch (error) {
    console.error("[v0] ❌ システム残高調整エラー:", error)
    handleError(error, "システム残高調整")
  }
}

export const handleDeletePlayer = async (player: Player, userName: string | null, onPasswordRequired: () => void) => {
  onPasswordRequired()
}

export const handleDeletePlayerConfirmed = async (player: Player, userName: string | null) => {
  try {
    console.log("[v0] 🗑️ プレイヤー削除:", {
      操作者: userName,
      プレイヤー: player.name,
      プレイヤーID: player.id,
      時刻: new Date().toLocaleString("ja-JP"),
    })

    await deletePlayer(player.id)

    handleSuccess(`${player.name}を削除しました`)
  } catch (error) {
    console.error("[v0] ❌ プレイヤー削除エラー:", error)
    handleError(error, "プレイヤー削除")
  }
}

export const handleManageGame = async (
  player: Player,
  gameAction: "start" | "update" | "end",
  data?: any,
  userName?: string | null,
) => {
  try {
    if (gameAction === "start") {
      console.log("[v0] 🎮 ゲーム開始:", {
        操作者: userName,
        プレイヤー: player.name,
        時刻: new Date().toLocaleString("ja-JP"),
      })
    }
  } catch (error) {
    console.error("[v0] ❌ ゲーム管理エラー:", error)
    handleError(error, "ゲーム管理")
  }
}

export const handleGameStart = async (
  player: Player,
  buyIn: number,
  additionalStack: number,
  userName: string | null,
) => {
  try {
    console.log("[v0] 🎮 ゲーム開始:", {
      操作者: userName,
      プレイヤー: player.name,
      プレイヤーID: player.id,
      バイイン: buyIn,
      追加スタック: additionalStack,
      時刻: new Date().toLocaleString("ja-JP"),
    })

    const gameId = `game_${Date.now()}`
    await createGame(gameId, userName || "system")
    await addPlayerToGame(gameId, player.id, buyIn + additionalStack)

    handleSuccess(`${player.name}のゲームを開始しました`)
  } catch (error) {
    console.error("[v0] ❌ ゲーム開始エラー:", error)
    handleError(error, "ゲーム開始")
  }
}

export const handleGameUpdate = async (gameId: string, playerId: string, newStack: number, userName: string | null) => {
  try {
    console.log("[v0] 🎮 ゲーム更新:", {
      操作者: userName,
      ゲームID: gameId,
      プレイヤーID: playerId,
      新しいスタック: newStack,
      時刻: new Date().toLocaleString("ja-JP"),
    })

    await updateGameParticipantStack(gameId, playerId, newStack)

    handleSuccess(`ゲームを更新しました`)
  } catch (error) {
    console.error("[v0] ❌ ゲーム更新エラー:", error)
    handleError(error, "ゲーム更新")
  }
}

export const handleGameEnd = async (
  finalStack: number,
  playerId: string,
  players: Player[],
  userName: string | null,
) => {
  const targetPlayer = players.find((p) => p.id === playerId && p.isPlaying && p.currentGameId)
  if (!targetPlayer) {
    console.error("[v0] ❌ ゲーム終了対象プレイヤーが見つかりません:", playerId)
    handleError(new Error("ゲーム終了対象のプレイヤーが見つかりません"), "ゲーム終了")
    return
  }

  try {
    console.log("[v0] 🏁 ゲーム終了操作:", {
      操作者: userName,
      プレイヤー: targetPlayer.name,
      プレイヤーID: targetPlayer.id,
      最終スタック: finalStack,
      時刻: new Date().toLocaleString("ja-JP"),
    })

    await endGameWithFinalStacks(targetPlayer.currentGameId!, [{ playerId: targetPlayer.id, finalStack }], userName || "system")

    handleSuccess(`${targetPlayer.name}のゲームが終了しました。最終スタック ${finalStack.toLocaleString()}© がシステム残高に追加されました。`)
  } catch (error) {
    console.error("[v0] ❌ ゲーム終了エラー:", error)
    handleError(error, "ゲーム終了")
  }
}

export const handleStatusChange = async (player: Player, newStatus: "normal" | "special" | "deduction", userName: string | null) => {
  const currentStatus = player.isSpecial ? "special" : player.isDeduction ? "deduction" : "normal"

  if (newStatus === currentStatus) {
    return
  }

  try {
    await togglePlayerStatus(player.id, newStatus, userName || "system")

    const statusNames = {
      normal: "通常仕様",
      special: "特別仕様",
      deduction: "差引仕様",
    }

    handleSuccess(`${player.name}の設定を${statusNames[newStatus]}に変更しました`)
  } catch (error) {
    console.error("[v0] プレイヤー仕様切り替えエラー:", error)
    handleError(error, "設定変更")
  }
}
