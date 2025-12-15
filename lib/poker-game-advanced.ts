/**
 * Advanced poker game functions with full game logic integration
 */

import {
  doc,
  getDoc,
  updateDoc,
  serverTimestamp,
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
  const activePlayers = game.players.filter(p => !p.isFolded && !p.isAllIn)
  
  if (activePlayers.length <= 1) {
    return true
  }
  
  // All active players must have the same bet amount
  const maxBet = Math.max(...game.players.map(p => p.currentBet))
  return activePlayers.every(p => p.currentBet === maxBet)
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
    winner.stack += gameData.pot
    
    await updateDoc(gameDoc, removeUndefined({
      phase: "showdown",
      pot: 0,
      players: gameData.players,
      updatedAt: serverTimestamp(),
    }))
    return
  }
  
  // Create deck for dealing community cards
  // Note: In production, deck state should be stored securely
  const deck = new Deck()
  deck.shuffle()
  
  // Remove already dealt cards from deck
  const dealtCards = [
    ...gameData.communityCards,
    ...gameData.players.flatMap(p => p.cards),
  ]
  
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
  }))
  
  // Find first active player after dealer
  let nextPlayerIndex = (gameData.dealerIndex + 1) % gameData.players.length
  while (gameData.players[nextPlayerIndex].isFolded || gameData.players[nextPlayerIndex].isAllIn) {
    nextPlayerIndex = (nextPlayerIndex + 1) % gameData.players.length
  }
  
  await updateDoc(gameDoc, removeUndefined({
    phase: newPhase,
    communityCards: newCommunityCards,
    currentBet: 0,
    players: updatedPlayers,
    currentPlayerIndex: nextPlayerIndex,
    updatedAt: serverTimestamp(),
  }))
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
  
  await updateDoc(gameDoc, removeUndefined({
    phase: "showdown",
    players: gameData.players,
    pot: 0,
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
  
  if (activePlayers.length < 1) {
    throw new Error("Need at least 1 player with chips to continue")
  }
  
  // Move dealer button
  let newDealerIndex = (gameData.dealerIndex + 1) % activePlayers.length
  let newSmallBlindIndex = (newDealerIndex + 1) % activePlayers.length
  let newBigBlindIndex = (newDealerIndex + 2) % activePlayers.length
  
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
    isFolded: false,
    isAllIn: false,
    isActive: true,
  }))
  
  // Post blinds
  const sbPlayer = updatedPlayers[newSmallBlindIndex]
  const bbPlayer = updatedPlayers[newBigBlindIndex]
  
  if (sbPlayer) {
    const sbAmount = Math.min(sbPlayer.stack, gameData.smallBlind)
    sbPlayer.currentBet = sbAmount
    sbPlayer.stack -= sbAmount
    if (sbPlayer.stack === 0) sbPlayer.isAllIn = true
  }
  
  if (bbPlayer) {
    const bbAmount = Math.min(bbPlayer.stack, gameData.bigBlind)
    bbPlayer.currentBet = bbAmount
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
  gameId: string
): Promise<void> => {
  const gameDoc = doc(getPokerGameCollection(storeId), gameId)
  const gameSnap = await getDoc(gameDoc)
  
  if (!gameSnap.exists()) {
    return
  }
  
  const gameData = gameSnap.data() as PokerGameState
  
  // Don't auto-advance if in waiting or showdown
  if (gameData.phase === "waiting" || gameData.phase === "showdown") {
    return
  }
  
  // Check if round is complete
  if (isRoundComplete(gameData)) {
    await advancePhase(storeId, gameId)
  }
}
