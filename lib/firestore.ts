/**
 * Firestore Operations - Central Export Hub
 * 
 * このファイルは、すべてのFirestore操作を機能別に分割したモジュールからの
 * インポートを一元管理するハブとして機能します。
 * 
 * 各モジュール:
 * - firestore-common.ts: 共通・ユーティリティ関数
 * - firestore-players.ts: プレイヤー関連操作
 * - firestore-games.ts: ゲーム関連操作
 * - firestore-transactions.ts: 取引・伝票・ポイント関連操作
 * - firestore-rankings.ts: ランキング・統計関連操作
 * - firestore-customers.ts: 顧客アカウント関連操作
 * - firestore-posts.ts: ハンド記録・投稿・チャット関連操作
 * - firestore-users.ts: ユーザー・店舗関連操作
 */

// --- Common & Utilities ---
export {
  checkFirebaseConfig,
  getPlayersCollection,
  getPointHistoryCollection,
  getUsersCollection,
  getGamesCollection,
  getTransactionsCollection,
  getGameTransactionsCollection,
  getRakeHistoryCollection,
  getReceiptsCollection,
  getReceiptItemsCollection,
  getDailySalesCollection,
  getStoreRankingSettingsCollection,
  getCustomerAccountsCollection,
  getPostsCollection,
  getPaymentHistoryCollection,
  getDailyRankingsCollection,
  getMonthlyRankingsCollection,
  getMonthlyPointsCollection,
  getMembershipRankDetails,
} from './firestore-common'

// --- Players ---
export {
  subscribeToPlayers,
  getPlayer,
  addPlayer,
  updatePlayer,
  deletePlayer,
  archivePlayer,
  unarchivePlayer,
  updatePlayerMembershipRank,
  deleteAllPlayers,
  resetPlayerStatistics,
} from './firestore-players'

// --- Games ---
export {
  subscribeToActiveGames,
  subscribeToGames,
  getGame,
  addGame,
  updateGame,
  deleteGame,
  deleteAllGames,
  applyStackResetAndRake,
} from './firestore-games'

// --- Transactions & Receipts & Points ---
export {
  recordPointHistory,
  addRewardPoints,
  deductRewardPoints,
  subscribeToPointHistory,
  subscribeToReceipts,
  subscribeToReceiptItems,
  getReceipt,
  addReceipt,
  updateReceipt,
  completeReceipt,
  deleteReceipt,
  deleteAllReceipts,
} from './firestore-transactions'

// --- Rankings & Statistics ---
export {
  subscribeToDailyRankings,
  subscribeToMonthlyPoints,
  subscribeToMonthlyRankings,
  subscribeToDailySales,
  deleteDailySales,
  settleDailySales,
  getStoreRankingSettings,
  saveStoreRankingSettings,
  subscribeToStoreRankingSettings,
  updateMonthlyPoints,
  confirmDailyRanking,
} from './firestore-rankings'

// --- Customers ---
export {
  subscribeToCustomerAccount,
  createCustomerAccount,
  getCustomerAccount,
  updateCustomerAccount,
  deleteCustomerAccount,
  subscribeToCustomerAccounts,
  addPaymentHistory,
  subscribeToPlayerPurchaseHistory,
  getCustomerByEmail,
  linkPlayerToCustomer,
  createPaymentHistory,
  createCustomerInFirestore,
  updateCustomerPayment,
} from './firestore-customers'

// --- Posts & Chat ---
export {
  addPost,
  updatePost,
  deletePost,
  subscribeToChatMessages,
  addChatMessage,
  subscribeToActiveUsers,
  setActiveUser,
  removeActiveUser,
  subscribeToUserPosts,
  createPost,
} from './firestore-posts'

// --- Users & Stores ---
export {
  createOrUpdateUser,
  subscribeToUsers,
  subscribeToRakeHistory,
  subscribeToStores,
  getStore,
} from './firestore-users'
