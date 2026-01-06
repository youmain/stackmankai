"use client"

import { useState, useEffect, useRef, useMemo, useCallback } from "react"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Send, AlertCircle } from "lucide-react"
import { doc, getDoc } from "firebase/firestore"
import { getDb } from "@/lib/firebase"
import { subscribeToChatMessages, sendChatMessage, subscribeToActiveUsers, setUserPresence, removeUserPresence } from "@/lib/firestore"
import { isWithinOperationHours } from "@/lib/utils"
import type { PokerOperationHours } from "@/types/stack-man-hand"
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
import { ChatPanel } from "@/components/chat/chat-panel"
import { ChatToastContainer } from "@/components/chat/chat-toast"

export function ChatRoomDualMode() {
  const { customerAccount } = useAuth()
  const { viewMode, setViewMode } = useViewMode()
  const [messages, setMessages] = useState<ChatMessage[]>([])
  
  // messagesの変化をログ出力
  useEffect(() => {
    console.log('[Messages] messages state changed:', messages.length, messages.slice(-3))
  }, [messages])
  const [newMessage, setNewMessage] = useState("")
  const [isSending, setIsSending] = useState(false)
  const [error, setError] = useState("")
  const [hiddenMessageIds, setHiddenMessageIds] = useState<Set<string>>(new Set())
  const [activeUsers, setActiveUsers] = useState<Array<{ userId: string; userName: string }>>([])
  const [pokerGame, setPokerGame] = useState<PokerGameState | null>(null)
  const [pokerGameId, setPokerGameId] = useState<string | null>(null)
  const [showTurnNotification, setShowTurnNotification] = useState(false)
  const [toastMessages, setToastMessages] = useState<ChatMessage[]>([])
  const [pokerAvailable, setPokerAvailable] = useState(true)
  const [operationHours, setOperationHours] = useState<PokerOperationHours | null>(null)
  
  // toastMessagesの変化をログ出力
  useEffect(() => {
    console.log('[Toast] toastMessages state changed:', toastMessages.length, toastMessages)
  }, [toastMessages])
  const lastMessageCountRef = useRef(0)
  const seenMessageIdsRef = useRef<Set<string>>(new Set())
  const isInitialLoadRef = useRef(true) // 初回ロードフラグ
  const joinedAtRef = useRef<Date>(new Date()) // 入室時刻を記録
  const scrollAreaRef = useRef<HTMLDivElement>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const wasSendingRef = useRef(false)

  // メッセージ送信後にフォーカスを戻す
  useEffect(() => {
    if (wasSendingRef.current && !isSending) {
      // 送信が完了したらフォーカスを戻す
      setTimeout(() => {
        inputRef.current?.focus()
      }, 50)
    }
    wasSendingRef.current = isSending
  }, [isSending])

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

  // メッセージが更新されたら最下部にスクロール（ScrollArea内のみ）
  useEffect(() => {
    if (scrollAreaRef.current) {
      const viewport = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]')
      if (viewport) {
        // ScrollArea内部のみをスクロール（ページ全体はスクロールしない）
        viewport.scrollTop = viewport.scrollHeight
      }
    }
  }, [messages])

  // チャットメッセージの購読
  useEffect(() => {
    if (!customerAccount?.storeId) return

    console.log('[Messages] Setting up subscription for storeId:', customerAccount.storeId, 'joinedAt:', joinedAtRef.current)
    const unsubscribe = subscribeToChatMessages(
      customerAccount.storeId,
      (newMessages) => {
        console.log('[Messages] Received from Firestore:', newMessages.length, newMessages.slice(-3))
        // 最新100件のみ保持
        const limitedMessages = newMessages.slice(-100)
        console.log('[Messages] Limited to last 100:', limitedMessages.length)
        setMessages(limitedMessages)
      },
      undefined, // onError
      joinedAtRef.current // 入室時刻を渡す
    )

    return () => {
      console.log('[Messages] Cleaning up subscription')
      unsubscribe()
    }
  }, [customerAccount?.storeId])

  // ポーカーモードで新しいメッセージが来たらトースト通知を表示
  useEffect(() => {
    console.log('[Toast] useEffect triggered:', {
      viewMode,
      hasAccount: !!customerAccount,
      messagesLength: messages.length,
      seenIdsCount: seenMessageIdsRef.current.size,
      toastMessagesLength: toastMessages.length
    })
    
    if (viewMode !== 'poker' || !customerAccount) {
      console.log('[Toast] Skipping: viewMode or account check failed')
      return
    }
    
    // 初回ロード時はすべてのメッセージIDを記録
    if (isInitialLoadRef.current) {
      console.log('[Toast] Initial load, recording', messages.length, 'message IDs')
      messages.forEach(msg => seenMessageIdsRef.current.add(msg.id))
      isInitialLoadRef.current = false
      return
    }
    
    // 新しいメッセージをIDベースで検出
    const newMessages = messages.filter(msg => !seenMessageIdsRef.current.has(msg.id))
    
    if (newMessages.length > 0) {
      console.log('[Toast] New messages detected:', newMessages.length, newMessages)
      
      // 新しいメッセージIDを記録
      newMessages.forEach(msg => seenMessageIdsRef.current.add(msg.id))
      
      // 自分以外のメッセージのみトースト表示
      const othersMessages = newMessages.filter(msg => msg.userId !== customerAccount.id)
      console.log('[Toast] Others messages:', othersMessages.length, othersMessages)
      
      if (othersMessages.length > 0) {
        console.log('[Toast] Adding to toastMessages')
        setToastMessages(prev => {
          const updated = [...prev, ...othersMessages]
          console.log('[Toast] toastMessages updated:', updated.length, updated)
          return updated
        })
      }
    } else {
      console.log('[Toast] No new messages')
    }
  }, [messages, viewMode, customerAccount])

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

  // 稼働時間設定の読み込み
  useEffect(() => {
    if (!customerAccount?.storeId) return

    const fetchOperationHours = async () => {
      const db = getDb()
      if (!db) return

      const storeRef = doc(db, "stores", customerAccount.storeId)
      const storeSnap = await getDoc(storeRef)

      if (storeSnap.exists()) {
        const storeData = storeSnap.data()
        if (storeData.pokerOperationHours) {
          const hours = storeData.pokerOperationHours as PokerOperationHours
          setOperationHours(hours)
          setPokerAvailable(isWithinOperationHours(hours))
        }
      }
    }

    fetchOperationHours()

    // 1分ごとに稼働状況をチェック
    const interval = setInterval(() => {
      if (operationHours) {
        setPokerAvailable(isWithinOperationHours(operationHours))
      }
    }, 60000)

    return () => clearInterval(interval)
  }, [customerAccount?.storeId, operationHours])

  // ポーカーゲームの初期化と購読
  useEffect(() => {
    if (!customerAccount?.storeId) return

    const storageKey = `pokerGameId_${customerAccount.storeId}`
    const savedGameId = localStorage.getItem(storageKey)

    const initGame = async () => {
      try {
        if (!pokerAvailable) {
          setError(`ポーカーは現在利用できません。稼働時間: ${operationHours?.open} - ${operationHours?.close}`)
          return
        }
        setError("") // 利用可能な場合はエラーをクリア

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

  // SHOWDOWN後の自動次ハンド開始（タイムアウト監視）
  useEffect(() => {
    if (!customerAccount || !pokerGameId || !pokerGame) return
    if (pokerGame.phase !== "showdown") return
    if (!pokerGame.nextHandStartTime) return

    console.log("[ChatRoomDualMode] Monitoring next hand start time...")
    
    // 1秒ごとにタイムアウトをチェック
    const interval = setInterval(async () => {
      const now = new Date()
      const startTime = pokerGame.nextHandStartTime
      
      if (startTime) {
        // Convert Firestore Timestamp to Date if needed
        const startDate = startTime instanceof Date ? startTime : (startTime.toDate ? startTime.toDate() : new Date(startTime))
        console.log(`[ChatRoomDualMode] Checking timeout - Now: ${now.toISOString()}, Start: ${startDate.toISOString()}`)
        
        if (now >= startDate) {
          console.log("[ChatRoomDualMode] Next hand timeout reached, checking and starting...")
          clearInterval(interval)
          
          try {
            const { checkAndStartNextHand } = await import('@/lib/poker-ready-next-hand')
            await checkAndStartNextHand(customerAccount.storeId, pokerGameId)
          } catch (err) {
            console.error("Error checking and starting next hand:", err)
          }
        }
      }
    }, 1000)
    
    return () => clearInterval(interval)
  }, [customerAccount, pokerGameId, pokerGame?.phase, pokerGame?.nextHandStartTime])

  const handleSendMessage = useCallback(async () => {
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
    } catch (err) {
      console.error("Error sending message:", err)
      setError("メッセージの送信に失敗しました")
    } finally {
      setIsSending(false)
    }
  }, [newMessage, customerAccount])

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }, [handleSendMessage])

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

    if (!pokerAvailable) {
      alert(`ポーカーは現在利用できません。稼働時間: ${operationHours?.open} - ${operationHours?.close}`)
      return
    }

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

    if (!pokerAvailable) {
      alert(`ポーカーは現在利用できません。稼働時間: ${operationHours?.open} - ${operationHours?.close}`)
      return
    }

    try {
      await startNewHand(customerAccount.storeId, pokerGameId)
    } catch (err) {
      console.error("Error starting game:", err)
      setError(err instanceof Error ? err.message : "ゲームを開始できませんでした")
    }
  }
  
  const handleTimeout = async () => {
    if (!customerAccount || !pokerGameId || !pokerGame) return
    
    const currentPlayer = pokerGame.players[pokerGame.currentPlayerIndex]
    if (!currentPlayer || currentPlayer.userId !== customerAccount.id) return
    
    console.log('[ChatRoomDualMode] Timeout detected, auto-folding')
    
    try {
      await handlePlayerTimeout(customerAccount.storeId, pokerGameId, customerAccount.id)
    } catch (err) {
      console.error('Error handling timeout:', err)
    }
  }
  
  const handleReadyNextHand = async () => {
    if (!customerAccount || !pokerGameId) return
    
    try {
      const { markPlayerReady } = await import('@/lib/poker-ready-next-hand')
      await markPlayerReady(customerAccount.storeId, pokerGameId, customerAccount.id)
    } catch (err) {
      console.error('Error marking ready for next hand:', err)
      setError(err instanceof Error ? err.message : '次のハンドの準備に失敗しました')
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

      {/* チャットトースト通知（ポーカーモードのみ） */}
      {(() => {
        const shouldShow = viewMode === 'poker' && toastMessages.length > 0
        console.log('[Toast] Render check:', { viewMode, toastMessagesLength: toastMessages.length, shouldShow })
        return shouldShow ? (
          <ChatToastContainer
            messages={toastMessages}
            onDismiss={(messageId) => {
              console.log('[Toast] Dismissing message:', messageId)
              setToastMessages(prev => prev.filter(msg => msg.id !== messageId))
            }}
            onClickToast={() => {
              console.log('[Toast] Toast clicked, switching to chat')
              setViewMode('chat')
            }}
          />
        ) : null
      })()}

      {/* メインコンテンツ */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden bg-gray-900">
        {!pokerAvailable && (
          <Alert variant="destructive" className="m-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              ポーカーは現在ご利用いただけません。稼働時間: {operationHours?.open} - {operationHours?.close}
            </AlertDescription>
          </Alert>
        )}
        {/* ポーカーモード */}
        {viewMode === 'poker' && pokerGame && (
          <>
            <div style={{ minHeight: '67vh' }} className="overflow-x-hidden w-full max-w-full">
              <PokerTable
                game={pokerGame}
                currentUserId={customerAccount.id}
                onAction={handlePokerAction}
                onLeaveSeat={handleLeaveSeat}
                onJoinSeat={pokerAvailable ? handleJoinSeat : () => alert(`ポーカーは現在利用できません。稼働時間: ${operationHours?.open} - ${operationHours?.close}`)}
                onStartGame={pokerAvailable ? handleStartGame : () => alert(`ポーカーは現在利用できません。稼働時間: ${operationHours?.open} - ${operationHours?.close}`)}
                onDeleteGame={handleDeleteGame}
                onResetGame={handleResetGame}
                onTimeout={handleTimeout}
                onReadyNextHand={handleReadyNextHand}
              />
            </div>
            <ChatPanel
              height="60vh"
              messages={messages}
              newMessage={newMessage}
              isSending={isSending}
              error={error}
              hiddenMessageIds={hiddenMessageIds}
              activeUsers={activeUsers}
              currentUserId={customerAccount.id}
              inputRef={inputRef}
              onMessageChange={setNewMessage}
              onSendMessage={handleSendMessage}
              onKeyDown={handleKeyDown}
              onClearHistory={handleClearHistory}
            />
          </>
        )}

        {/* チャットモード */}
        {viewMode === 'chat' && (
          <>
            <ChatPanel
              height="67vh"
              messages={messages}
              newMessage={newMessage}
              isSending={isSending}
              error={error}
              hiddenMessageIds={hiddenMessageIds}
              activeUsers={activeUsers}
              currentUserId={customerAccount.id}
              inputRef={inputRef}
              onMessageChange={setNewMessage}
              onSendMessage={handleSendMessage}
              onKeyDown={handleKeyDown}
              onClearHistory={handleClearHistory}
            />
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
            <ChatPanel
              height="82vh"
              messages={messages}
              newMessage={newMessage}
              isSending={isSending}
              error={error}
              hiddenMessageIds={hiddenMessageIds}
              activeUsers={activeUsers}
              currentUserId={customerAccount.id}
              inputRef={inputRef}
              onMessageChange={setNewMessage}
              onSendMessage={handleSendMessage}
              onKeyDown={handleKeyDown}
              onClearHistory={handleClearHistory}
            />
            <GameStatusMinimal />
          </>
        )}
      </div>
    </div>
  )
}
