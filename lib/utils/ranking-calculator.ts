import type { Player, RakeHistory } from "@/types"

export interface RankingData {
  playerId: string
  playerName: string
  totalProfit: number
  totalGames: number
  winRate: number
  lastGameDate: Date | null
  averageProfit: number
  maxWin: number
  maxWinStreak: number
  currentStreak: number
  totalPoints?: number
}

/**
 * ランキングデータを計算する共通関数
 * @param games - レーキ履歴の配列
 * @param allPlayers - 全プレイヤーの配列（オプション）
 * @returns ランキングデータの配列（収支順にソート済み）
 */
export function calculateRankings(games: RakeHistory[], allPlayers?: Player[]): RankingData[] {
  const playerStats: Record<string, RankingData> = {}

  // 全プレイヤーを初期化（allPlayersが提供されている場合）
  if (allPlayers) {
    allPlayers.forEach((player) => {
      const playerName = getPlayerDisplayName(player)

      playerStats[player.プレイヤーID || player.id] = {
        playerId: player.プレイヤーID || player.id,
        playerName,
        totalProfit: 0,
        totalGames: 0,
        winRate: 0,
        lastGameDate: null,
        averageProfit: 0,
        maxWin: 0,
        maxWinStreak: 0,
        currentStreak: 0,
        totalPoints: 0,
      }
    })
  }

  // ゲーム結果を反映
  games.forEach((game) => {
    const profit = game.finalStack - (game.buyIn + game.additionalStack)

    if (!playerStats[game.playerId]) {
      playerStats[game.playerId] = {
        playerId: game.playerId,
        playerName: game.playerName,
        totalProfit: 0,
        totalGames: 0,
        winRate: 0,
        lastGameDate: null,
        averageProfit: 0,
        maxWin: 0,
        maxWinStreak: 0,
        currentStreak: 0,
      }
    }

    const stats = playerStats[game.playerId]
    stats.totalProfit += profit
    stats.totalGames += 1

    if (profit > stats.maxWin) {
      stats.maxWin = profit
    }

    // 最終ゲーム日を更新
    const gameDate = game.createdAt instanceof Date ? game.createdAt : game.createdAt.toDate()
    if (!stats.lastGameDate || gameDate > stats.lastGameDate) {
      stats.lastGameDate = gameDate
    }
  })

  // 勝率と連勝記録を計算
  Object.values(playerStats).forEach((stats) => {
    const playerGames = games
      .filter((game) => game.playerId === stats.playerId)
      .sort((a, b) => {
        const dateA = a.createdAt instanceof Date ? a.createdAt : a.createdAt.toDate()
        const dateB = b.createdAt instanceof Date ? b.createdAt : b.createdAt.toDate()
        return dateA.getTime() - dateB.getTime()
      })

    const wins = playerGames.filter((game) => game.finalStack - (game.buyIn + game.additionalStack) > 0).length
    stats.winRate = stats.totalGames > 0 ? (wins / stats.totalGames) * 100 : 0
    stats.averageProfit = stats.totalGames > 0 ? stats.totalProfit / stats.totalGames : 0

    // 連勝記録を計算
    let maxStreak = 0
    let currentStreak = 0
    let lastResult = 0

    playerGames.forEach((game) => {
      const profit = game.finalStack - (game.buyIn + game.additionalStack)
      if (profit > 0) {
        currentStreak = lastResult > 0 ? currentStreak + 1 : 1
        maxStreak = Math.max(maxStreak, currentStreak)
      } else {
        currentStreak = 0
      }
      lastResult = profit
    })

    stats.maxWinStreak = maxStreak
    stats.currentStreak = lastResult > 0 ? currentStreak : 0
  })

  return Object.values(playerStats).sort((a, b) => b.totalProfit - a.totalProfit)
}

/**
 * プレイヤーの表示名を取得する
 */
function getPlayerDisplayName(player: Player): string {
  if (player.pokerName) {
    return player.pokerName
  }
  if (player.name) {
    return player.name
  }
  if (typeof player.プレイヤー名 === "string") {
    return player.プレイヤー名
  }
  if (player.プレイヤー名?.name) {
    return player.プレイヤー名.name
  }
  return "Unknown Player"
}

/**
 * 勝率ランキングを取得（3ゲーム以上参加したプレイヤーのみ）
 */
export function getWinRateRankings(rankings: RankingData[], minGames = 3): RankingData[] {
  return [...rankings].filter((player) => player.totalGames >= minGames).sort((a, b) => b.winRate - a.winRate)
}

/**
 * 最大勝利額ランキングを取得
 */
export function getMaxWinRankings(rankings: RankingData[], minWin = 30000, limit = 10): RankingData[] {
  return [...rankings]
    .filter((player) => player.maxWin >= minWin)
    .sort((a, b) => b.maxWin - a.maxWin)
    .slice(0, limit)
}

/**
 * 連勝記録ランキングを取得
 */
export function getWinStreakRankings(rankings: RankingData[], minStreak = 3, limit = 10): RankingData[] {
  return [...rankings]
    .filter((player) => player.maxWinStreak >= minStreak)
    .sort((a, b) => b.maxWinStreak - a.maxWinStreak)
    .slice(0, limit)
}
