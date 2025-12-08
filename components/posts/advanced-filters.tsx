"use client"

import { Label } from "@/components/ui/label"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Slider } from "@/components/ui/slider"
import { Filter, X } from "lucide-react"

export interface FilterOptions {
  visibility: ("public" | "store" | "friends")[]
  seekingAdvice: boolean | null
  stores: string[]
  dateRange: "all" | "today" | "week" | "month" | "year"
  minLikes: number
  minComments: number
  stages: ("preflop" | "flop" | "turn" | "river")[]
}

interface AdvancedFiltersProps {
  filters: FilterOptions
  onChange: (filters: FilterOptions) => void
  availableStores: { id: string; name: string }[]
  isOpen: boolean
  onToggle: () => void
}

export function AdvancedFilters({ filters, onChange, availableStores, isOpen, onToggle }: AdvancedFiltersProps) {
  const [tempFilters, setTempFilters] = useState<FilterOptions>(filters)

  const handleApplyFilters = () => {
    onChange(tempFilters)
    onToggle()
  }

  const handleResetFilters = () => {
    const resetFilters: FilterOptions = {
      visibility: ["public", "store"],
      seekingAdvice: null,
      stores: [],
      dateRange: "all",
      minLikes: 0,
      minComments: 0,
      stages: [],
    }
    setTempFilters(resetFilters)
    onChange(resetFilters)
  }

  const getActiveFilterCount = () => {
    let count = 0
    if (tempFilters.visibility.length < 2) count++
    if (tempFilters.seekingAdvice !== null) count++
    if (tempFilters.stores.length > 0) count++
    if (tempFilters.dateRange !== "all") count++
    if (tempFilters.minLikes > 0) count++
    if (tempFilters.minComments > 0) count++
    if (tempFilters.stages.length > 0) count++
    return count
  }

  if (!isOpen) {
    return (
      <Button variant="outline" onClick={onToggle} className="flex items-center gap-2 bg-transparent">
        <Filter className="w-4 h-4" />
        詳細フィルター
        {getActiveFilterCount() > 0 && <Badge variant="secondary">{getActiveFilterCount()}</Badge>}
      </Button>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Filter className="w-5 h-5" />
            詳細フィルター
          </CardTitle>
          <Button variant="ghost" size="sm" onClick={onToggle}>
            <X className="w-4 h-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* 公開範囲 */}
        <div>
          <h4 className="font-semibold mb-3">公開範囲</h4>
          <div className="space-y-2">
            {[
              { value: "public", label: "公開投稿" },
              { value: "store", label: "店舗限定" },
              { value: "friends", label: "フレンド限定" },
            ].map((option) => (
              <div key={option.value} className="flex items-center space-x-2">
                <Checkbox
                  id={`visibility-${option.value}`}
                  checked={tempFilters.visibility.includes(option.value as any)}
                  onCheckedChange={(checked) => {
                    if (checked) {
                      setTempFilters({
                        ...tempFilters,
                        visibility: [...tempFilters.visibility, option.value as any],
                      })
                    } else {
                      setTempFilters({
                        ...tempFilters,
                        visibility: tempFilters.visibility.filter((v) => v !== option.value),
                      })
                    }
                  }}
                />
                <Label htmlFor={`visibility-${option.value}`}>{option.label}</Label>
              </div>
            ))}
          </div>
        </div>

        {/* アドバイス求む */}
        <div>
          <h4 className="font-semibold mb-3">アドバイス</h4>
          <Select
            value={tempFilters.seekingAdvice === null ? "all" : tempFilters.seekingAdvice ? "yes" : "no"}
            onValueChange={(value) => {
              setTempFilters({
                ...tempFilters,
                seekingAdvice: value === "all" ? null : value === "yes",
              })
            }}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">すべて</SelectItem>
              <SelectItem value="yes">アドバイス求む</SelectItem>
              <SelectItem value="no">通常投稿</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* 店舗 */}
        <div>
          <h4 className="font-semibold mb-3">店舗</h4>
          <div className="space-y-2 max-h-32 overflow-y-auto">
            {availableStores.map((store) => (
              <div key={store.id} className="flex items-center space-x-2">
                <Checkbox
                  id={`store-${store.id}`}
                  checked={tempFilters.stores.includes(store.id)}
                  onCheckedChange={(checked) => {
                    if (checked) {
                      setTempFilters({
                        ...tempFilters,
                        stores: [...tempFilters.stores, store.id],
                      })
                    } else {
                      setTempFilters({
                        ...tempFilters,
                        stores: tempFilters.stores.filter((s) => s !== store.id),
                      })
                    }
                  }}
                />
                <Label htmlFor={`store-${store.id}`}>{store.name}</Label>
              </div>
            ))}
          </div>
        </div>

        {/* 期間 */}
        <div>
          <h4 className="font-semibold mb-3">投稿期間</h4>
          <Select
            value={tempFilters.dateRange}
            onValueChange={(value: any) => setTempFilters({ ...tempFilters, dateRange: value })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">すべて</SelectItem>
              <SelectItem value="today">今日</SelectItem>
              <SelectItem value="week">1週間以内</SelectItem>
              <SelectItem value="month">1ヶ月以内</SelectItem>
              <SelectItem value="year">1年以内</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* 最小いいね数 */}
        <div>
          <h4 className="font-semibold mb-3">最小いいね数: {tempFilters.minLikes}</h4>
          <Slider
            value={[tempFilters.minLikes]}
            onValueChange={([value]) => setTempFilters({ ...tempFilters, minLikes: value })}
            max={50}
            step={1}
            className="w-full"
          />
        </div>

        {/* 最小コメント数 */}
        <div>
          <h4 className="font-semibold mb-3">最小コメント数: {tempFilters.minComments}</h4>
          <Slider
            value={[tempFilters.minComments]}
            onValueChange={([value]) => setTempFilters({ ...tempFilters, minComments: value })}
            max={20}
            step={1}
            className="w-full"
          />
        </div>

        {/* ステージ */}
        <div>
          <h4 className="font-semibold mb-3">含まれるステージ</h4>
          <div className="grid grid-cols-2 gap-2">
            {[
              { value: "preflop", label: "プリフロップ" },
              { value: "flop", label: "フロップ" },
              { value: "turn", label: "ターン" },
              { value: "river", label: "リバー" },
            ].map((stage) => (
              <div key={stage.value} className="flex items-center space-x-2">
                <Checkbox
                  id={`stage-${stage.value}`}
                  checked={tempFilters.stages.includes(stage.value as any)}
                  onCheckedChange={(checked) => {
                    if (checked) {
                      setTempFilters({
                        ...tempFilters,
                        stages: [...tempFilters.stages, stage.value as any],
                      })
                    } else {
                      setTempFilters({
                        ...tempFilters,
                        stages: tempFilters.stages.filter((s) => s !== stage.value),
                      })
                    }
                  }}
                />
                <Label htmlFor={`stage-${stage.value}`}>{stage.label}</Label>
              </div>
            ))}
          </div>
        </div>

        {/* アクションボタン */}
        <div className="flex gap-2 pt-4 border-t">
          <Button onClick={handleApplyFilters} className="flex-1">
            フィルターを適用
          </Button>
          <Button variant="outline" onClick={handleResetFilters}>
            リセット
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
