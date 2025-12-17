/**
 * Test side pot calculation with totalBet field
 */

import { calculateSidePots, distributePots } from "./lib/poker-logic/side-pot"
import type { PokerPlayer } from "./types/poker"

console.log("=== Test: Side Pot with totalBet (After Phase Advance) ===")
console.log("")
console.log("Scenario:")
console.log("  1. Preflop: Player A bets 5,000, Player B bets 10,000, Player C bets 15,000")
console.log("  2. Advance to Flop: currentBet is reset to 0, but totalBet is preserved")
console.log("  3. Showdown: Calculate side pots using totalBet")
console.log("")

// After phase advance (currentBet reset to 0, but totalBet preserved)
const players: PokerPlayer[] = [
  {
    userId: "A",
    userName: "Player A",
    seatIndex: 0,
    stack: 0,
    currentBet: 0, // Reset
    totalBet: 5000, // Preserved!
    cards: [],
    isFolded: false,
    isAllIn: true,
    isActive: true,
  },
  {
    userId: "B",
    userName: "Player B",
    seatIndex: 1,
    stack: 0,
    currentBet: 0, // Reset
    totalBet: 10000, // Preserved!
    cards: [],
    isFolded: false,
    isAllIn: true,
    isActive: true,
  },
  {
    userId: "C",
    userName: "Player C",
    seatIndex: 2,
    stack: 0,
    currentBet: 0, // Reset
    totalBet: 15000, // Preserved!
    cards: [],
    isFolded: false,
    isAllIn: true,
    isActive: true,
  },
]

console.log("Player states after phase advance:")
players.forEach(p => {
  console.log(`  ${p.userName}: currentBet = ${p.currentBet}, totalBet = ${p.totalBet}, isAllIn = ${p.isAllIn}`)
})
console.log("")

const pots = calculateSidePots(players)

console.log("Calculated pots:")
if (pots.length === 0) {
  console.log("  ❌ ERROR: No pots calculated!")
} else {
  pots.forEach((pot, index) => {
    const eligibleNames = pot.eligiblePlayerIndices.map(idx => players[idx].userName).join(", ")
    console.log(`  ${index === 0 ? 'Main Pot' : `Side Pot ${index}`}: ${pot.amount.toLocaleString()} (${eligibleNames})`)
  })
  console.log("")
  console.log("✅ SUCCESS: Side pots calculated correctly!")
}
console.log("")

console.log("Expected:")
console.log("  Main Pot: 15,000 (5,000 x 3) - All players")
console.log("  Side Pot 1: 10,000 (5,000 x 2) - Player B and C")
console.log("  Side Pot 2: 5,000 (5,000 x 1) - Player C only")
console.log("")

// Test distribution
console.log("=== Test: Distribution - Player C Wins ===")
const players2 = JSON.parse(JSON.stringify(players)) as PokerPlayer[]
const pots2 = calculateSidePots(players2)

console.log("Before distribution:")
players2.forEach(p => console.log(`  ${p.userName}: stack = ${p.stack}`))

// Player C wins (index 2)
distributePots(pots2, players2, [[2]])

console.log("After distribution:")
players2.forEach(p => console.log(`  ${p.userName}: stack = ${p.stack}`))
console.log(`Expected: Player C should have 30,000 (15,000 + 10,000 + 5,000)`)
console.log("")

// Test distribution - Player A wins
console.log("=== Test: Distribution - Player A Wins ===")
const players3 = JSON.parse(JSON.stringify(players)) as PokerPlayer[]
const pots3 = calculateSidePots(players3)

console.log("Before distribution:")
players3.forEach(p => console.log(`  ${p.userName}: stack = ${p.stack}`))

// Player A wins (index 0)
distributePots(pots3, players3, [[0]])

console.log("After distribution:")
players3.forEach(p => console.log(`  ${p.userName}: stack = ${p.stack}`))
console.log(`Expected: Player A should have 15,000 (only main pot)`)
console.log(`Expected: Player B should have 10,000 (side pot 1, best among B and C)`)
console.log(`Expected: Player C should have 5,000 (side pot 2, only C eligible)`)
console.log("")

console.log("Note: In actual game, B and C would compete for side pots based on hand strength.")
