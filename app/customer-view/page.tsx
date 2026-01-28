"use client"

import { useRouter } from "next/navigation"
import { User, Menu, Loader2, AlertCircle } from 'lucide-react'

import type { Player, DailyRanking, MonthlyPoints, StoreRankingSettings, RakeHistory, CustomerAccount } from "@/types"

// Hooks
import { useCustomerState } from "@/hooks/useCustomerState"
import { useCustomerLogic } from "@/hooks/useCustomerLogic"
import { useCustomerHandlers } from "@/hooks/useCustomerHandlers"

// Components
import { CustomerHeader } from "@/components/customer-view/layout/CustomerHeader"
import { ViewSwitcher } from "@/components/customer-view/ViewSwitcher"
import PlayerDetailedDataModal from "@/components/player-detailed-data-modal"
import MenuModal from "@/components/customer-view/modals/MenuModal"
import ResetStatisticsModal from "@/components/customer-view/modals/ResetStatisticsModal"
import PlayerLinkingModal from "@/components/customer-view/modals/PlayerLinkingModal"
import PlayerConfirmationModal from "@/components/customer-view/modals/PlayerConfirmationModal"
import LinkingSuccessModal from "@/components/customer-view/modals/LinkingSuccessModal"
import AccountCancellationModal from "@/components/customer-view/modals/AccountCancellationModal"
import { Button } from "@/components/ui/button"

export default function CustomerView() {
  const state = useCustomerState()

  const { linkedPlayer, getDisplayName, getPlayerName } = useCustomerLogic({
    players: state.players || [],
    customerAccount: state.customerAccount,
    setCustomerAccount: state.setCustomerAccount,
  })

  const handlers = useCustomerHandlers({
    customerAccount: state.customerAccount,
    linkedPlayer: linkedPlayer,
    playerSearchId: state.playerIdInput,
    isPlayerLinking: state.isLinking,
    isPlayerConfirmationOpen: state.showConfirmation,
    isLinkingSuccessOpen: state.showLinkingSuccessModal,
    isStatisticsResetOpen: state.isResetConfirmOpen,
    isAccountCancellationOpen: state.isCancelConfirmOpen,
    selectedPlayerForDetailedData: state.selectedPlayerForDetailedData?.player || null,
    isDetailedDataModalOpen: state.isDetailedDataModalOpen,
    viewMode: state.viewMode,
    selectedPostId: state.selectedPostId,
    skipLinkingAfterSuccess: state.skipLinkingAfterSuccess,
    currentRewardRate: state.storeSettings?.rewardRate ?? 0.1,
    storeSettings: state.storeSettings,
    players: state.players || [],
    setLinkedPlayer: state.setSelectedPlayer,
    setPlayerSearchId: state.setPlayerIdInput,
    setIsPlayerLinking: state.setIsLinking,
    setIsPlayerConfirmationOpen: state.setShowConfirmation,
    setIsLinkingSuccessOpen: state.setShowLinkingSuccessModal,
    setIsStatisticsResetOpen: state.setIsResetConfirmOpen,
    setIsAccountCancellationOpen: state.setIsCancelConfirmOpen,
    setSelectedPlayerForDetailedData: (player) => state.setSelectedPlayerForDetailedData(player ? { playerId: player.id, playerName: player.pokerName || player.name || "Unknown", player } : null),
    setIsDetailedDataModalOpen: state.setIsDetailedDataModalOpen,
    setViewMode: state.setViewMode,
    setSelectedPostId: state.setSelectedPostId,
    setSkipLinkingAfterSuccess: state.setSkipLinkingAfterSuccess,
    setCustomerAccount: state.setCustomerAccount,
    setIsMenuOpen: state.setIsMenuOpen,
    setIsCancelling: state.setIsCancelling,
    setLinkingError: state.setLinkingError,
    setOriginalPlayerData: state.setOriginalPlayerData,
    setShowPlayerIdForm: state.setShowPlayerIdForm,
    setShowPlayerLinkModal: state.setShowPlayerLinkModal,
    signOut: state.signOut,
    playerId: state.customerAccount?.playerId || null,
  })

  // 読み込み中の表示 (修正済み)
  if (state.isLoading && !state.customerAccount) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
        <Loader2 className="w-10 h-10 text-blue-600 animate-spin mb-4" />
        <p className="text-gray-600 font-medium">データを読み込み中...</p>
      </div>
    )
  }

  // エラー表示（customerAccountがない場合）
  if (!state.isLoading && !state.customerAccount) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
        <AlertCircle className="w-12 h-12 text-red-500 mb-4" />
        <h2 className="text-xl font-bold text-gray-900 mb-2">認証エラー</h2>
        <p className="text-gray-600 mb-2 text-center">
          顧客情報が見つかりませんでした。
        </p>
        <div className="bg-gray-100 p-4 rounded-md mb-6 text-xs font-mono text-gray-500 max-w-md overflow-auto">
          Debug: {JSON.stringify({ 
            hasAuth: !!state.customerAccount, 
            loading: state.isLoading,
            dataLoaded: state.dataLoaded
          })}
        </div>
        <Button onClick={() => state.signOut()} className="bg-blue-600 hover:bg-blue-700">
          ログイン画面へ戻る
        </Button>
      </div>
    )
  }

  const {
    handlePaymentCompletion,
    handlePlayerIdLink,
    confirmPlayerLink,
    handleStatisticsReset,
    handleDetailedDataClick,
    handlePlayerClick,
    handlePlayerIdChange,
    handlePlayerLinkClick,
    handleSkipLinkingAfterSuccessChange,
    handlePostClick,
    handleBackFromPostDetail,
    handleAccountCancellation,
  } = handlers

  const viewMode = state.viewMode || "main";

  return (
    <div className="min-h-screen bg-gray-50">
      <CustomerHeader
        customerAccount={state.customerAccount}
        linkedPlayer={linkedPlayer}
        getDisplayName={getDisplayName}
        setIsMenuOpen={state.setIsMenuOpen}
      />

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        <ViewSwitcher
          viewMode={viewMode}
          linkedPlayer={linkedPlayer}
          customerAccount={state.customerAccount}
          dailyRankings={state.dailyRankings || []}
          monthlyPoints={state.monthlyPoints || []}
          storeSettings={state.storeSettings}
          rakeHistory={state.rakeHistory || []}
          pointHistory={state.pointHistory || []}
          players={state.players || []}
          selectedPostId={state.selectedPostId}
          selectedTab={state.selectedTab}
          activeTab={state.activeTab}
          currentDate={state.currentDate}
          currentYear={state.currentYear}
          currentMonth={state.currentMonth}
          currentMonthStr={state.currentMonthStr}
          today={state.today}
          isLoading={state.isLoading}
          getDisplayName={getDisplayName}
          handlePostClick={handlePostClick}
          handleBackFromPostDetail={handleBackFromPostDetail}
          setSelectedTab={state.setSelectedTab}
          setActiveTab={state.setActiveTab}
          setSelectedPlayerForChart={state.setSelectedPlayerForChart}
          setIsChartModalOpen={state.setIsChartModalOpen}
          setViewMode={state.setViewMode}
          setSelectedPlayerForDetailedData={state.setSelectedPlayerForDetailedData}
          setIsDetailedDataModalOpen={state.setIsDetailedDataModalOpen}
        />
      </div>

      {/* Modals */}
      <MenuModal
        isOpen={state.isMenuOpen}
        onOpenChange={(open) => state.setIsMenuOpen(open)}
        customerAccount={state.customerAccount}
        linkedPlayer={linkedPlayer}
        onViewModeChange={(mode) => state.setViewMode(mode)}
        onDetailedDataClick={() => handleDetailedDataClick()}
        onPlayerIdChange={() => handlePlayerIdChange()}
        onResetStatistics={() => state.setIsResetConfirmOpen(true)}
        onPlayerLinkClick={() => handlePlayerLinkClick()}
        onAccountCancellation={() => state.setIsCancelConfirmOpen(true)}
        onLogout={() => state.signOut()}
        getDisplayName={getDisplayName}
      />

      <ResetStatisticsModal
        isOpen={state.isResetConfirmOpen}
        onOpenChange={(open) => state.setIsResetConfirmOpen(open)}
        linkedPlayer={linkedPlayer}
        isResetting={state.isResetting}
        onConfirm={() => handleStatisticsReset()}
      />

      <PlayerLinkingModal
        isOpen={state.showPlayerLinkModal || state.showPlayerIdForm}
        onOpenChange={(open) => {
          if (!open) {
            state.setShowPlayerLinkModal(false)
            state.setShowPlayerIdForm(false)
            state.setLinkingError(null)
          }
        }}
        playerIdInput={state.playerIdInput}
        onPlayerIdInputChange={(val) => state.setPlayerIdInput(val)}
        isLinking={state.isLinking}
        linkingError={state.linkingError || ""}
        onSearch={() => handlePlayerIdLink()}
      />

      <PlayerConfirmationModal
        isOpen={state.showConfirmation}
        onOpenChange={(open) => state.setShowConfirmation(open)}
        selectedPlayer={state.selectedPlayer}
        isLinking={state.isLinking}
        onConfirm={() => confirmPlayerLink()}
      />

      <LinkingSuccessModal
        isOpen={state.showLinkingSuccessModal}
        onOpenChange={(open) => state.setShowLinkingSuccessModal(open)}
        customerAccount={state.customerAccount}
        skipLinkingAfterSuccess={state.skipLinkingAfterSuccess}
        onSkipChange={(checked) => handleSkipLinkingAfterSuccessChange(checked)}
        onClose={() => state.setShowLinkingSuccessModal(false)}
      />

      <AccountCancellationModal
        isOpen={state.isCancelConfirmOpen}
        onOpenChange={(open) => state.setIsCancelConfirmOpen(open)}
        onConfirm={() => handleAccountCancellation()}
        isCancelling={state.isCancelling}
      />

      <PlayerDetailedDataModal
        isOpen={state.isDetailedDataModalOpen}
        onClose={() => state.setIsDetailedDataModalOpen(false)}
        player={linkedPlayer}
        rakeHistory={state.rakeHistory || []}
        pointHistory={state.pointHistory || []}
        getDisplayName={getDisplayName}
        activeTab={state.activeTab}
        setActiveTab={(tab) => state.setActiveTab(tab)}
        selectedPlayerForChart={state.selectedPlayerForChart}
        setSelectedPlayerForChart={(player) => state.setSelectedPlayerForChart(player)}
        isChartModalOpen={state.isChartModalOpen}
        setIsChartModalOpen={(open) => state.setIsChartModalOpen(open)}
        players={state.players || []}
      />
    </div>
  )
}
