// キングハイ用Firebaseからプレイヤー名とシステム残高を移行するスクリプト
import { initializeApp, cert } from "firebase-admin/app"
import { getFirestore } from "firebase-admin/firestore"

// 移行元（キングハイ用）のFirebase設定
const sourceApp = initializeApp(
  {
    credential: cert({
      // キングハイ用のサービスアカウントキーをここに設定
      projectId: "your-kinghigh-project-id",
      privateKey: "-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n",
      clientEmail: "firebase-adminsdk-xxxxx@your-kinghigh-project-id.iam.gserviceaccount.com",
    }),
  },
  "source",
)

// 移行先（現在のプロジェクト）のFirebase設定
const targetApp = initializeApp(
  {
    credential: cert({
      // 現在のプロジェクトのサービスアカウントキーをここに設定
      projectId: "your-current-project-id",
      privateKey: "-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n",
      clientEmail: "firebase-adminsdk-xxxxx@your-current-project-id.iam.gserviceaccount.com",
    }),
  },
  "target",
)

const sourceDb = getFirestore(sourceApp)
const targetDb = getFirestore(targetApp)

async function migratePlayerData() {
  try {
    console.log("[v0] データ移行を開始します...")

    // キングハイ用プロジェクトからプレイヤーデータを取得
    const playersSnapshot = await sourceDb.collection("players").get()

    if (playersSnapshot.empty) {
      console.log("[v0] 移行元にプレイヤーデータが見つかりません")
      return
    }

    console.log(`[v0] ${playersSnapshot.size}件のプレイヤーデータを発見しました`)

    const batch = targetDb.batch()
    let migratedCount = 0

    for (const doc of playersSnapshot.docs) {
      const sourceData = doc.data()

      // プレイヤー名とシステム残高を抽出
      const playerName = sourceData.name || sourceData.playerName || "名前不明"
      const systemBalance = sourceData.systemBalance || sourceData.balance || 0

      // 現在のプロジェクトの構造に合わせてデータを作成
      const newPlayerData = {
        name: playerName,
        pokerName: sourceData.pokerName || "",
        furigana: sourceData.furigana || "",
        systemBalance: systemBalance,
        uniqueId: Math.random().toString(36).substring(2, 15),
        currentGameId: null,
        isPlaying: false,
        isSpecial: false,
        isDeduction: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      // 新しいドキュメントとして追加
      const newDocRef = targetDb.collection("players").doc()
      batch.set(newDocRef, newPlayerData)

      migratedCount++
      console.log(`[v0] 移行準備完了: ${playerName} (残高: ${systemBalance}©)`)
    }

    // バッチ処理で一括保存
    await batch.commit()

    console.log(`[v0] データ移行が完了しました。${migratedCount}件のプレイヤーデータを移行しました。`)
  } catch (error) {
    console.error("[v0] データ移行中にエラーが発生しました:", error)
  }
}

// データ移行を実行
migratePlayerData()
