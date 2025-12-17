/**
 * Comprehensive test suite for poker game logic
 */

import { calculateSidePots, distributePots } from "./lib/poker-logic/side-pot"
import type { PokerPlayer, PokerGameState } from "./types/poker"

// isRoundComplete function (copied from poker-game-advanced.ts for testing)
const isRoundComplete = (game: PokerGameState): boolean => {
  const nonFoldedPlayers = game.players.filter(p => !p.isFolded)
  if (nonFoldedPlayers.length <= 1) return true
  
  const actionablePlayers = game.players.filter(p => !p.isFolded && !p.isAllIn)
  if (actionablePlayers.length > 0) {
    const maxBet = Math.max(...game.players.map(p => p.currentBet))
    const allHaveSameBet = actionablePlayers.every(p => p.currentBet === maxBet)
    const allHaveActed = actionablePlayers.every(p => p.lastAction !== undefined && p.lastAction !== null)
    return allHaveSameBet && allHaveActed
  }
  
  return true
}

let testsPassed = 0
let testsFailed = 0

function assert(condition: boolean, message: string) {
  if (condition) {
    console.log(`  ✅ ${message}`)
    testsPassed++
  } else {
    console.log(`  ❌ ${message}`)
    testsFailed++
  }
}

console.log("=".repeat(80))
console.log("COMPREHENSIVE POKER GAME TEST SUITE")
console.log("=".repeat(80))
console.log("")

// ============================================================================
// Test 1: 2 Players, Same Amount All-In
// ============================================================================
console.log("Test 1: 2 Players, Same Amount All-In")
console.log("-".repeat(80))

const test1Players: PokerPlayer[] = [
  {
    userId: "1", userName: "Player 1", seatIndex: 0, stack: 0,
    currentBet: 0, totalBet: 10000, cards: [], isFolded: false, isAllIn: true, isActive: true
  },
  {
    userId: "2", userName: "Player 2", seatIndex: 1, stack: 0,
    currentBet: 0, totalBet: 10000, cards: [], isFolded: false, isAllIn: true, isActive: true
  },
]

const test1Pots = calculateSidePots(test1Players)
assert(test1Pots.length === 1, "Should have 1 pot (main pot)")
assert(test1Pots[0].amount === 20000, "Main pot should be 20,000")
assert(test1Pots[0].eligiblePlayerIndices.length === 2, "Both players eligible")

// Test distribution - Player 1 wins
const test1Players2 = JSON.parse(JSON.stringify(test1Players)) as PokerPlayer[]
const test1Pots2 = calculateSidePots(test1Players2)
distributePots(test1Pots2, test1Players2, [[0]])
assert(test1Players2[0].stack === 20000, "Winner should get 20,000")
assert(test1Players2[1].stack === 0, "Loser should get 0")

// Test distribution - Split pot
const test1Players3 = JSON.parse(JSON.stringify(test1Players)) as PokerPlayer[]
const test1Pots3 = calculateSidePots(test1Players3)
distributePots(test1Pots3, test1Players3, [[0, 1]])
assert(test1Players3[0].stack === 10000, "Each should get 10,000 in split")
assert(test1Players3[1].stack === 10000, "Each should get 10,000 in split")

console.log("")

// ============================================================================
// Test 2: 3 Players, Different All-In Amounts
// ============================================================================
console.log("Test 2: 3 Players, Different All-In Amounts")
console.log("-".repeat(80))

const test2Players: PokerPlayer[] = [
  {
    userId: "1", userName: "Player 1", seatIndex: 0, stack: 0,
    currentBet: 0, totalBet: 5000, cards: [], isFolded: false, isAllIn: true, isActive: true
  },
  {
    userId: "2", userName: "Player 2", seatIndex: 1, stack: 0,
    currentBet: 0, totalBet: 10000, cards: [], isFolded: false, isAllIn: true, isActive: true
  },
  {
    userId: "3", userName: "Player 3", seatIndex: 2, stack: 0,
    currentBet: 0, totalBet: 15000, cards: [], isFolded: false, isAllIn: true, isActive: true
  },
]

const test2Pots = calculateSidePots(test2Players)
assert(test2Pots.length === 3, "Should have 3 pots")
assert(test2Pots[0].amount === 15000, "Main pot: 15,000 (5k x 3)")
assert(test2Pots[1].amount === 10000, "Side pot 1: 10,000 (5k x 2)")
assert(test2Pots[2].amount === 5000, "Side pot 2: 5,000 (5k x 1)")
assert(test2Pots[0].eligiblePlayerIndices.length === 3, "Main pot: all 3 eligible")
assert(test2Pots[1].eligiblePlayerIndices.length === 2, "Side pot 1: 2 eligible")
assert(test2Pots[2].eligiblePlayerIndices.length === 1, "Side pot 2: 1 eligible")

// Player 3 wins all
const test2Players2 = JSON.parse(JSON.stringify(test2Players)) as PokerPlayer[]
const test2Pots2 = calculateSidePots(test2Players2)
distributePots(test2Pots2, test2Players2, [[2]])
assert(test2Players2[2].stack === 30000, "Player 3 wins all: 30,000")

// Player 1 wins (only main pot)
const test2Players3 = JSON.parse(JSON.stringify(test2Players)) as PokerPlayer[]
const test2Pots3 = calculateSidePots(test2Players3)
distributePots(test2Pots3, test2Players3, [[0], [1]])
assert(test2Players3[0].stack === 15000, "Player 1 wins main pot: 15,000")
assert(test2Players3[1].stack === 10000, "Player 2 wins side pot 1: 10,000")

console.log("")

// ============================================================================
// Test 3: With Folded Players
// ============================================================================
console.log("Test 3: With Folded Players")
console.log("-".repeat(80))

const test3Players: PokerPlayer[] = [
  {
    userId: "1", userName: "Player 1", seatIndex: 0, stack: 0,
    currentBet: 0, totalBet: 5000, cards: [], isFolded: true, isAllIn: false, isActive: true
  },
  {
    userId: "2", userName: "Player 2", seatIndex: 1, stack: 0,
    currentBet: 0, totalBet: 10000, cards: [], isFolded: false, isAllIn: true, isActive: true
  },
  {
    userId: "3", userName: "Player 3", seatIndex: 2, stack: 0,
    currentBet: 0, totalBet: 15000, cards: [], isFolded: false, isAllIn: true, isActive: true
  },
]

const test3Pots = calculateSidePots(test3Players)
assert(test3Pots.length === 3, "Should have 3 pots (separate bet levels)")
assert(test3Pots[0].amount === 15000, "Pot 0: 15,000 (5k x 3)")
assert(test3Pots[1].amount === 10000, "Pot 1: 10,000 (5k x 2)")
assert(test3Pots[2].amount === 5000, "Pot 2: 5,000 (5k x 1)")
assert(test3Pots[0].eligiblePlayerIndices.length === 2, "Pot 0: 2 eligible (P2, P3)")
assert(!test3Pots[0].eligiblePlayerIndices.includes(0), "Player 1 not eligible (folded)")

// Test distribution - Player 2 wins (but not eligible for pot 2)
const test3Players2 = JSON.parse(JSON.stringify(test3Players)) as PokerPlayer[]
const test3Pots2 = calculateSidePots(test3Players2)
distributePots(test3Pots2, test3Players2, [[1], [2]])
assert(test3Players2[1].stack === 25000, "Player 2 wins pots 0 and 1: 25,000")
assert(test3Players2[2].stack === 5000, "Player 3 wins pot 2: 5,000 (P2 not eligible)")

// Test distribution - Player 3 wins all
const test3Players3 = JSON.parse(JSON.stringify(test3Players)) as PokerPlayer[]
const test3Pots3 = calculateSidePots(test3Players3)
distributePots(test3Pots3, test3Players3, [[2]])
assert(test3Players3[2].stack === 30000, "Player 3 wins all pots: 30,000")

console.log("")

// ============================================================================
// Test 4: 4 Players, Complex Side Pots
// ============================================================================
console.log("Test 4: 4 Players, Complex Side Pots")
console.log("-".repeat(80))

const test4Players: PokerPlayer[] = [
  {
    userId: "1", userName: "Player 1", seatIndex: 0, stack: 0,
    currentBet: 0, totalBet: 2000, cards: [], isFolded: false, isAllIn: true, isActive: true
  },
  {
    userId: "2", userName: "Player 2", seatIndex: 1, stack: 0,
    currentBet: 0, totalBet: 5000, cards: [], isFolded: false, isAllIn: true, isActive: true
  },
  {
    userId: "3", userName: "Player 3", seatIndex: 2, stack: 0,
    currentBet: 0, totalBet: 10000, cards: [], isFolded: false, isAllIn: true, isActive: true
  },
  {
    userId: "4", userName: "Player 4", seatIndex: 3, stack: 0,
    currentBet: 0, totalBet: 20000, cards: [], isFolded: false, isAllIn: true, isActive: true
  },
]

const test4Pots = calculateSidePots(test4Players)
assert(test4Pots.length === 4, "Should have 4 pots")
assert(test4Pots[0].amount === 8000, "Main pot: 8,000 (2k x 4)")
assert(test4Pots[1].amount === 9000, "Side pot 1: 9,000 (3k x 3)")
assert(test4Pots[2].amount === 10000, "Side pot 2: 10,000 (5k x 2)")
assert(test4Pots[3].amount === 10000, "Side pot 3: 10,000 (10k x 1)")

const totalPot = test4Pots.reduce((sum, pot) => sum + pot.amount, 0)
assert(totalPot === 37000, "Total pot should be 37,000")

console.log("")

// ============================================================================
// Test 5: Blind-Only All-In
// ============================================================================
console.log("Test 5: Blind-Only All-In (Small Stack)")
console.log("-".repeat(80))

const test5Players: PokerPlayer[] = [
  {
    userId: "1", userName: "Player 1", seatIndex: 0, stack: 0,
    currentBet: 0, totalBet: 100, cards: [], isFolded: false, isAllIn: true, isActive: true
  },
  {
    userId: "2", userName: "Player 2", seatIndex: 1, stack: 0,
    currentBet: 0, totalBet: 1000, cards: [], isFolded: false, isAllIn: false, isActive: true
  },
  {
    userId: "3", userName: "Player 3", seatIndex: 2, stack: 0,
    currentBet: 0, totalBet: 1000, cards: [], isFolded: false, isAllIn: false, isActive: true
  },
]

const test5Pots = calculateSidePots(test5Players)
assert(test5Pots.length === 2, "Should have 2 pots")
assert(test5Pots[0].amount === 300, "Main pot: 300 (100 x 3)")
assert(test5Pots[1].amount === 1800, "Side pot: 1,800 (900 x 2)")

console.log("")

// ============================================================================
// Test 6: Round Completion Logic
// ============================================================================
console.log("Test 6: Round Completion Logic")
console.log("-".repeat(80))

// All players all-in
const game1: PokerGameState = {
  id: "test", storeId: "test", phase: "preflop", pot: 20000,
  communityCards: [], currentBet: 10000, minRaise: 100,
  dealerIndex: 0, smallBlindIndex: 1, bigBlindIndex: 2, currentPlayerIndex: 0,
  players: [
    { userId: "1", userName: "P1", seatIndex: 0, stack: 0, currentBet: 10000, totalBet: 10000,
      cards: [], isFolded: false, isAllIn: true, isActive: true },
    { userId: "2", userName: "P2", seatIndex: 1, stack: 0, currentBet: 10000, totalBet: 10000,
      cards: [], isFolded: false, isAllIn: true, isActive: true },
  ],
  smallBlind: 50, bigBlind: 100, timeoutSeconds: 30, actionHistory: []
}

assert(isRoundComplete(game1), "Round should be complete (all all-in)")

// One player has chips left
const game2: PokerGameState = {
  ...game1,
  players: [
    { userId: "1", userName: "P1", seatIndex: 0, stack: 0, currentBet: 10000, totalBet: 10000,
      cards: [], isFolded: false, isAllIn: true, isActive: true },
    { userId: "2", userName: "P2", seatIndex: 1, stack: 5000, currentBet: 10000, totalBet: 10000,
      cards: [], isFolded: false, isAllIn: false, isActive: true, lastAction: "call" },
  ],
}

assert(isRoundComplete(game2), "Round should be complete (all acted, same bet)")

// Player hasn't acted yet
const game3: PokerGameState = {
  ...game1,
  players: [
    { userId: "1", userName: "P1", seatIndex: 0, stack: 0, currentBet: 10000, totalBet: 10000,
      cards: [], isFolded: false, isAllIn: true, isActive: true, lastAction: "allin" },
    { userId: "2", userName: "P2", seatIndex: 1, stack: 5000, currentBet: 5000, totalBet: 5000,
      cards: [], isFolded: false, isAllIn: false, isActive: true },
  ],
}

assert(!isRoundComplete(game3), "Round should NOT be complete (P2 hasn't matched bet)")

console.log("")

// ============================================================================
// Test 7: Edge Case - Zero Bet Players
// ============================================================================
console.log("Test 7: Edge Case - Zero Bet Players")
console.log("-".repeat(80))

const test7Players: PokerPlayer[] = [
  {
    userId: "1", userName: "Player 1", seatIndex: 0, stack: 1000,
    currentBet: 0, totalBet: 0, cards: [], isFolded: false, isAllIn: false, isActive: true
  },
  {
    userId: "2", userName: "Player 2", seatIndex: 1, stack: 1000,
    currentBet: 0, totalBet: 0, cards: [], isFolded: false, isAllIn: false, isActive: true
  },
]

const test7Pots = calculateSidePots(test7Players)
assert(test7Pots.length === 0, "Should have no pots (no bets)")

console.log("")

// ============================================================================
// Test 8: Partial All-In (Different Amounts)
// ============================================================================
console.log("Test 8: Partial All-In During Flop")
console.log("-".repeat(80))

const test8Players: PokerPlayer[] = [
  {
    userId: "1", userName: "Player 1", seatIndex: 0, stack: 0,
    currentBet: 0, totalBet: 3000, // 1000 preflop + 2000 flop
    cards: [], isFolded: false, isAllIn: true, isActive: true
  },
  {
    userId: "2", userName: "Player 2", seatIndex: 1, stack: 0,
    currentBet: 0, totalBet: 6000, // 1000 preflop + 5000 flop
    cards: [], isFolded: false, isAllIn: true, isActive: true
  },
]

const test8Pots = calculateSidePots(test8Players)
assert(test8Pots.length === 2, "Should have 2 pots")
assert(test8Pots[0].amount === 6000, "Main pot: 6,000 (3k x 2)")
assert(test8Pots[1].amount === 3000, "Side pot: 3,000 (3k x 1)")

console.log("")

// ============================================================================
// Summary
// ============================================================================
console.log("=".repeat(80))
console.log("TEST SUMMARY")
console.log("=".repeat(80))
console.log(`Total Tests: ${testsPassed + testsFailed}`)
console.log(`✅ Passed: ${testsPassed}`)
console.log(`❌ Failed: ${testsFailed}`)
console.log("")

if (testsFailed === 0) {
  console.log("🎉 ALL TESTS PASSED!")
} else {
  console.log("⚠️  SOME TESTS FAILED - Please review the failures above")
  process.exit(1)
}
