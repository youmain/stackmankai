"use client"

import { useState, useEffect } from "react"
import { AuthGuard } from "@/components/auth-guard"
import { Header } from "@/components/header"
import {
  subscribeToPlayers,
  subscribeToPlayerPurchaseHistory,
  subscribeToRakeHistory,
} from "@/lib/firestore"
import type { Player } from "@/types"
import { useAuth } from "@/contexts/auth-context"
import { isFirebaseConfigured } from "@/lib/firebase"
import { handleError } from "@/lib/error-handler"
import { performanceMonitor } from "@/lib/performance-monitor"

// New components
import { PlayersHeader } from "@/components/players/players-header"
import { PlayerListView } from "@/components/players/player-list-view"
import { PlayerModalsContainer } from "@/components/players/player-modals-container"
import {
  handleGeneratePlayerId,
  handleBalanceManagement,
  handleDeletePlayer,
  handleDeletePlayerConfirmed,
  handleManageGame,
  handleGameStart,
  handleGameUpdate,
  handleGameEnd,
  handleStatusChange,
} from "@/components/players/player-handlers"

export default function PlayersPage() {
  console.log("[v0] 📱 PlayersPageコンポーネント実行開始")

  const { userName, storeId } = useAuth()

  console.log("[v0] 🔐 認証状態確認:", { userName, hasUserName: !!userName })

  // Player data
  const [players, setPlayers] = useState<Player[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [playerPurchaseHistory, setPlayerPurchaseHistory] = useState<Record<string, number>>({})
  const [rakeHistory, setRakeHistory] = useState<
    Array<{
      id: string
      playerId: string
      playerName: string
      gameId: string
      buyIn: number
      additionalStack: number
      finalStack: number
      rake: number
      createdAt: Date
    }>
  >([])

  // Modal states
  const [showRegistrationModal, setShowRegistrationModal] = useState(false)
  const [showBalanceModal, setShowBalanceModal] = useState(false)
  const [showHistoryModal, setShowHistoryModal] = useState(false)
  const [showGameStartModal, setShowGameStartModal] = useState(false)
  const [showGameManagementModal, setShowGameManagementModal] = useState(false)
  const [showPasswordModal, setShowPasswordModal] = useState(false)
  const [showPasswordSettings, setShowPasswordSettings] = useState(false)
  const [showQRCodeModal, setShowQRCodeModal] = useState(false)
  const [showPlayerQRCodeModal, setShowPlayerQRCodeModal] = useState(false)
  const [showPlayerEditModal, setShowPlayerEditModal] = useState(false)
  const [showJSONImportModal, setShowJSONImportModal] = useState(false)
  const [showPlayerStatusModal, setShowPlayerStatusModal] = useState(false)

  // Selected data
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null)
  const [deletingPlayerId, setDeletingPlayerId] = useState<string | null>(null)
  const [qrCodePlayer, setQRCodePlayer] = useState<Player | null>(null)
  const [statusChangePlayer, setStatusChangePlayer] = useState<Player | null>(null)

  // Password action
  const [passwordAction, setPasswordAction] = useState<{
    type: "balance" | "delete" | "deleteAll"
    player?: Player
    callback: () => void
  } | null>(null)

  // Error state
  const [firebaseError, setFirebaseError] = useState<string | null>(null)

  // Filtered players
  const filteredPlayers = players.filter((player) => {
    const searchLower = searchTerm.toLowerCase()
    return (
      player.name?.toLowerCase().includes(searchLower) ||
      player.pokerName?.toLowerCase().includes(searchLower) ||
      player.furigana?.toLowerCase().includes(searchLower) ||
      player.uniqueId?.includes(searchTerm)
    )
  })

  // Subscribe to players
  useEffect(() => {
    if (!isFirebaseConfigured()) {
      setFirebaseError("Firebase設定完了後にプレイヤーデータが表示されます")
      return
    }

    console.log("[v0] 🔄 プレイヤーデータ購読開始")

    const unsubscribe = subscribeToPlayers((playersData) => {
      console.log("[v0] ✅ プレイヤーデータ取得:", playersData.length, "件")
      setPlayers(playersData)
      setFirebaseError(null)
    })

    return () => {
      console.log("[v0] 🔄 プレイヤーデータ購読終了")
      unsubscribe()
    }
  }, [])

  // Subscribe to player purchase history
  useEffect(() => {
    if (!isFirebaseConfigured() || !storeId) return

    console.log("[v0] 🔄 プレイヤー購入履歴購読開始")

    const unsubscribe = subscribeToPlayerPurchaseHistory(storeId, (history) => {
      console.log("[v0] ✅ プレイヤー購入履歴取得:", history)
      setPlayerPurchaseHistory(history)
    })

    return () => {
      console.log("[v0] 🔄 プレイヤー購入履歴購読終了")
      unsubscribe()
    }
  }, [storeId])

  // Subscribe to rake history
  useEffect(() => {
    if (!isFirebaseConfigured() || !storeId) return

    console.log("[v0] 🔄 レーキ履歴購読開始")

    const unsubscribe = subscribeToRakeHistory(storeId, (history) => {
      console.log("[v0] ✅ レーキ履歴取得:", history.length, "件")
      setRakeHistory(history)
    })

    return () => {
      console.log("[v0] 🔄 レーキ履歴購読終了")
      unsubscribe()
    }
  }, [storeId])

  // Handler wrappers
  const handleEditPlayer = (player: Player) => {
    setSelectedPlayer(player)
    setShowPlayerEditModal(true)
  }

  const handleViewHistory = (player: Player) => {
    setSelectedPlayer(player)
    setShowHistoryModal(true)
  }

  const handleStartGame = (player: Player) => {
    setSelectedPlayer(player)
    setShowGameStartModal(true)
  }

  const handleTogglePlayerStatus = async (player: Player) => {
    setStatusChangePlayer(player)
    setShowPlayerStatusModal(true)
  }

  const handleBalanceManagementClick = (player: Player) => {
    setSelectedPlayer(player)
    setShowBalanceModal(true)
  }

  const handleDeletePlayerClick = (player: Player) => {
    setDeletingPlayerId(player.id)
    setPasswordAction({
      type: "delete",
      player,
      callback: () => handleDeletePlayerConfirmed(player, userName),
    })
    setShowPasswordModal(true)
  }

  const handleManageGameClick = (player: Player) => {
    setSelectedPlayer(player)
    setShowGameManagementModal(true)
  }

  const handleGameEndClick = (finalStack: number) => {
    if (selectedPlayer) {
      handleGameEnd(finalStack, selectedPlayer.id, players, userName)
    }
  }

  const handleGameStartClick = (player: Player, buyIn: number, additionalStack: number) => {
    handleGameStart(player, buyIn, additionalStack, userName)
    setShowGameStartModal(false)
  }

  const handleGameUpdateClick = (gameId: string, playerId: string, newStack: number) => {
    handleGameUpdate(gameId, playerId, newStack, userName)
  }

  const handleStatusChangeClick = (newStatus: "normal" | "special" | "deduction") => {
    if (statusChangePlayer) {
      handleStatusChange(statusChangePlayer, newStatus, userName)
      setShowPlayerStatusModal(false)
      setStatusChangePlayer(null)
    }
  }

  const handlePasswordSuccess = () => {
    if (passwordAction) {
      passwordAction.callback()
      setPasswordAction(null)
    }
  }

  const handlePasswordClose = () => {
    setShowPasswordModal(false)
    setPasswordAction(null)
    setDeletingPlayerId(null)
  }

  return (
    <AuthGuard>
      <div className="min-h-screen bg-background">
        <Header />

        <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-10">
          <PlayersHeader
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
            onShowRegistration={() => setShowRegistrationModal(true)}
            onShowPasswordSettings={() => setShowPasswordSettings(true)}
          />

          <PlayerListView
            players={filteredPlayers}
            deletingPlayerId={deletingPlayerId}
            playerPurchaseHistory={playerPurchaseHistory}
            onToggleStatus={handleTogglePlayerStatus}
            onGenerateId={(player) => handleGeneratePlayerId(player, userName)}
            onEdit={handleEditPlayer}
            onBalanceManagement={handleBalanceManagementClick}
            onViewHistory={handleViewHistory}
            onStartGame={handleStartGame}
            onManageGame={handleManageGameClick}
            onDelete={handleDeletePlayerClick}
            onShowQRCode={(player) => {
              setQRCodePlayer(player)
              setShowPlayerQRCodeModal(true)
            }}
          />

          {filteredPlayers.length === 0 && !firebaseError && (
            <div className="text-center py-8 sm:py-12 lg:py-16" role="status" aria-live="polite">
              <p className="text-sm sm:text-base lg:text-lg text-muted-foreground">
                {searchTerm ? "検索条件に一致するプレイヤーが見つかりません" : "プレイヤーが登録されていません"}
              </p>
            </div>
          )}

          {firebaseError && (
            <div className="text-center py-8 sm:py-12 lg:py-16" role="status" aria-live="polite">
              <p className="text-sm sm:text-base lg:text-lg text-muted-foreground">
                {firebaseError}
              </p>
            </div>
          )}
        </main>

        <PlayerModalsContainer
          // Registration
          showRegistrationModal={showRegistrationModal}
          onRegistrationClose={() => setShowRegistrationModal(false)}
          storeId={storeId}
          // Edit
          showPlayerEditModal={showPlayerEditModal}
          onPlayerEditClose={() => {
            setShowPlayerEditModal(false)
            setSelectedPlayer(null)
          }}
          selectedPlayer={selectedPlayer}
          // Balance
          showBalanceModal={showBalanceModal}
          onBalanceClose={() => {
            setShowBalanceModal(false)
            setSelectedPlayer(null)
          }}
          // History
          showHistoryModal={showHistoryModal}
          onHistoryClose={() => {
            setShowHistoryModal(false)
            setSelectedPlayer(null)
          }}
          // Game Start
          showGameStartModal={showGameStartModal}
          onGameStartClose={() => {
            setShowGameStartModal(false)
            setSelectedPlayer(null)
          }}
          onGameStart={handleGameStartClick}
          // Game Management
          showGameManagementModal={showGameManagementModal}
          onGameManagementClose={() => {
            setShowGameManagementModal(false)
            setSelectedPlayer(null)
          }}
          onGameEnd={handleGameEndClick}
          onGameUpdate={handleGameUpdateClick}
          // Password
          showPasswordModal={showPasswordModal}
          onPasswordClose={handlePasswordClose}
          onPasswordSuccess={handlePasswordSuccess}
          passwordAction={passwordAction}
          // Password Settings
          showPasswordSettings={showPasswordSettings}
          onPasswordSettingsClose={() => setShowPasswordSettings(false)}
          // Status
          showPlayerStatusModal={showPlayerStatusModal}
          onPlayerStatusClose={() => {
            setShowPlayerStatusModal(false)
            setStatusChangePlayer(null)
          }}
          statusChangePlayer={statusChangePlayer}
          onStatusChange={handleStatusChangeClick}
          // QR Code
          showPlayerQRCodeModal={showPlayerQRCodeModal}
          onPlayerQRCodeClose={() => {
            setShowPlayerQRCodeModal(false)
            setQRCodePlayer(null)
          }}
          qrCodePlayer={qrCodePlayer}
        />
      </div>
    </AuthGuard>
  )
}
