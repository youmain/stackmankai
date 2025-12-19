/**
 * Advanced poker game functions with full game logic integration
 */

import {
  doc,
  getDoc,
  updateDoc,
  serverTimestamp,
  Timestamp,
} from "firebase/firestore"
import { getDb } from "./firebase"
import { collection } from "firebase/firestore"
import type { PokerGameState, Card } from "@/types/poker"
import { Deck } from "./poker-logic/deck"
import { HandEvaluator } from "./poker-logic/hand-evaluator"
import { determineWinners } from "./poker-logic/game-helpers"
import { calculateSidePots, distributePots } from "./poker-logic/side-pot"
import { removeUndefined } from "./poker-logic/firestore-utils"

/**
 * Get poker game collection reference for a store
 */
const getPokerGameCollection = (storeId: string) => {
  const db = getDb()
  if (!db) throw new Error("Firestore is not initialized")
  return collection(db, "pokerGames", `store_${storeId}`, "games")
}

/**
 * Check if all players have acted in current betting round
 */
const isRoundComplete = (game: PokerGameState): boolean => {
  // フォールドしていないプレイヤー（オールインも含む）
  const nonFoldedPlayers = game.players.filter(p => !p.isFolded)
  
  console.log('[isRoundComplete] Check:', {
    phase: game.phase,
    nonFoldedCount: nonFoldedPlayers.length,
    players: game.players.map(p => ({
      name: p.userName,
      isFolded: p.isFolded,
      isAllIn: p.isAllIn,
      currentBet: p.currentBet,
      lastAction: p.lastAction
    }))
  })
  
  // フォールドしていないプレイヤーが1人以下ならラウンド完了
  if (nonFoldedPlayers.length <= 1) {
    console.log('[isRoundComplete] Only one player left, round complete')
    return true
  }
  
  // アクション可能なプレイヤー（フォールドもオールインもしていない）
  const actionablePlayers = game.players.filter(p => !p.isFolded && !p.isAllIn)
  
  console.log('[isRoundComplete] Actionable players:', actionablePlayers.length)
  
  // アクション可能なプレイヤーがいる場合
  if (actionablePlayers.length > 0) {
    // 全員がアクションしたかチェック
    const allHaveActed = actionablePlayers.every(p => p.lastAction !== undefined && p.lastAction !== null)
    
    console.log('[isRoundComplete] Actionable players check:', {
      count: actionablePlayers.length,
      allHaveActed,
      players: actionablePlayers.map(p => ({
        name: p.userName,
        currentBet: p.currentBet,
        lastAction: p.lastAction
      }))
    })
    
    // 全員がアクションしていない場合は、まだラウンド完了ではない
    if (!allHaveActed) {
      return false
    }
    
    // 全員のベット額を確認
    const maxBet = Math.max(0, ...game.players.map(p => p.currentBet || 0))
    const allHaveSameBet = actionablePlayers.every(p => (p.currentBet || 0) === maxBet)
    
    console.log('[isRoundComplete] Bet check:', { maxBet, allHaveSameBet })
    
    // 全員がアクション済みで、ベット額が揃っている場合
    if (allHaveSameBet) {
      return true
    }
    
    // ベット額が揃っていないが、相手が全員オールインの場合
    // （例: Player Aが9,800オールイン、Player Bが9,800コールして200残る）
    const opponents = nonFoldedPlayers.filter(p => !actionablePlayers.includes(p))
    const allOpponentsAllIn = opponents.length > 0 && opponents.every(p => p.isAllIn)
    
    if (allOpponentsAllIn && actionablePlayers.length === 1) {
      console.log('[isRoundComplete] Only one actionable player and all opponents are all-in, round complete')
      return true
    }
    
    return false
  }
  
  // アクション可能なプレイヤーがいない（全員オールイン）ならラウンド完了
  console.log('[isRoundComplete] No actionable players, round complete')
  return true
}

/**
 * Advance to next phase (flop -> turn -> river -> showdown)
 */
export const advancePhase = async (
  storeId: string,
  gameId: string
): Promise<void> => {
  const gameDoc = doc(getPokerGameCollection(storeId), gameId)
  const gameSnap = await getDoc(gameDoc)
  
  if (!gameSnap.exists()) {
    throw new Error("Game not found")
  }
  
  const gameData = gameSnap.data() as PokerGameState
  
  // Check if round is complete
  if (!isRoundComplete(gameData)) {
    throw new Error("Round is not complete")
  }
  
  // Check if only one player remains (everyone else folded)
  const activePlayers = gameData.players.filter(p => !p.isFolded)
  if (activePlayers.length === 1) {
    // Award pot to last remaining player
    const winner = activePlayers[0]
    const potAmount = gameData.pot
    winner.stack += potAmount
    
    await updateDoc(gameDoc, removeUndefined({
      phase: "showdown",
      pot: potAmount, // potを保持してWinnerDisplayに表示
      players: gameData.players,
      winners: [winner.userId], // winnersを設定
      showByFold: true, // フォールド勝利のフラグ
      updatedAt: serverTimestamp(),
    }))
    return
  }
  
  // Create deck for dealing community cards
  // Note: In production, deck state should be stored securely
  const deck = new Deck()
  
  // Remove already dealt cards from deck
  const dealtCards = [
    ...gameData.communityCards,
    ...gameData.players.flatMap(p => p.cards),
  ]
  
  // 既に配られたカードをデッキから除外
  deck.removeCards(dealtCards)
  
  // シャッフル
  deck.shuffle()
  
  let newCommunityCards: Card[] = [...gameData.communityCards]
  let newPhase = gameData.phase
  
  switch (gameData.phase) {
    case "preflop":
      // Deal flop (3 cards)
      newCommunityCards = deck.dealMultiple(3)
      newPhase = "flop"
      break
      
    case "flop":
      // Deal turn (1 card)
      newCommunityCards.push(...deck.dealMultiple(1))
      newPhase = "turn"
      break
      
    case "turn":
      // Deal river (1 card)
      newCommunityCards.push(...deck.dealMultiple(1))
      newPhase = "river"
      break
      
    case "river":
      // Go to showdown
      await evaluateShowdown(storeId, gameId)
      return
      
    default:
      throw new Error(`Cannot advance from phase: ${gameData.phase}`)
  }
  
  // Reset bets for new round
  const updatedPlayers = gameData.players.map(p => ({
    ...p,
    currentBet: 0,
    lastAction: undefined, // Reset lastAction for new betting round
  }))
  
  // Find first active player after dealer
  let nextPlayerIndex = (gameData.dealerIndex + 1) % gameData.players.length
  let loopCount = 0
  const maxLoops = gameData.players.length
  
  while (
    loopCount < maxLoops &&
    (gameData.players[nextPlayerIndex].isFolded || gameData.players[nextPlayerIndex].isAllIn)
  ) {
    nextPlayerIndex = (nextPlayerIndex + 1) % gameData.players.length
    loopCount++
  }
  
  // If all players are folded or all-in, keep current index (no actions needed)
  if (loopCount >= maxLoops) {
    nextPlayerIndex = gameData.currentPlayerIndex
  }
  
  await updateDoc(gameDoc, removeUndefined({
    phase: newPhase,
    communityCards: newCommunityCards,
    currentBet: 0,
    players: updatedPlayers,
    currentPlayerIndex: nextPlayerIndex,
    turnStartTime: new Date(),
    updatedAt: serverTimestamp(),
  }))
  
  // If all remaining players are all-in, continue advancing automatically
  const actionablePlayers = updatedPlayers.filter(p => !p.isFolded && !p.isAllIn)
  if (actionablePlayers.length === 0) {
    // Add delay before auto-advancing to next phase for better UX
    let delay = 0
    
    switch (newPhase) {
      case "flop":
        // Flop: Wait 2 seconds before advancing to turn
        delay = 2000
        break
      case "turn":
        // Turn: Wait 3 seconds before advancing to river
        delay = 3000
        break
      case "river":
        // River: Wait before showdown
        delay = 2000
        break
      default:
        delay = 0
    }
    
    console.log(`[advancePhase] Auto-advancing after ${delay}ms delay (phase: ${newPhase})`)
    
    // Wait before advancing to next phase
    await new Promise(resolve => setTimeout(resolve, delay))
    
    // Recursively advance to next phase
    await checkAndAdvancePhase(storeId, gameId)
  }
}

/**
 * Evaluate showdown and determine winners
 */
export const evaluateShowdown = async (
  storeId: string,
  gameId: string
): Promise<void> => {
  const gameDoc = doc(getPokerGameCollection(storeId), gameId)
  const gameSnap = await getDoc(gameDoc)
  
  if (!gameSnap.exists()) {
    throw new Error("Game not found")
  }
  
  const gameData = gameSnap.data() as PokerGameState
  
  // Calculate side pots
  const pots = calculateSidePots(gameData.players)
  
  // Determine winners using hand evaluator
  const { winners, hands } = determineWinners(gameData)
  
  // Group winners by hand strength
  const winnersByStrength: number[][] = [winners]
  
  // Distribute pots to winners
  distributePots(pots, gameData.players, winnersByStrength)
  
  // Store hand results for history
  const handResult = {
    winners: winners.map(idx => gameData.players[idx].userId),
    pot: gameData.pot,
    communityCards: gameData.communityCards,
    playerHands: hands.map(h => ({
      userId: gameData.players[h.seatIndex].userId,
      userName: gameData.players[h.seatIndex].userName,
      cards: gameData.players[h.seatIndex].cards,
      handRank: h.handRank,
    })),
    timestamp: new Date(),
  }
  
  // Set next hand start time (15 seconds from now)
  const nextHandStartTime = Timestamp.fromMillis(Date.now() + 15000)
  
  await updateDoc(gameDoc, removeUndefined({
    phase: "showdown",
    players: gameData.players,
    pot: gameData.pot, // Keep pot amount for display in WinnerDisplay
    winners: winners.map(idx => gameData.players[idx].userId),
    winnerHands: hands.filter(h => winners.includes(h.seatIndex)),
    showByFold: false, // 通常のショーダウン：ハンドを公開
    nextHandReadyPlayers: [], // Reset ready players
    nextHandStartTime: nextHandStartTime,
    updatedAt: serverTimestamp(),
  }))
}

/**
 * Start next hand (move dealer button, reset game state)
 */
export const startNextHand = async (
  storeId: string,
  gameId: string
): Promise<void> => {
  const gameDoc = doc(getPokerGameCollection(storeId), gameId)
  const gameSnap = await getDoc(gameDoc)
  
  if (!gameSnap.exists()) {
    throw new Error("Game not found")
  }
  
  const gameData = gameSnap.data() as PokerGameState
  
  // Remove players with 0 stack
  const activePlayers = gameData.players.filter(p => p.stack > 0)
  
  // Need at least 2 players to start next hand
  if (activePlayers.length < 2) {
    console.log(`[startNextHand] Not enough players to start next hand: ${activePlayers.length}`)
    return
  }
  
  // Move dealer button
  let newDealerIndex = (gameData.dealerIndex + 1) % activePlayers.length
  
  // Calculate blind positions
  const newSmallBlindIndex = (newDealerIndex + 1) % activePlayers.length
  const newBigBlindIndex = (newDealerIndex + 2) % activePlayers.length
  
  // In preflop, action starts after BB (UTG position)
  // For 3 players or less, action starts with dealer (who is also UTG)
  let newCurrentPlayerIndex: number
  if (activePlayers.length <= 3) {
    // With 3 or fewer players, dealer acts first preflop
    newCurrentPlayerIndex = newDealerIndex
  } else {
    // With 4+ players, UTG (after BB) acts first
    newCurrentPlayerIndex = (newBigBlindIndex + 1) % activePlayers.length
  }
  
  // Shuffle deck and deal cards
  const deck = new Deck()
  deck.shuffle()
  
  // Deal 2 cards to each player
  const updatedPlayers = activePlayers.map(player => ({
    ...player,
    cards: deck.dealMultiple(2),
    currentBet: 0,
    totalBet: 0, // Reset totalBet for new hand
    isFolded: false,
    isAllIn: false,
    isActive: true,
    lastAction: undefined, // Reset lastAction for new hand
  }))
  
  // Post blinds
  const sbPlayer = updatedPlayers[newSmallBlindIndex]
  const bbPlayer = updatedPlayers[newBigBlindIndex]
  
  if (sbPlayer) {
    const sbAmount = Math.min(sbPlayer.stack, gameData.smallBlind)
    sbPlayer.currentBet = sbAmount
    sbPlayer.totalBet = sbAmount // Initialize totalBet with blind
    sbPlayer.stack -= sbAmount
    if (sbPlayer.stack === 0) sbPlayer.isAllIn = true
  }
  
  if (bbPlayer) {
    const bbAmount = Math.min(bbPlayer.stack, gameData.bigBlind)
    bbPlayer.currentBet = bbAmount
    bbPlayer.totalBet = bbAmount // Initialize totalBet with blind
    bbPlayer.stack -= bbAmount
    if (bbPlayer.stack === 0) bbPlayer.isAllIn = true
  }
  
  const pot = (sbPlayer?.currentBet || 0) + (bbPlayer?.currentBet || 0)
  
  const updateData = removeUndefined({
    phase: "preflop" as const,
    pot,
    communityCards: [],
    currentBet: gameData.bigBlind,
    minRaise: gameData.bigBlind,
    dealerIndex: newDealerIndex,
    smallBlindIndex: newSmallBlindIndex,
    bigBlindIndex: newBigBlindIndex,
    currentPlayerIndex: newCurrentPlayerIndex,
    players: updatedPlayers,
    timeoutSeconds: gameData.timeoutSeconds || 30,
    turnStartTime: new Date(),
  })
  
  await updateDoc(gameDoc, {
    ...updateData,
    updatedAt: serverTimestamp(),
  })
}

/**
 * Check if phase should advance automatically
 * Call this after each action
 */
export const checkAndAdvancePhase = async (
  storeId: string,
  gameId: string,
  providedGameData?: PokerGameState
): Promise<void> => {
  let gameData: PokerGameState
  
  if (providedGameData) {
    console.log('[checkAndAdvancePhase] Using provided game data')
    gameData = providedGameData
  } else {
    const gameDoc = doc(getPokerGameCollection(storeId), gameId)
    const gameSnap = await getDoc(gameDoc)
    
    if (!gameSnap.exists()) {
      console.log('[checkAndAdvancePhase] Game not found')
      return
    }
    
    gameData = gameSnap.data() as PokerGameState
  }
  
  console.log('[checkAndAdvancePhase] Called:', {
    phase: gameData.phase,
    currentPlayerIndex: gameData.currentPlayerIndex
  })
  
  // Don't auto-advance if in waiting or showdown
  if (gameData.phase === "waiting" || gameData.phase === "showdown") {
    console.log('[checkAndAdvancePhase] Phase is waiting or showdown, skipping')
    return
  }
  
  // Check if round is complete
  const roundComplete = isRoundComplete(gameData)
  console.log('[checkAndAdvancePhase] Round complete?', roundComplete)
  
  if (roundComplete) {
    console.log('[checkAndAdvancePhase] Advancing phase...')
    await advancePhase(storeId, gameId)
  }
}
