/**
 * Debug test for folded player scenario
 */

import { calculateSidePots } from "./lib/poker-logic/side-pot"
import type { PokerPlayer } from "./types/poker"

console.log("=== Debug: Folded Player Scenario ===")
console.log("")

const players: PokerPlayer[] = [
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

console.log("Players:")
players.forEach(p => {
  console.log(`  ${p.userName}: totalBet=${p.totalBet}, isFolded=${p.isFolded}`)
})
console.log("")

const pots = calculateSidePots(players)

console.log(`Number of pots: ${pots.length}`)
console.log("")

pots.forEach((pot, index) => {
  const eligibleNames = pot.eligiblePlayerIndices.map(idx => players[idx].userName).join(", ")
  console.log(`Pot ${index}:`)
  console.log(`  Amount: ${pot.amount.toLocaleString()}`)
  console.log(`  Eligible: ${eligibleNames}`)
  console.log(`  Eligible indices: ${pot.eligiblePlayerIndices}`)
})
console.log("")

console.log("Expected:")
console.log("  Pot 0: 15,000 (Player 2, Player 3)")
console.log("  Pot 1: 5,000 (Player 3)")
console.log("")

console.log("Analysis:")
console.log("  Player 1 bet 5,000 but folded → contributes to pot but not eligible")
console.log("  Player 2 bet 10,000 → eligible for pots up to 10,000")
console.log("  Player 3 bet 15,000 → eligible for all pots")
console.log("")
console.log("  Pot breakdown:")
console.log("    - First 5,000 from each (3 players) = 15,000 → P2, P3 eligible")
console.log("    - Next 5,000 from P2 and P3 (2 players) = 10,000 → P2, P3 eligible")
console.log("    - Last 5,000 from P3 (1 player) = 5,000 → P3 eligible")
console.log("")
console.log("  Wait... that should be 3 pots, not 2!")
console.log("  Let me recalculate:")
console.log("    Level 5,000: 5k x 3 = 15,000 (P2, P3 eligible)")
console.log("    Level 10,000: 5k x 2 = 10,000 (P2, P3 eligible)")
console.log("    Level 15,000: 5k x 1 = 5,000 (P3 eligible)")
console.log("")
console.log("  But pots at same eligible players might be combined?")
console.log("  No, they should be separate for side pot logic.")
