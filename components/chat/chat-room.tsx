"use client"

import { useState, useEffect, useRef } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Send, MessageCircle, AlertCircle } from "lucide-react"
import { subscribeToChatMessages, sendChatMessage, subscribeToActiveUsers, setUserPresence, removeUserPresence } from "@/lib/firestore"
import { createPokerGame, joinPokerGame, performAction, startNewHand, subscribeToPokerGame } from "@/lib/poker-game"
import { deletePokerGame } from "@/lib/poker-game-reset"
import type { ChatMessage } from "@/types"
import type { PokerGameState } from "@/types/poker"
import { useAuth } from "@/contexts/auth-context"
import { PokerTable } from "@/components/poker/poker-table"
import { PokerTestControls } from "@/components/poker/poker-test-controls"

export function ChatRoom() {
  const { customerAccount } = useAuth()
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [newMessage, setNewMessage] = useState("")
  const [isSending, setIsSending] = useState(false)
  const [error, setError] = useState("")
  const [hiddenMessageIds, setHiddenMessageIds] = useState<Set<string>>(new Set())
  const [activeUsers, setActiveUsers] = useState<Array<{ userId: string; userName: string }>>([])
  const [pokerGame, setPokerGame] = useState<PokerGameState | null>(null)
  const [pokerGameId, setPokerGameId] = useState<string | null>(null)
  const scrollAreaRef = useRef<HTMLDivElement>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

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
      if (scrollAreaRef.current) {
        const viewport = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]')
        if (viewport) {
          setTimeout(() => {
            viewport.scrollTop = viewport.scrollHeight
          }, 100)
        }
      }
    }
    scrollToBottom()
  }, [messages])

  // メッセージの購読と入室通知
  useEffect(() => {
    if (!customerAccount || !customerAccount.storeId) {
      console.error("Customer account or storeId is missing")
      setError("店舗情報が見つかりません")
      return
    }

    console.log("Setting up chat subscription for store:", customerAccount.storeId)
    
    const unsubscribe = subscribeToChatMessages(
      customerAccount.storeId,
      (msgs) => {
        console.log("Received messages:", msgs.length)
        setMessages(msgs)
        setError("") // Clear error on successful load
        
        // 新しいメッセージが追加されたら自動スクロール
        setTimeout(() => {
          if (scrollAreaRef.current) {
            scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight
          }
        }, 100)
      },
      (error) => {
        console.error("Chat subscription error:", error)
        setError("メッセージの読み込みに失敗しました")
      }
    )

    return () => unsubscribe()
  }, [customerAccount])

  // プレゼンス管理（入室・退室）
  useEffect(() => {
    if (!customerAccount || !customerAccount.storeId) return

    const displayName = customerAccount.playerName || customerAccount.email.split("@")[0]
    
    // 入室時にプレゼンスを設定
    setUserPresence(customerAccount.storeId, customerAccount.id, displayName).catch(err => 
      console.error("Error setting presence:", err)
    )
    
    // 30秒ごとにハートビートを送信
    const heartbeatInterval = setInterval(() => {
      setUserPresence(customerAccount.storeId, customerAccount.id, displayName).catch(err => 
        console.error("Error in heartbeat:", err)
      )
    }, 30000)
    
    // ページを閉じる時にプレゼンスを削除
    const handleBeforeUnload = () => {
      removeUserPresence(customerAccount.storeId, customerAccount.id)
    }
    window.addEventListener("beforeunload", handleBeforeUnload)
    
    // クリーンアップ
    return () => {
      clearInterval(heartbeatInterval)
      window.removeEventListener("beforeunload", handleBeforeUnload)
      removeUserPresence(customerAccount.storeId, customerAccount.id)
    }
  }, [customerAccount])

  // アクティブユーザーの購読
  useEffect(() => {
    if (!customerAccount || !customerAccount.storeId) return

    const unsubscribe = subscribeToActiveUsers(
      customerAccount.storeId,
      (users) => {
        setActiveUsers(users)
      },
      (error) => {
        console.error("Active users subscription error:", error)
      }
    )

    return () => unsubscribe()
  }, [customerAccount])

  // ポーカーゲームの初期化と購読
  useEffect(() => {
    if (!customerAccount || !customerAccount.storeId) return

    // ゲームIDをローカルストレージから取得または新規作成
    const storageKey = `pokerGameId_${customerAccount.storeId}`
    const storedGameId = localStorage.getItem(storageKey)

    if (storedGameId) {
      setPokerGameId(storedGameId)
    } else {
      // 新しいゲームを作成
      createPokerGame(customerAccount.storeId, 50, 100)
        .then((gameId) => {
          setPokerGameId(gameId)
          localStorage.setItem(storageKey, gameId)
        })
        .catch((err) => console.error("Error creating poker game:", err))
    }
  }, [customerAccount])

  // ポーカーゲームの購読
  useEffect(() => {
    if (!customerAccount || !pokerGameId) return

    const unsubscribe = subscribeToPokerGame(
      customerAccount.storeId,
      pokerGameId,
      (game) => {
        if (game) {
          setPokerGame(game)
        } else {
          // ゲームが存在しない場合、localStorageをクリアして新規作成
          console.log("Game not found, creating new game")
          const storageKey = `pokerGameId_${customerAccount.storeId}`
          localStorage.removeItem(storageKey)
          setPokerGameId(null)
          setPokerGame(null)
        }
      },
      (error) => {
        console.error("Poker game subscription error:", error)
      }
    )

    return () => unsubscribe()
  }, [customerAccount, pokerGameId])

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !customerAccount) return

    setIsSending(true)
    setError("")

    try {
      // プレイヤー名を表示名として使用（なければメールアドレスの@前を使用）
      const displayName = customerAccount.playerName || customerAccount.email.split("@")[0]
      
      if (!customerAccount.storeId) {
        throw new Error("Store ID not found")
      }
      
      await sendChatMessage(newMessage.trim(), customerAccount.id, displayName, customerAccount.storeId)
      setNewMessage("")
      // 送信後に入力欄にフォーカスを戻す
      setTimeout(() => {
        inputRef.current?.focus()
      }, 100)
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
    
    // 現在表示されている全メッセージIDを非表示リストに追加
    const allMessageIds = messages.map(msg => msg.id)
    const newHiddenIds = new Set([...hiddenMessageIds, ...allMessageIds])
    setHiddenMessageIds(newHiddenIds)
    
    // ローカルストレージに保存
    const storageKey = `hiddenMessages_${customerAccount.storeId}`
    localStorage.setItem(storageKey, JSON.stringify(Array.from(newHiddenIds)))
  }

  // ポーカーアクションハンドラー
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
        10000 // 初期スタック
      )
    } catch (err) {
      console.error("Error joining seat:", err)
      setError(err instanceof Error ? err.message : "座席に着くことができませんでした")
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
      // localStorageからも削除
      const storageKey = `pokerGameId_${customerAccount.storeId}`
      localStorage.removeItem(storageKey)
      // 新しいゲームを作成
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

  return (
    <div className="h-full flex flex-col">
      {/* テストコントロール - コメントアウト */}
      {/* <div className="p-2 bg-gray-50 border-b">
        <PokerTestControls />
      </div> */}
      
      {/* ポーカーテーブル */}
      {pokerGame && customerAccount && (
        <div style={{ height: '70%' }} className="overflow-hidden">
          <PokerTable
            game={pokerGame}
            currentUserId={customerAccount.id}
            onAction={handlePokerAction}
            onJoinSeat={handleJoinSeat}
            onStartGame={handleStartGame}
            onResetGame={handleResetGame}
          />
        </div>
      )}

      {/* チャット */}
      <Card style={{ height: '30%' }} className="flex flex-col overflow-hidden rounded-t-lg rounded-b-none border-t-2 border-purple-500">
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
        {/* 入室中ユーザー表示 */}
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
      <CardContent className="flex-1 flex flex-col gap-2 p-2 overflow-hidden">
        {/* メッセージ一覧 */}
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
                
                // システムメッセージの表示
                if (isSystemMessage) {
                  return (
                    <div key={msg.id} className="flex justify-center my-2">
                      <div className="text-xs text-muted-foreground bg-muted/50 px-3 py-1 rounded-full">
                        {msg.message}
                      </div>
                    </div>
                  )
                }
                
                // 通常メッセージの表示
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
            {/* スクロール用の目印 */}
            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>

        {/* エラー表示 */}
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* メッセージ入力 */}
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
    </div>
  )
}
