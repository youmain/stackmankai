/**
 * Timeout management for poker games
 */

import type { PokerGameState } from "@/types/poker"

export const DEFAULT_TIMEOUT_SECONDS = 30 // 30 seconds per action

export interface TimeoutState {
  currentPlayerIndex: number
  startTime: Date
  timeoutSeconds: number
}

/**
 * Check if current player has timed out
 */
export function hasTimedOut(timeoutState: TimeoutState): boolean {
  const now = new Date()
  const elapsedSeconds = (now.getTime() - timeoutState.startTime.getTime()) / 1000
  return elapsedSeconds >= timeoutState.timeoutSeconds
}

/**
 * Get remaining time in seconds
 */
export function getRemainingTime(timeoutState: TimeoutState): number {
  const now = new Date()
  const elapsedSeconds = (now.getTime() - timeoutState.startTime.getTime()) / 1000
  const remaining = timeoutState.timeoutSeconds - elapsedSeconds
  return Math.max(0, Math.floor(remaining))
}

/**
 * Create a new timeout state for current player
 */
export function createTimeoutState(
  game: PokerGameState,
  timeoutSeconds: number = DEFAULT_TIMEOUT_SECONDS
): TimeoutState {
  return {
    currentPlayerIndex: game.currentPlayerIndex,
    startTime: new Date(),
    timeoutSeconds,
  }
}

/**
 * Check if timeout state is still valid (player hasn't changed)
 */
export function isTimeoutStateValid(
  timeoutState: TimeoutState,
  game: PokerGameState
): boolean {
  return timeoutState.currentPlayerIndex === game.currentPlayerIndex
}
