"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Plus, Search, Settings } from "lucide-react"

interface PlayersHeaderProps {
  searchTerm: string
  onSearchChange: (value: string) => void
  onShowRegistration: () => void
  onShowPasswordSettings: () => void
}

export function PlayersHeader({
  searchTerm,
  onSearchChange,
  onShowRegistration,
  onShowPasswordSettings,
}: PlayersHeaderProps) {
  return (
    <div className="mb-6 sm:mb-8 lg:mb-10">
      <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-4 sm:mb-6 lg:mb-8">プレイヤー管理</h1>

      <nav className="flex flex-wrap gap-2 sm:gap-3 lg:gap-4 mb-4 sm:mb-6 lg:mb-8">
        <Button
          variant="outline"
          onClick={onShowPasswordSettings}
          className="w-full sm:w-auto lg:px-6 lg:py-3 lg:text-base"
          aria-label="パスワード設定を開く"
        >
          <Settings className="h-4 w-4 lg:h-5 lg:w-5 mr-2" aria-hidden="true" />
          パスワード設定
        </Button>
        <Button
          onClick={onShowRegistration}
          className="w-full sm:w-auto lg:px-6 lg:py-3 lg:text-base"
          aria-label="新規プレイヤーを登録"
        >
          <Plus className="h-4 w-4 lg:h-5 lg:w-5 mr-2" aria-hidden="true" />
          新規プレイヤー登録
        </Button>
      </nav>

      <div className="mb-4 sm:mb-6 lg:mb-8" role="search">
        <div className="relative w-full sm:max-w-md lg:max-w-lg">
          <Search
            className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 lg:h-5 lg:w-5 text-muted-foreground"
            aria-hidden="true"
          />
          <Input
            placeholder="プレイヤー名・ポーカーネーム・読み仮名で検索..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-10 lg:pl-12 lg:py-3 lg:text-base"
            aria-label="プレイヤー検索"
          />
        </div>
      </div>
    </div>
  )
}
