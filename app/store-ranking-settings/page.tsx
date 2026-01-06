"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Header } from "@/components/header"
import { AuthGuard } from "@/components/auth-guard"
import { getStoreRankingSettings, updateStoreRankingSettings } from "@/lib/firestore"
import type { StoreRankingSettings } from "@/types"
import { CalendarIcon, X, Trophy, Gift, Zap, AlertCircle } from 'lucide-react'
import { format } from "date-fns"
import { ja } from "date-fns/locale"
import { PasswordModal } from "@/components/password-modal"
import { handleError, handleSuccess } from "@/lib/error-handler"

export default function StoreRankingSettingsPage() {
  const [settings, setSettings] = useState<StoreRankingSettings | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [selectedDate, setSelectedDate] = useState<Date>()
  const [isCalendarOpen, setIsCalendarOpen] = useState(false)
  const [showPasswordModal, setShowPasswordModal] = useState(false)

  // Form state
  const [monthlyPrizes, setMonthlyPrizes] = useState({
    first: 10000,
    second: 5000,
    third: 3000,
  })
  const [pointSystem, setPointSystem] = useState({
    first: 8,
    second: 5,
    third: 3,
    fourth: 1,
    fifth: 1,
  })
  const [doublePointDays, setDoublePointDays] = useState<string[]>([])
  const [rewardPointsSettings, setRewardPointsSettings] = useState({
    baseRate: 5, // デフォルト5%
    dailyRates: {} as { [date: string]: number },
    usageScope: "all" as "all" | "stack_only", // デフォルトは会計全体
  })
  const [selectedRewardDate, setSelectedRewardDate] = useState<Date>()
  const [isRewardCalendarOpen, setIsRewardCalendarOpen] = useState(false)
  const [dailyRate, setDailyRate] = useState<string>("10")
  const [announcement, setAnnouncement] = useState({
    message: "",
    isVisible: false,
  })
  const [membershipRankSettings, setMembershipRankSettings] = useState({
    enabled: false,
    ranks: {
      silver: {
        requiredCP: 1000,
        benefits: {
          cpBoostPercentage: 0,
          freeDrink: false,
          freeCharge: false,
        },
      },
      gold: {
        requiredCP: 5000,
        benefits: {
          cpBoostPercentage: 0,
          freeDrink: false,
          freeCharge: false,
        },
      },
      platinum: {
        requiredCP: 10000,
        benefits: {
          cpBoostPercentage: 0,
          freeDrink: false,
          freeCharge: false,
        },
      },
    },
  })

  useEffect(() => {
    loadSettings()
  }, [])

  const loadSettings = async () => {
    try {
      const storeSettings = await getStoreRankingSettings()
      if (storeSettings) {
        setSettings(storeSettings)
        setMonthlyPrizes(storeSettings.monthlyPrizes || { first: 10000, second: 5000, third: 3000 })
        setPointSystem(storeSettings.pointSystem || { first: 8, second: 5, third: 3, fourth: 1, fifth: 1 })
        setDoublePointDays(storeSettings.doublePointDays || [])
        if (storeSettings.cashbackPointsSettings) {
          setRewardPointsSettings(storeSettings.cashbackPointsSettings)
        }
        if (storeSettings.announcement) {
          setAnnouncement(storeSettings.announcement)
        }
        if (storeSettings.membershipRankSettings) {
          setMembershipRankSettings(storeSettings.membershipRankSettings)
        }
      }
    } catch (error) {
      console.error("設定読み込みエラー:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    setShowPasswordModal(true)
  }

  const handlePasswordSuccess = async () => {
    setSaving(true)
    try {
      await updateStoreRankingSettings({
        monthlyPrizes,
        pointSystem,
        doublePointDays,
        cashbackPointsSettings: rewardPointsSettings,
        announcement,
        membershipRankSettings,
      })
      handleSuccess("設定を保存しました")
    } catch (error) {
      console.error("設定保存エラー:", error)
      handleError(error, "設定保存")
    } finally {
      setSaving(false)
    }
  }

  const addDoublePointDay = () => {
    if (selectedDate) {
      const dateString = format(selectedDate, "yyyy-MM-dd")
      if (!doublePointDays.includes(dateString)) {
        setDoublePointDays([...doublePointDays, dateString])
      }
      setSelectedDate(undefined)
      setIsCalendarOpen(false)
    }
  }

  const removeDoublePointDay = (dateString: string) => {
    setDoublePointDays(doublePointDays.filter((d) => d !== dateString))
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <main className="container mx-auto px-4 py-8">
          <div className="text-center">読み込み中...</div>
        </main>
      </div>
    )
  }

  return (
    <AuthGuard>
      <div className="min-h-screen bg-gray-50">
        <Header />
        <main className="container mx-auto px-4 py-8 max-w-4xl">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">ランキング設定</h1>
            <p className="text-gray-600">月間プライズ、ポイント制度を管理します</p>
          </div>

          <div className="grid gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Gift className="h-5 w-5 text-yellow-500" />
                  月間プライズ設定
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>1位プライズ</Label>
                    <Input
                      type="number"
                      value={monthlyPrizes.first}
                      onChange={(e) => setMonthlyPrizes({...monthlyPrizes, first: parseInt(e.target.value) || 0})}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>2位プライズ</Label>
                    <Input
                      type="number"
                      value={monthlyPrizes.second}
                      onChange={(e) => setMonthlyPrizes({...monthlyPrizes, second: parseInt(e.target.value) || 0})}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>3位プライズ</Label>
                    <Input
                      type="number"
                      value={monthlyPrizes.third}
                      onChange={(e) => setMonthlyPrizes({...monthlyPrizes, third: parseInt(e.target.value) || 0})}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Trophy className="h-5 w-5 text-blue-500" />
                  RPシステム設定
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                  <div className="space-y-2">
                    <Label>1位</Label>
                    <Input
                      type="number"
                      value={pointSystem.first}
                      onChange={(e) => setPointSystem({...pointSystem, first: parseInt(e.target.value) || 0})}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>2位</Label>
                    <Input
                      type="number"
                      value={pointSystem.second}
                      onChange={(e) => setPointSystem({...pointSystem, second: parseInt(e.target.value) || 0})}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>3位</Label>
                    <Input
                      type="number"
                      value={pointSystem.third}
                      onChange={(e) => setPointSystem({...pointSystem, third: parseInt(e.target.value) || 0})}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>4位</Label>
                    <Input
                      type="number"
                      value={pointSystem.fourth}
                      onChange={(e) => setPointSystem({...pointSystem, fourth: parseInt(e.target.value) || 0})}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>5位</Label>
                    <Input
                      type="number"
                      value={pointSystem.fifth}
                      onChange={(e) => setPointSystem({...pointSystem, fifth: parseInt(e.target.value) || 0})}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="flex justify-end mt-6">
              <Button onClick={handleSave} disabled={saving} className="bg-blue-600 hover:bg-blue-700 px-8">
                {saving ? "保存中..." : "設定を保存"}
              </Button>
            </div>
          </div>

          <PasswordModal
            open={showPasswordModal}
            onClose={() => setShowPasswordModal(false)}
            onSuccess={handlePasswordSuccess}
            title="ランキング設定の変更"
            description="設定を保存するには管理者パスワードが必要です。"
          />
        </main>
      </div>
    </AuthGuard>
  )
}
