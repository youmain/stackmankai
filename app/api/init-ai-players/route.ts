import { NextResponse } from "next/server"
import { initializeApp, getApps } from "firebase/app"
import { getFirestore, doc, setDoc } from "firebase/firestore"
import { AI_PLAYERS } from "@/lib/ai-players-data"

export const dynamic = "force-dynamic"

// Firebase初期化（既存の設定を使用）
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "AIzaSyB2IryF98PSSX5oToDF8aDtbLzXjJnXcXU",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "stackmankai.firebaseapp.com",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "stackmankai",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "stackmankai.firebasestorage.app",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "436713065076",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "1:436713065076:web:111033e0543a666a139f21",
}

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0]
const db = getFirestore(app)

export async function GET() {
  try {
    console.log("[v0] AIプレイヤーをFirestoreに登録中...")

    const results = []

    for (const player of AI_PLAYERS) {
      const playerRef = doc(db, "aiPlayers", player.id)

      await setDoc(playerRef, {
        ...player,
        createdAt: new Date(),
        isActive: true,
      })

      console.log(`[v0] ✓ ${player.name} を登録しました`)
      results.push(`✓ ${player.name} を登録しました`)
    }

    console.log(`[v0] ✅ 全てのAIプレイヤーの登録が完了しました！合計: ${AI_PLAYERS.length}人`)

    return NextResponse.json({
      success: true,
      message: `${AI_PLAYERS.length}人のAIプレイヤーを登録しました`,
      players: results,
    })
  } catch (error) {
    console.error("[v0] ❌ エラーが発生しました:", error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "不明なエラー",
      },
      { status: 500 },
    )
  }
}
