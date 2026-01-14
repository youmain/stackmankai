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
  if (!isFirebaseConfigured) throw new Error("Firebase is not configured")
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
    timeoutSeconds: 30,
    turnStartTime: null, // ゲーム開始前はnull
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
    if (!isFirebaseConfigured) throw new Error("Firebase is not configured")
    
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

    // Update player's stapokaBalance in the players collection
    const db = getDb()!
    const playerRef = doc(db, "players", userId);
    await updateDoc(playerRef, {
      stapokaBalance: gameData.players.find(p => p.userId === userId)?.stack || 0, // Assuming stack is the new stapokaBalance after joining
      updatedAt: serverTimestamp(),
    });
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
  if (!isFirebaseConfigured) throw new Error("Firebase is not configured")
  
  const gameCollection = getPokerGameCollection(storeId)
  const gameDoc = doc(gameCollection, gameId)
  const gameSnap = await getDoc(gameDoc)
  
  if (!gameSnap.exists()) {
    throw new Error("Game not found")
  }
  
  const gameData = gameSnap.data() as PokerGameState
  const leavingPlayer = gameData.players.find(p => p.userId === userId)
  
  // ゲーム中の場合、自動的にフォールド
  if (leavingPlayer && gameData.phase !== "waiting" && !leavingPlayer.isFolded) {
    console.log(`[leavePokerGame] Player ${leavingPlayer.userName} leaving during game, auto-folding...`)
    console.log('[leavePokerGame] Game state before leave:', {
      phase: gameData.phase,
      pot: gameData.pot,
      players: gameData.players.map(p => ({
        name: p.userName,
        isFolded: p.isFolded,
        stack: p.stack
      }))
    })
    
    // プレイヤーをフォールド状態にする
    const updatedPlayers = gameData.players.map(p => {
      if (p.userId === userId) {
        return { ...p, isFolded: true, lastAction: "fold" as const }
      }
      return p
    })
    
    // アクション履歴に追加
    const newHistoryEntry = {
      playerName: leavingPlayer.userName,
      action: "fold" as const,
      phase: gameData.phase,
      timestamp: new Date()
    }
    
    const updatedHistory = [...(gameData.actionHistory || []), newHistoryEntry]
    
    // フォールド後、次のプレイヤーに進む（現在のターンの場合）
    let nextPlayerIndex = gameData.currentPlayerIndex
    if (gameData.currentPlayerIndex !== undefined && 
        gameData.players[gameData.currentPlayerIndex]?.userId === userId) {
      nextPlayerIndex = (gameData.currentPlayerIndex + 1) % gameData.players.length
      let attempts = 0
      while (
        attempts < gameData.players.length &&
        (updatedPlayers[nextPlayerIndex].isFolded || updatedPlayers[nextPlayerIndex].isAllIn)
      ) {
        nextPlayerIndex = (nextPlayerIndex + 1) % gameData.players.length
        attempts++
      }
    }
    
    // フォールドしたプレイヤーを削除
    const playersAfterLeave = updatedPlayers.filter(p => p.userId !== userId)
    
    await updateDoc(gameDoc, removeUndefined({
      players: playersAfterLeave,
      currentPlayerIndex: nextPlayerIndex,
      actionHistory: updatedHistory,
      turnStartTime: new Date(),
      updatedAt: serverTimestamp(),
    }))
    
    // フェーズ進行をチェック
    const { checkAndAdvancePhase } = await import("./poker-game-advanced")
    await checkAndAdvancePhase(storeId, gameId)
  } else {
    // 待機中または既にフォールド済みの場合、そのまま削除
    await updateDoc(gameDoc, removeUndefined({
      players: gameData.players.filter(p => p.userId !== userId),
      updatedAt: serverTimestamp(),
    }))
  }
}

/**
 * Start a new hand
 */
export const startNewHand = async (
  storeId: string,
  gameId: string
): Promise<void> => {
  if (!isFirebaseConfigured) throw new Error("Firebase is not configured")
  
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
    if (!isFirebaseConfigured) throw new Error("Firebase is not configured")
    
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
      player.totalBet = (player.totalBet || 0) + callAmount
      newPot += callAmount
      break
      
    case "bet":
    case "raise":
      if (!amount || amount < gameData.minRaise) {
        throw new Error("Invalid bet amount")
      }
      player.stack -= amount
      player.currentBet += amount
      player.totalBet = (player.totalBet || 0) + amount
      newPot += amount
      newCurrentBet = player.currentBet
      break
      
    case "allin":
      const allinAmount = player.stack
      player.stack = 0
      player.currentBet += allinAmount
      player.totalBet = (player.totalBet || 0) + allinAmount
      player.isAllIn = true
      newPot += allinAmount
      if (player.currentBet > newCurrentBet) {
        newCurrentBet = player.currentBet
      }
      break
  }
  
  player.lastAction = action
  
  // タイムアウトカウンターをリセット
  player.consecutiveTimeouts = 0
  
  // Add to action history
  const actionHistory = gameData.actionHistory || []
  actionHistory.push({
    playerName: player.userName,
    action: action,
    amount: amount,
    phase: gameData.phase,
    timestamp: new Date()
  })
  
  // Move to next player
  let nextPlayerIndex = (gameData.currentPlayerIndex + 1) % gameData.players.length
  let loopCount = 0
  const maxLoops = gameData.players.length
  
  // Find next active player (not folded, not all-in)
  // Note: player.isAllIn is already updated above, so this will correctly skip the current player if they went all-in
  while (
    loopCount < maxLoops &&
    (gameData.players[nextPlayerIndex].isFolded || gameData.players[nextPlayerIndex].isAllIn)
  ) {
    nextPlayerIndex = (nextPlayerIndex + 1) % gameData.players.length
    loopCount++
  }
  
  // If we looped through all players, it means no actionable players left
  // In this case, keep currentPlayerIndex as is (will be handled by checkAndAdvancePhase)
  if (loopCount >= maxLoops) {
    nextPlayerIndex = gameData.currentPlayerIndex
  }
  
    await updateDoc(gameDoc, removeUndefined({
      players: gameData.players,
      pot: newPot,
      currentBet: newCurrentBet,
      currentPlayerIndex: nextPlayerIndex,
      actionHistory: actionHistory,
      turnStartTime: new Date(), // ターン開始時刻を記録
      updatedAt: serverTimestamp(),
    }))

    // Update player's stapokaBalance in the players collection
    const db = getDb()!
    const playerRef = doc(db, "players", userId);
    await updateDoc(playerRef, {
      stapokaBalance: player.stack,
      updatedAt: serverTimestamp(),
    });
  
    // Check if phase should advance automatically
    // Pass the updated game data directly to avoid reading stale data from Firestore
    const updatedGameData: PokerGameState = {
      ...gameData,
      pot: newPot,
      currentBet: newCurrentBet,
      currentPlayerIndex: nextPlayerIndex,
      actionHistory: actionHistory,
    }
    
    const { checkAndAdvancePhase } = await import("./poker-game-advanced")
    await checkAndAdvancePhase(storeId, gameId, updatedGameData)
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
  if (!isFirebaseConfigured) {
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
          
          console.log('[subscribeToPokerGame] Raw nextHandStartTime:', data.nextHandStartTime, 'type:', typeof data.nextHandStartTime)
          // Convert Firestore Timestamp to Date
          let convertedTime: Date | null = null
          if (data.nextHandStartTime) {
            if (data.nextHandStartTime instanceof Date) {
              convertedTime = data.nextHandStartTime
            } else if (data.nextHandStartTime.toDate && typeof data.nextHandStartTime.toDate === 'function') {
              convertedTime = data.nextHandStartTime.toDate()
            } else if (typeof data.nextHandStartTime === 'number') {
              convertedTime = new Date(data.nextHandStartTime)
            } else if (data.nextHandStartTime.seconds !== undefined) {
              // Firestore Timestamp with seconds/nanoseconds
              convertedTime = new Date(data.nextHandStartTime.seconds * 1000 + (data.nextHandStartTime.nanoseconds || 0) / 1000000)
              console.log('[subscribeToPokerGame] Converted from seconds/nanoseconds:', convertedTime)
            } else {
              console.warn('[subscribeToPokerGame] Unknown nextHandStartTime format:', data.nextHandStartTime)
              convertedTime = null
            }
          }
          console.log('[subscribeToPokerGame] Converted nextHandStartTime:', convertedTime, 'type:', typeof convertedTime)
          
          const game: PokerGameState = {
            ...data,
            id: snapshot.id,
            createdAt: data.createdAt?.toDate() || new Date(),
            updatedAt: updatedAtDate,
            nextHandReadyPlayers: Array.isArray(data.nextHandReadyPlayers) ? data.nextHandReadyPlayers : [],
            nextHandStartTime: convertedTime,
          } as PokerGameState
          console.log('[subscribeToPokerGame] Final game.nextHandStartTime:', game.nextHandStartTime)
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
