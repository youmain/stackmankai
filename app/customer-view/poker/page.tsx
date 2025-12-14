"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { MessageCircle, X, ArrowLeft } from "lucide-react"
import { ChatRoom } from "@/components/chat/chat-room"
import PokerTableMobile from "@/components/poker/poker-table-mobile"
import { PokerGame } from "@/types/poker"

export default function PokerPage() {
  const router = useRouter()
  const [isChatOpen, setIsChatOpen] = useState(false)
  
  // テスト用のゲームデータ
  const [game] = useState<PokerGame>({
    id: "test-game-1",
    phase: "playing",
    pot: 15000,
    currentBet: 500,
    communityCards: [
      { suit: "diamonds", rank: "Q" },
      { suit: "clubs", rank: "J" },
      { suit: "hearts", rank: "10" },
      { suit: "spades", rank: "9" },
      { suit: "diamonds", rank: "8" }
    ],
    players: [
      {
        userId: "user1",
        userName: "プレイヤー1",
        seatIndex: 0,
        stack: 10000,
        currentBet: 500,
        cards: [
          { suit: "hearts", rank: "A" },
          { suit: "spades", rank: "K" }
        ],
        isFolded: false,
        lastAction: "bet"
      },
      {
        userId: "user2",
        userName: "プレイヤー2",
        seatIndex: 2,
        stack: 8500,
        currentBet: 500,
        cards: [],
        isFolded: false,
        lastAction: "call"
      },
      {
        userId: "user3",
        userName: "プレイヤー3",
        seatIndex: 4,
        stack: 12000,
        currentBet: 0,
        cards: [],
        isFolded: true,
        lastAction: "fold"
      },
      {
        userId: "user4",
        userName: "プレイヤー4",
        seatIndex: 6,
        stack: 9500,
        currentBet: 500,
        cards: [],
        isFolded: false,
        lastAction: "call"
      }
    ],
    currentPlayerIndex: 0,
    dealerIndex: 0,
    smallBlindIndex: 2,
    bigBlindIndex: 4,
    createdAt: new Date(),
    updatedAt: new Date()
  })

  const handleJoinSeat = (seatIndex: number) => {
    console.log("座席に着席:", seatIndex)
    // TODO: Firestoreに座席情報を保存
  }

  const handleAction = (action: string, amount?: number) => {
    console.log("アクション:", action, amount)
    // TODO: Firestoreにアクション情報を保存
  }

  const handleStartGame = () => {
    console.log("ゲーム開始")
    // TODO: Firestoreにゲーム開始情報を保存
  }

  return (
    <div className="relative h-screen overflow-hidden">
      {/* 戻るボタン（左上固定） */}
      <Button
        variant="ghost"
        size="sm"
        onClick={() => router.push("/customer-view")}
        className="absolute top-2 left-2 z-50 bg-gray-800/80 text-white hover:bg-gray-700"
      >
        <ArrowLeft className="h-4 w-4" />
      </Button>

      {/* ポーカーテーブル */}
      <PokerTableMobile
        game={game}
        currentUserId="user1"
        onJoinSeat={handleJoinSeat}
        onAction={handleAction}
        onStartGame={handleStartGame}
      />

      {/* チャットドロワー */}
      <div
        className={`fixed bottom-0 left-0 right-0 bg-white shadow-2xl transition-transform duration-300 z-40 ${
          isChatOpen ? "translate-y-0" : "translate-y-full"
        }`}
        style={{ height: "60vh" }}
      >
        <div className="h-full flex flex-col">
          {/* チャットヘッダー */}
          <div className="bg-purple-600 text-white px-4 py-3 flex items-center justify-between">
            <h2 className="font-bold text-lg">チャット</h2>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsChatOpen(false)}
              className="text-white hover:bg-purple-700"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>

          {/* チャット内容 */}
          <div className="flex-1 overflow-hidden">
            <ChatRoom />
          </div>
        </div>
      </div>

      {/* チャット開閉ボタン */}
      {!isChatOpen && (
        <Button
          onClick={() => setIsChatOpen(true)}
          className="fixed bottom-4 right-4 rounded-full w-14 h-14 shadow-lg z-50 bg-purple-600 hover:bg-purple-700"
        >
          <MessageCircle className="h-6 w-6" />
        </Button>
      )}
    </div>
  )
}
