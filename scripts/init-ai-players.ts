import { initializeApp } from "firebase/app"
import { getFirestore, doc, setDoc } from "firebase/firestore"
import { AI_PLAYERS } from "../lib/ai-players-data"

// Firebase初期化（既存の設定を使用）
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "AIzaSyB2IryF98PSSX5oToDF8aDtbLzXjJnXcXU",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "stackmankai.firebaseapp.com",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "stackmankai",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "stackmankai.firebasestorage.app",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "436713065076",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "1:436713065076:web:111033e0543a666a139f21",
}

const app = initializeApp(firebaseConfig)
const db = getFirestore(app)

async function initAIPlayers() {
  console.log("AIプレイヤーをFirestoreに登録中...")

  try {
    for (const player of AI_PLAYERS) {
      const playerRef = doc(db, "aiPlayers", player.id)

      await setDoc(playerRef, {
        ...player,
        createdAt: new Date(),
        isActive: true,
      })

      console.log(`✓ ${player.name} を登録しました`)
    }

    console.log("\n✅ 全てのAIプレイヤーの登録が完了しました！")
    console.log(`合計: ${AI_PLAYERS.length}人`)
  } catch (error) {
    console.error("❌ エラーが発生しました:", error)
    throw error
  }
}

// スクリプト実行
initAIPlayers()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
