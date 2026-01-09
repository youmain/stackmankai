import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import type { PokerOperationHours } from "@/types/stack-man-hand"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Get current time in Japan Standard Time (JST)
 */
const getCurrentTimeInJST = (): { hours: number; minutes: number } => {
  const now = new Date()
  // Convert to JST (UTC+9)
  const jstTime = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Tokyo' }))
  return {
    hours: jstTime.getHours(),
    minutes: jstTime.getMinutes()
  }
}

/**
 * Check if the current time is within the specified operation hours.
 * @param hours - The operation hours object { open: "HH:MM", close: "HH:MM" }
 * @returns true if current time is between open and close time (inclusive of open, exclusive of close), false otherwise.
 */
export const isWithinOperationHours = (hours: PokerOperationHours): boolean => {
  if (!hours || !hours.open || !hours.close) {
    // If hours are not set, assume 24/7 operation
    return true
  }

  // Type validation
  if (typeof hours.open !== 'string' || typeof hours.close !== 'string') {
    console.warn('[isWithinOperationHours] Invalid hours format:', hours)
    return true // Default to 24/7 if data is invalid
  }

  const jstTime = getCurrentTimeInJST()
  const currentHour = jstTime.hours
  const currentMinute = jstTime.minutes
  
  // Convert "HH:MM" to minutes from midnight
  const timeToMinutes = (time: string): number => {
    if (typeof time !== 'string') return 0
    const parts = time.split(':')
    if (parts.length !== 2) return 0
    const [hour, minute] = parts.map(Number)
    if (isNaN(hour) || isNaN(minute)) return 0
    return hour * 60 + minute
  }

  const currentTimeInMinutes = currentHour * 60 + currentMinute
  const openTimeInMinutes = timeToMinutes(hours.open)
  const closeTimeInMinutes = timeToMinutes(hours.close)

  if (openTimeInMinutes <= closeTimeInMinutes) {
    // Case 1: Operation hours do not cross midnight (e.g., 10:00 - 22:00)
    return currentTimeInMinutes >= openTimeInMinutes && currentTimeInMinutes < closeTimeInMinutes
  } else {
    // Case 2: Operation hours cross midnight (e.g., 22:00 - 10:00)
    // The time is either after open time (22:00) or before close time (10:00)
    return currentTimeInMinutes >= openTimeInMinutes || currentTimeInMinutes < closeTimeInMinutes
  }
}

/**
 * Check if the current time is within the purchase-only window (1 hour after close).
 */
export const isWithinPurchaseWindow = (hours: PokerOperationHours): boolean => {
  if (!hours || !hours.open || !hours.close) return false

  // Type validation
  if (typeof hours.open !== 'string' || typeof hours.close !== 'string') {
    console.warn('[isWithinPurchaseWindow] Invalid hours format:', hours)
    return false
  }

  const jstTime = getCurrentTimeInJST()
  const currentTimeInMinutes = jstTime.hours * 60 + jstTime.minutes
  
  const timeToMinutes = (time: string): number => {
    if (typeof time !== 'string') return 0
    const parts = time.split(':')
    if (parts.length !== 2) return 0
    const [hour, minute] = parts.map(Number)
    if (isNaN(hour) || isNaN(minute)) return 0
    return hour * 60 + minute
  }

  const closeTimeInMinutes = timeToMinutes(hours.close)
  const purchaseEndTimeInMinutes = (closeTimeInMinutes + 60) % (24 * 60)

  if (closeTimeInMinutes < purchaseEndTimeInMinutes) {
    // Normal case (e.g., 24:00 - 01:00)
    return currentTimeInMinutes >= closeTimeInMinutes && currentTimeInMinutes < purchaseEndTimeInMinutes
  } else {
    // Crosses midnight (e.g., 23:30 - 00:30)
    return currentTimeInMinutes >= closeTimeInMinutes || currentTimeInMinutes < purchaseEndTimeInMinutes
  }
}
