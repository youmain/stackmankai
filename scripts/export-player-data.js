// キングハイ用Firebaseからプレイヤーデータをエクスポートするスクリプト
import { initializeApp, cert } from "firebase-admin/app"
import { getFirestore } from "firebase-admin/firestore"
import fs from "fs"

// キングハイ用のFirebase設定
const app = initializeApp({
  credential: cert({
    // キングハイ用のサービスアカウントキーをここに設定
    projectId: "your-kinghigh-project-id",
    privateKey: "-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n",
    clientEmail: "firebase-adminsdk-xxxxx@your-kinghigh-project-id.iam.gserviceaccount.com",
  }),
})

const db = getFirestore(app)

async function exportPlayerData() {
  try {
    console.log("[v0] プレイヤーデータのエクスポートを開始します...")

    const playersSnapshot = await db.collection("players").get()

    if (playersSnapshot.empty) {
      console.log("[v0] プレイヤーデータが見つかりません")
      return
    }

    const exportData = []

    playersSnapshot.forEach((doc) => {
      const data = doc.data()
      exportData.push({
        id: doc.id,
        name: data.name || data.playerName || "名前不明",
        systemBalance: data.systemBalance || data.balance || 0,
        pokerName: data.pokerName || "",
        furigana: data.furigana || "",
        originalData: data, // 元データも保持
      })
    })

    // JSONファイルとして保存
    const exportJson = JSON.stringify(exportData, null, 2)
    fs.writeFileSync("exported-player-data.json", exportJson)

    console.log(`[v0] ${exportData.length}件のプレイヤーデータをexported-player-data.jsonに保存しました`)

    // CSVファイルとしても保存
    const csvHeader = "プレイヤー名,システム残高,ポーカーネーム,読み仮名\n"
    const csvData = exportData
      .map((player) => `"${player.name}",${player.systemBalance},"${player.pokerName}","${player.furigana}"`)
      .join("\n")

    fs.writeFileSync("exported-player-data.csv", csvHeader + csvData)
    console.log("[v0] CSVファイルも作成しました: exported-player-data.csv")
  } catch (error) {
    console.error("[v0] エクスポート中にエラーが発生しました:", error)
  }
}

// データエクスポートを実行
exportPlayerData()
