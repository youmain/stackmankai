/**
 * Player 型定義
 * 
 * このファイルは、プレイヤーに関連するすべての型定義を一元管理します。
 * 異なる用途のプレイヤー型を統一的に定義し、型の混同を防ぎます。
 */

/**
 * PlayerBase: すべてのプレイヤー型の基本インターフェース
 * プレイヤーの基本情報を定義
 */
export interface PlayerBase {
  id: string
  uniqueId: string // ランダム生成されたユニークID（サブスク機能用）
  name: string
  pokerName?: string // ポーカーネーム（オプション）
  furigana?: string // 読み仮名（オプション）
}

/**
 * PlayerGameState: ゲーム管理用のプレイヤー型
 * 店舗のゲーム管理システムで使用
 * types/index.ts の元々の Player 型に対応
 */
export interface PlayerGameState extends PlayerBase {
  systemBalance: number // 【貯スタック】店舗が管理するスタック。ゲームプレイで変動。スタックマンハンド購入には使用されない。
  stapokaBalance?: number // 【スタポカ貯スタック】チャットのポーカーゲーム内で獲得したチップ。スタックマンハンド購入に使用される。
  rewardPoints: number // 【CP（キャッシュバックポイント）】会員ランク判定用。スタックマンハンド購入には使用されない。
  currentGameId?: string // 現在参加中のゲームID
  isPlaying: boolean // プレイ中かどうか
  isSpecial?: boolean // 特別仕様フラグを追加
  isDeduction?: boolean // 差引仕様フラグ（ゲーム終了時に残ったマイナス分のみ購入金額として計上）
  membershipStatus?: "trial" | "active" | "expired" | "none" // 会員ステータス
  subscriptionEndDate?: Date // サブスクリプション有効期限
  storeId?: string // ホーム店舗ID
  storeName?: string // ホーム店舗名
  membershipRank?: "silver" | "gold" | "platinum" | "none" // 会員ランク
  totalCPEarned?: number // 獲得CP総額（ランク判定用、CP使用でも減らない）
  playerId?: string // プレイヤーID（互換性用）
  lastGameDate?: string | Date // 最後のゲーム日時
  createdAt: Date
  updatedAt: Date
}

/**
 * PokerPlayer: ポーカーゲーム用のプレイヤー型
 * ハンド記録作成時に使用
 * types/post.ts の元々の Player 型に対応
 */
export interface PokerPlayer extends PlayerBase {
  position: number
  stack: number
  bet: number
  action?: "fold" | "call" | "raise" | "check" | "all-in"
  cards?: any[] // PlayingCard の配列
  isActive?: boolean
  isDealer?: boolean
}

/**
 * Player: 汎用プレイヤー型
 * PlayerGameState と PokerPlayer の Union 型
 * 用途に応じて適切な型が選択されます
 */
export type Player = PlayerGameState | PokerPlayer

/**
 * LinkedPlayer: 互換性用の型エイリアス
 * 既存コードとの互換性を保つため
 */
export type LinkedPlayer = PlayerGameState
