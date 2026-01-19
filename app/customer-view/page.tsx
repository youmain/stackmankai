"use client"

import { useRouter } from "next/navigation"
import { User, Menu } from 'lucide-react' // Only essential icons for the final page structure

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


export default function CustomerView() {
  const state = useCustomerState()

  const { linkedPlayer, getDisplayName, getPlayerName } = useCustomerLogic({
    players: state.players,
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
    selectedPlayerForDetailedData: null,
    isDetailedDataModalOpen: state.isDetailedDataModalOpen,
    viewMode: state.viewMode,
    selectedPostId: state.selectedPostId,
    skipLinkingAfterSuccess: state.skipLinkingAfterSuccess,
    currentRewardRate: state.storeSettings?.rewardRate ?? 0.1,
    storeSettings: state.storeSettings,
    players: state.players,
    setLinkedPlayer: () => {},
    setPlayerSearchId: state.setPlayerIdInput,
    setIsPlayerLinking: state.setIsLinking,
    setIsPlayerConfirmationOpen: state.setShowConfirmation,
    setIsLinkingSuccessOpen: state.setShowLinkingSuccessModal,
    setIsStatisticsResetOpen: state.setIsResetConfirmOpen,
    setIsAccountCancellationOpen: state.setIsCancelConfirmOpen,
    setSelectedPlayerForDetailedData: () => {},
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
          viewMode={state.viewMode}
          linkedPlayer={linkedPlayer}
          customerAccount={state.customerAccount}
          dailyRankings={state.dailyRankings}
          monthlyPoints={state.monthlyPoints}
          storeSettings={state.storeSettings}
          rakeHistory={state.rakeHistory}
          pointHistory={state.pointHistory}
          players={state.players}
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
        />
      </div>

      {/* Modals */}
      <MenuModal
        isOpen={state.isMenuOpen}
        onOpenChange={state.setIsMenuOpen}
        customerAccount={state.customerAccount}
        linkedPlayer={linkedPlayer}
        getDisplayName={getDisplayName}
        onDetailedDataClick={handleDetailedDataClick}
        onPlayerIdChange={handlePlayerIdChange}
        onResetStatistics={handleStatisticsReset}
        onPlayerLinkClick={handlePlayerLinkClick}
        onAccountCancellation={handleAccountCancellation}
        onViewModeChange={state.setViewMode}
        onLogout={() => {
          state.setCustomerAccount(null)
          state.signOut()
          window.location.href = "/"
        }}
      />

      <ResetStatisticsModal
        isOpen={state.isResetConfirmOpen}
        onOpenChange={state.setIsResetConfirmOpen}
        linkedPlayer={linkedPlayer}
        isResetting={state.isResetting}
        onConfirm={handleStatisticsReset}
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
        onPlayerIdInputChange={handlePlayerIdChange}
        isLinking={state.isLinking}
        linkingError={state.linkingError || ""}
        onSearch={handlePlayerIdLink}
      />

      <PlayerConfirmationModal
        isOpen={state.showConfirmation}
        onOpenChange={state.setShowConfirmation}
        selectedPlayer={state.selectedPlayer}
        isLinking={state.isLinking}
        onConfirm={confirmPlayerLink}
      />

      <LinkingSuccessModal
        isOpen={state.showLinkingSuccessModal}
        onOpenChange={state.setShowLinkingSuccessModal}
        customerAccount={state.customerAccount}
        skipLinkingAfterSuccess={state.skipLinkingAfterSuccess}
        onSkipChange={handleSkipLinkingAfterSuccessChange}
        onClose={() => state.setShowLinkingSuccessModal(false)}
      />

      <AccountCancellationModal
        isOpen={state.isCancelConfirmOpen}
        onOpenChange={state.setIsCancelConfirmOpen}
        onConfirm={handleAccountCancellation}
        isCancelling={state.isCancelling}
      />

      <PlayerDetailedDataModal
        isOpen={state.isDetailedDataModalOpen}
        onClose={() => state.setIsDetailedDataModalOpen(false)}
        player={null}
        rakeHistory={state.rakeHistory}
        pointHistory={state.pointHistory}
        getDisplayName={getDisplayName}
        activeTab={state.activeTab}
        setActiveTab={state.setActiveTab}
        selectedPlayerForChart={state.selectedPlayerForChart}
        setSelectedPlayerForChart={state.setSelectedPlayerForChart}
        isChartModalOpen={state.isChartModalOpen}
        setIsChartModalOpen={state.setIsChartModalOpen}
        players={state.players}
      />
    </div>
  )
}
