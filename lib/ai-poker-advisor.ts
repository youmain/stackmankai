/**
 * AIポーカーアドバイザー
 * DeepSeek LLMを使用して戦略的なアドバイスを生成
 * 3つのタイプ: エクスプロイト、バランス、GTO
 */

import { createOpenAI } from "@ai-sdk/openai"
import { generateText } from "ai"
import type { PlayerStats } from "./poker-stats"
import { classifyPlayStyle, estimateOpponentRange } from "./poker-stats"

export type AdvisorType = "exploit" | "balanced" | "gto"

export interface PokerAdvice {
  currentAnalysis: string // 現状分析
  opponentAnalysis: string // 相手分析
  recommendedAction: string // 推奨アクション
  reasoning: string // 根拠
  confidence: number // 信頼度（0-1）
  advisorType: AdvisorType // アドバイザータイプ
}

/**
 * DeepSeekクライアントの初期化
 */
const getDeepSeekClient = () => {
  const apiKey = process.env.DEEPSEEK_API_KEY
  if (!apiKey) {
    throw new Error("DEEPSEEK_API_KEY is not configured")
  }
  return createOpenAI({
    apiKey,
    baseURL: "https://api.deepseek.com/v1",
  })
}

/**
 * AIアドバイスを生成
 */
export const generatePokerAdvice = async (
  playerHand: {
    cards: Array<{ suit: string; rank: string }>
    equity: number
  },
  communityCards: Array<{ suit: string; rank: string }>,
  potSize: number,
  potOdds: number,
  opponentStats: PlayerStats | null,
  gamePhase: string,
  stackSize: number,
  opponentStackSize: number,
  advisorType: AdvisorType = "balanced"
): Promise<PokerAdvice> => {
  try {
    const deepseek = getDeepSeekClient()

    // 相手のプレイスタイルを分類
    const playStyle = opponentStats ? classifyPlayStyle(opponentStats) : "unknown"
    const opponentRange = opponentStats
      ? estimateOpponentRange(opponentStats, "bet", gamePhase)
      : "Unknown"

    // プロンプトを構築
    const prompt = buildAdvicePrompt({
      playerHand,
      communityCards,
      potSize,
      potOdds,
      opponentStats,
      playStyle,
      opponentRange,
      gamePhase,
      stackSize,
      opponentStackSize,
    })

    const systemPrompt = buildSystemPrompt(advisorType)

    // DeepSeek APIを使用してアドバイスを生成
    const { text } = await generateText({
      model: deepseek("deepseek-chat"),
      system: systemPrompt,
      prompt: prompt,
      temperature: advisorType === "gto" ? 0.3 : 0.7,
      maxTokens: 500,
    })

    // レスポンスをパース
    const advice = parseAdviceResponse(text, advisorType)

    return advice
  } catch (error) {
    console.error("Error generating poker advice with DeepSeek:", error)

    // エラーの場合は基本的なアドバイスを返す
    return {
      currentAnalysis: `ポットオッズ: ${(potOdds * 100).toFixed(1)}%、エクイティ: ${(playerHand.equity * 100).toFixed(1)}%`,
      opponentAnalysis: `相手のプレイスタイル: unknown`,
      recommendedAction: playerHand.equity > potOdds ? "call" : "fold",
      reasoning: "AIアドバイスの生成に失敗しました。基本的な確率に基づいてアドバイスしています。",
      confidence: 0.5,
      advisorType,
    }
  }
}

/**
 * アドバイザータイプに基づいてシステムプロンプトを構築
 */
const buildSystemPrompt = (advisorType: AdvisorType): string => {
  if (advisorType === "exploit") {
    return `You are an expert poker player specializing in exploitative strategy. Your goal is to identify and exploit opponent weaknesses.

Key principles:
1. Analyze opponent statistics (VPIP, PFR, AF, play style) to find exploitable patterns
2. Adjust your strategy to punish opponent mistakes
3. Be aggressive against weak opponents, tight against strong ones
4. Prioritize maximum value extraction over theoretical optimality

Provide advice in this format:
1. Current Analysis: Pot odds and equity
2. Opponent Analysis: Specific weaknesses to exploit
3. Recommended Action: Action that maximizes exploitation
4. Reasoning: Why this action exploits the opponent

Respond in Japanese, concisely and strategically.`
  } else if (advisorType === "balanced") {
    return `You are a balanced poker player who combines GTO theory with exploitative adjustments.

Key principles:
1. Use GTO as your foundation for solid strategy
2. Make exploitative adjustments based on opponent statistics
3. Balance between theoretical optimality and opponent exploitation
4. Adjust intensity based on data reliability

Provide advice in this format:
1. Current Analysis: Pot odds and equity
2. Opponent Analysis: Statistical insights with adjustments
3. Recommended Action: Theoretically sound with exploitative tweaks
4. Reasoning: Both theoretical and exploitative reasoning

Respond in Japanese, concisely and strategically.`
  } else {
    // GTO型
    return `You are a GTO (Game Theory Optimal) poker player who plays theoretically optimal poker.

Key principles:
1. Ignore opponent statistics and play theoretically optimal strategy
2. Focus on mathematical correctness and long-term profitability
3. Use pot odds and equity as primary decision factors
4. Maintain balanced ranges and unexploitable play

Provide advice in this format:
1. Current Analysis: Pot odds and equity
2. Opponent Analysis: Theoretical opponent hand range
3. Recommended Action: Theoretically optimal action
4. Reasoning: Mathematical and theoretical reasoning

Respond in Japanese, concisely and theoretically.`
  }
}

/**
 * アドバイスプロンプトを構築
 */
const buildAdvicePrompt = (params: {
  playerHand: { cards: Array<{ suit: string; rank: string }>; equity: number }
  communityCards: Array<{ suit: string; rank: string }>
  potSize: number
  potOdds: number
  opponentStats: PlayerStats | null
  playStyle: string
  opponentRange: string
  gamePhase: string
  stackSize: number
  opponentStackSize: number
}): string => {
  const {
    playerHand,
    communityCards,
    potSize,
    potOdds,
    opponentStats,
    playStyle,
    opponentRange,
    gamePhase,
    stackSize,
    opponentStackSize,
  } = params

  const handString = playerHand.cards
    .map((c) => `${c.rank}${c.suit}`)
    .join(", ")
  const communityString =
    communityCards.length > 0
      ? communityCards.map((c) => `${c.rank}${c.suit}`).join(", ")
      : "なし"

  let statsInfo = ""
  if (opponentStats) {
    statsInfo = `
相手の統計情報:
- VPIP (参加率): ${opponentStats.vpip.toFixed(1)}%
- PFR (プリフロップレイズ率): ${opponentStats.pfr.toFixed(1)}%
- AF (アグレッションファクター): ${opponentStats.af.toFixed(2)}
- 総ハンド数: ${opponentStats.totalHands}
- プレイスタイル: ${playStyle}
- 推定ハンドレンジ: ${opponentRange}`
  }

  return `
現在のゲーム状況:

あなたのハンド: ${handString}
コミュニティカード: ${communityString}
ゲームフェーズ: ${gamePhase}

ポット情報:
- ポットサイズ: ${potSize}チップ
- ポットオッズ: ${(potOdds * 100).toFixed(1)}%
- あなたのエクイティ: ${(playerHand.equity * 100).toFixed(1)}%

スタック情報:
- あなたのスタック: ${stackSize}チップ
- 相手のスタック: ${opponentStackSize}チップ
${statsInfo}

この状況で、最適なアクションと根拠を教えてください。`
}

/**
 * AIレスポンスをパース
 */
const parseAdviceResponse = (response: string, advisorType: AdvisorType): PokerAdvice => {
  const lines = response.split("\n")
  let currentAnalysis = ""
  let opponentAnalysis = ""
  let recommendedAction = "call"
  let reasoning = ""

  let section = ""
  for (const line of lines) {
    if (
      line.includes("現状分析") ||
      line.includes("ポットオッズ") ||
      line.includes("Current Analysis")
    ) {
      section = "current"
    } else if (
      line.includes("相手分析") ||
      line.includes("相手のプレイスタイル") ||
      line.includes("Opponent Analysis")
    ) {
      section = "opponent"
    } else if (
      line.includes("推奨") ||
      line.includes("アクション") ||
      line.includes("Recommended Action")
    ) {
      section = "action"
    } else if (
      line.includes("根拠") ||
      line.includes("理由") ||
      line.includes("Reasoning")
    ) {
      section = "reasoning"
    }

    if (section === "current") {
      currentAnalysis += line + "\n"
    } else if (section === "opponent") {
      opponentAnalysis += line + "\n"
    } else if (section === "action") {
      if (
        line.toLowerCase().includes("fold") ||
        line.toLowerCase().includes("フォールド")
      ) {
        recommendedAction = "fold"
      } else if (
        line.toLowerCase().includes("raise") ||
        line.toLowerCase().includes("レイズ")
      ) {
        recommendedAction = "raise"
      } else if (
        line.toLowerCase().includes("call") ||
        line.toLowerCase().includes("コール")
      ) {
        recommendedAction = "call"
      }
    } else if (section === "reasoning") {
      reasoning += line + "\n"
    }
  }

  return {
    currentAnalysis: currentAnalysis.trim() || response.substring(0, 100),
    opponentAnalysis: opponentAnalysis.trim() || "相手の分析情報",
    recommendedAction,
    reasoning: reasoning.trim() || response,
    confidence: advisorType === "gto" ? 0.8 : 0.7,
    advisorType,
  }
}

/**
 * シンプルなアドバイスを生成（LLM不使用）
 */
export const generateSimpleAdvice = (
  playerEquity: number,
  potOdds: number,
  opponentStats: PlayerStats | null,
  gamePhase: string,
  advisorType: AdvisorType = "balanced"
): PokerAdvice => {
  const playStyle = opponentStats ? classifyPlayStyle(opponentStats) : "unknown"

  let recommendedAction = "call"
  let reasoning = ""
  let confidence = 0.5

  if (advisorType === "gto") {
    // GTO型: エクイティとポットオッズのみで判断
    if (playerEquity > potOdds) {
      recommendedAction = "call"
      reasoning = `エクイティ (${(playerEquity * 100).toFixed(1)}%) がポットオッズ (${(potOdds * 100).toFixed(1)}%) を上回っています。理論的に正解です。`
      confidence = 0.8
    } else {
      recommendedAction = "fold"
      reasoning = `エクイティ (${(playerEquity * 100).toFixed(1)}%) がポットオッズ (${(potOdds * 100).toFixed(1)}%) を下回っています。理論的に正解です。`
      confidence = 0.8
    }
  } else if (advisorType === "exploit") {
    // エクスプロイト型: 相手の弱点を最大限活用
    if (playerEquity > potOdds) {
      recommendedAction = "call"
      reasoning = `エクイティ (${(playerEquity * 100).toFixed(1)}%) がポットオッズ (${(potOdds * 100).toFixed(1)}%) を上回っています。`
      confidence = 0.7
    } else {
      recommendedAction = "fold"
      reasoning = `エクイティが不足しています。`
      confidence = 0.6
    }

    if (opponentStats) {
      if (playStyle === "tight_aggressive" && opponentStats.af > 3) {
        if (recommendedAction === "call") {
          recommendedAction = "raise"
          reasoning += ` 相手は${playStyle}で攻撃的です。強気に出ましょう。`
          confidence = 0.75
        }
      } else if (playStyle === "loose_passive" && opponentStats.af < 1.5) {
        if (recommendedAction === "fold") {
          recommendedAction = "call"
          reasoning = `相手は${playStyle}です。弱いハンドの可能性が高いため、コールしましょう。`
          confidence = 0.65
        }
      }
    }
  } else {
    // バランス型: GTO + 相手分析
    if (playerEquity > potOdds) {
      recommendedAction = "call"
      reasoning = `エクイティ (${(playerEquity * 100).toFixed(1)}%) がポットオッズ (${(potOdds * 100).toFixed(1)}%) を上回っています。`
      confidence = 0.7
    } else {
      recommendedAction = "fold"
      reasoning = `エクイティ (${(playerEquity * 100).toFixed(1)}%) がポットオッズ (${(potOdds * 100).toFixed(1)}%) を下回っています。`
      confidence = 0.6
    }

    if (opponentStats && opponentStats.totalHands > 20) {
      if (playStyle === "tight_aggressive" && opponentStats.af > 3) {
        if (recommendedAction === "call") {
          recommendedAction = "raise"
          reasoning += ` 相手は${playStyle}で、やや攻撃的に出ましょう。`
          confidence = 0.72
        }
      } else if (playStyle === "loose_passive" && opponentStats.af < 1.5) {
        if (recommendedAction === "fold") {
          recommendedAction = "call"
          reasoning = `相手は${playStyle}です。コールで様子を見ましょう。`
          confidence = 0.65
        }
      }
    }
  }

  return {
    currentAnalysis: `ゲームフェーズ: ${gamePhase}、エクイティ: ${(playerEquity * 100).toFixed(1)}%、ポットオッズ: ${(potOdds * 100).toFixed(1)}%`,
    opponentAnalysis: `相手のプレイスタイル: ${playStyle}`,
    recommendedAction,
    reasoning,
    confidence,
    advisorType,
  }
}
