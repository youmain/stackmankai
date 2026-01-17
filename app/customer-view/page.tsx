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
  const {
    viewMode, setViewMode, selectedPostId, setSelectedPostId, isDetailedDataModalOpen, setIsDetailedDataModalOpen,
    players, dailyRankings, monthlyPoints, storeSettings, selectedTab, setSelectedTab, isMenuOpen, setIsMenuOpen,
    playerIdInput, setPlayerIdInput, isLinking, setIsLinking, linkingError, setLinkingError,
    showLinkingSuccessModal, setShowLinkingSuccessModal, skipLinkingAfterSuccess, setSkipLinkingAfterSuccess, showConfirmation,
    setShowConfirmation, selectedPlayer, rakeHistory, selectedPlayerForChart, setSelectedPlayerForChart,
    isChartModalOpen, setIsChartModalOpen, activeTab, setActiveTab, pointHistory,
    isLoading, dataLoaded, showPlayerIdForm, setShowPlayerIdForm,
    isResetConfirmOpen, setIsResetConfirmOpen, isResetting,
    isCancelConfirmOpen, setIsCancelConfirmOpen, isCancelling, showPlayerLinkModal, setShowPlayerLinkModal,
    currentDate, currentYear, currentMonth, currentMonthStr, today,
    customerAccount, setCustomerAccount, signOut, router,
  } = state

  const { linkedPlayer, getDisplayName, getPlayerName } = useCustomerLogic({
    players,
    customerAccount,
    setCustomerAccount,
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
  } = useCustomerHandlers({
    customerAccount: state.customerAccount,
    linkedPlayer,
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
    setLinkedPlayer: () => {}, // useCustomerLogic handles this now
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
    router: state.router,
    players: state.players,
    getDisplayName,
    signOut: state.signOut,
  })

  return (
    <div className="min-h-screen bg-gray-50">
      <CustomerHeader
        customerAccount={customerAccount}
        linkedPlayer={linkedPlayer}
        getDisplayName={getDisplayName}
        setIsMenuOpen={setIsMenuOpen}
      />

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        <ViewSwitcher
          viewMode={viewMode}
          linkedPlayer={linkedPlayer}
          customerAccount={customerAccount}
          dailyRankings={dailyRankings}
          monthlyPoints={monthlyPoints}
          storeSettings={storeSettings}
          rakeHistory={rakeHistory}
          pointHistory={pointHistory}
          players={players}
          selectedPostId={selectedPostId}
          selectedTab={selectedTab}
          activeTab={activeTab}
          currentDate={currentDate}
          currentYear={currentYear}
          currentMonth={currentMonth}
          currentMonthStr={currentMonthStr}
          today={today}
          isLoading={isLoading}
          getDisplayName={getDisplayName}
          handlePostClick={handlePostClick}
          handleBackFromPostDetail={handleBackFromPostDetail}
          setSelectedTab={setSelectedTab}
          setActiveTab={setActiveTab}
          setSelectedPlayerForChart={setSelectedPlayerForChart}
          setIsChartModalOpen={setIsChartModalOpen}
        />
      </div>

      {/* Modals */}
      <MenuModal
        isOpen={isMenuOpen}
        onOpenChange={setIsMenuOpen}
        customerAccount={customerAccount}
        linkedPlayer={linkedPlayer}
        getDisplayName={getDisplayName}
        onDetailedDataClick={handleDetailedDataClick}
        onPlayerIdChange={handlePlayerIdChange}
        onResetStatistics={handleStatisticsReset}
        onPlayerLinkClick={handlePlayerLinkClick}
        onAccountCancellation={handleAccountCancellation}
        onViewModeChange={setViewMode}
        onLogout={() => {
          setCustomerAccount(null)
          signOut()
          window.location.href = "/"
        }}
      />

      <ResetStatisticsModal
        isOpen={isResetConfirmOpen}
        onOpenChange={setIsResetConfirmOpen}
        linkedPlayer={linkedPlayer}
        isResetting={isResetting}
        onConfirm={handleStatisticsReset}
      />

      <PlayerLinkingModal
        isOpen={showPlayerLinkModal || showPlayerIdForm}
        onOpenChange={(open) => {
          if (!open) {
            setShowPlayerLinkModal(false)
            setShowPlayerIdForm(false)
            setLinkingError(null)
          }
        }}
        playerIdInput={playerIdInput}
        onPlayerIdInputChange={handlePlayerIdChange}
        isLinking={isLinking}
        linkingError={linkingError || ""}
        onSearch={handlePlayerIdLink}
      />

      <PlayerConfirmationModal
        isOpen={showConfirmation}
        onOpenChange={setShowConfirmation}
        selectedPlayer={selectedPlayer}
        isLinking={isLinking}
        onConfirm={confirmPlayerLink}
      />

      <LinkingSuccessModal
        isOpen={showLinkingSuccessModal}
        onOpenChange={setShowLinkingSuccessModal}
        customerAccount={customerAccount}
        skipLinkingAfterSuccess={skipLinkingAfterSuccess}
        onSkipChange={handleSkipLinkingAfterSuccessChange}
        onClose={() => setShowLinkingSuccessModal(false)}
      />

      <AccountCancellationModal
        isOpen={isCancelConfirmOpen}
        onOpenChange={setIsCancelConfirmOpen}
        onConfirm={handleAccountCancellation}
        isCancelling={isCancelling}
      />

      <PlayerDetailedDataModal
        isOpen={isDetailedDataModalOpen}
        onClose={() => setIsDetailedDataModalOpen(false)}
        player={null}
        rakeHistory={rakeHistory}
        pointHistory={pointHistory}
        getDisplayName={getDisplayName}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        selectedPlayerForChart={selectedPlayerForChart}
        setSelectedPlayerForChart={setSelectedPlayerForChart}
        isChartModalOpen={isChartModalOpen}
        setIsChartModalOpen={setIsChartModalOpen}
        players={players}
      />
    </div>
  )
}
