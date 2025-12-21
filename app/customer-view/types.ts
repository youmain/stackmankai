import type { Player, StoreRankingSettings, PointHistory } from "@/types"

export interface LinkedPlayer {
  id: string
  name: string
  player?: Player
}

export interface PlayerStats {
  totalGames: number
  totalProfit: number
  winRate: number
  averageProfit: number
  todayGames: number
  todayProfit: number
}

export interface PlayerInfoCardProps {
  linkedPlayer: LinkedPlayer | null
  currentRewardRate: number
  storeSettings: StoreRankingSettings | null
  onDetailedDataClick: () => void
}

export interface PointHistorySectionProps {
  pointHistory: PointHistory[]
  linkedPlayer: LinkedPlayer | null
}

export interface PlayerStatsCardProps {
  playerStats: PlayerStats | null
}

export interface PlayingPlayersCardProps {
  players: Player[]
}

export interface SpecialNoticesSectionProps {
  isDoublePointDay: boolean
  hasSpecialRate: boolean
  currentRewardRate: number
  storeSettings: StoreRankingSettings | null
  linkedPlayer: LinkedPlayer | null
}
