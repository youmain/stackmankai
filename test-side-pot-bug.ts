/**
 * Test side pot calculation bug: currentBet reset between phases
 */

import { calculateSidePots, distributePots } from "./lib/poker-logic/side-pot"
import type { PokerPlayer } from "./types/poker"

console.log("=== Bug Test: currentBet Reset After Phase Advance ===")
console.log("")
console.log("Scenario:")
console.log("  1. Preflop: Player A bets 5,000, Player B bets 10,000, Player C bets 15,000")
console.log("  2. Advance to Flop: currentBet is reset to 0 for all players")
console.log("  3. Showdown: Try to calculate side pots")
console.log("")

// After phase advance (currentBet reset to 0)
const playersAfterReset: PokerPlayer[] = [
  {
    userId: "A",
    userName: "Player A",
    seatIndex: 0,
    stack: 0,
    currentBet: 0, // ← Reset!
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
    currentBet: 0, // ← Reset!
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
    currentBet: 0, // ← Reset!
    cards: [],
    isFolded: false,
    isAllIn: true,
    isActive: true,
  },
]

console.log("Player states after phase advance:")
playersAfterReset.forEach(p => {
  console.log(`  ${p.userName}: currentBet = ${p.currentBet}, isAllIn = ${p.isAllIn}`)
})
console.log("")

const pots = calculateSidePots(playersAfterReset)

console.log("Calculated pots:")
if (pots.length === 0) {
  console.log("  ❌ ERROR: No pots calculated!")
  console.log("  This is because currentBet was reset to 0 for all players.")
} else {
  pots.forEach((pot, index) => {
    const eligibleNames = pot.eligiblePlayerIndices.map(idx => playersAfterReset[idx].userName).join(", ")
    console.log(`  ${index === 0 ? 'Main Pot' : `Side Pot ${index}`}: ${pot.amount.toLocaleString()} (${eligibleNames})`)
  })
}
console.log("")

console.log("Expected pots (if currentBet was preserved):")
console.log("  Main Pot: 15,000 (5,000 x 3) - All players")
console.log("  Side Pot 1: 10,000 (5,000 x 2) - Player B and C")
console.log("  Side Pot 2: 5,000 (5,000 x 1) - Player C only")
console.log("")

console.log("=== Solution ===")
console.log("We need to track total bet amount separately from currentBet.")
console.log("Option 1: Add a 'totalBet' field to PokerPlayer")
console.log("Option 2: Store bet history and sum it up at showdown")
console.log("Option 3: Don't reset currentBet, accumulate it across phases")
