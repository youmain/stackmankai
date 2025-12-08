"use client"

import { useState, useEffect } from "react"
import { AuthGuard } from "@/components/auth-guard"
import { Header } from "@/components/header"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Plus, Search, Users, Clock } from "lucide-react"
import { subscribeToActiveGames } from "@/lib/firestore"
import type { Game } from "@/types"
import { GameCreationModal } from "@/components/game-creation-modal"
import Link from "next/link"

export default function GamesPage() {
  const [games, setGames] = useState<Game[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [showCreationModal, setShowCreationModal] = useState(false)

  useEffect(() => {
    const unsubscribe = subscribeToActiveGames(setGames)
    return unsubscribe
  }, [])

  const filteredGames = games.filter((game) => game.name.toLowerCase().includes(searchTerm.toLowerCase()))

  return (
    <AuthGuard>
      <div className="min-h-screen bg-gray-50">
        <Header />
        <main className="container mx-auto px-4 py-8" role="main" aria-label="ゲーム管理">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold">ゲーム管理</h1>
              <p className="text-muted-foreground mt-2">ゲーム作成・参加者管理・スタック管理</p>
            </div>
            <Button onClick={() => setShowCreationModal(true)} aria-label="新規ゲームを作成">
              <Plus className="h-4 w-4 mr-2" aria-hidden="true" />
              新規ゲーム作成
            </Button>
          </div>

          <div className="mb-6" role="search">
            <div className="relative max-w-md">
              <Search
                className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground"
                aria-hidden="true"
              />
              <Input
                placeholder="ゲーム名で検索..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
                aria-label="ゲーム検索"
              />
            </div>
          </div>

          <div
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
            role="list"
            aria-label="ゲーム一覧"
            aria-live="polite"
          >
            {filteredGames.map((game) => (
              <Link key={game.id} href={`/games/${game.id}`}>
                <Card className="hover:shadow-md transition-shadow cursor-pointer" role="listitem">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">{game.name}</CardTitle>
                      <Badge variant="default" aria-label="ゲーム状態: 進行中">
                        進行中
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center space-x-1">
                          <Users className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
                          <span aria-label={`${game.participants.length}人が参加中`}>
                            {game.participants.length}人参加
                          </span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Clock className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
                          <span aria-label={`作成日: ${game.createdAt.toLocaleDateString("ja-JP")}`}>
                            {game.createdAt.toLocaleDateString("ja-JP")}
                          </span>
                        </div>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        <p
                          aria-label={`総スタック: ${game.participants.reduce((total, p) => total + p.currentStack, 0).toLocaleString()}円`}
                        >
                          総スタック: ¥
                          {game.participants.reduce((total, p) => total + p.currentStack, 0).toLocaleString()}
                        </p>
                        <p
                          aria-label={`総購入額: ${game.participants.reduce((total, p) => total + p.buyInAmount + p.additionalBuyIns, 0).toLocaleString()}円`}
                        >
                          総購入額: ¥
                          {game.participants
                            .reduce((total, p) => total + p.buyInAmount + p.additionalBuyIns, 0)
                            .toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>

          {filteredGames.length === 0 && (
            <div className="text-center py-12" role="status" aria-live="polite">
              <p className="text-muted-foreground">
                {searchTerm ? "検索条件に一致するゲームが見つかりません" : "アクティブなゲームがありません"}
              </p>
            </div>
          )}
        </main>

        <GameCreationModal open={showCreationModal} onClose={() => setShowCreationModal(false)} />
      </div>
    </AuthGuard>
  )
}
