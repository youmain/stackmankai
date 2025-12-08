import fs from "fs"
import path from "path"

async function previewJSONData() {
  try {
    console.log("[v0] JSONデータのプレビューを開始...")

    // JSONファイルを読み込み
    const jsonPath = path.join(
      process.cwd(),
      "user_read_only_context/text_attachments/poker-data-export-2025-09-17-yb0v2.json",
    )
    const jsonData = JSON.parse(fs.readFileSync(jsonPath, "utf8"))

    console.log("\n=== データサマリー ===")
    console.log(`エクスポート日時: ${new Date(jsonData.exportDate).toLocaleString("ja-JP")}`)
    console.log(`エクスポート者: ${jsonData.exportedBy}`)
    console.log(`総プレイヤー数: ${jsonData.summary.totalPlayers}人`)
    console.log(`総システム残高: ${jsonData.summary.totalSystemBalance.toLocaleString()}©`)
    console.log(`総購入金額: ${jsonData.summary.totalPurchaseAmount.toLocaleString()}©`)
    console.log(`総レーキ: ${jsonData.summary.totalRake.toLocaleString()}©`)

    console.log("\n=== プレイヤーデータ（上位10人の残高） ===")
    const sortedPlayers = jsonData.players.sort((a, b) => b.systemBalance - a.systemBalance).slice(0, 10)

    sortedPlayers.forEach((player, index) => {
      console.log(`${index + 1}. ${player.name}: ${player.systemBalance.toLocaleString()}©`)
    })

    console.log("\n=== 残高分布 ===")
    const balanceRanges = {
      "100万©以上": 0,
      "50万©以上": 0,
      "10万©以上": 0,
      "5万©以上": 0,
      "1万©以上": 0,
      "1万©未満": 0,
    }

    jsonData.players.forEach((player) => {
      const balance = player.systemBalance
      if (balance >= 1000000) balanceRanges["100万©以上"]++
      else if (balance >= 500000) balanceRanges["50万©以上"]++
      else if (balance >= 100000) balanceRanges["10万©以上"]++
      else if (balance >= 50000) balanceRanges["5万©以上"]++
      else if (balance >= 10000) balanceRanges["1万©以上"]++
      else balanceRanges["1万©未満"]++
    })

    Object.entries(balanceRanges).forEach(([range, count]) => {
      console.log(`${range}: ${count}人`)
    })
  } catch (error) {
    console.error("[v0] プレビューエラー:", error)
  }
}

// スクリプト実行
previewJSONData()
