"use client"

import { useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Calendar } from "@/components/ui/calendar"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Trophy, Medal, Award, TrendingUp, Target, Zap, BarChart3, Percent, Star, Menu, AlertCircle, AlertTriangle, RefreshCw, LogOut, User, FileText, History, Bot, Gift, MessageCircle } from 'lucide-react'

import type { Player, DailyRanking, MonthlyPoints, StoreRankingSettings, RakeHistory, CustomerAccount } from "@/types"
import {
  calculateRankings,
  getWinRateRankings,
  getMaxWinRankings,
  getWinStreakRankings,
} from "@/lib/utils/ranking-calculator"
import { formatMonth, getRankIcon } from "@/lib/utils/formatters"
import { PostsList } from "@/components/posts/posts-list"
import { MyPostsList } from "@/components/posts/my-posts-list"
import { PostDetail } from "@/components/posts/post-detail"
import { AIPlayersInfo } from "@/components/ai-players-info"
import { ChatRoomDualMode } from "@/components/chat/chat-room-dual-mode"
import { CustomerMainContent } from "@/components/customer-view/layout/CustomerMainContent"
import { MainDashboard } from "@/components/customer-view/MainDashboard"
import { PostsView } from "@/components/customer-view/PostsView"
import { AIPlayersView } from "@/components/customer-view/AIPlayersView"
import { ChatView } from "@/components/customer-view/ChatView"


interface ViewSwitcherProps {
  viewMode: string
  linkedPlayer: Player | null
  customerAccount: CustomerAccount | null
  dailyRankings: DailyRanking[]
  monthlyPoints: MonthlyPoints[]
  storeSettings: StoreRankingSettings | null
  rakeHistory: RakeHistory[]
  pointHistory: RakeHistory[] // RakeHistoryとPointHistoryは同じ型と仮定
  players: Player[]
  selectedPostId: string | null
  selectedTab: string
  activeTab: string
  currentDate: Date
  currentYear: number
  currentMonth: number
  currentMonthStr: string
  today: Date
  isLoading: boolean
  getDisplayName: (player: Player) => string
  handlePostClick: (postId: string) => void
  handleBackFromPostDetail: () => void
  setSelectedTab: (tab: string) => void
  setActiveTab: (tab: string) => void
  setSelectedPlayerForChart: (player: string | null) => void
  setIsChartModalOpen: (isOpen: boolean) => void
  setViewMode: (mode: string) => void
  setSelectedPlayerForDetailedData: (player: any) => void
  setIsDetailedDataModalOpen: (isOpen: boolean) => void
}

export const ViewSwitcher: React.FC<ViewSwitcherProps> = ({
  viewMode, linkedPlayer, customerAccount, dailyRankings, monthlyPoints, storeSettings, rakeHistory, pointHistory, players = [],
  selectedPostId, selectedTab, activeTab, currentDate, currentYear, currentMonth, currentMonthStr, today, isLoading,
  getDisplayName, handlePostClick, handleBackFromPostDetail, setSelectedTab, setActiveTab, setSelectedPlayerForChart, setIsChartModalOpen, setViewMode,
  setSelectedPlayerForDetailedData, setIsDetailedDataModalOpen
}) => {

  // プレイヤーの統計情報を計算
  const playerStats = useMemo(() => {
    if (!linkedPlayer) return null

    const playerRakeHistory = rakeHistory.filter(
      (r) => r.playerId === linkedPlayer.playerId
    )
    const playerPointHistory = pointHistory.filter(
      (p) => p.playerId === linkedPlayer.playerId
    )

    const totalProfit = playerRakeHistory.reduce(
      (sum, r) => sum + r.profit,
      0
    )
    const totalRake = playerRakeHistory.reduce(
      (sum, r) => sum + r.rake,
      0
    )
    const totalGames = playerRakeHistory.length
    const winRate = totalGames > 0 ? (playerRakeHistory.filter((r) => r.profit > 0).length / totalGames) * 100 : 0
    const maxWin = playerRakeHistory.reduce(
      (max, r) => Math.max(max, r.profit),
      0
    )
    const averageProfit = totalGames > 0 ? totalProfit / totalGames : 0

    // ポイント関連の計算
    const totalPoints = playerPointHistory.reduce(
      (sum, p) => sum + p.point,
      0
    )
    const currentPoints = totalPoints // 簡略化のため、ここでは合計を現在のポイントとする

    return {
      totalProfit,
      totalRake,
      totalGames,
      winRate,
      maxWin,
      averageProfit,
      totalPoints,
      currentPoints,
    }
  }, [linkedPlayer, rakeHistory, pointHistory])

  // ランキング計算
  const rankings = useMemo(() => {
    if (!rakeHistory || rakeHistory.length === 0) return []
    return calculateRankings(rakeHistory, players)
  }, [rakeHistory, players])

  const winRateRankings = useMemo(() => {
    if (!rankings || rankings.length === 0) return []
    return getWinRateRankings(rankings)
  }, [rankings])

  const maxWinRankings = useMemo(() => {
    if (!rankings || rankings.length === 0) return []
    return getMaxWinRankings(rankings)
  }, [rankings])

  const winStreakRankings = useMemo(() => {
    if (!rankings || rankings.length === 0) return []
    return getWinStreakRankings(rankings)
  }, [rankings])

  // 月間ポイントランキング
  const monthlyPointRankings = useMemo(() => {
    if (!monthlyPoints || monthlyPoints.length === 0) return []
    return [...monthlyPoints]
      .sort((a, b) => b.totalPoints - a.totalPoints)
      .map((mp, index) => {
        const player = players?.find(p => p.playerId === mp.playerId)
        return {
          ...mp,
          rank: index + 1,
          playerName: player ? getDisplayName(player) : "不明なプレイヤー",
        }
      })
  }, [monthlyPoints, players, getDisplayName])

  // プレイヤーの月間ポイント
  const playerMonthlyPoints = useMemo(() => {
    if (!linkedPlayer) return null
    return monthlyPoints.find(mp => mp.playerId === linkedPlayer.playerId) || null
  }, [linkedPlayer, monthlyPoints])

  // プレイヤーのランキング情報
  const playerRanking = useMemo(() => {
    if (!linkedPlayer) return null
    const rank = rankings.find(r => r.playerId === linkedPlayer.playerId)
    const winRateRank = winRateRankings.find(r => r.playerId === linkedPlayer.playerId)
    const maxWinRank = maxWinRankings.find(r => r.playerId === linkedPlayer.playerId)
    const winStreakRank = winStreakRankings.find(r => r.playerId === linkedPlayer.playerId)

    return {
      rank: rank?.rank || null,
      winRateRank: winRateRank?.rank || null,
      maxWinRank: maxWinRank?.rank || null,
      winStreakRank: winStreakRank?.rank || null,
    }
  }, [linkedPlayer, rankings, winRateRankings, maxWinRankings, winStreakRankings])


  // ViewSwitcherのメインロジック
  switch (viewMode) {
    case "posts":
      return (
        <PostsView
          onViewModeChange={(mode) => setViewMode(mode)}
          onPostClick={handlePostClick}
        />
      )
    case "my-posts":
      return (
        <PostsView
          onViewModeChange={(mode) => setViewMode(mode)}
          onPostClick={handlePostClick}
        />
      )
    case "post-detail":
      return (
        <PostDetail
          postId={selectedPostId!}
          handleBack={handleBackFromPostDetail}
        />
      )
    case "ai-players":
      return (
        <AIPlayersView
          onViewModeChange={(mode) => setViewMode(mode)}
        />
      )
    case "chat":
      return (
        <ChatView
          linkedPlayer={linkedPlayer}
          customerAccount={customerAccount}
          getDisplayName={getDisplayName}
          onViewModeChange={(mode) => setViewMode(mode)}
        />
      )
    case "main":
    default:
      return (
        <CustomerMainContent
          linkedPlayer={linkedPlayer}
          customerAccount={customerAccount}
          viewMode={viewMode}
          playerStats={playerStats as any}
          pointHistory={pointHistory as any}
          currentRewardRate={storeSettings?.rewardRate ?? 0.1}
          storeSettings={storeSettings}
          playingPlayers={players.filter(p => p.isPlaying)}
          getDisplayName={getDisplayName}
          onDetailedDataClick={(playerId, playerName, player) => {
            setSelectedPlayerForDetailedData(player ? { playerId, playerName, player } : { playerId, playerName });
            setIsDetailedDataModalOpen(true);
          }}
          onViewModeChange={(mode) => setViewMode(mode)}
        />
      )
  }
}

export default ViewSwitcher
