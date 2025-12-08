import type { Player, Game, Receipt, RakeHistory, PurchaseHistory, User, StoreRankingSettings, PointHistory } from "@/types"

// モックプレイヤーデータ
export const mockPlayers: Player[] = [
  {
    id: "player1",
    uniqueId: "unique1",
    name: "あおやまあやき",
    pokerName: "あおやま",
    systemBalance: 14200,
    rewardPoints: 1250,
    isPlaying: true,
    currentGameId: "game1",
    membershipStatus: "active",
    subscriptionEndDate: new Date("2025-11-07"),
    createdAt: new Date("2025-10-07"),
    updatedAt: new Date("2025-10-08"),
  },
  {
    id: "player2",
    uniqueId: "unique2",
    name: "あかねちゃん",
    pokerName: "あかね",
    systemBalance: 6200,
    rewardPoints: 580,
    isPlaying: true,
    currentGameId: "game1",
    membershipStatus: "trial",
    subscriptionEndDate: new Date("2025-10-20"),
    createdAt: new Date("2025-10-07"),
    updatedAt: new Date("2025-10-08"),
  },
  {
    id: "player3",
    uniqueId: "unique3",
    name: "いお",
    pokerName: "いお",
    systemBalance: 4150,
    rewardPoints: 320,
    isPlaying: true,
    currentGameId: "game1",
    membershipStatus: "inactive",
    subscriptionEndDate: new Date("2025-10-15"),
    createdAt: new Date("2025-10-07"),
    updatedAt: new Date("2025-10-08"),
  },
  {
    id: "player4",
    uniqueId: "unique4",
    name: "あいさ",
    systemBalance: 0,
    rewardPoints: 0,
    isPlaying: false,
    currentGameId: "",
    membershipStatus: "inactive",
    subscriptionEndDate: new Date("2025-10-10"),
    createdAt: new Date("2025-10-07"),
    updatedAt: new Date("2025-10-08"),
  },
  {
    id: "player5",
    uniqueId: "unique5",
    name: "あかい",
    systemBalance: 14400,
    rewardPoints: 2100,
    isPlaying: false,
    currentGameId: "",
    membershipStatus: "inactive",
    subscriptionEndDate: new Date("2025-10-12"),
    createdAt: new Date("2025-10-07"),
    updatedAt: new Date("2025-10-08"),
  },
  {
    id: "player6",
    uniqueId: "unique6",
    name: "あんさん",
    systemBalance: 0,
    rewardPoints: 0,
    isPlaying: false,
    currentGameId: "",
    membershipStatus: "inactive",
    subscriptionEndDate: new Date("2025-10-14"),
    createdAt: new Date("2025-10-07"),
    updatedAt: new Date("2025-10-08"),
  },
]

// モックゲームデータ
export const mockGames: Game[] = [
  {
    id: "game1",
    name: "キャッシュゲーム #1",
    isActive: true,
    createdAt: new Date("2025-10-08"),
    updatedAt: new Date("2025-10-08"),
    participants: [
      {
        playerId: "player1",
        playerName: "あおやまあやき",
        buyInAmount: 10000,
        currentStack: 14200,
        additionalBuyIns: 4200,
        joinedAt: new Date("2025-10-08"),
      },
      {
        playerId: "player2",
        playerName: "あかねちゃん",
        buyInAmount: 5000,
        currentStack: 6200,
        additionalBuyIns: 1200,
        joinedAt: new Date("2025-10-08"),
      },
      {
        playerId: "player3",
        playerName: "いお",
        buyInAmount: 5000,
        currentStack: 4150,
        additionalBuyIns: 0,
        joinedAt: new Date("2025-10-08"),
      },
    ],
  },
]

// モックレシートデータ
export const mockReceipts: Receipt[] = [
  {
    id: "receipt1",
    playerId: "player1",
    playerName: "あおやまあやき",
    gameId: "game1",
    status: "active",
    totalAmount: 14200,
    totalTaxableAmount: 0,
    totalTax: 0,
    createdAt: new Date("2025-10-08"),
    updatedAt: new Date("2025-10-08"),
    createdBy: "staff1",
  },
  {
    id: "receipt2",
    playerId: "player2",
    playerName: "あかねちゃん",
    gameId: "game1",
    status: "active",
    totalAmount: 6200,
    totalTaxableAmount: 0,
    totalTax: 0,
    createdAt: new Date("2025-10-08"),
    updatedAt: new Date("2025-10-08"),
    createdBy: "staff1",
  },
]

// モックレーキ履歴データ
export const mockRakeHistory: RakeHistory[] = [
  {
    id: "rake1",
    gameId: "game1",
    amount: 500,
    playerCount: 3,
    calculation: "500© (3人)",
    createdAt: new Date("2025-10-08").toISOString(),
  },
]

// モック購入履歴データ
export const mockPurchaseHistory: PurchaseHistory[] = [
  {
    id: "purchase1",
    playerId: "player1",
    playerName: "あおやまあやき",
    amount: 10000,
    description: "初回購入",
    createdAt: new Date("2025-10-08"),
    createdBy: "staff1",
  },
  {
    id: "purchase2",
    playerId: "player1",
    playerName: "あおやまあやき",
    amount: 4200,
    description: "追加購入",
    createdAt: new Date("2025-10-08"),
    createdBy: "staff1",
  },
  {
    id: "purchase3",
    playerId: "player2",
    playerName: "あかねちゃん",
    amount: 5000,
    description: "初回購入",
    createdAt: new Date("2025-10-08"),
    createdBy: "staff1",
  },
  {
    id: "purchase4",
    playerId: "player2",
    playerName: "あかねちゃん",
    amount: 1200,
    description: "追加購入",
    createdAt: new Date("2025-10-08"),
    createdBy: "staff1",
  },
]

// モックユーザーデータ
export const mockUsers: User[] = [
  {
    id: "user1",
    name: "インフルエンサー",
    isOnline: true,
    lastActivity: new Date(),
    createdAt: new Date("2025-10-07"),
  },
]

export const mockMonthlyPoints: any[] = []

export const mockMonthlyRankings: any[] = []

export const mockDailyRankings: any[] = []

// モックポイント履歴データ
export const mockPointHistory: PointHistory[] = [
  {
    id: "ph1",
    playerId: "player1",
    playerName: "あおやまあやき",
    type: "earn",
    points: 710,
    receiptId: "receipt1",
    purchaseAmount: 14200,
    rate: 5,
    description: "会計時のポイント付与（還元率5%）",
    balanceBefore: 540,
    balanceAfter: 1250,
    createdAt: new Date("2025-10-08"),
    createdBy: "staff1",
  },
  {
    id: "ph2",
    playerId: "player2",
    playerName: "あかねちゃん",
    type: "earn",
    points: 310,
    receiptId: "receipt2",
    purchaseAmount: 6200,
    rate: 5,
    description: "会計時のポイント付与（還元率5%）",
    balanceBefore: 270,
    balanceAfter: 580,
    createdAt: new Date("2025-10-08"),
    createdBy: "staff1",
  },
  {
    id: "ph3",
    playerId: "player5",
    playerName: "あかい",
    type: "use",
    points: 500,
    receiptId: "receipt3",
    description: "会計時のポイント使用",
    balanceBefore: 2600,
    balanceAfter: 2100,
    createdAt: new Date("2025-10-07"),
    createdBy: "staff1",
  },
]

// モックストアランキング設定データ
export const mockStoreRankingSettings: StoreRankingSettings = {
  id: "default_settings",
  monthlyPrizes: {
    first: 10000,
    second: 5000,
    third: 3000,
  },
  doublePointDays: [],
  pointSystem: {
    first: 8,
    second: 5,
    third: 3,
    fourth: 1,
    fifth: 1,
  },
  rewardPointsSettings: {
    baseRate: 5,
    dailyRates: {
      [new Date().toISOString().split('T')[0]]: 10, // 今日は10%還元
    },
    usageScope: "all",
  },
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
}
