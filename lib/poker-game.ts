import {
  collection,
  doc,
  setDoc,
  getDoc,
  updateDoc,
  onSnapshot,
  serverTimestamp,
  Timestamp,
} from "firebase/firestore"
import { getDb, isFirebaseConfigured } from "./firebase"
import type {
  Card,
  Suit,
  Rank,
  PokerGameState,
  PokerPlayer,
  PlayerAction,
  GamePhase,
} from "@/types/poker"
import { validatePlayerAction, validateSeatSelection, withErrorHandling } from "./poker-logic/validation"
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
 * Create a new deck of cards
 */
const createDeck = (): Card[] => {
  const suits: Suit[] = ["hearts", "diamonds", "clubs", "spades"]
  const ranks: Rank[] = ["2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K", "A"]
  const deck: Card[] = []
  
  for (const suit of suits) {
    for (const rank of ranks) {
      deck.push({ suit, rank })
    }
  }
  
  return deck
}

/**
 * Shuffle deck using Fisher-Yates algorithm
 */
const shuffleDeck = (deck: Card[]): Card[] => {
  const shuffled = [...deck]
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }
  return shuffled
}

/**
 * Create a new poker game
 */
export const createPokerGame = async (
  storeId: string,
  smallBlind: number = 50,
  bigBlind: number = 100
): Promise<string> => {
  if (!isFirebaseConfigured()) throw new Error("Firebase is not configured")
  if (!storeId) throw new Error("Store ID is required")
  
  const gameCollection = getPokerGameCollection(storeId)
  const gameDoc = doc(gameCollection)
  
  const initialState: Omit<PokerGameState, "id"> = {
    storeId,
    phase: "waiting",
    pot: 0,
    communityCards: [],
    currentBet: 0,
    minRaise: bigBlind,
    dealerIndex: 0,
    smallBlindIndex: 1,
    bigBlindIndex: 2,
    currentPlayerIndex: 3,
    players: [],
    smallBlind,
    bigBlind,
    createdAt: new Date(),
    updatedAt: new Date(),
  }
  
  await setDoc(gameDoc, {
    ...initialState,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  })
  
  return gameDoc.id
}

/**
 * Join a poker game
 */
export const joinPokerGame = async (
  storeId: string,
  gameId: string,
  userId: string,
  userName: string,
  seatIndex: number,
  buyIn: number
): Promise<void> => {
  return withErrorHandling(async () => {
    if (!isFirebaseConfigured()) throw new Error("Firebase is not configured")
    
    const gameCollection = getPokerGameCollection(storeId)
    const gameDoc = doc(gameCollection, gameId)
    const gameSnap = await getDoc(gameDoc)
    
    if (!gameSnap.exists()) {
      throw new Error("Game not found")
    }
    
    const gameData = gameSnap.data() as PokerGameState
    
    // Validate seat selection
    validateSeatSelection(gameData, userId, seatIndex, buyIn)
  
  const newPlayer: PokerPlayer = {
    userId,
    userName,
    seatIndex,
    stack: buyIn,
    currentBet: 0,
    cards: [],
    isFolded: false,
    isAllIn: false,
    isActive: true,
  }
  
    await updateDoc(gameDoc, removeUndefined({
      players: [...gameData.players, newPlayer],
      updatedAt: serverTimestamp(),
    }))
  }, "座席への参加に失敗しました")
}

/**
 * Leave a poker game
 */
export const leavePokerGame = async (
  storeId: string,
  gameId: string,
  userId: string
): Promise<void> => {
  if (!isFirebaseConfigured()) throw new Error("Firebase is not configured")
  
  const gameCollection = getPokerGameCollection(storeId)
  const gameDoc = doc(gameCollection, gameId)
  const gameSnap = await getDoc(gameDoc)
  
  if (!gameSnap.exists()) {
    throw new Error("Game not found")
  }
  
  const gameData = gameSnap.data() as PokerGameState
  
  await updateDoc(gameDoc, removeUndefined({
    players: gameData.players.filter(p => p.userId !== userId),
    updatedAt: serverTimestamp(),
  }))
}

/**
 * Start a new hand
 */
export const startNewHand = async (
  storeId: string,
  gameId: string
): Promise<void> => {
  if (!isFirebaseConfigured()) throw new Error("Firebase is not configured")
  
  // Use the advanced logic from poker-game-advanced
  const { startNextHand } = await import("./poker-game-advanced")
  await startNextHand(storeId, gameId)
}

/**
 * Perform player action
 */
export const performAction = async (
  storeId: string,
  gameId: string,
  userId: string,
  action: PlayerAction,
  amount?: number
): Promise<void> => {
  return withErrorHandling(async () => {
    if (!isFirebaseConfigured()) throw new Error("Firebase is not configured")
    
    const gameCollection = getPokerGameCollection(storeId)
    const gameDoc = doc(gameCollection, gameId)
    const gameSnap = await getDoc(gameDoc)
    
    if (!gameSnap.exists()) {
      throw new Error("Game not found")
    }
    
    const gameData = gameSnap.data() as PokerGameState
    
    // Validate action
    validatePlayerAction(gameData, userId, action, amount)
    
    const playerIndex = gameData.players.findIndex(p => p.userId === userId)
  
  const player = gameData.players[playerIndex]
  let newPot = gameData.pot
  let newCurrentBet = gameData.currentBet
  
  // Process action
  switch (action) {
    case "fold":
      player.isFolded = true
      break
      
    case "check":
      if (player.currentBet < gameData.currentBet) {
        throw new Error("Cannot check, must call or raise")
      }
      break
      
    case "call":
      const callAmount = gameData.currentBet - player.currentBet
      player.stack -= callAmount
      player.currentBet += callAmount
      newPot += callAmount
      break
      
    case "bet":
    case "raise":
      if (!amount || amount < gameData.minRaise) {
        throw new Error("Invalid bet amount")
      }
      player.stack -= amount
      player.currentBet += amount
      newPot += amount
      newCurrentBet = player.currentBet
      break
      
    case "allin":
      const allinAmount = player.stack
      player.stack = 0
      player.currentBet += allinAmount
      player.isAllIn = true
      newPot += allinAmount
      if (player.currentBet > newCurrentBet) {
        newCurrentBet = player.currentBet
      }
      break
  }
  
  player.lastAction = action
  
  // Move to next player
  let nextPlayerIndex = (gameData.currentPlayerIndex + 1) % gameData.players.length
  let loopCount = 0
  const maxLoops = gameData.players.length
  
  // Find next active player (not folded, not all-in)
  while (
    loopCount < maxLoops &&
    (gameData.players[nextPlayerIndex].isFolded || gameData.players[nextPlayerIndex].isAllIn)
  ) {
    nextPlayerIndex = (nextPlayerIndex + 1) % gameData.players.length
    loopCount++
  }
  
  // If we looped through all players, it means only one active player left
  // In this case, keep currentPlayerIndex as is (will be handled by checkAndAdvancePhase)
  if (loopCount >= maxLoops) {
    nextPlayerIndex = gameData.currentPlayerIndex
  }
  
  await updateDoc(gameDoc, removeUndefined({
    players: gameData.players,
    pot: newPot,
    currentBet: newCurrentBet,
    currentPlayerIndex: nextPlayerIndex,
    updatedAt: serverTimestamp(),
  }))
  
    // Check if phase should advance automatically
    const { checkAndAdvancePhase } = await import("./poker-game-advanced")
    await checkAndAdvancePhase(storeId, gameId)
  }, "アクションの実行に失敗しました")
}

/**
 * Subscribe to poker game updates
 */
export const subscribeToPokerGame = (
  storeId: string,
  gameId: string,
  callback: (game: PokerGameState | null) => void,
  onError?: (error: Error) => void
): (() => void) => {
  if (!isFirebaseConfigured()) {
    callback(null)
    return () => {}
  }
  
  try {
    const gameCollection = getPokerGameCollection(storeId)
    const gameDoc = doc(gameCollection, gameId)
    
    return onSnapshot(
      gameDoc,
      (snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.data()
          // updatedAtがTimestampオブジェクトかどうかをチェック
          let updatedAtDate = new Date()
          if (data.updatedAt && typeof data.updatedAt.toDate === 'function') {
            updatedAtDate = data.updatedAt.toDate()
          }
          
          const game: PokerGameState = {
            ...data,
            id: snapshot.id,
            createdAt: data.createdAt?.toDate() || new Date(),
            updatedAt: updatedAtDate,
          } as PokerGameState
          callback(game)
        } else {
          callback(null)
        }
      },
      (error) => {
        console.error("Error subscribing to poker game:", error)
        if (onError) onError(error)
      }
    )
  } catch (error) {
    console.error("Error setting up poker game subscription:", error)
    if (onError) onError(error as Error)
    callback(null)
    return () => {}
  }
}
