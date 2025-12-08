"use client"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import { AuthGuard } from "@/components/auth-guard"
import { Header } from "@/components/header"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, UserPlus, DollarSign } from "lucide-react"
import { doc, onSnapshot } from "firebase/firestore"
import { db } from "@/lib/firebase"
import type { Game, Player, GameParticipant } from "@/types"
import { subscribeToPlayers } from "@/lib/firestore"
import { PlayerJoinModal } from "@/components/player-join-modal"
import { StackManagementModal } from "@/components/stack-management-modal"
import { GameEndModal } from "@/components/game-end-modal"
import Link from "next/link"

export default function GameDetailPage() {
  const params = useParams()
  const gameId = params.id as string

  const [game, setGame] = useState<Game | null>(null)
  const [players, setPlayers] = useState<Player[]>([])
  const [loading, setLoading] = useState(true)
  const [showJoinModal, setShowJoinModal] = useState(false)
  const [showStackModal, setShowStackModal] = useState(false)
  const [showEndModal, setShowEndModal] = useState(false)
  const [selectedParticipant, setSelectedParticipant] = useState<GameParticipant | null>(null)

  useEffect(() => {
    if (!gameId) return

    const gameRef = doc(db, "games", gameId)
    const unsubscribeGame = onSnapshot(gameRef, (doc) => {
      if (doc.exists()) {
        const data = doc.data()
        setGame({
          id: doc.id,
          name: data.name,
          isActive: data.isActive,
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date(),
          participants: data.participants || [],
        })
      }
      setLoading(false)
    })

    const unsubscribePlayers = subscribeToPlayers(setPlayers)

    return () => {
      unsubscribeGame()
      unsubscribePlayers()
    }
  }, [gameId])

  const handleStackManagement = (participant: GameParticipant) => {
    setSelectedParticipant(participant)
    setShowStackModal(true)
  }

  if (loading) {
    return (
      <AuthGuard>
        <div className="min-h-screen bg-gray-50">
          <Header />
          <div className="container mx-auto px-4 py-8">
            <div className="flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          </div>
        </div>
      </AuthGuard>
    )
  }

  if (!game) {
    return (
      <AuthGuard>
        <div className="min-h-screen bg-gray-50">
          <Header />
          <div className="container mx-auto px-4 py-8">
            <div className="text-center">
              <p className="text-muted-foreground">ゲームが見つかりません</p>
              <Link href="/games">
                <Button className="mt-4">ゲーム一覧に戻る</Button>
              </Link>
            </div>
          </div>
        </div>
      </AuthGuard>
    )
  }

  const totalStack = game.participants.reduce((total, p) => total + p.currentStack, 0)
  const totalBuyIn = game.participants.reduce((total, p) => total + p.buyInAmount + p.additionalBuyIns, 0)

  return (
    <AuthGuard>
      <div className="min-h-screen bg-gray-50">
        <Header />
        <main className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center space-x-4">
              <Link href="/games">
                <Button variant="outline" size="sm">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  戻る
                </Button>
              </Link>
              <div>
                <h1 className="text-3xl font-bold">{game.name}</h1>
                <p className="text-muted-foreground mt-2">
                  {game.participants.length}人参加 • 開始: {game.createdAt.toLocaleDateString("ja-JP")}
                </p>
              </div>
            </div>
            <div className="flex space-x-2">
              <Button onClick={() => setShowJoinModal(true)}>
                <UserPlus className="h-4 w-4 mr-2" />
                プレイヤー参加
              </Button>
              <Button variant="destructive" onClick={() => setShowEndModal(true)}>
                ゲーム終了
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">総スタック</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">¥{totalStack.toLocaleString()}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">総購入額</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">¥{totalBuyIn.toLocaleString()}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">損益</CardTitle>
              </CardHeader>
              <CardContent>
                <p className={`text-2xl font-bold ${totalStack - totalBuyIn >= 0 ? "text-green-600" : "text-red-600"}`}>
                  ¥{(totalStack - totalBuyIn).toLocaleString()}
                </p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>参加者一覧</CardTitle>
            </CardHeader>
            <CardContent>
              {game.participants.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">参加者がいません</div>
              ) : (
                <div className="space-y-4">
                  {game.participants.map((participant, index) => (
                    <div key={participant.playerId} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center space-x-4">
                        <div className="w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-medium">
                          {index + 1}
                        </div>
                        <div>
                          <p className="font-medium">{participant.playerName}</p>
                          <p className="text-sm text-muted-foreground">
                            参加: {new Date(participant.joinedAt).toLocaleString("ja-JP")}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-4">
                        <div className="text-right">
                          <p className="font-medium">¥{participant.currentStack.toLocaleString()}</p>
                          <p className="text-sm text-muted-foreground">
                            購入: ¥{(participant.buyInAmount + participant.additionalBuyIns).toLocaleString()}
                          </p>
                        </div>
                        <Badge
                          variant={
                            participant.currentStack - (participant.buyInAmount + participant.additionalBuyIns) >= 0
                              ? "default"
                              : "destructive"
                          }
                        >
                          {participant.currentStack - (participant.buyInAmount + participant.additionalBuyIns) >= 0
                            ? "+"
                            : ""}
                          ¥
                          {(
                            participant.currentStack -
                            (participant.buyInAmount + participant.additionalBuyIns)
                          ).toLocaleString()}
                        </Badge>
                        <Button variant="outline" size="sm" onClick={() => handleStackManagement(participant)}>
                          <DollarSign className="h-4 w-4 mr-1" />
                          スタック管理
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </main>

        <PlayerJoinModal
          open={showJoinModal}
          onClose={() => setShowJoinModal(false)}
          gameId={gameId}
          players={players}
          currentParticipants={game.participants}
        />

        {selectedParticipant && (
          <StackManagementModal
            open={showStackModal}
            onClose={() => {
              setShowStackModal(false)
              setSelectedParticipant(null)
            }}
            gameId={gameId}
            participant={selectedParticipant}
          />
        )}

        <GameEndModal open={showEndModal} onClose={() => setShowEndModal(false)} game={game} />
      </div>
    </AuthGuard>
  )
}
