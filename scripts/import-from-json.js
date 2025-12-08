import { initializeApp } from "firebase/app"
import { getFirestore, collection, addDoc, getDocs, query, where } from "firebase/firestore"
import fs from "fs"
import path from "path"

// Firebase設定（環境変数から取得）
const firebaseConfig = {
  // 現在のプロジェクトのFirebase設定をここに入力
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
}

// Firebase初期化
const app = initializeApp(firebaseConfig)
const db = getFirestore(app)

// ユニークIDを生成する関数
function generateUniqueId() {
  return Math.random().toString(36).substr(2, 9)
}

async function importPlayersFromJSON() {
  try {
    console.log("[v0] JSONファイルからプレイヤーデータをインポート開始...")

    // JSONファイルを読み込み
    const jsonPath = path.join(
      process.cwd(),
      "user_read_only_context/text_attachments/poker-data-export-2025-09-17-yb0v2.json",
    )
    const jsonData = JSON.parse(fs.readFileSync(jsonPath, "utf8"))

    console.log(`[v0] ${jsonData.players.length}人のプレイヤーデータを発見`)
    console.log(`[v0] 総システム残高: ${jsonData.summary.totalSystemBalance.toLocaleString()}©`)

    const playersCollection = collection(db, "players")
    let importedCount = 0
    let skippedCount = 0

    for (const playerData of jsonData.players) {
      try {
        // 既存のプレイヤーをチェック（名前で重複確認）
        const existingPlayerQuery = query(playersCollection, where("name", "==", playerData.name))
        const existingPlayers = await getDocs(existingPlayerQuery)

        if (!existingPlayers.empty) {
          console.log(`[v0] スキップ: ${playerData.name} (既に存在)`)
          skippedCount++
          continue
        }

        // 新しいプレイヤーデータを作成
        const newPlayer = {
          uniqueId: generateUniqueId(),
          name: playerData.name,
          pokerName: playerData.pokerName || "",
          furigana: "",
          systemBalance: playerData.systemBalance || 0,
          currentGameId: null,
          isPlaying: false,
          isSpecial: playerData.isSpecial || false,
          isDeduction: false,
          createdAt: new Date(),
          updatedAt: new Date(),
        }

        // Firestoreに追加
        await addDoc(playersCollection, newPlayer)
        console.log(`[v0] インポート完了: ${playerData.name} (残高: ${playerData.systemBalance.toLocaleString()}©)`)
        importedCount++
      } catch (error) {
        console.error(`[v0] エラー - ${playerData.name}:`, error)
      }
    }

    console.log("\n[v0] インポート結果:")
    console.log(`[v0] インポート成功: ${importedCount}人`)
    console.log(`[v0] スキップ: ${skippedCount}人`)
    console.log(`[v0] 合計処理: ${importedCount + skippedCount}人`)
  } catch (error) {
    console.error("[v0] インポートエラー:", error)
  }
}

// スクリプト実行
importPlayersFromJSON()
