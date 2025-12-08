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
        setMonthlyPrizes(storeSettings.monthlyPrizes)
        setPointSystem(storeSettings.pointSystem)
        setDoublePointDays(storeSettings.doublePointDays)
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
      // 会員ランク制度のON/OFF変更を検出
      const previousEnabled = storeSettings?.membershipRankSettings?.enabled || false
      const currentEnabled = membershipRankSettings.enabled

      await updateStoreRankingSettings({
        monthlyPrizes,
        pointSystem,
        doublePointDays,
        cashbackPointsSettings: rewardPointsSettings,
        announcement,
        membershipRankSettings,
      })

      // 会員ランク制度をOFFにした場合、全プレイヤーの獲得CP総額とランクをリセット
      if (previousEnabled && !currentEnabled) {
        const { resetAllPlayersMembershipData } = await import("@/lib/firestore")
        await resetAllPlayersMembershipData()
        handleSuccess("設定を保存し、全プレイヤーの会員ランクデータをリセットしました")
      } else {
        handleSuccess("設定を保存しました")
      }
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

  const addDailyRewardRate = () => {
    if (selectedRewardDate && dailyRate) {
      const dateString = format(selectedRewardDate, "yyyy-MM-dd")
      const rate = Number.parseFloat(dailyRate) || 0
      setRewardPointsSettings({
        ...rewardPointsSettings,
        dailyRates: {
          ...rewardPointsSettings.dailyRates,
          [dateString]: rate,
        },
      })
      setSelectedRewardDate(undefined)
      setDailyRate("10")
      setIsRewardCalendarOpen(false)
    }
  }

  const removeDailyRewardRate = (dateString: string) => {
    const newRates = { ...rewardPointsSettings.dailyRates }
    delete newRates[dateString]
    setRewardPointsSettings({
      ...rewardPointsSettings,
      dailyRates: newRates,
    })
  }

  if (loading) {
    return (
      <AuthGuard>
        <div className="min-h-screen bg-gray-50">
          <Header />
          <main className="container mx-auto px-4 py-8">
            <div className="text-center">読み込み中...</div>
          </main>
        </div>
      </AuthGuard>
    )
  }

  return (
    <AuthGuard>
      <div className="min-h-screen bg-gray-50">
        <Header />
        <main className="container mx-auto px-4 py-8 max-w-4xl">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">店舗設定</h1>
            <p className="text-gray-600">月間プライズ、ポイント制度、還元ポイントを管理します</p>
          </div>

          <div className="grid gap-6">
            {/* 月間プライズ設定 */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Gift className="h-5 w-5 text-yellow-500" />
                  月間プライズ設定
                </CardTitle>
                <CardDescription>月間ランキング1位・2位・3位のプライズ金額を設定します</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="first-prize">1位プライズ (©)</Label>
                    <Input
                      id="first-prize"
                      type="number"
                      value={monthlyPrizes.first}
                      onChange={(e) =>
                        setMonthlyPrizes({
                          ...monthlyPrizes,
                          first: Number.parseInt(e.target.value) || 0,
                        })
                      }
                      className="text-lg font-semibold"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="second-prize">2位プライズ (©)</Label>
                    <Input
                      id="second-prize"
                      type="number"
                      value={monthlyPrizes.second}
                      onChange={(e) =>
                        setMonthlyPrizes({
                          ...monthlyPrizes,
                          second: Number.parseInt(e.target.value) || 0,
                        })
                      }
                      className="text-lg font-semibold"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="third-prize">3位プライズ (©)</Label>
                    <Input
                      id="third-prize"
                      type="number"
                      value={monthlyPrizes.third}
                      onChange={(e) =>
                        setMonthlyPrizes({
                          ...monthlyPrizes,
                          third: Number.parseInt(e.target.value) || 0,
                        })
                      }
                      className="text-lg font-semibold"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* ポイントシステム設定 */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Trophy className="h-5 w-5 text-blue-500" />
                  RPシステム設定
                </CardTitle>
                <CardDescription>日別ランキングの順位別RPを設定します</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="first-points">1位</Label>
                    <Input
                      id="first-points"
                      type="number"
                      value={pointSystem.first}
                      onChange={(e) =>
                        setPointSystem({
                          ...pointSystem,
                          first: Number.parseInt(e.target.value) || 0,
                        })
                      }
                      className="text-center font-semibold"
                    />
                    <p className="text-xs text-gray-500 text-center">RP</p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="second-points">2位</Label>
                    <Input
                      id="second-points"
                      type="number"
                      value={pointSystem.second}
                      onChange={(e) =>
                        setPointSystem({
                          ...pointSystem,
                          second: Number.parseInt(e.target.value) || 0,
                        })
                      }
                      className="text-center font-semibold"
                    />
                    <p className="text-xs text-gray-500 text-center">RP</p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="third-points">3位</Label>
                    <Input
                      id="third-points"
                      type="number"
                      value={pointSystem.third}
                      onChange={(e) =>
                        setPointSystem({
                          ...pointSystem,
                          third: Number.parseInt(e.target.value) || 0,
                        })
                      }
                      className="text-center font-semibold"
                    />
                    <p className="text-xs text-gray-500 text-center">RP</p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="fourth-points">4位</Label>
                    <Input
                      id="fourth-points"
                      type="number"
                      value={pointSystem.fourth}
                      onChange={(e) =>
                        setPointSystem({
                          ...pointSystem,
                          fourth: Number.parseInt(e.target.value) || 0,
                        })
                      }
                      className="text-center font-semibold"
                    />
                    <p className="text-xs text-gray-500 text-center">RP</p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="fifth-points">5位</Label>
                    <Input
                      id="fifth-points"
                      type="number"
                      value={pointSystem.fifth}
                      onChange={(e) =>
                        setPointSystem({
                          ...pointSystem,
                          fifth: Number.parseInt(e.target.value) || 0,
                        })
                      }
                      className="text-center font-semibold"
                    />
                    <p className="text-xs text-gray-500 text-center">RP</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* ランキングポイント2倍デー設定 */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="h-5 w-5 text-orange-500" />
                  RP2倍デー設定
                </CardTitle>
                <CardDescription>特定の日をRP2倍デーに設定できます</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-2">
                  <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className="w-[240px] justify-start text-left font-normal bg-transparent"
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {selectedDate ? format(selectedDate, "yyyy年MM月dd日", { locale: ja }) : "日付を選択"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar mode="single" selected={selectedDate} onSelect={setSelectedDate} initialFocus />
                    </PopoverContent>
                  </Popover>
                  <Button
                    onClick={addDoublePointDay}
                    disabled={!selectedDate}
                    className="bg-orange-500 hover:bg-orange-600"
                  >
                    追加
                  </Button>
                </div>

                {doublePointDays.length > 0 && (
                  <div className="space-y-2">
                    <Label>設定済みRP2倍デー</Label>
                    <div className="flex flex-wrap gap-2">
                      {doublePointDays.map((dateString) => (
                        <Badge key={dateString} variant="secondary" className="flex items-center gap-1">
                          <Zap className="h-3 w-3" />
                          {format(new Date(dateString), "MM/dd", { locale: ja })}
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-4 w-4 p-0 hover:bg-red-100"
                            onClick={() => removeDoublePointDay(dateString)}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* リワードポイント還元設定 */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Gift className="h-5 w-5 text-purple-500" />
                  リワードポイント(P)還元設定
                </CardTitle>
                <CardDescription>購入金額に対するリワードポイント(P)還元率を設定します（1P = 1円）</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="base-reward-rate">基本還元率 (%)</Label>
                  <Input
                    id="base-reward-rate"
                    type="number"
                    step="0.1"
                    value={rewardPointsSettings.baseRate}
                    onChange={(e) =>
                      setRewardPointsSettings({
                        ...rewardPointsSettings,
                        baseRate: Number.parseFloat(e.target.value) || 0,
                      })
                    }
                    className="text-lg font-semibold max-w-xs"
                  />
                  <p className="text-xs text-gray-500">
                    例：5% = 1000円の購入で50Pが付与されます
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="usage-scope">ポイント使用対象</Label>
                  <select
                    id="usage-scope"
                    value={rewardPointsSettings.usageScope}
                    onChange={(e) =>
                      setRewardPointsSettings({
                        ...rewardPointsSettings,
                        usageScope: e.target.value as "all" | "stack_only",
                      })
                    }
                    className="w-full max-w-xs p-2 border rounded-md"
                  >
                    <option value="all">会計全体に使用可能</option>
                    <option value="stack_only">スタック購入のみに使用可能</option>
                  </select>
                  <p className="text-xs text-gray-500">
                    {rewardPointsSettings.usageScope === "all" 
                      ? "ドリンクや食事を含むすべての会計に使用できます"
                      : "スタック購入（トーナメント・リバイ含む）のみに使用できます"
                    }
                  </p>
                </div>

                <div className="space-y-2">
                  <Label>日別還元率設定</Label>
                  <div className="flex items-center gap-2 flex-wrap">
                    <Popover open={isRewardCalendarOpen} onOpenChange={setIsRewardCalendarOpen}>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className="w-[200px] justify-start text-left font-normal bg-transparent"
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {selectedRewardDate ? format(selectedRewardDate, "yyyy年MM月dd日", { locale: ja }) : "日付を選択"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar mode="single" selected={selectedRewardDate} onSelect={setSelectedRewardDate} initialFocus />
                      </PopoverContent>
                    </Popover>
                    <Input
                      type="number"
                      step="0.1"
                      value={dailyRate}
                      onChange={(e) => setDailyRate(e.target.value)}
                      placeholder="還元率(%)"
                      className="w-[120px]"
                    />
                    <Button
                      onClick={addDailyRewardRate}
                      disabled={!selectedRewardDate}
                      className="bg-purple-500 hover:bg-purple-600"
                    >
                      追加
                    </Button>
                  </div>
                  <p className="text-xs text-gray-500">
                    特定の日の還元率を変更できます（基本還元率より優先されます）
                  </p>
                </div>

                {Object.keys(rewardPointsSettings.dailyRates).length > 0 && (
                  <div className="space-y-2">
                    <Label>設定済み日別還元率</Label>
                    <div className="flex flex-wrap gap-2">
                      {Object.entries(rewardPointsSettings.dailyRates)
                        .sort(([a], [b]) => a.localeCompare(b))
                        .map(([dateString, rate]) => (
                          <Badge key={dateString} variant="secondary" className="flex items-center gap-1">
                            <Gift className="h-3 w-3" />
                            {format(new Date(dateString), "MM/dd", { locale: ja })} - {rate}%
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-4 w-4 p-0 hover:bg-red-100"
                              onClick={() => removeDailyRewardRate(dateString)}
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          </Badge>
                        ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* お知らせ機能 */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertCircle className="h-5 w-5 text-blue-500" />
                  お知らせメッセージ
                </CardTitle>
                <CardDescription>
                  顧客ビューページに表示されるお知らせメッセージを設定できます
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="announcement-message">メッセージ</Label>
                  <Input
                    id="announcement-message"
                    value={announcement.message}
                    onChange={(e) => setAnnouncement({ ...announcement, message: e.target.value })}
                    placeholder="例：明日は臨時休業となります"
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="announcement-visible"
                    checked={announcement.isVisible}
                    onChange={(e) => setAnnouncement({ ...announcement, isVisible: e.target.checked })}
                    className="h-4 w-4 text-blue-600 rounded"
                  />
                  <Label htmlFor="announcement-visible" className="cursor-pointer">
                    お知らせを表示する
                  </Label>
                </div>
              </CardContent>
            </Card>

            {/* 会員ランク設定 */}
            <Card className="shadow-md">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Trophy className="h-5 w-5 text-yellow-500" />
                  会員ランク制度
                </CardTitle>
                <CardDescription>
                  シルバー・ゴールド・プラチナの3段階の会員ランクを設定できます
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* ON/OFF切り替え */}
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="membership-enabled"
                    checked={membershipRankSettings.enabled}
                    onChange={(e) =>
                      setMembershipRankSettings({ ...membershipRankSettings, enabled: e.target.checked })
                    }
                    className="h-4 w-4 text-blue-600 rounded"
                  />
                  <Label htmlFor="membership-enabled" className="cursor-pointer font-semibold">
                    会員ランク制度を有効化
                  </Label>
                </div>

                {membershipRankSettings.enabled && (
                  <div className="space-y-6 border-t pt-6">
                    {/* シルバー会員 */}
                    <div className="space-y-4 p-4 bg-gray-50 rounded-lg">
                      <h3 className="font-semibold text-lg flex items-center gap-2">
                        <Badge variant="outline" className="bg-gray-400 text-white">
                          シルバー
                        </Badge>
                      </h3>
                      <div className="space-y-2">
                        <Label>必要累積CP</Label>
                        <Input
                          type="number"
                          value={membershipRankSettings.ranks.silver.requiredCP}
                          onChange={(e) =>
                            setMembershipRankSettings({
                              ...membershipRankSettings,
                              ranks: {
                                ...membershipRankSettings.ranks,
                                silver: {
                                  ...membershipRankSettings.ranks.silver,
                                  requiredCP: Number(e.target.value),
                                },
                              },
                            })
                          }
                          placeholder="1000"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>CP率アップ（%）</Label>
                        <Input
                          type="number"
                          value={membershipRankSettings.ranks.silver.benefits.cpBoostPercentage}
                          onChange={(e) =>
                            setMembershipRankSettings({
                              ...membershipRankSettings,
                              ranks: {
                                ...membershipRankSettings.ranks,
                                silver: {
                                  ...membershipRankSettings.ranks.silver,
                                  benefits: {
                                    ...membershipRankSettings.ranks.silver.benefits,
                                    cpBoostPercentage: Number(e.target.value),
                                  },
                                },
                              },
                            })
                          }
                          placeholder="0"
                        />
                      </div>
                      <div className="flex items-center space-x-4">
                        <div className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            id="silver-free-drink"
                            checked={membershipRankSettings.ranks.silver.benefits.freeDrink}
                            onChange={(e) =>
                              setMembershipRankSettings({
                                ...membershipRankSettings,
                                ranks: {
                                  ...membershipRankSettings.ranks,
                                  silver: {
                                    ...membershipRankSettings.ranks.silver,
                                    benefits: {
                                      ...membershipRankSettings.ranks.silver.benefits,
                                      freeDrink: e.target.checked,
                                    },
                                  },
                                },
                              })
                            }
                            className="h-4 w-4 text-blue-600 rounded"
                          />
                          <Label htmlFor="silver-free-drink" className="cursor-pointer">
                            ワンドリンク無料
                          </Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            id="silver-free-charge"
                            checked={membershipRankSettings.ranks.silver.benefits.freeCharge}
                            onChange={(e) =>
                              setMembershipRankSettings({
                                ...membershipRankSettings,
                                ranks: {
                                  ...membershipRankSettings.ranks,
                                  silver: {
                                    ...membershipRankSettings.ranks.silver,
                                    benefits: {
                                      ...membershipRankSettings.ranks.silver.benefits,
                                      freeCharge: e.target.checked,
                                    },
                                  },
                                },
                              })
                            }
                            className="h-4 w-4 text-blue-600 rounded"
                          />
                          <Label htmlFor="silver-free-charge" className="cursor-pointer">
                            チャージ無料
                          </Label>
                        </div>
                      </div>
                    </div>

                    {/* ゴールド会員 */}
                    <div className="space-y-4 p-4 bg-yellow-50 rounded-lg">
                      <h3 className="font-semibold text-lg flex items-center gap-2">
                        <Badge variant="outline" className="bg-yellow-500 text-white">
                          ゴールド
                        </Badge>
                      </h3>
                      <div className="space-y-2">
                        <Label>必要累積CP</Label>
                        <Input
                          type="number"
                          value={membershipRankSettings.ranks.gold.requiredCP}
                          onChange={(e) =>
                            setMembershipRankSettings({
                              ...membershipRankSettings,
                              ranks: {
                                ...membershipRankSettings.ranks,
                                gold: {
                                  ...membershipRankSettings.ranks.gold,
                                  requiredCP: Number(e.target.value),
                                },
                              },
                            })
                          }
                          placeholder="5000"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>CP率アップ（%）</Label>
                        <Input
                          type="number"
                          value={membershipRankSettings.ranks.gold.benefits.cpBoostPercentage}
                          onChange={(e) =>
                            setMembershipRankSettings({
                              ...membershipRankSettings,
                              ranks: {
                                ...membershipRankSettings.ranks,
                                gold: {
                                  ...membershipRankSettings.ranks.gold,
                                  benefits: {
                                    ...membershipRankSettings.ranks.gold.benefits,
                                    cpBoostPercentage: Number(e.target.value),
                                  },
                                },
                              },
                            })
                          }
                          placeholder="0"
                        />
                      </div>
                      <div className="flex items-center space-x-4">
                        <div className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            id="gold-free-drink"
                            checked={membershipRankSettings.ranks.gold.benefits.freeDrink}
                            onChange={(e) =>
                              setMembershipRankSettings({
                                ...membershipRankSettings,
                                ranks: {
                                  ...membershipRankSettings.ranks,
                                  gold: {
                                    ...membershipRankSettings.ranks.gold,
                                    benefits: {
                                      ...membershipRankSettings.ranks.gold.benefits,
                                      freeDrink: e.target.checked,
                                    },
                                  },
                                },
                              })
                            }
                            className="h-4 w-4 text-blue-600 rounded"
                          />
                          <Label htmlFor="gold-free-drink" className="cursor-pointer">
                            ワンドリンク無料
                          </Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            id="gold-free-charge"
                            checked={membershipRankSettings.ranks.gold.benefits.freeCharge}
                            onChange={(e) =>
                              setMembershipRankSettings({
                                ...membershipRankSettings,
                                ranks: {
                                  ...membershipRankSettings.ranks,
                                  gold: {
                                    ...membershipRankSettings.ranks.gold,
                                    benefits: {
                                      ...membershipRankSettings.ranks.gold.benefits,
                                      freeCharge: e.target.checked,
                                    },
                                  },
                                },
                              })
                            }
                            className="h-4 w-4 text-blue-600 rounded"
                          />
                          <Label htmlFor="gold-free-charge" className="cursor-pointer">
                            チャージ無料
                          </Label>
                        </div>
                      </div>
                    </div>

                    {/* プラチナ会員 */}
                    <div className="space-y-4 p-4 bg-purple-50 rounded-lg">
                      <h3 className="font-semibold text-lg flex items-center gap-2">
                        <Badge variant="outline" className="bg-purple-600 text-white">
                          プラチナ
                        </Badge>
                      </h3>
                      <div className="space-y-2">
                        <Label>必要累積CP</Label>
                        <Input
                          type="number"
                          value={membershipRankSettings.ranks.platinum.requiredCP}
                          onChange={(e) =>
                            setMembershipRankSettings({
                              ...membershipRankSettings,
                              ranks: {
                                ...membershipRankSettings.ranks,
                                platinum: {
                                  ...membershipRankSettings.ranks.platinum,
                                  requiredCP: Number(e.target.value),
                                },
                              },
                            })
                          }
                          placeholder="10000"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>CP率アップ（%）</Label>
                        <Input
                          type="number"
                          value={membershipRankSettings.ranks.platinum.benefits.cpBoostPercentage}
                          onChange={(e) =>
                            setMembershipRankSettings({
                              ...membershipRankSettings,
                              ranks: {
                                ...membershipRankSettings.ranks,
                                platinum: {
                                  ...membershipRankSettings.ranks.platinum,
                                  benefits: {
                                    ...membershipRankSettings.ranks.platinum.benefits,
                                    cpBoostPercentage: Number(e.target.value),
                                  },
                                },
                              },
                            })
                          }
                          placeholder="0"
                        />
                      </div>
                      <div className="flex items-center space-x-4">
                        <div className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            id="platinum-free-drink"
                            checked={membershipRankSettings.ranks.platinum.benefits.freeDrink}
                            onChange={(e) =>
                              setMembershipRankSettings({
                                ...membershipRankSettings,
                                ranks: {
                                  ...membershipRankSettings.ranks,
                                  platinum: {
                                    ...membershipRankSettings.ranks.platinum,
                                    benefits: {
                                      ...membershipRankSettings.ranks.platinum.benefits,
                                      freeDrink: e.target.checked,
                                    },
                                  },
                                },
                              })
                            }
                            className="h-4 w-4 text-blue-600 rounded"
                          />
                          <Label htmlFor="platinum-free-drink" className="cursor-pointer">
                            ワンドリンク無料
                          </Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            id="platinum-free-charge"
                            checked={membershipRankSettings.ranks.platinum.benefits.freeCharge}
                            onChange={(e) =>
                              setMembershipRankSettings({
                                ...membershipRankSettings,
                                ranks: {
                                  ...membershipRankSettings.ranks,
                                  platinum: {
                                    ...membershipRankSettings.ranks.platinum,
                                    benefits: {
                                      ...membershipRankSettings.ranks.platinum.benefits,
                                      freeCharge: e.target.checked,
                                    },
                                  },
                                },
                              })
                            }
                            className="h-4 w-4 text-blue-600 rounded"
                          />
                          <Label htmlFor="platinum-free-charge" className="cursor-pointer">
                            チャージ無料
                          </Label>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* 保存ボタン */}
            <div className="flex justify-end">
              <Button onClick={handleSave} disabled={saving} className="bg-blue-600 hover:bg-blue-700 px-8">
                {saving ? "保存中..." : "設定を保存"}
              </Button>
            </div>
          </div>
        </main>

        <PasswordModal
          open={showPasswordModal}
          onClose={() => setShowPasswordModal(false)}
          onSuccess={handlePasswordSuccess}
          title="店舗設定の変更"
          description="店舗設定を変更するにはスタックマンパスワードが必要です。"
        />
      </div>
    </AuthGuard>
  )
}
