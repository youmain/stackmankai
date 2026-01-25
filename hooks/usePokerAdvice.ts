"use client"

import { useState, useCallback, useEffect } from "react"
import { generatePokerAdvice, generateSimpleAdvice, type PokerAdvice, type AdvisorType } from "@/lib/ai-poker-advisor"
import { getPlayerStats, type PlayerStats } from "@/lib/poker-stats"
import type { Card } from "@/types/poker"

interface UsePokerAdviceParams {
  storeId: string
  gameId: string
  playerId: string
  playerCards: Card[]
  communityCards: Card[]
  potSize: number
  playerStack: number
  opponentStack: number
  gamePhase: string
  opponentId?: string
  advisorType?: AdvisorType
}

export const usePokerAdvice = (params: UsePokerAdviceParams) => {
  const [advice, setAdvice] = useState<PokerAdvice | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [opponentStats, setOpponentStats] = useState<PlayerStats | null>(null)

  // 相手の統計情報を取得
  useEffect(() => {
    const fetchOpponentStats = async () => {
      if (!params.opponentId) return

      try {
        const stats = await getPlayerStats(params.storeId, params.opponentId)
        setOpponentStats(stats)
      } catch (err) {
        console.error("Error fetching opponent stats:", err)
      }
    }

    fetchOpponentStats()
  }, [params.storeId, params.opponentId])

  // アドバイスを生成
  const generateAdvice = useCallback(async () => {
    if (!params.playerCards || params.playerCards.length === 0) {
      return;
    }
    
    setLoading(true)
    setError(null)

    try {
      // エクイティを計算（簡略版）
      const equity = calculateEquity(params.playerCards, params.communityCards)

      // ポットオッズを計算
      const potOdds = calculatePotOdds(params.potSize, params.playerStack)

      // プレイヤーハンドを構築
      const playerHand = {
        cards: params.playerCards,
        equity,
      }

      const advisorType = params.advisorType || "balanced"

      // AIアドバイスを生成
      let generatedAdvice: PokerAdvice

      if (opponentStats && opponentStats.totalHands > 20) {
        // 十分なデータがある場合はLLMを使用
        try {
          generatedAdvice = await generatePokerAdvice(
            playerHand,
            params.communityCards,
            params.potSize,
            potOdds,
            opponentStats,
            params.gamePhase,
            params.playerStack,
            params.opponentStack,
            advisorType
          )
        } catch (err) {
          console.warn("LLM advice generation failed, using simple advice:", err)
          // LLMが失敗した場合は簡単なアドバイスを使用
          generatedAdvice = generateSimpleAdvice(
            equity,
            potOdds,
            opponentStats,
            params.gamePhase,
            advisorType
          )
        }
      } else {
        // データが不足している場合は簡単なアドバイスを使用
        generatedAdvice = generateSimpleAdvice(
          equity,
          potOdds,
          opponentStats,
          params.gamePhase,
          advisorType
        )
      }

      setAdvice(generatedAdvice)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Unknown error"
      setError(errorMessage)
      console.error("Error generating advice:", err)
    } finally {
      setLoading(false)
    }
  }, [
    params.playerCards,
    params.communityCards,
    params.potSize,
    params.playerStack,
    params.opponentStack,
    params.gamePhase,
    params.storeId,
    params.advisorType,
    opponentStats,
  ])

  return {
    advice,
    loading,
    error,
    generateAdvice,
    opponentStats,
    advisorType: params.advisorType || "balanced",
  }
}

/**
 * エクイティを計算（簡略版）
 * 実際の計算には、より複雑なアルゴリズムが必要
 */
const calculateEquity = (playerCards: Card[], communityCards: Card[]): number => {
  // これは簡略版です
  // 実際には、モンテカルロシミュレーションなどを使用する必要があります

  // プレイヤーのハンドランクを計算
  const playerRank = getHandRank(playerCards)

  // コミュニティカードの数に基づいて推定
  if (communityCards.length === 0) {
    // プリフロップ
    return estimatePreflopEquity(playerCards)
  } else if (communityCards.length === 3) {
    // フロップ
    return estimateFlopEquity(playerCards, communityCards)
  } else if (communityCards.length === 4) {
    // ターン
    return estimateTurnEquity(playerCards, communityCards)
  } else if (communityCards.length === 5) {
    // リバー
    return estimateRiverEquity(playerCards, communityCards)
  }

  return 0.5
}

/**
 * ハンドランクを取得
 */
const getHandRank = (cards: Card[]): number => {
  // 簡略版: カードの強さを合計
  let rank = 0
  for (const card of cards) {
    const rankValue = getRankValue(card.rank)
    rank += rankValue
  }
  return rank
}

/**
 * ランク値を取得
 */
const getRankValue = (rank: string): number => {
  const values: { [key: string]: number } = {
    A: 14,
    K: 13,
    Q: 12,
    J: 11,
    T: 10,
    "9": 9,
    "8": 8,
    "7": 7,
    "6": 6,
    "5": 5,
    "4": 4,
    "3": 3,
    "2": 2,
  }
  return values[rank] || 0
}

/**
 * プリフロップエクイティを推定
 */
const estimatePreflopEquity = (cards: Card[]): number => {
  if (cards.length !== 2) return 0.5

  const rank1 = getRankValue(cards[0].rank)
  const rank2 = getRankValue(cards[1].rank)

  // ペア
  if (cards[0].rank === cards[1].rank) {
    if (rank1 >= 13) return 0.55 // AA, KK
    if (rank1 >= 11) return 0.52 // QQ, JJ
    if (rank1 >= 9) return 0.50 // TT, 99
    return 0.48
  }

  // スーテッド
  if (cards[0].suit === cards[1].suit) {
    if ((rank1 === 14 || rank2 === 14) && Math.abs(rank1 - rank2) <= 4) {
      return 0.54 // AK, AQ, AJ, AT
    }
    if ((rank1 === 13 || rank2 === 13) && Math.abs(rank1 - rank2) <= 3) {
      return 0.52 // KQ, KJ, KT
    }
    return 0.50
  }

  // オフスーテッド
  if ((rank1 === 14 || rank2 === 14) && Math.abs(rank1 - rank2) <= 3) {
    return 0.51 // AK, AQ, AJ
  }

  return 0.48
}

/**
 * フロップエクイティを推定
 */
const estimateFlopEquity = (playerCards: Card[], communityCards: Card[]): number => {
  // 簡略版: トップペアなら50%以上、ドローなら35-45%
  const playerRank = getHandRank(playerCards)
  const communityRank = getHandRank(communityCards)

  if (playerRank > communityRank) {
    return 0.55
  } else if (playerRank === communityRank) {
    return 0.50
  } else {
    return 0.40
  }
}

/**
 * ターンエクイティを推定
 */
const estimateTurnEquity = (playerCards: Card[], communityCards: Card[]): number => {
  const playerRank = getHandRank(playerCards)
  const communityRank = getHandRank(communityCards)

  if (playerRank > communityRank) {
    return 0.60
  } else if (playerRank === communityRank) {
    return 0.50
  } else {
    return 0.35
  }
}

/**
 * リバーエクイティを推定
 */
const estimateRiverEquity = (playerCards: Card[], communityCards: Card[]): number => {
  const playerRank = getHandRank(playerCards)
  const communityRank = getHandRank(communityCards)

  if (playerRank > communityRank) {
    return 0.95
  } else if (playerRank === communityRank) {
    return 0.50
  } else {
    return 0.05
  }
}

/**
 * ポットオッズを計算
 */
const calculatePotOdds = (potSize: number, callAmount: number): number => {
  if (potSize + callAmount === 0) return 0
  return callAmount / (potSize + callAmount)
}
