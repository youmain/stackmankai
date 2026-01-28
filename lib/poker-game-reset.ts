/**
 * Reset/delete poker game
 */

import * as firestore from "firebase/firestore"
import { getDb } from "@/lib/firebase"

/**
 * Delete a poker game completely
 */
export const deletePokerGame = async (
  storeId: string,
  gameId: string
): Promise<void> => {
  const db = getDb()
  if (!db || typeof firestore.doc !== 'function' || typeof firestore.deleteDoc !== 'function') {
    // SSRまたは未初期化の場合は処理をスキップ
    return
  }
  
  const gameDoc = firestore.doc(db, "stores", storeId, "poker_games", gameId)
  await firestore.deleteDoc(gameDoc)
}
