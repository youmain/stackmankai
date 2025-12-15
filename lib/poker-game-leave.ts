// ポーカーゲーム退席機能
import { doc, updateDoc, arrayRemove, getDoc } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { getPokerGameCollection } from "./poker-game"

export async function leavePokerGame(
  storeId: string,
  gameId: string,
  userId: string
): Promise<void> {
  const gameRef = doc(getPokerGameCollection(storeId), gameId)
  const gameSnap = await getDoc(gameRef)
  
  if (!gameSnap.exists()) {
    throw new Error("Game not found")
  }
  
  const gameData = gameSnap.data()
  const player = gameData.players.find((p: any) => p.userId === userId)
  
  if (!player) {
    throw new Error("Player not found in game")
  }
  
  // ゲームが進行中（waiting以外）の場合は退席できない
  if (gameData.phase !== "waiting") {
    throw new Error("Cannot leave during an active game")
  }
  
  // プレイヤーを削除
  await updateDoc(gameRef, {
    players: arrayRemove(player)
  })
}
