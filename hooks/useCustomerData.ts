/**
 * useCustomerData
 * 
 * カスタムフック: 顧客ビューで必要なデータを一元管理します。
 * 複数のデータソース（顧客アカウント、プレイヤー、ランキング、店舗設定など）の購読と
 * ロード状態の管理を行います。
 * 
 * リファクタリング: app/customer-view/page.tsx の巨大な useEffect から
 * データ購読ロジックを分離しました。
 */

import { useState, useMemo, useEffect } from "react"
import { doc, getDoc, collection, query, orderBy, limit, getDocs } from "firebase/firestore"
import { getDb } from "@/lib/firebase"
import { cache, CacheKeys } from "@/lib/cache"
import {
  subscribeToPlayers,
  subscribeToDailyRankings,
  subscribeToMonthlyPoints,
  subscribeToCustomerAccounts,
  subscribeToPointHistory,
} from "@/lib/firestore"
import type { Player, DailyRanking, MonthlyPoints, StoreRankingSettings, RakeHistory, CustomerAccount } from "@/types"

interface UseCustomerDataReturn {
  players: Player[]
  dailyRankings: DailyRanking[]
  monthlyPoints: MonthlyPoints[]
  storeSettings: StoreRankingSettings | null
  rakeHistory: RakeHistory[]
  pointHistory: any[]
  customerAccounts: CustomerAccount[]
  currentRewardRate: number
  isLoading: boolean
  dataLoaded: {
    customers: boolean
    players: boolean
    dailyRankings: boolean
    monthlyPoints: boolean
    storeSettings: boolean
  }
}

export const useCustomerData = (
  linkedPlayerId: string | undefined,
  currentYear: number,
  currentMonth: number,
  setCustomerAccount: (customer: any) => void
): UseCustomerDataReturn => {
  const [players, setPlayers] = useState<Player[]>([])
  const [dailyRankings, setDailyRankings] = useState<DailyRanking[]>([])
  const [monthlyPoints, setMonthlyPoints] = useState<MonthlyPoints[]>([])
  const [storeSettings, setStoreSettings] = useState<StoreRankingSettings | null>(null)
  const [rakeHistory, setRakeHistory] = useState<RakeHistory[]>([])
  const [pointHistory, setPointHistory] = useState<any[]>([])
  const [customerAccounts, setCustomerAccounts] = useState<CustomerAccount[]>([])
  const [currentRewardRate, setCurrentRewardRate] = useState<number>(5)
  const [isLoading, setIsLoading] = useState(true)
  const [dataLoaded, setDataLoaded] = useState({
    customers: false,
    players: false,
    dailyRankings: false,
    monthlyPoints: false,
    storeSettings: false,
  })

  useEffect(() => {
    console.log("[v0] 🎯 お客さん専用ランキングページ初期化開始")

    // 認証状態の安定化
    const initializeAuth = () => {
      const currentUserEmail = sessionStorage.getItem("currentUserEmail")
      console.log("[v0] 認証初期化 - 保存されたメール:", currentUserEmail)

      if (currentUserEmail) {
        // メールアドレスが保存されている場合、そのユーザーを優先的に設定
        console.log("[v0] 保存されたメールアドレスでユーザー検索:", currentUserEmail)
      }
    }

    initializeAuth()

    const unsubscribeCustomers = subscribeToCustomerAccounts((customers) => {
      console.log("[v0] 👥 お客さんアカウント同期受信:", customers.length, "件")

      if (customers.length > 0) {
        const currentUserEmail = sessionStorage.getItem("currentUserEmail")
        let targetCustomer = customers[0] // デフォルトは最初の顧客

        // メールアドレスが保存されている場合、該当する顧客を検索
        if (currentUserEmail) {
          const foundCustomer = customers.find((customer) => customer.email === currentUserEmail)
          if (foundCustomer) {
            targetCustomer = foundCustomer
            console.log("[v0] 👤 セッションに基づく顧客選択:", {
              email: currentUserEmail,
              customerId: foundCustomer.id,
            })
          }
        }

        const tempCustomer = {
          ...targetCustomer,
          subscriptionStatus: "active" as const,
        }

        // 現在の顧客と異なる場合のみ更新
        setCustomerAccount((prevCustomer: any) => {
          if (!prevCustomer || prevCustomer.id !== tempCustomer.id) {
            console.log("[v0] Customer状態更新:", tempCustomer)
            return tempCustomer
          }
          return prevCustomer
        })

        setCustomerAccounts(customers)
      } else {
        setCustomerAccounts(customers)
        // customerAccountをnullに設定
        setCustomerAccount(null)
        console.log("[v0] Customer状態クリア")
      }
      setDataLoaded((prev) => ({ ...prev, customers: true }))
    })

    const storeId = localStorage.getItem("storeId")
    const unsubscribePlayers = subscribeToPlayers((players) => {
      console.log("[v0] 👥 プレイヤー同期受信:", players.length, "人")
      setPlayers(players)
      setDataLoaded((prev) => ({ ...prev, players: true }))
    }, undefined, storeId)

    const unsubscribeDailyRankings = subscribeToDailyRankings((rankings) => {
      console.log("[v0] 📊 日別ランキング同期受信:", rankings.length, "件")
      setDailyRankings(rankings)
      setDataLoaded((prev) => ({ ...prev, dailyRankings: true }))
    }, storeId)

    const unsubscribeMonthlyPoints = subscribeToMonthlyPoints(currentYear, currentMonth, (points) => {
      console.log("[v0] 📈 月間RP同期受信:", points.length, "件")
      setMonthlyPoints(points)
      setDataLoaded((prev) => ({ ...prev, monthlyPoints: true }))
    })

    // 店舗設定は1回のみ取得（キャッシュ付き、TTL: 5分）
    const fetchStoreSettings = async () => {
      try {
        const db = getDb()
        if (!db) return

        const settings = await cache.get(
          CacheKeys.storeSettings(),
          async () => {
            const settingsDoc = await getDoc(doc(db, "storeRankingSettings", "default"))
            return settingsDoc.exists() ? (settingsDoc.data() as StoreRankingSettings) : null
          },
          5 * 60 * 1000 // 5分間キャッシュ
        )

        if (settings) {
          console.log("[v0] ⚙️ 店舗ランキング設定取得:", "1 件")
          setStoreSettings(settings)

          // CP率はcashbackPointsSettings.rateのみを使用（RP2倍デーとは獨立）
          const cpRate = settings.cashbackPointsSettings?.rate || 5
          setCurrentRewardRate(cpRate)
        } else {
          console.log("[v0] ⚙️ 店舗ランキング設定取得:", "0 件")
        }
        setDataLoaded((prev) => ({ ...prev, storeSettings: true }))
      } catch (error) {
        console.error("[v0] 店舗設定取得エラー:", error)
        setDataLoaded((prev) => ({ ...prev, storeSettings: true }))
      }
    }
    fetchStoreSettings()

    // レーキ履歴は1回のみ取得（キャッシュ付き、TTL: 2分）
    const fetchRakeHistory = async () => {
      try {
        const db = getDb()
        if (!db) return

        const history = await cache.get(
          CacheKeys.rakeHistory(100),
          async () => {
            const historyRef = collection(db, "rakeHistory")
            const historyQuery = query(historyRef, orderBy("createdAt", "desc"), limit(100))
            const snapshot = await getDocs(historyQuery)

            return snapshot.docs.map((doc) => ({
              id: doc.id,
              ...doc.data(),
            })) as RakeHistory[]
          },
          2 * 60 * 1000 // 2分間キャッシュ
        )

        console.log("[v0] 📊 レーキ履歴取得:", history.length, "件")
        setRakeHistory(history)
      } catch (error) {
        console.error("[v0] レーキ履歴取得エラー:", error)
      }
    }
    fetchRakeHistory()

    let unsubscribePointHistory: (() => void) | null = null
    if (linkedPlayerId) {
      console.log("[v0] ポイント履歴リスナー設定:", linkedPlayerId)
      unsubscribePointHistory = subscribeToPointHistory(linkedPlayerId, (history) => {
        console.log("[v0] ポイント履歴受信:", history.length, "件")
        setPointHistory(history)
      })
    } else {
      console.log("[v0] linkedPlayerが未定義のためポイント履歴リスナーをスキップ")
    }

    return () => {
      console.log("[v0] 🔄 リスナークリーンアップ実行")
      unsubscribeCustomers()
      unsubscribePlayers()
      unsubscribeDailyRankings()
      unsubscribeMonthlyPoints()
      if (unsubscribePointHistory) {
        unsubscribePointHistory()
      }
    }
  }, [currentYear, currentMonth, linkedPlayerId, setCustomerAccount])

  useEffect(() => {
    const allDataLoaded = Object.values(dataLoaded).every((loaded) => loaded)
    if (allDataLoaded && !isLoading) {
      console.log("[v0] ✅ 全データ同期完了 - ローディング終了")
    } else if (allDataLoaded && isLoading) {
      console.log("[v0] ✅ 全データ同期完了 - ローディング終了")
      setIsLoading(false)
    }
  }, [dataLoaded, isLoading])

  return {
    players,
    dailyRankings,
    monthlyPoints,
    storeSettings,
    rakeHistory,
    pointHistory,
    customerAccounts,
    currentRewardRate,
    isLoading,
    dataLoaded,
  }
}
