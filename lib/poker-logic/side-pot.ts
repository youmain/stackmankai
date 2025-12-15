/**
 * Side pot calculation for poker games
 * Handles multiple all-in scenarios
 */

import type { PokerPlayer } from "@/types/poker"

export interface Pot {
  amount: number
  eligiblePlayerIndices: number[]
}

/**
 * Calculate side pots when there are multiple all-ins
 * Returns an array of pots, each with eligible players
 */
export function calculateSidePots(players: PokerPlayer[]): Pot[] {
  // Get all players who have bet something
  const playersWithBets = players
    .map((player, index) => ({ player, index }))
    .filter(({ player }) => player.currentBet > 0)
    .sort((a, b) => a.player.currentBet - b.player.currentBet)

  if (playersWithBets.length === 0) {
    return []
  }

  const pots: Pot[] = []
  let previousBetLevel = 0

  // Process each bet level
  for (let i = 0; i < playersWithBets.length; i++) {
    const currentBetLevel = playersWithBets[i].player.currentBet

    if (currentBetLevel === previousBetLevel) {
      continue
    }

    const betDifference = currentBetLevel - previousBetLevel

    // Calculate pot amount for this level
    let potAmount = 0
    const eligiblePlayerIndices: number[] = []

    // All players who bet at least this amount contribute
    for (let j = 0; j < players.length; j++) {
      const player = players[j]
      if (player.currentBet >= currentBetLevel) {
        potAmount += betDifference
        
        // Only non-folded players are eligible to win
        if (!player.isFolded) {
          eligiblePlayerIndices.push(j)
        }
      } else if (player.currentBet > previousBetLevel) {
        // Partial contribution
        potAmount += player.currentBet - previousBetLevel
        
        if (!player.isFolded) {
          eligiblePlayerIndices.push(j)
        }
      }
    }

    if (potAmount > 0 && eligiblePlayerIndices.length > 0) {
      pots.push({
        amount: potAmount,
        eligiblePlayerIndices,
      })
    }

    previousBetLevel = currentBetLevel
  }

  return pots
}

/**
 * Distribute pots to winners
 * Handles side pots and splits
 */
export function distributePots(
  pots: Pot[],
  players: PokerPlayer[],
  winnersByStrength: number[][]
): void {
  // Process each pot
  for (const pot of pots) {
    // Find winners eligible for this pot
    let potWinners: number[] = []

    for (const winnerGroup of winnersByStrength) {
      const eligibleWinners = winnerGroup.filter(idx =>
        pot.eligiblePlayerIndices.includes(idx)
      )

      if (eligibleWinners.length > 0) {
        potWinners = eligibleWinners
        break
      }
    }

    // Distribute pot among winners
    if (potWinners.length > 0) {
      const amountPerWinner = Math.floor(pot.amount / potWinners.length)
      const remainder = pot.amount % potWinners.length

      for (let i = 0; i < potWinners.length; i++) {
        const winnerIndex = potWinners[i]
        players[winnerIndex].stack += amountPerWinner
        
        // Give remainder to first winner (closest to dealer button)
        if (i === 0) {
          players[winnerIndex].stack += remainder
        }
      }
    }
  }
}

/**
 * Get human-readable pot descriptions
 */
export function getPotDescriptions(pots: Pot[], players: PokerPlayer[]): string[] {
  return pots.map((pot, index) => {
    const playerNames = pot.eligiblePlayerIndices
      .map(idx => players[idx].userName)
      .join(", ")

    if (index === 0) {
      return `メインポット: ¥${pot.amount.toLocaleString()} (${playerNames})`
    } else {
      return `サイドポット${index}: ¥${pot.amount.toLocaleString()} (${playerNames})`
    }
  })
}
