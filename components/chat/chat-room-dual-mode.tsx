"use client"

import { useState, useEffect, useRef } from "react"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Send, AlertCircle } from "lucide-react"
import { subscribeToChatMessages, sendChatMessage, subscribeToActiveUsers, setUserPresence, removeUserPresence } from "@/lib/firestore"
import { createPokerGame, joinPokerGame, leavePokerGame, performAction, startNewHand, subscribeToPokerGame } from "@/lib/poker-game"
import { handlePlayerTimeout, getRemainingTime } from "@/lib/poker-timeout"
import { deletePokerGame } from "@/lib/poker-game-reset"
import type { ChatMessage } from "@/types"
import type { PokerGameState } from "@/types/poker"
import { useAuth } from "@/contexts/auth-context"
import { PokerTable } from "@/components/poker/poker-table"
import { ViewModeHeader } from "@/components/poker/view-mode-header"
import { TurnNotification } from "@/components/poker/turn-notification"
import { useViewMode } from "@/hooks/use-view-mode"

export function ChatRoomDualMode() {
  const { customerAccount } = useAuth()
  const { viewMode, setViewMode } = useViewMode()
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [newMessage, setNewMessage] = useState("")
  const [isSending, setIsSending] = useState(false)
  const [error, setError] = useState("")
  const [hiddenMessageIds, setHiddenMessageIds] = useState<Set<string>>(new Set())
  const [activeUsers, setActiveUsers] = useState<Array<{ userId: string; userName: string }>>([])
  const [pokerGame, setPokerGame] = useState<PokerGameState | null>(null)
  const [pokerGameId, setPokerGameId] = useState<string | null>(null)
  const [showTurnNotification, setShowTurnNotification] = useState(false)
  const scrollAreaRef = useRef<HTMLDivElement>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // 自分のターンかどうかを判定
  const isMyTurn = pokerGame && 
    pokerGame.currentPlayerIndex !== undefined && 
    pokerGame.players[pokerGame.currentPlayerIndex]?.userId === customerAccount?.id &&
    pokerGame.phase !== "waiting" && 
    pokerGame.phase !== "showdown"

  // 自分のターンが来たら通知を表示（ポーカーモード以外）
  useEffect(() => {
    if (isMyTurn && viewMode !== 'poker') {
      setShowTurnNotification(true)
    } else {
      setShowTurnNotification(false)
    }
  }, [isMyTurn, viewMode])

  // ローカルストレージから非表示メッセージIDを読み込む
  useEffect(() => {
    const storageKey = `hiddenMessages_${customerAccount?.storeId}`
    const stored = localStorage.getItem(storageKey)
    if (stored) {
      try {
        setHiddenMessageIds(new Set(JSON.parse(stored)))
      } catch (e) {
        console.error("Failed to parse hidden messages:", e)
      }
    }
  }, [customerAccount?.storeId])

  // メッセージが更新されたら最下部にスクロール
  useEffect(() => {
    const scrollToBottom = () => {
      if (messagesEndRef.current) {
        messagesEndRef.current.scrollIntoView({ behavior: 'smooth' })
      }
    }
    // 少し遅延させて確実にスクロール
    const timer = setTimeout(scrollToBottom, 100)
    return () => clearTimeout(timer)
  }, [messages])

  // チャットメッセージの購読
  useEffect(() => {
    if (!customerAccount?.storeId) return

    const unsubscribe = subscribeToChatMessages(customerAccount.storeId, (newMessages) => {
      setMessages(newMessages)
    })

    return () => unsubscribe()
  }, [customerAccount?.storeId])

  // アクティブユーザーの購読
  useEffect(() => {
    if (!customerAccount?.storeId) return

    const unsubscribe = subscribeToActiveUsers(customerAccount.storeId, (users) => {
      setActiveUsers(users)
    })

    return () => unsubscribe()
  }, [customerAccount?.storeId])

  // ユーザープレゼンスの設定
  useEffect(() => {
    if (!customerAccount) return

    const displayName = customerAccount.playerName || customerAccount.email.split("@")[0]
    setUserPresence(customerAccount.storeId, customerAccount.id, displayName)

    return () => {
      removeUserPresence(customerAccount.storeId, customerAccount.id)
    }
  }, [customerAccount])

  // ポーカーゲームの初期化と購読
  useEffect(() => {
    if (!customerAccount?.storeId) return

    const storageKey = `pokerGameId_${customerAccount.storeId}`
    const savedGameId = localStorage.getItem(storageKey)

    const initGame = async () => {
      try {
        let gameId = savedGameId
        if (!gameId) {
          gameId = await createPokerGame(customerAccount.storeId, 50, 100)
          localStorage.setItem(storageKey, gameId)
        }
        setPokerGameId(gameId)
      } catch (err) {
        console.error("Error initializing poker game:", err)
        setError("ポーカーゲームの初期化に失敗しました")
      }
    }

    initGame()
  }, [customerAccount?.storeId])

  useEffect(() => {
    if (!customerAccount?.storeId || !pokerGameId) return

    const unsubscribe = subscribeToPokerGame(
      customerAccount.storeId,
      pokerGameId,
      (game) => {
        setPokerGame(game)
      }
    )

    return () => unsubscribe()
  }, [customerAccount?.storeId, pokerGameId])

  // タイムアウト監視 - 一時的に無効化（UIのカウントダウンテスト用）
  // TODO: サーバー側でタイムアウト処理を実装する
  /*
  useEffect(() => {
    if (!customerAccount || !pokerGameId || !pokerGame) return
    if (pokerGame.phase === "waiting" || pokerGame.phase === "showdown") return

    const currentPlayer = pokerGame.players[pokerGame.currentPlayerIndex]
    if (!currentPlayer || currentPlayer.isFolded || currentPlayer.isAllIn) return

    // 1秒ごとにタイムアウトをチェック
    const interval = setInterval(() => {
      const remaining = getRemainingTime(pokerGame.turnStartTime)
      
      if (remaining <= 0) {
        console.log(`Player ${currentPlayer.userName} timeout detected`)
        handlePlayerTimeout(customerAccount.storeId, pokerGameId, currentPlayer.userId)
          .catch((err) => {
            console.error("Error handling timeout:", err)
          })
        clearInterval(interval)
      }
    }, 1000)

    return () => clearInterval(interval)
  }, [customerAccount, pokerGameId, pokerGame])
  */

  // SHOWDOWN後の自動次ハンド開始
  useEffect(() => {
    if (!customerAccount || !pokerGameId || !pokerGame) return

    if (pokerGame.phase === "showdown" && pokerGame.players.length >= 2) {
      console.log("SHOWDOWN detected, starting next hand in 5 seconds...")
      
      const timer = setTimeout(() => {
        startNewHand(customerAccount.storeId, pokerGameId)
          .then(() => {
            console.log("Next hand started successfully")
          })
          .catch((err) => {
            console.error("Error starting next hand:", err)
            setError("次のハンドを開始できませんでした")
          })
      }, 5000)
      
      return () => clearTimeout(timer)
    }
  }, [customerAccount, pokerGameId, pokerGame])

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !customerAccount) return

    setIsSending(true)
    setError("")

    try {
      const displayName = customerAccount.playerName || customerAccount.email.split("@")[0]
      
      if (!customerAccount.storeId) {
        throw new Error("Store ID not found")
      }
      
      await sendChatMessage(newMessage.trim(), customerAccount.id, displayName, customerAccount.storeId)
      setNewMessage("")
      // フォーカスを維持
      requestAnimationFrame(() => {
        inputRef.current?.focus()
      })
    } catch (err) {
      console.error("Error sending message:", err)
      setError("メッセージの送信に失敗しました")
    } finally {
      setIsSending(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  const handleClearHistory = () => {
    if (!customerAccount?.storeId) return
    
    const allMessageIds = messages.map(msg => msg.id)
    const newHiddenIds = new Set([...hiddenMessageIds, ...allMessageIds])
    setHiddenMessageIds(newHiddenIds)
    
    const storageKey = `hiddenMessages_${customerAccount.storeId}`
    localStorage.setItem(storageKey, JSON.stringify(Array.from(newHiddenIds)))
  }

  const handlePokerAction = async (action: string, amount?: number) => {
    if (!customerAccount || !pokerGameId) return

    try {
      await performAction(
        customerAccount.storeId,
        pokerGameId,
        customerAccount.id,
        action as any,
        amount
      )
    } catch (err) {
      console.error("Error performing action:", err)
      setError(err instanceof Error ? err.message : "アクションに失敗しました")
    }
  }

  const handleJoinSeat = async (seatIndex: number) => {
    if (!customerAccount || !pokerGameId) return

    try {
      const displayName = customerAccount.playerName || customerAccount.email.split("@")[0]
      await joinPokerGame(
        customerAccount.storeId,
        pokerGameId,
        customerAccount.id,
        displayName,
        seatIndex,
        10000
      )
    } catch (err) {
      console.error("Error joining seat:", err)
      setError(err instanceof Error ? err.message : "着席できませんでした")
    }
  }

  const handleLeaveSeat = async () => {
    if (!customerAccount || !pokerGameId) return

    if (!confirm("席を立ちますか？")) return

    try {
      await leavePokerGame(customerAccount.storeId, pokerGameId, customerAccount.id)
    } catch (err) {
      console.error("Error leaving seat:", err)
      setError(err instanceof Error ? err.message : "席を立つことができませんでした")
    }
  }

  const handleStartGame = async () => {
    if (!customerAccount || !pokerGameId) return

    try {
      await startNewHand(customerAccount.storeId, pokerGameId)
    } catch (err) {
      console.error("Error starting game:", err)
      setError(err instanceof Error ? err.message : "ゲームを開始できませんでした")
    }
  }

  const handleResetGame = async () => {
    if (!customerAccount || !pokerGameId) return

    if (!confirm("ゲームをリセットしますか？全てのデータが削除されます。")) return

    try {
      await deletePokerGame(customerAccount.storeId, pokerGameId)
      setPokerGameId(null)
      setPokerGame(null)
      const storageKey = `pokerGameId_${customerAccount.storeId}`
      localStorage.removeItem(storageKey)
      const newGameId = await createPokerGame(customerAccount.storeId, 50, 100)
      setPokerGameId(newGameId)
      localStorage.setItem(storageKey, newGameId)
    } catch (err) {
      console.error("Error resetting game:", err)
      setError(err instanceof Error ? err.message : "ゲームをリセットできませんでした")
    }
  }

  if (!customerAccount) {
    return (
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          チャットを利用するにはログインが必要です
        </AlertDescription>
      </Alert>
    )
  }

  // チャットコンポーネント
  const ChatPanel = ({ height, showHeader = true }: { height: string; showHeader?: boolean }) => (
    <Card style={{ height }} className="flex flex-col overflow-hidden rounded-none border-0 border-t-2 border-purple-500">
      {showHeader && (
        <CardHeader className="p-2 pb-1">
          <div className="flex items-center justify-end">
            <Button
              variant="outline"
              size="sm"
              className="h-6 text-xs px-2"
              onClick={handleClearHistory}
              disabled={messages.filter(msg => !hiddenMessageIds.has(msg.id)).length === 0}
            >
              消去
            </Button>
          </div>
          {activeUsers.length > 0 && (
            <div className="mt-1">
              <span className="text-xs text-muted-foreground">入室中: ({activeUsers.length}人)</span>
              <div className="flex gap-1 overflow-x-auto pb-1 mt-1" style={{ scrollbarWidth: 'thin' }}>
                {activeUsers.map((user) => (
                  <div
                    key={user.userId}
                    className="px-2 py-0.5 text-[10px] font-medium border border-purple-300 bg-purple-50 text-purple-700 rounded whitespace-nowrap flex-shrink-0"
                  >
                    {user.userName}
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardHeader>
      )}
      <CardContent className="flex-1 flex flex-col gap-2 p-2 overflow-hidden">
        <ScrollArea className="flex-1 pr-4" ref={scrollAreaRef}>
          <div className="space-y-4">
            {messages.filter(msg => !hiddenMessageIds.has(msg.id)).length === 0 ? (
              <div className="text-center text-muted-foreground py-8">
                まだメッセージがありません
              </div>
            ) : (
              messages.filter(msg => !hiddenMessageIds.has(msg.id)).map((msg) => {
                const isOwnMessage = msg.userId === customerAccount.id
                const isSystemMessage = msg.type === "system"
                
                if (isSystemMessage) {
                  return (
                    <div key={msg.id} className="flex justify-center my-2">
                      <div className="text-xs text-muted-foreground bg-muted/50 px-3 py-1 rounded-full">
                        {msg.message}
                      </div>
                    </div>
                  )
                }
                
                return (
                  <div
                    key={msg.id}
                    className={`flex ${isOwnMessage ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-[70%] rounded-lg px-3 py-2 ${
                        isOwnMessage
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted"
                      }`}
                    >
                      <div className="text-sm">
                        <span className="font-semibold">{msg.userName}</span>
                        <span>: </span>
                        <span className="whitespace-pre-wrap break-words">{msg.message}</span>
                        <span className="text-xs opacity-70 ml-2">({msg.createdAt.toLocaleTimeString("ja-JP", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })})</span>
                      </div>
                    </div>
                  </div>
                )
              })
            )}
            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="flex gap-2">
          <Input
            ref={inputRef}
            placeholder="メッセージを入力..."
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            disabled={isSending}
            className="flex-1"
          />
          <Button
            onClick={handleSendMessage}
            disabled={!newMessage.trim() || isSending}
            size="icon"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  )

  // ゲーム状況の最小表示
  const GameStatusMinimal = () => (
    <div className="h-[12vh] bg-slate-800 border-t border-slate-700 p-2 flex flex-col items-center justify-center">
      {pokerGame && (
        <>
          <div className="text-sm text-slate-300 mb-1">
            {pokerGame.phase === "waiting" ? "ゲーム待機中" : `🃏 ${pokerGame.phase.toUpperCase()}`}
            {" • "}
            POT: {pokerGame.pot}
          </div>
          <div className="text-xs text-slate-400">
            {pokerGame.players.filter(p => p.isActive).map(p => p.userName).join(" vs ")}
          </div>
          <Button
            onClick={() => setViewMode('chat')}
            variant="outline"
            size="sm"
            className="mt-2 h-6 text-xs"
          >
            ゲームを見る
          </Button>
        </>
      )}
    </div>
  )

  return (
    <div className="h-screen flex flex-col">
      {/* ヘッダー */}
      <ViewModeHeader viewMode={viewMode} onModeChange={setViewMode} />

      {/* ターン通知 */}
      {showTurnNotification && (
        <TurnNotification
          onSwitchToPoker={() => setViewMode('poker')}
          onDismiss={() => setShowTurnNotification(false)}
        />
      )}

      {/* メインコンテンツ */}
      <div className="flex-1 overflow-hidden">
        {/* ポーカーモード */}
        {viewMode === 'poker' && pokerGame && (
          <>
            <div style={{ height: '67vh' }} className="overflow-hidden">
              <PokerTable
                game={pokerGame}
                currentUserId={customerAccount.id}
                onAction={handlePokerAction}
                onJoinSeat={handleJoinSeat}
                onLeaveSeat={handleLeaveSeat}
                onStartGame={handleStartGame}
                onResetGame={handleResetGame}
              />
            </div>
            <ChatPanel height="27vh" />
          </>
        )}

        {/* チャットモード */}
        {viewMode === 'chat' && (
          <>
            <ChatPanel height="67vh" />
            {pokerGame && (
              <div style={{ height: '27vh' }} className="overflow-hidden bg-slate-900">
                <div className="h-full flex flex-col items-center justify-center p-2">
                  <div className="text-sm text-slate-300 mb-2">
                    {pokerGame.phase === "waiting" ? "ゲーム待機中" : `🃏 ${pokerGame.phase.toUpperCase()}`}
                    {" • "}
                    POT: {pokerGame.pot}
                  </div>
                  <div className="text-xs text-slate-400 mb-2">
                    {pokerGame.players.filter(p => p.isActive).map(p => p.userName).join(" vs ")}
                  </div>
                  {pokerGame.communityCards.length > 0 && (
                    <div className="flex gap-1 mb-2">
                      {pokerGame.communityCards.map((card, i) => (
                        <div key={i} className="w-8 h-12 bg-white rounded text-xs flex items-center justify-center">
                          {card.rank}{card.suit === 'hearts' ? '♥' : card.suit === 'diamonds' ? '♦' : card.suit === 'clubs' ? '♣' : '♠'}
                        </div>
                      ))}
                    </div>
                  )}
                  <Button
                    onClick={() => setViewMode('poker')}
                    variant="outline"
                    size="sm"
                    className="h-7 text-xs"
                  >
                    ポーカーモードに切り替え
                  </Button>
                </div>
              </div>
            )}
          </>
        )}

        {/* 観戦モード */}
        {viewMode === 'spectate' && (
          <>
            <ChatPanel height="82vh" />
            <GameStatusMinimal />
          </>
        )}
      </div>
    </div>
  )
}
