"use client"

import type React from "react"
import { useState, useEffect, useRef, useMemo, useCallback } from "react"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle } from "lucide-react"
import { subscribeToChatMessages, subscribeToActiveUsers } from "@/lib/firestore"
import { isWithinOperationHours } from "@/lib/utils"
import type { PokerOperationHours } from "@/types/stack-man-hand"
import type { ChatMessage } from "@/types"
import type { PokerGameState } from "@/types/poker"
import { useAuth } from "@/contexts/auth-context"
import { PokerTable } from "@/components/poker/poker-table"
import { ViewModeHeader } from "@/components/poker/view-mode-header"
import { TurnNotification } from "@/components/poker/turn-notification"
import { useViewMode } from "@/hooks/use-view-mode"
import { ChatPanel } from "@/components/chat/chat-panel"
import { ChatToastContainer } from "@/components/chat/chat-toast"

// New handler modules
import {
  handleSendMessage,
  handleSetUserPresence,
  handleRemoveUserPresence,
  handleClearHistory,
  toggleMessageVisibility,
} from "@/components/chat/chat-handlers"
import {
  fetchOperationHours,
  initGame,
  handleJoinSeat,
  handleLeaveSeat,
  handleStartGame,
  handlePokerAction,
  handleTimeout,
  handleReadyNextHand,
  handleDeleteGame,
  handleResetGame,
  getRemainingTimeForGame,
} from "@/components/chat/poker-game-manager"
import { subscribeToPokerGame } from "@/lib/poker-game"

export function ChatRoomDualMode({ onViewModeChange }: { onViewModeChange?: (mode: any) => void }) {
  const { customerAccount } = useAuth()
  const { viewMode: internalViewMode, setViewMode: setInternalViewMode } = useViewMode()

  // 外部から渡された onViewModeChange がある場合はそれを使用し、
  // ない場合は内部の setInternalViewMode を使用する
  const handleModeChange = useCallback((mode: any) => {
    console.log('Mode change requested:', mode);
    
    // 常に内部状態を更新してUIを切り替える
    if (typeof setInternalViewMode === 'function') {
      setInternalViewMode(mode);
    }
    
    // 外部のハンドラがあれば呼ぶ
    if (typeof onViewModeChange === 'function') {
      onViewModeChange(mode);
    }
  }, [setInternalViewMode, onViewModeChange]);

  // Chat states
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [newMessage, setNewMessage] = useState("")
  const [isSending, setIsSending] = useState(false)
  const [error, setError] = useState("")
  const [hiddenMessageIds, setHiddenMessageIds] = useState<Set<string>>(new Set())
  const [activeUsers, setActiveUsers] = useState<Array<{ userId: string; userName: string }>>([])

  // Poker states
  const [pokerGame, setPokerGame] = useState<PokerGameState | null>(null)
  const [pokerGameId, setPokerGameId] = useState<string | null>(null)
  const [showTurnNotification, setShowTurnNotification] = useState(false)
  const [toastMessages, setToastMessages] = useState<ChatMessage[]>([])
  const [pokerAvailable, setPokerAvailable] = useState(true)
  const [operationHours, setOperationHours] = useState<PokerOperationHours | null>(null)

  // Refs
  const lastMessageCountRef = useRef(0)
  const seenMessageIdsRef = useRef<Set<string>>(new Set())
  const isInitialLoadRef = useRef(true)
  const joinedAtRef = useRef<Date>(new Date())
  const scrollAreaRef = useRef<HTMLDivElement>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const wasSendingRef = useRef(false)

  // Focus management after sending
  useEffect(() => {
    if (wasSendingRef.current && !isSending) {
      setTimeout(() => {
        inputRef.current?.focus()
      }, 50)
    }
    wasSendingRef.current = isSending
  }, [isSending])

  // Check if it's my turn
  const isMyTurn = pokerGame &&
    pokerGame.currentPlayerIndex !== undefined &&
    pokerGame.players[pokerGame.currentPlayerIndex]?.userId === customerAccount?.id &&
    pokerGame.phase !== "waiting" &&
    pokerGame.phase !== "showdown"

  // Show turn notification
  useEffect(() => {
    if (isMyTurn && internalViewMode !== "poker") {
      setShowTurnNotification(true)
    } else {
      setShowTurnNotification(false)
    }
  }, [isMyTurn, internalViewMode])

  // Load hidden messages from storage
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

  // Subscribe to chat messages
  useEffect(() => {
    if (!customerAccount?.storeId) return

    const unsubscribe = subscribeToChatMessages(
      customerAccount.storeId,
      (newMessages) => {
        setMessages(newMessages)

        // Add new messages to toast
        if (!isInitialLoadRef.current) {
          const newMsgs = newMessages.filter(
            (msg) => !seenMessageIdsRef.current.has(msg.id || "")
          )

          newMsgs.forEach((msg) => {
            seenMessageIdsRef.current.add(msg.id || "")
          })

          if (newMsgs.length > 0) {
            setToastMessages((prev) => [...prev, ...newMsgs].slice(-5))
          }
        } else {
          isInitialLoadRef.current = false
          newMessages.forEach((msg) => {
            seenMessageIdsRef.current.add(msg.id || "")
          })
        }

        lastMessageCountRef.current = newMessages.length
      }
    )

    return () => unsubscribe()
  }, [customerAccount?.storeId])

  // Subscribe to active users
  useEffect(() => {
    if (!customerAccount?.storeId) return

    const unsubscribe = subscribeToActiveUsers(
      customerAccount.storeId,
      (users) => {
        setActiveUsers(users)
      }
    )

    return () => unsubscribe()
  }, [customerAccount?.storeId])

  // Set user presence
  useEffect(() => {
    if (!customerAccount) return

    const displayName = customerAccount.playerName || customerAccount.email.split("@")[0]
    handleSetUserPresence(
      customerAccount.storeId,
      customerAccount.id,
      displayName,
      setError
    )

    return () => {
      handleRemoveUserPresence(customerAccount.storeId, customerAccount.id, setError)
    }
  }, [customerAccount])

  // Fetch operation hours
  useEffect(() => {
    if (!customerAccount?.storeId) return

    fetchOperationHours(customerAccount.storeId, setOperationHours, setError)

    // Check every minute
    const interval = setInterval(() => {
      if (operationHours) {
        setPokerAvailable(isWithinOperationHours(operationHours))
      }
    }, 60000)

    return () => clearInterval(interval)
  }, [customerAccount?.storeId, operationHours])

  // Initialize poker game
  useEffect(() => {
    if (!customerAccount?.storeId || !customerAccount?.id) return

    initGame(
      customerAccount.storeId,
      customerAccount.id,
      setPokerGameId,
      setPokerGame,
      setError
    )
  }, [customerAccount?.storeId, customerAccount?.id])

  // Subscribe to poker game updates
  useEffect(() => {
    if (!pokerGameId) return

    const unsubscribe = subscribeToPokerGame(pokerGameId, (updatedGame) => {
      setPokerGame(updatedGame)
    })

    return () => {
      if (typeof unsubscribe === 'function') {
        unsubscribe()
      }
    }
  }, [pokerGameId])

  // Handle send message
  const handleSendMessageClick = useCallback(async (e?: React.FormEvent) => {
    e?.preventDefault()
    if (!customerAccount) return
    await handleSendMessage(
      newMessage,
      customerAccount.storeId,
      customerAccount.id,
      customerAccount.playerName || customerAccount.email.split("@")[0],
      setNewMessage,
      setIsSending,
      setError
    )
  }, [newMessage, customerAccount])

  // Handle clear history
  const handleClearHistoryClick = useCallback(() => {
    if (!customerAccount) return
    handleClearHistory(customerAccount.storeId, setHiddenMessageIds)
  }, [customerAccount])

  // Handle toggle visibility
  const handleToggleVisibility = useCallback((messageId: string) => {
    if (!customerAccount) return
    toggleMessageVisibility(messageId, hiddenMessageIds, setHiddenMessageIds, customerAccount.storeId)
  }, [hiddenMessageIds, customerAccount])

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 h-screen p-4 bg-gray-50">
      {/* Poker section */}
      <div className="lg:col-span-2 flex flex-col gap-4">
        <ViewModeHeader viewMode={internalViewMode} onModeChange={handleModeChange} />

        {error && (
          <Alert className="border-red-200 bg-red-50">
            <AlertCircle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-600">{error}</AlertDescription>
          </Alert>
        )}

        {!pokerAvailable && (
          <Alert className="border-yellow-200 bg-yellow-50">
            <AlertCircle className="h-4 w-4 text-yellow-600" />
            <AlertDescription className="text-yellow-600">
              ポーカーは現在利用できません。稼働時間: {operationHours?.open} - {operationHours?.close}
            </AlertDescription>
          </Alert>
        )}

        {(internalViewMode === "poker" || internalViewMode === "spectate") && (
          <Card className="flex-1 bg-gray-900 border-gray-800 overflow-hidden flex flex-col">
            <CardContent className="p-0 flex-1 overflow-y-auto">
              <PokerTable
                game={pokerGame}
                currentUserId={customerAccount?.id || ""}
                onAction={(action, amount) => handlePokerAction(customerAccount?.storeId, pokerGameId, customerAccount?.id, action, amount, setError)}
                onJoinSeat={(seatIndex) => handleJoinSeat(customerAccount?.storeId, pokerGameId, seatIndex, customerAccount?.id, customerAccount?.playerName, setError)}
                onLeaveSeat={() => handleLeaveSeat(customerAccount?.storeId, pokerGameId, customerAccount?.id, setError)}
                onStartGame={() => handleStartGame(customerAccount?.storeId, pokerGameId, setError)}
                onTimeout={() => handleTimeout(pokerGameId, customerAccount?.id, setError)}
                onReadyNextHand={() => handleReadyNextHand(customerAccount?.storeId, pokerGameId, customerAccount?.id, setError)}
                onResetGame={() => handleResetGame(pokerGameId, setError)}
              />
            </CardContent>
          </Card>
        )}

        {showTurnNotification && <TurnNotification />}
      </div>

      {/* Chat section */}
      <div className="flex flex-col gap-4">
        <Card className="flex-1 flex flex-col">
          <CardHeader>
            <div className="flex justify-between items-center">
              <h3 className="font-semibold">チャット</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClearHistoryClick}
                className="text-xs"
              >
                削除
              </Button>
            </div>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col gap-4 overflow-hidden">
            <ChatPanel
              height="100%"
              showHeader={true}
              messages={messages}
              newMessage={newMessage}
              isSending={isSending}
              error={error}
              hiddenMessageIds={hiddenMessageIds}
              activeUsers={activeUsers}
              currentUserId={customerAccount?.id || ""}
              inputRef={inputRef}
              onMessageChange={(msg) => setNewMessage(msg)}
              onSendMessage={() => handleSendMessageClick()}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault()
                  handleSendMessageClick()
                }
              }}
              onClearHistory={handleClearHistoryClick}
            />
          </CardContent>
        </Card>

        <ChatToastContainer messages={toastMessages} />
      </div>
    </div>
  )
}
