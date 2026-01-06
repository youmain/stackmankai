
import type { PokerOperationHours } from "@/types/stack-man-hand"

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

  const now = new Date()
  const currentHour = now.getHours()
  const currentMinute = now.getMinutes()
  
  // Convert "HH:MM" to minutes from midnight
  const timeToMinutes = (time: string): number => {
    const [hour, minute] = time.split(':').map(Number)
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
