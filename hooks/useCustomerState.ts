"use client"

import { useState, useEffect, useMemo } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import {
  Player,
  DailyRanking,
  MonthlyPoints,
  StoreRankingSettings,
  CustomerAccount,
  RakeHistory,
} from "@/types"
import { subscribeToPlayers } from "@/lib/firestore"

interface DataLoadedState {
  customers: boolean
  players: boolean
  dailyRankings: boolean
  monthlyPoints: boolean
  storeSettings: boolean
}

export const useCustomerState = () => {
  const { customerAccount, setCustomerAccount, signOut } = useAuth()
  const router = useRouter()

  // --- 1. View State ---
  const [viewMode, setViewMode] = useState<"main" | "posts" | "my-posts" | "post-detail" | "ai-players" | "chat">("main")
  const [selectedPostId, setSelectedPostId] = useState<string | null>(null)
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [selectedTab, setSelectedTab] = useState<string>("today")
  const [activeTab, setActiveTab] = useState("today")

  // --- 2. Data State ---
  const [players, setPlayers] = useState<Player[]>([])
  const [dailyRankings, setDailyRankings] = useState<DailyRanking[]>([])
  const [monthlyPoints, setMonthlyPoints] = useState<MonthlyPoints[]>([])
  const [storeSettings, setStoreSettings] = useState<StoreRankingSettings | null>(null)
  const [rakeHistory, setRakeHistory] = useState<RakeHistory[]>([])
  const [pointHistory, setPointHistory] = useState<any[]>([])
  const [customerAccounts, setCustomerAccounts] = useState<CustomerAccount[]>([])
  const [currentRewardRate, setCurrentRewardRate] = useState<number>(5) // Track current reward rate

  // --- 3. Loading/Status State ---
  const [isLoading, setIsLoading] = useState(true)
  const [dataLoaded, setDataLoaded] = useState<DataLoadedState>({
    customers: false,
    players: false,
    dailyRankings: false,
    monthlyPoints: false,
    storeSettings: false,
  })

  // --- 4. Player Linking/Modal State ---
  const [isDetailedDataModalOpen, setIsDetailedDataModalOpen] = useState(false)
  const [selectedPlayerForDetailedData, setSelectedPlayerForDetailedData] = useState<{
    playerId: string
    playerName: string
    player?: Player
  } | null>(null)
  const [playerIdInput, setPlayerIdInput] = useState("")
  const [isLinking, setIsLinking] = useState(false)
  const [linkingError, setLinkingError] = useState<string | null>(null)
  const [skipLinking, setSkipLinking] = useState(false)
  const [showLinkingSuccessModal, setShowLinkingSuccessModal] = useState(false)
  const [skipLinkingAfterSuccess, setSkipLinkingAfterSuccess] = useState(false)
  const [showConfirmation, setShowConfirmation] = useState(false)
  const [selectedPlayer, setSelectedPlayer] = useState<any>(null)
  const [selectedPlayerForChart, setSelectedPlayerForChart] = useState<string | null>(null)
  const [isChartModalOpen, setIsChartModalOpen] = useState(false)
  const [showPlayerIdForm, setShowPlayerIdForm] = useState(false)
  const [originalPlayerData, setOriginalPlayerData] = useState<{ playerId: string; playerName: string } | null>(null)
  const [isResetConfirmOpen, setIsResetConfirmOpen] = useState(false)
  const [isResetting, setIsResetting] = useState(false)
  const [isCancelConfirmOpen, setIsCancelConfirmOpen] = useState(false)
  const [isCancelling, setIsCancelling] = useState(false)
  const [showPlayerLinkModal, setShowPlayerLinkModal] = useState(false)

  // --- 5. Computed Values (Time) ---
  // Dateオブジェクトはレンダリングごとに新しいインスタンスになるため、useMemoでラップし、依存配列を空にする
  const currentDate = useMemo(() => new Date(), [])
  const currentYear = useMemo(() => currentDate.getFullYear(), [currentDate])
  const currentMonth = useMemo(() => currentDate.getMonth() + 1, [currentDate])
  const currentMonthStr = useMemo(() => currentDate.toISOString().slice(0, 7), [currentDate]) // YYYY-MM
  const today = useMemo(() => new Date(), [])

  // --- 6. Initial Load Effects (from page.tsx) ---

  // forceResetパラメータでゲームをリセット（一時的な機能）
  useEffect(() => {
    if (!customerAccount?.storeId || typeof window === 'undefined') return // windowの存在チェックを追加
    const urlParams = new URLSearchParams(window.location.search)
    if (urlParams.get("forceReset") === "true") {
      const storageKey = `pokerGameId_${customerAccount.storeId}`
      localStorage.removeItem(storageKey)
      // パラメータを削除してリロード
      urlParams.delete("forceReset")
      const newUrl = window.location.pathname + (urlParams.toString() ? "?" + urlParams.toString() : "")
      window.location.href = newUrl
    }
  }, [customerAccount?.storeId])

  // localStorageとURLパラメータからviewModeを読み取る
  useEffect(() => {
    if (typeof window === 'undefined') return // windowの存在チェックを追加
    
    // まずlocalStorageから復元
    const saved = localStorage.getItem("customerViewMode")
    if (saved === "chat" || saved === "posts" || saved === "my-posts" || saved === "post-detail" || saved === "ai-players") {
      setViewMode(saved as any)
    }
    
    // URLパラメータがあればそちらを優先
    const urlParams = new URLSearchParams(window.location.search)
    const viewModeParam = urlParams.get("viewMode")
    if (viewModeParam === "chat" || viewModeParam === "posts" || viewModeParam === "my-posts" || viewModeParam === "post-detail" || viewModeParam === "ai-players") {
      setViewMode(viewModeParam as any)
    }
  }, [])

  // viewModeが変更されたらローカルストレージに保存
  useEffect(() => {
    if (viewMode !== "post-detail") {
      localStorage.setItem("customerViewMode", viewMode)
    }
  }, [viewMode])

  // skipLinkingAfterSuccessの初期化
  useEffect(() => {
    const skipSuccess = localStorage.getItem("skipPlayerLinkingSuccess")
    if (skipSuccess === "true") {
      setSkipLinkingAfterSuccess(true)
    }
  }, [])

  // --- 7. Data Subscription Effects ---
  
  // プレイヤーデータの購読
  useEffect(() => {
    if (!customerAccount) {
      return;
    }
    
    // storeIdがある場合はその店舗のプレイヤーのみ、ない場合は全プレイヤー（紐付け用）
    const storeId = customerAccount.storeId || undefined;

    const unsubscribe = subscribeToPlayers(storeId || "", (newPlayers) => {
      setPlayers(newPlayers || [])
      setDataLoaded(prev => ({ ...prev, players: true }));
    }, (error) => {
      console.error("Players subscription error:", error);
      setDataLoaded(prev => ({ ...prev, players: true }));
    })

    return () => {
      if (typeof unsubscribe === 'function') {
        unsubscribe();
      }
    }
  }, [customerAccount])

  // 顧客アカウントのロード状態管理
  useEffect(() => {
    if (customerAccount) {
      setDataLoaded(prev => ({ ...prev, customers: true }));
    } else {
      setDataLoaded(prev => ({ ...prev, customers: true }));
    }
  }, [customerAccount?.id])

  // 全体のロード状態を更新
  useEffect(() => {
    if (dataLoaded.players && dataLoaded.customers) {
      const timer = setTimeout(() => {
        setIsLoading(false)
      }, 100)
      return () => clearTimeout(timer)
    }
  }, [dataLoaded.players, dataLoaded.customers])

  return {
    // States
    viewMode, setViewMode, selectedPostId, setSelectedPostId, isDetailedDataModalOpen, setIsDetailedDataModalOpen,
    selectedPlayerForDetailedData, setSelectedPlayerForDetailedData, players, setPlayers, dailyRankings, setDailyRankings,
    monthlyPoints, setMonthlyPoints, storeSettings, setStoreSettings, selectedTab, setSelectedTab, isMenuOpen, setIsMenuOpen,
    playerIdInput, setPlayerIdInput, isLinking, setIsLinking, linkingError, setLinkingError, skipLinking, setSkipLinking,
    showLinkingSuccessModal, setShowLinkingSuccessModal, skipLinkingAfterSuccess, setSkipLinkingAfterSuccess, showConfirmation,
    setShowConfirmation, selectedPlayer, setSelectedPlayer, rakeHistory, setRakeHistory, selectedPlayerForChart, setSelectedPlayerForChart,
    isChartModalOpen, setIsChartModalOpen, activeTab, setActiveTab, pointHistory, setPointHistory, currentRewardRate, setCurrentRewardRate,
    isLoading, setIsLoading, customerAccounts, setCustomerAccounts, dataLoaded, setDataLoaded, showPlayerIdForm, setShowPlayerIdForm,
    originalPlayerData, setOriginalPlayerData, isResetConfirmOpen, setIsResetConfirmOpen, isResetting, setIsResetting,
    isCancelConfirmOpen, setIsCancelConfirmOpen, isCancelling, setIsCancelling, showPlayerLinkModal, setShowPlayerLinkModal,
    
    // Computed Values
    currentDate, currentYear, currentMonth, currentMonthStr, today,
    
    // Auth/Router
    customerAccount, setCustomerAccount, signOut, router,
  }
}
