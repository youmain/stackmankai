"use client"

import type { Player } from "@/types"
import { PlayerRegistrationModal } from "@/components/player-registration-modal"
import { PlayerEditModal } from "@/components/player-edit-modal"
import { BalanceManagementModal } from "@/components/balance-management-modal"
import { TransactionHistoryModal } from "@/components/transaction-history-modal"
import { GameStartModal } from "@/components/game-start-modal"
import { GameManagementModal } from "@/components/game-management-modal"
import { PasswordModal } from "@/components/password-modal"
import { PasswordSettingsModal } from "@/components/password-settings-modal"
import { PlayerStatusModal } from "@/components/player-status-modal"
import { PlayerQRCodeModal } from "@/components/player-qr-code-modal"

interface PlayerModalsContainerProps {
  // Registration
  showRegistrationModal: boolean
  onRegistrationClose: () => void
  storeId: string

  // Edit
  showPlayerEditModal: boolean
  onPlayerEditClose: () => void
  selectedPlayer: Player | null

  // Balance
  showBalanceModal: boolean
  onBalanceClose: () => void

  // History
  showHistoryModal: boolean
  onHistoryClose: () => void

  // Game Start
  showGameStartModal: boolean
  onGameStartClose: () => void
  onGameStart: (player: Player, buyIn: number, additionalStack: number) => void

  // Game Management
  showGameManagementModal: boolean
  onGameManagementClose: () => void
  onGameEnd: (finalStack: number) => void
  onGameUpdate: (gameId: string, playerId: string, newStack: number) => void

  // Password
  showPasswordModal: boolean
  onPasswordClose: () => void
  onPasswordSuccess: () => void
  passwordAction: {
    type: "balance" | "delete" | "deleteAll"
    player?: Player
    callback: () => void
  } | null

  // Password Settings
  showPasswordSettings: boolean
  onPasswordSettingsClose: () => void

  // Status
  showPlayerStatusModal: boolean
  onPlayerStatusClose: () => void
  statusChangePlayer: Player | null
  onStatusChange: (newStatus: "normal" | "special" | "deduction") => void

  // QR Code
  showPlayerQRCodeModal: boolean
  onPlayerQRCodeClose: () => void
  qrCodePlayer: Player | null
}

export function PlayerModalsContainer({
  // Registration
  showRegistrationModal,
  onRegistrationClose,
  storeId,

  // Edit
  showPlayerEditModal,
  onPlayerEditClose,
  selectedPlayer,

  // Balance
  showBalanceModal,
  onBalanceClose,

  // History
  showHistoryModal,
  onHistoryClose,

  // Game Start
  showGameStartModal,
  onGameStartClose,
  onGameStart,

  // Game Management
  showGameManagementModal,
  onGameManagementClose,
  onGameEnd,
  onGameUpdate,

  // Password
  showPasswordModal,
  onPasswordClose,
  onPasswordSuccess,
  passwordAction,

  // Password Settings
  showPasswordSettings,
  onPasswordSettingsClose,

  // Status
  showPlayerStatusModal,
  onPlayerStatusClose,
  statusChangePlayer,
  onStatusChange,

  // QR Code
  showPlayerQRCodeModal,
  onPlayerQRCodeClose,
  qrCodePlayer,
}: PlayerModalsContainerProps) {
  return (
    <>
      <PlayerRegistrationModal open={showRegistrationModal} onClose={onRegistrationClose} storeId={storeId} />

      <PlayerEditModal
        open={showPlayerEditModal}
        onClose={onPlayerEditClose}
        player={selectedPlayer}
      />

      {selectedPlayer && (
        <>
          <BalanceManagementModal
            open={showBalanceModal}
            onClose={onBalanceClose}
            player={selectedPlayer}
          />
          <TransactionHistoryModal
            open={showHistoryModal}
            onClose={onHistoryClose}
            player={selectedPlayer}
          />
          <GameStartModal
            open={showGameStartModal}
            onClose={onGameStartClose}
            player={selectedPlayer}
            onGameStart={onGameStart}
          />
        </>
      )}

      {showGameManagementModal && selectedPlayer && selectedPlayer.id && (
        <GameManagementModal
          open={showGameManagementModal}
          onClose={onGameManagementClose}
          player={selectedPlayer as Player}
          onGameEnd={onGameEnd}
          onGameUpdate={onGameUpdate}
        />
      )}

      <PasswordModal
        open={showPasswordModal}
        onClose={onPasswordClose}
        onSuccess={onPasswordSuccess}
        title={
          passwordAction?.type === "balance"
            ? "システム残高調整"
            : passwordAction?.type === "delete"
              ? "プレイヤー削除"
              : "全プレイヤー削除"
        }
        description={
          passwordAction?.type === "balance"
            ? "システム残高を調整するにはパスワードが必要です。"
            : passwordAction?.type === "delete"
              ? "プレイヤーを削除するにはパスワードが必要です。"
              : "全プレイヤーを削除するにはパスワードが必要です。"
        }
      />

      <PasswordSettingsModal open={showPasswordSettings} onClose={onPasswordSettingsClose} />

      {statusChangePlayer && (
        <PlayerStatusModal
          open={showPlayerStatusModal}
          onClose={onPlayerStatusClose}
          playerName={statusChangePlayer.name}
          currentStatus={
            statusChangePlayer.isSpecial ? "special" : statusChangePlayer.isDeduction ? "deduction" : "normal"
          }
          onStatusChange={onStatusChange}
        />
      )}

      <PlayerQRCodeModal
        player={qrCodePlayer}
        isOpen={showPlayerQRCodeModal}
        onClose={onPlayerQRCodeClose}
      />
    </>
  )
}
