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
  if (!isFirebaseConfigured()) throw new Error("Firebase is not configured")
  
  const gameCollection = getPokerGameCollection(storeId)
  const gameDoc = doc(gameCollection, gameId)
  const gameSnap = await getDoc(gameDoc)
  
  if (!gameSnap.exists()) {
    throw new Error("Game not found")
  }
  
  const gameData = gameSnap.data() as PokerGameState
  
  // Check if seat is available
  if (gameData.players.some(p => p.seatIndex === seatIndex)) {
    throw new Error("Seat is already taken")
  }
  
  // Check if player is already in game
  if (gameData.players.some(p => p.userId === userId)) {
    throw new Error("Player is already in game")
  }
  
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
  
  await updateDoc(gameDoc, {
    players: [...gameData.players, newPlayer],
    updatedAt: serverTimestamp(),
  })
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
  
  await updateDoc(gameDoc, {
    players: gameData.players.filter(p => p.userId !== userId),
    updatedAt: serverTimestamp(),
  })
}

/**
 * Start a new hand
 */
export const startNewHand = async (
  storeId: string,
  gameId: string
): Promise<void> => {
  if (!isFirebaseConfigured()) throw new Error("Firebase is not configured")
  
  const gameCollection = getPokerGameCollection(storeId)
  const gameDoc = doc(gameCollection, gameId)
  const gameSnap = await getDoc(gameDoc)
  
  if (!gameSnap.exists()) {
    throw new Error("Game not found")
  }
  
  const gameData = gameSnap.data() as PokerGameState
  
  // Need at least 2 players
  if (gameData.players.length < 2) {
    throw new Error("Need at least 2 players to start")
  }
  
  // Shuffle deck and deal cards
  const deck = shuffleDeck(createDeck())
  let cardIndex = 0
  
  // Deal 2 cards to each player
  const updatedPlayers = gameData.players.map(player => ({
    ...player,
    cards: [deck[cardIndex++], deck[cardIndex++]],
    currentBet: 0,
    isFolded: false,
    isAllIn: false,
  }))
  
  // Post blinds
  const sbPlayer = updatedPlayers.find(p => p.seatIndex === gameData.smallBlindIndex)
  const bbPlayer = updatedPlayers.find(p => p.seatIndex === gameData.bigBlindIndex)
  
  if (sbPlayer) {
    sbPlayer.currentBet = gameData.smallBlind
    sbPlayer.stack -= gameData.smallBlind
  }
  
  if (bbPlayer) {
    bbPlayer.currentBet = gameData.bigBlind
    bbPlayer.stack -= gameData.bigBlind
  }
  
  await updateDoc(gameDoc, {
    phase: "preflop",
    pot: gameData.smallBlind + gameData.bigBlind,
    communityCards: [],
    currentBet: gameData.bigBlind,
    minRaise: gameData.bigBlind,
    players: updatedPlayers,
    updatedAt: serverTimestamp(),
  })
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
  if (!isFirebaseConfigured()) throw new Error("Firebase is not configured")
  
  const gameCollection = getPokerGameCollection(storeId)
  const gameDoc = doc(gameCollection, gameId)
  const gameSnap = await getDoc(gameDoc)
  
  if (!gameSnap.exists()) {
    throw new Error("Game not found")
  }
  
  const gameData = gameSnap.data() as PokerGameState
  const playerIndex = gameData.players.findIndex(p => p.userId === userId)
  
  if (playerIndex === -1) {
    throw new Error("Player not found")
  }
  
  if (playerIndex !== gameData.currentPlayerIndex) {
    throw new Error("Not your turn")
  }
  
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
  while (gameData.players[nextPlayerIndex].isFolded || gameData.players[nextPlayerIndex].isAllIn) {
    nextPlayerIndex = (nextPlayerIndex + 1) % gameData.players.length
  }
  
  await updateDoc(gameDoc, {
    players: gameData.players,
    pot: newPot,
    currentBet: newCurrentBet,
    currentPlayerIndex: nextPlayerIndex,
    updatedAt: serverTimestamp(),
  })
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
          const game: PokerGameState = {
            ...data,
            id: snapshot.id,
            createdAt: data.createdAt?.toDate() || new Date(),
            updatedAt: data.updatedAt?.toDate() || new Date(),
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
