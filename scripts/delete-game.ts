/**
 * Delete a poker game from Firestore
 * Usage: npx tsx scripts/delete-game.ts <storeId> <gameId>
 */

import { initializeApp, cert, getApps } from "firebase-admin/app"
import { getFirestore } from "firebase-admin/firestore"

// Initialize Firebase Admin
if (getApps().length === 0) {
  // For local testing, you can use service account key
  // For now, we'll use the default credentials
  initializeApp()
}

const db = getFirestore()

async function deleteGame(storeId: string, gameId: string) {
  try {
    const gameRef = db
      .collection("pokerGames")
      .doc(storeId)
      .collection("games")
      .doc(gameId)
    
    await gameRef.delete()
    console.log(`✅ Game deleted: ${gameId}`)
  } catch (error) {
    console.error("❌ Error deleting game:", error)
    throw error
  }
}

// Get command line arguments
const storeId = process.argv[2]
const gameId = process.argv[3]

if (!storeId || !gameId) {
  console.error("Usage: npx tsx scripts/delete-game.ts <storeId> <gameId>")
  console.error("Example: npx tsx scripts/delete-game.ts store_KLDdhiCU3rOI3fQFq4na i8pBCca6OUImWXWrFH0m")
  process.exit(1)
}

deleteGame(storeId, gameId)
  .then(() => {
    console.log("Done!")
    process.exit(0)
  })
  .catch((error) => {
    console.error("Failed:", error)
    process.exit(1)
  })
