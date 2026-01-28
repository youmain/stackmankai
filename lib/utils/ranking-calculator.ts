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
      if (!player) return;
      const playerName = getPlayerDisplayName(player)

      playerStats[player.id] = {
        playerId: player.id,
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
    // 必須プロパティがない場合はスキップ
    if (!game.playerId || game.finalStack === undefined || game.buyIn === undefined || game.additionalStack === undefined) {
      return
    }

    const profit = game.finalStack - (game.buyIn + game.additionalStack)

    if (!playerStats[game.playerId]) {
      playerStats[game.playerId] = {
        playerId: game.playerId,
        playerName: game.playerName || "Unknown Player",
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
    const gameDate = (() => {
      if (game.createdAt instanceof Date) return game.createdAt;
      if (typeof game.createdAt === 'string') return new Date(game.createdAt);
      if (game.createdAt && typeof (game.createdAt as any).toDate === 'function') return (game.createdAt as any).toDate();
      return new Date();
    })();
    if (!stats.lastGameDate || gameDate > stats.lastGameDate) {
      stats.lastGameDate = gameDate
    }
  })

  // 勝率と連勝記録を計算
  Object.values(playerStats).forEach((stats) => {
    const playerGames = games
      .filter((game) => game.playerId === stats.playerId)
      .sort((a, b) => {
        const dateA = (() => {
          if (a.createdAt instanceof Date) return a.createdAt;
          if (typeof a.createdAt === 'string') return new Date(a.createdAt);
          if (a.createdAt && typeof (a.createdAt as any).toDate === 'function') return (a.createdAt as any).toDate();
          return new Date(0);
        })();
        const dateB = (() => {
          if (b.createdAt instanceof Date) return b.createdAt;
          if (typeof b.createdAt === 'string') return new Date(b.createdAt);
          if (b.createdAt && typeof (b.createdAt as any).toDate === 'function') return (b.createdAt as any).toDate();
          return new Date(0);
        })();
        return dateA.getTime() - dateB.getTime()
      })

    const wins = playerGames.filter((game) => 
      game.finalStack !== undefined && 
      game.buyIn !== undefined && 
      game.additionalStack !== undefined && 
      game.finalStack - (game.buyIn + game.additionalStack) > 0
    ).length
    stats.winRate = stats.totalGames > 0 ? (wins / stats.totalGames) * 100 : 0
    stats.averageProfit = stats.totalGames > 0 ? stats.totalProfit / stats.totalGames : 0

    // 連勝記録を計算
    let maxStreak = 0
    let currentStreak = 0
    let lastResult = 0

    playerGames.forEach((game) => {
      if (game.finalStack === undefined || game.buyIn === undefined || game.additionalStack === undefined) {
        return
      }
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
  // 日本語プロパティは存在しないため削除
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
