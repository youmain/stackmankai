/**
 * ポーカープレイヤー統計データの収集と計算
 * VPIP、PFR、AF（Aggression Factor）などの指標を計算
 */

import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  serverTimestamp,
  increment,
} from "firebase/firestore"
import { getDb } from "./firebase"
import { collection } from "firebase/firestore"
import type { PokerGameState, Player } from "@/types/poker"

/**
 * プレイヤー統計データの型定義
 */
export interface PlayerStats {
  playerId: string
  userName: string
  totalHands: number // 総ハンド数
  participatedHands: number // 参加したハンド数（チップを投じた）
  raisedHands: number // レイズしたハンド数
  checkRaiseCount: number // チェックレイズ回数
  dunkBetCount: number // ドンクベット回数
  bets: number // ベット回数
  raises: number // レイズ回数
  calls: number // コール回数
  checks: number // チェック回数
  folds: number // フォールド回数
  vpip: number // 参加率（VPIP）
  pfr: number // プリフロップレイズ率
  af: number // アグレッションファクター
  updatedAt: any
  actionHistory: ActionRecord[]
}

/**
 * 行動記録の型定義
 */
export interface ActionRecord {
  phase: string // preflop, flop, turn, river
  action: string // fold, check, call, bet, raise, all-in
  amount: number
  timestamp: any
}

/**
 * ハンド結果の型定義
 */
export interface HandResult {
  handNumber: number
  players: Array<{
    playerId: string
    userName: string
    actions: ActionRecord[]
    finalStack: number
  }>
  result: {
    winners: string[]
    pot: number
    timestamp: any
  }
}

/**
 * プレイヤー統計コレクションへの参照を取得
 */
const getPlayerStatsCollection = (storeId: string) => {
  const db = getDb()
  if (!db) throw new Error("Firestore is not initialized")
  return collection(db, "stores", storeId, "playerStats")
}

/**
 * プレイヤー統計を初期化
 */
export const initializePlayerStats = async (
  storeId: string,
  player: Player
): Promise<void> => {
  const statsCollection = getPlayerStatsCollection(storeId)
  const statsDoc = doc(statsCollection, player.userId)

  const initialStats: PlayerStats = {
    playerId: player.userId,
    userName: player.userName,
    totalHands: 0,
    participatedHands: 0,
    raisedHands: 0,
    checkRaiseCount: 0,
    dunkBetCount: 0,
    bets: 0,
    raises: 0,
    calls: 0,
    checks: 0,
    folds: 0,
    vpip: 0,
    pfr: 0,
    af: 0,
    updatedAt: serverTimestamp(),
    actionHistory: [],
  }

  const statsSnap = await getDoc(statsDoc)
  if (!statsSnap.exists()) {
    await setDoc(statsDoc, initialStats)
  }
}

/**
 * プレイヤー統計を取得
 */
export const getPlayerStats = async (
  storeId: string,
  playerId: string
): Promise<PlayerStats | null> => {
  const statsCollection = getPlayerStatsCollection(storeId)
  const statsDoc = doc(statsCollection, playerId)

  const statsSnap = await getDoc(statsDoc)
  if (!statsSnap.exists()) {
    return null
  }

  return statsSnap.data() as PlayerStats
}

/**
 * ハンド終了後にプレイヤー統計を更新
 */
export const updatePlayerStatsAfterHand = async (
  storeId: string,
  gameData: PokerGameState,
  handHistory: HandResult
): Promise<void> => {
  const statsCollection = getPlayerStatsCollection(storeId)

  // 各プレイヤーの統計を更新
  for (const player of gameData.players) {
    const statsDoc = doc(statsCollection, player.userId)
    const statsSnap = await getDoc(statsDoc)

    if (!statsSnap.exists()) {
      // 初期化
      await initializePlayerStats(storeId, player)
    }

    const currentStats = statsSnap.data() as PlayerStats
    const playerHandHistory = handHistory.players.find(
      (p) => p.playerId === player.userId
    )

    if (!playerHandHistory) continue

    // 行動を分析
    const { participated, raised, bets, raises, calls, checks, folds } =
      analyzeActions(playerHandHistory.actions)

    // 統計を計算
    const newTotalHands = currentStats.totalHands + 1
    const newParticipatedHands = currentStats.participatedHands + (participated ? 1 : 0)
    const newRaisedHands = currentStats.raisedHands + (raised ? 1 : 0)

    const newBets = currentStats.bets + bets
    const newRaises = currentStats.raises + raises
    const newCalls = currentStats.calls + calls
    const newChecks = currentStats.checks + checks
    const newFolds = currentStats.folds + folds

    // VPIP = 参加したハンド数 / 総ハンド数
    const vpip = (newParticipatedHands / newTotalHands) * 100

    // PFR = プリフロップでレイズしたハンド数 / 総ハンド数
    const preflopRaises = playerHandHistory.actions.filter(
      (a) => a.phase === "preflop" && (a.action === "raise" || a.action === "all-in")
    ).length
    const pfr = (preflopRaises / newTotalHands) * 100

    // AF = (ベット + レイズ) / コール
    const af = newCalls > 0 ? (newBets + newRaises) / newCalls : 0

    // 統計を更新
    await updateDoc(statsDoc, {
      totalHands: newTotalHands,
      participatedHands: newParticipatedHands,
      raisedHands: newRaisedHands,
      bets: newBets,
      raises: newRaises,
      calls: newCalls,
      checks: newChecks,
      folds: newFolds,
      vpip,
      pfr,
      af,
      updatedAt: serverTimestamp(),
      actionHistory: [...currentStats.actionHistory, ...playerHandHistory.actions],
    })
  }
}

/**
 * 行動を分析
 */
const analyzeActions = (
  actions: ActionRecord[]
): {
  participated: boolean
  raised: boolean
  bets: number
  raises: number
  calls: number
  checks: number
  folds: number
} => {
  let participated = false
  let raised = false
  let bets = 0
  let raises = 0
  let calls = 0
  let checks = 0
  let folds = 0

  for (const action of actions) {
    if (action.action === "fold") {
      folds++
    } else if (action.action === "check") {
      checks++
    } else if (action.action === "call") {
      calls++
      participated = true
    } else if (action.action === "bet") {
      bets++
      participated = true
    } else if (action.action === "raise" || action.action === "all-in") {
      raises++
      raised = true
      participated = true
    }
  }

  return {
    participated,
    raised,
    bets,
    raises,
    calls,
    checks,
    folds,
  }
}

/**
 * プレイヤーのプレイスタイルを分類
 */
export const classifyPlayStyle = (stats: PlayerStats): string => {
  if (stats.totalHands < 20) {
    return "insufficient_data" // データ不足
  }

  const vpip = stats.vpip
  const pfr = stats.pfr
  const af = stats.af

  // ルース・アグレッシブ（LA）
  if (vpip > 35 && pfr > 20 && af > 3) {
    return "loose_aggressive"
  }

  // ルース・パッシブ（LP）
  if (vpip > 35 && pfr <= 20 && af <= 2) {
    return "loose_passive"
  }

  // タイト・アグレッシブ（TA）
  if (vpip <= 25 && pfr > 15 && af > 3) {
    return "tight_aggressive"
  }

  // タイト・パッシブ（TP）
  if (vpip <= 25 && pfr <= 15 && af <= 2) {
    return "tight_passive"
  }

  // バランス型
  return "balanced"
}

/**
 * 相手のレンジを推測
 */
export const estimateOpponentRange = (
  stats: PlayerStats,
  action: string,
  phase: string
): string => {
  const playStyle = classifyPlayStyle(stats)

  // プリフロップでのレイズ
  if (phase === "preflop" && (action === "raise" || action === "all-in")) {
    if (playStyle === "tight_aggressive") {
      return "AA, KK, QQ, AK, AQ" // 非常に強いハンド
    } else if (playStyle === "loose_aggressive") {
      return "AA-22, AK-A9, KQ, KJ" // より広いレンジ
    } else if (playStyle === "balanced") {
      return "AA-TT, AK, AQ" // バランスの取れたレンジ
    }
  }

  // フロップでのベット
  if (phase === "flop" && action === "bet") {
    if (playStyle === "tight_aggressive") {
      return "Strong made hands (Top pair+)" // 強いハンド
    } else if (playStyle === "loose_aggressive") {
      return "Any pair or draw" // ペアかドロー
    }
  }

  return "Unknown range"
}

/**
 * 推奨アクションを生成
 */
export const generateRecommendedAction = (
  stats: PlayerStats,
  playerEquity: number,
  potOdds: number
): {
  action: string
  reason: string
  confidence: number
} => {
  const playStyle = classifyPlayStyle(stats)
  const af = stats.af

  // データが不足している場合
  if (stats.totalHands < 20) {
    return {
      action: "call",
      reason: "相手のデータが不足しています。様子を見ましょう。",
      confidence: 0.5,
    }
  }

  // エクイティがポットオッズより高い場合
  if (playerEquity > potOdds) {
    if (playStyle === "tight_aggressive" && af > 3) {
      return {
        action: "raise",
        reason: `相手は${playStyle}です。強気に出ましょう。`,
        confidence: 0.8,
      }
    } else {
      return {
        action: "call",
        reason: `エクイティ（${(playerEquity * 100).toFixed(1)}%）がポットオッズ（${(potOdds * 100).toFixed(1)}%）を上回っています。`,
        confidence: 0.7,
      }
    }
  }

  // エクイティがポットオッズより低い場合
  if (playStyle === "tight_aggressive" && af < 2) {
    return {
      action: "fold",
      reason: `相手は${playStyle}で、ここでのベットは強いハンドの可能性が高いです。`,
      confidence: 0.75,
    }
  }

  return {
    action: "call",
    reason: "様子を見ましょう。",
    confidence: 0.5,
  }
}
