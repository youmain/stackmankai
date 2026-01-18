// Player 型は types/player.ts で定義
// ここでインポートして再エクスポート
export type { Player, PlayerGameState, PlayerBase, LinkedPlayer } from './player'

export interface Game {
  id: string
  name: string
  isActive: boolean
  createdAt: Date
  updatedAt: Date
  participants: GameParticipant[]
}

export interface GameParticipant {
  playerId: string
  playerName: string
  buyInAmount: number // 購入金額
  currentStack: number // 現在のスタック
  additionalBuyIns: number // 追加購入合計
  joinedAt: Date
}

export interface Transaction {
  id: string
  playerId: string
  gameId?: string
  type: "deposit" | "withdrawal" | "game_buy_in" | "game_additional" | "game_cashout"
  amount: number
  balanceBefore: number
  balanceAfter: number
  description: string
  createdAt: Date
  createdBy: string // 操作した従業員のUID
}

export interface GameTransaction {
  id: string
  gameId: string
  playerId: string
  type: "buy_in" | "additional_buy_in" | "stack_update" | "cashout"
  amount: number
  stackBefore: number
  stackAfter: number
  description: string
  createdAt: Date
  createdBy: string
}

export interface User {
  id: string
  name: string
  isOnline: boolean
  lastActivity: Date
  createdAt: Date
}

export interface Receipt {
  id: string
  playerId: string
  playerName: string
  gameId?: string // 関連するゲームID（ある場合）
  status: "active" | "completed" | "cancelled" | "settled" // Adding 'settled' status for archived receipts
  totalAmount: number // 税込み合計金額
  totalTaxableAmount: number // 課税対象金額
  totalTax: number // 消費税額
  pointsUsed?: number // 使用されたCP数を追加
  profit?: number // 収支（プラスが勝ち、マイナスが負け）
  createdAt: Date
  updatedAt: Date
  createdBy: string // 伝票作成者
  settledAt?: Date // Adding settlement timestamp
  settledBy?: string // Adding who settled the receipt
}

export interface ReceiptItem {
  id: string
  receiptId: string
  menuType: MenuType
  itemName: string
  unitPrice: number
  quantity: number
  totalPrice: number
  isTaxable: boolean // 課税対象かどうか
  chipAmount?: number // ©の数量（スタック購入時のみ）
  conversionRate?: number // 換算レート（1© = ?円）
  createdAt: Date
  createdBy: string // 注文を追加した従業員
}

export type MenuType =
  | "tournament" // トーナメント（非課税）
  | "rebuy" // リバイ（非課税）
  | "stack_purchase" // スタック購入（非課税）
  | "charge" // チャージ（課税）
  | "drink" // ドリンク（課税）
  | "food" // 食事（課税）
  | "other" // その他（課税）
  | "other_non_taxable" // その他（非課税）

export interface MenuCategory {
  type: MenuType
  name: string
  isTaxable: boolean
  description: string
}

export interface DailySales {
  id: string
  date: string // YYYY-MM-DD format
  salesAmount: number // 売上合計
  rakeAmount: number // レーキ合計
  receiptCount: number // 伝票件数
  settledReceipts?: string[] // Adding list of settled receipt IDs for history tracking
  createdAt: string
}

export interface RakeHistory {
  id: string
  gameId: string
  amount: number
  playerCount: number
  calculation: string
  createdAt: string | Date
  // ランキング計算用のプロパティ（ゲーム結果データから取得）
  playerId?: string
  playerName?: string
  finalStack?: number
  buyIn?: number
  additionalStack?: number
  profit?: number // 収支
  rake?: number // レーキ
  timestamp?: string | Date // タイムスタンプ
}

export interface Expense {
  id: string
  description: string // 経費の説明
  amount: number // 金額
  category: "仕入れ" | "光熱費" | "店舗運営費" | "その他" // カテゴリー
  vendor: string // 支払先・店舗名
  date: string // 日付 (YYYY-MM-DD format)
  imageUrl?: string // レシート画像URL
  isOcrProcessed: boolean // OCR処理済みフラグ
  ocrData?: {
    rawText: string // OCRで抽出された生テキスト
    confidence: number // 認識精度
  }
  createdAt: string
  createdBy: string // 登録者
}

// Store 型は types/store.ts で定義
// ここでインポートして再エクスポート
export type { Store } from './store'

export interface StoreSettings {
  id: string
  storeName: string // 店舗名
  storeSlug: string // URL用の店舗識別子
  logo?: string // ロゴ画像URL

  // 価格設定
  drinkDefaultPrice: number // ドリンクのデフォルト価格
  foodDefaultPrice: number // 食事のデフォルト価格
  chargeDefaultPrice: number // チャージのデフォルト価格

  // 機能設定
  hasNomihodai: boolean // 飲み放題システム有無
  nomihodaiPrice: number // 飲み放題価格
  hasTimeCharge: boolean // 時間制課金システム有無
  timeChargeRate: number // 時間あたり料金

  // 税率設定
  taxRate: number // 消費税率（デフォルト10%）

  // レーキ設定
  rakeRate: number // レーキ率（デフォルト10%）

  // 運用設定
  businessHours: {
    open: string // 営業開始時間 (HH:mm)
    close: string // 営業終了時間 (HH:mm)
  }

  // UI設定
  primaryColor: string // メインカラー
  secondaryColor: string // サブカラー

  createdAt: string
  updatedAt: string
}

export interface DailyRanking {
  id: string
  date: string // YYYY-MM-DD format
  rankings: PlayerRanking[]
  isConfirmed: boolean // 売上確定済みかどうか
  pointMultiplier: number // ポイント倍率（通常1、2倍デーは2）
  createdAt: string
  confirmedAt?: string
}

export interface PlayerRanking {
  playerId: string
  playerName: string
  pokerName?: string // ポーカーネーム（ランキング表示用）
  rank: number // 順位
  profit: number // 収支
  points: number // 獲得ポイント
  totalGames?: number // ゲーム数
  winRate?: number // 勝率
  maxWin?: number // 最大勝利
  winStreak?: number // 連勝
}

export interface MonthlyPoints {
  id: string
  playerId: string
  playerName: string
  pokerName?: string // ポーカーネーム（ランキング表示用）
  year: number
  month: number
  totalPoints: number // 月間合計ポイント
  dailyPoints: DailyPointRecord[] // 日別ポイント記録
  createdAt: string
  updatedAt: string
}

export interface DailyPointRecord {
  date: string // YYYY-MM-DD format
  rank: number
  profit: number
  points: number
  multiplier: number
}

export interface StoreRankingSettings {
  id: string
  // プライズ設定
  monthlyPrizes: {
    first: number // 1位のプライズ（©）
    second: number // 2位のプライズ（©）
    third: number // 3位のプライズ（©）
  }
  // 2倍デー設定
  doublePointDays: string[] // YYYY-MM-DD format の配列
  // ポイント設定
  pointSystem: {
    first: number // 1位のポイント（デフォルト8）
    second: number // 2位のポイント（デフォルト5）
    third: number // 3位のポイント（デフォルト3）
    fourth: number // 4位のポイント（デフォルト1）
    fifth: number // 5位のポイント（デフォルト1）
  }
  cashbackPointsSettings: {
    baseRate: number // 基本還元率（％）例：5 = 5%
    dailyRates: {
      [date: string]: number // 日別還元率 YYYY-MM-DD: rate(%)
    }
    usageScope: "all" | "stack_only" // CP使用対象：会計全体 or スタック購入のみ
  }
  // お知らせ機能
  announcement?: {
    message: string // お知らせメッセージ
    isVisible: boolean // 表示/非表示
  }
  // 会員ランク設定
  membershipRankSettings?: {
    enabled: boolean // ランク制度のON/OFF
    ranks: {
      silver: MembershipRankConfig
      gold: MembershipRankConfig
      platinum: MembershipRankConfig
    }
  }
  // 月間ポイント目標
  monthlyPointTarget?: number // 月間ポイント目標
  rewardRate?: number // 還元率
  createdAt: string
  updatedAt: string
}

export interface CustomerAccount {
  id: string
  email: string
  uid?: string // Firebase Auth UID
  stapokaBalance?: number // スタポカ貯スタック
  role?: string // ユーザーロール
  playerId?: string // 紐づけされたプレイヤーID
  playerName?: string // 紐づけされたプレイヤー名
  storeId?: string | null // 所属店舗ID（オプショナル：後で設定可能）
  storeName?: string | null // 所属店舗名（オプショナル：後で設定可能）
  stripeCustomerId?: string // Stripe顧客ID（オプショナル：有料化時に設定）
  subscriptionStatus?: "active" | "inactive" | "canceled" | "past_due" | "trialing" | "free_trial"
  subscriptionId?: string // StripeサブスクリプションID
  currentPeriodStart?: Date
  currentPeriodEnd?: Date
  isBetaTester?: boolean // ベータテスターフラグ
  linkedAt?: Date // プレイヤーと紐づけされた日時
  createdAt?: Date | any // serverTimestamp()を許容
  updatedAt?: Date | any // serverTimestamp()を許容
}

export interface SubscriptionPlan {
  id: string
  name: string
  description: string
  price: number // 月額料金（円）
  stripePriceId: string // Stripe価格ID
  features: string[] // 機能一覧
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}

export interface PaymentHistory {
  id: string
  customerId: string
  stripePaymentIntentId: string
  amount: number
  currency: string
  status: "succeeded" | "failed" | "pending" | "canceled"
  description: string
  paymentMethod?: string // 支払い方法（card, bank_transferなど）
  createdAt: Date
}

export interface StoreSubscriptionSettings {
  id: string
  storeId: string
  // 店舗の月額料金設定
  storeMonthlyFee: number // 店舗の基本月額（デフォルト15000円）
  customerMonthlyFee: number // お客さんの月額（デフォルト1650円税込）
  // Stripe設定
  stripePublishableKey: string
  stripeSecretKey: string
  stripeWebhookSecret: string
  // 機能設定
  allowCustomerSubscription: boolean // お客さんのサブスク機能有効化
  requirePlayerLinking: boolean // プレイヤーID紐づけ必須
  createdAt: Date
  updatedAt: Date
}

export interface PurchaseHistory {
  id: string
  playerId: string
  playerName?: string
  amount: number
  description?: string
  createdAt: Date
  createdBy: string
}

export interface PointHistory {
  id: string
  playerId: string
  playerName: string
  type: "earn" | "use" // 獲得 or 使用
  points: number // CP数
  point?: number // ポイント（互換性用）
  receiptId?: string // 関連する伝票ID
  purchaseAmount?: number // 購入金額（獲得時）
  rate?: number // 適用された還元率（獲得時）
  description: string
  balanceBefore: number
  balanceAfter: number
  createdAt: Date
  createdBy: string
}

export interface MembershipRankConfig {
  requiredCP: number // このランクに必要な累積 CP数
  benefits: {
    cpBoostPercentage: number // CP率アップ（%）
    freeDrink: boolean // ワンドリンク無料
    freeCharge: boolean // チャージ無料
  }
}

export interface ChatMessage {
  id: string
  storeId: string // 店舗ID
  userId: string // 送信者のユーザーID（customerAccountのid）
  userName: string // 送信者の表示名
  message: string // メッセージ内容
  type?: "user" | "system" // メッセージタイプ（デフォルト: "user"）
  createdAt: Date
}


