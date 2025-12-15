/**
 * Test side pot calculation
 */

import { calculateSidePots, distributePots, getPotDescriptions } from "./lib/poker-logic/side-pot"
import type { PokerPlayer } from "./types/poker"

// Test case 1: Simple all-in scenario
console.log("=== Test 1: Simple All-In ===")
const players1: PokerPlayer[] = [
  {
    userId: "1",
    userName: "Player 1",
    seatIndex: 0,
    stack: 0,
    currentBet: 100, // All-in
    cards: [],
    isFolded: false,
    isAllIn: true,
    isActive: true,
  },
  {
    userId: "2",
    userName: "Player 2",
    seatIndex: 1,
    stack: 0,
    currentBet: 200, // Has more chips
    cards: [],
    isFolded: false,
    isAllIn: false,
    isActive: true,
  },
  {
    userId: "3",
    userName: "Player 3",
    seatIndex: 2,
    stack: 0,
    currentBet: 200,
    cards: [],
    isFolded: false,
    isAllIn: false,
    isActive: true,
  },
]

const pots1 = calculateSidePots(players1)
console.log("Pots:", JSON.stringify(pots1, null, 2))
console.log("Descriptions:", getPotDescriptions(pots1, players1))
console.log("Expected: Main pot 300 (all 3), Side pot 200 (Player 2, 3)")
console.log()

// Test case 2: Multiple all-ins
console.log("=== Test 2: Multiple All-Ins ===")
const players2: PokerPlayer[] = [
  {
    userId: "1",
    userName: "Player 1",
    seatIndex: 0,
    stack: 0,
    currentBet: 50, // Small all-in
    cards: [],
    isFolded: false,
    isAllIn: true,
    isActive: true,
  },
  {
    userId: "2",
    userName: "Player 2",
    seatIndex: 1,
    stack: 0,
    currentBet: 100, // Medium all-in
    cards: [],
    isFolded: false,
    isAllIn: true,
    isActive: true,
  },
  {
    userId: "3",
    userName: "Player 3",
    seatIndex: 2,
    stack: 0,
    currentBet: 200, // Large bet
    cards: [],
    isFolded: false,
    isAllIn: false,
    isActive: true,
  },
  {
    userId: "4",
    userName: "Player 4",
    seatIndex: 3,
    stack: 0,
    currentBet: 200,
    cards: [],
    isFolded: false,
    isAllIn: false,
    isActive: true,
  },
]

const pots2 = calculateSidePots(players2)
console.log("Pots:", JSON.stringify(pots2, null, 2))
console.log("Descriptions:", getPotDescriptions(pots2, players2))
console.log("Expected:")
console.log("  Main pot: 200 (50x4) - all 4 players")
console.log("  Side pot 1: 150 (50x3) - Player 2, 3, 4")
console.log("  Side pot 2: 200 (100x2) - Player 3, 4")
console.log()

// Test case 3: With folded players
console.log("=== Test 3: With Folded Players ===")
const players3: PokerPlayer[] = [
  {
    userId: "1",
    userName: "Player 1",
    seatIndex: 0,
    stack: 0,
    currentBet: 100,
    cards: [],
    isFolded: true, // Folded
    isAllIn: false,
    isActive: true,
  },
  {
    userId: "2",
    userName: "Player 2",
    seatIndex: 1,
    stack: 0,
    currentBet: 100,
    cards: [],
    isFolded: false,
    isAllIn: true,
    isActive: true,
  },
  {
    userId: "3",
    userName: "Player 3",
    seatIndex: 2,
    stack: 0,
    currentBet: 200,
    cards: [],
    isFolded: false,
    isAllIn: false,
    isActive: true,
  },
]

const pots3 = calculateSidePots(players3)
console.log("Pots:", JSON.stringify(pots3, null, 2))
console.log("Descriptions:", getPotDescriptions(pots3, players3))
console.log("Expected:")
console.log("  Main pot: 300 (100x3) - Player 2, 3 only (Player 1 folded)")
console.log("  Side pot: 100 (100x1) - Player 3 only")
console.log()

// Test case 4: Distribution test
console.log("=== Test 4: Distribution Test ===")
const players4: PokerPlayer[] = [
  {
    userId: "1",
    userName: "Player 1",
    seatIndex: 0,
    stack: 0,
    currentBet: 100,
    cards: [],
    isFolded: false,
    isAllIn: true,
    isActive: true,
  },
  {
    userId: "2",
    userName: "Player 2",
    seatIndex: 1,
    stack: 0,
    currentBet: 200,
    cards: [],
    isFolded: false,
    isAllIn: false,
    isActive: true,
  },
  {
    userId: "3",
    userName: "Player 3",
    seatIndex: 2,
    stack: 0,
    currentBet: 200,
    cards: [],
    isFolded: false,
    isAllIn: false,
    isActive: true,
  },
]

const pots4 = calculateSidePots(players4)
console.log("Pots before distribution:", JSON.stringify(pots4, null, 2))

// Player 2 wins both pots
const winnersByStrength4 = [[1]]
distributePots(pots4, players4, winnersByStrength4)

console.log("After distribution (Player 2 wins):")
console.log("  Player 1 stack:", players4[0].stack, "(expected: 0)")
console.log("  Player 2 stack:", players4[1].stack, "(expected: 500)")
console.log("  Player 3 stack:", players4[2].stack, "(expected: 0)")
console.log()

// Test case 5: Split pot
console.log("=== Test 5: Split Pot ===")
const players5: PokerPlayer[] = [
  {
    userId: "1",
    userName: "Player 1",
    seatIndex: 0,
    stack: 0,
    currentBet: 100,
    cards: [],
    isFolded: false,
    isAllIn: false,
    isActive: true,
  },
  {
    userId: "2",
    userName: "Player 2",
    seatIndex: 1,
    stack: 0,
    currentBet: 100,
    cards: [],
    isFolded: false,
    isAllIn: false,
    isActive: true,
  },
]

const pots5 = calculateSidePots(players5)
console.log("Pots before distribution:", JSON.stringify(pots5, null, 2))

// Both players tie
const winnersByStrength5 = [[0, 1]]
distributePots(pots5, players5, winnersByStrength5)

console.log("After distribution (both win):")
console.log("  Player 1 stack:", players5[0].stack, "(expected: 100)")
console.log("  Player 2 stack:", players5[1].stack, "(expected: 100)")
console.log()

console.log("✅ All side pot tests completed!")
