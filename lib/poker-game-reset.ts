/**
 * Reset/delete poker game
 */

import { doc, deleteDoc } from "firebase/firestore"
import { db } from "@/lib/firebase"

/**
 * Delete a poker game completely
 */
export const deletePokerGame = async (
  storeId: string,
  gameId: string
): Promise<void> => {
  if (!db) throw new Error("Firebase is not configured")
  
  const gameDoc = doc(db, "stores", storeId, "poker_games", gameId)
  await deleteDoc(gameDoc)
}
