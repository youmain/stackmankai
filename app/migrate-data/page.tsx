"use client"

import { useState } from "react"
import { getDb } from "@/lib/firebase"
import { collection, getDocs, writeBatch } from "firebase/firestore"

export default function MigrateDataPage() {
  const [password, setPassword] = useState("")
  const [isRunning, setIsRunning] = useState(false)
  const [results, setResults] = useState<any>(null)
  const [error, setError] = useState("")

  const runMigration = async () => {
    if (password !== "migrate510") {
      setError("パスワードが正しくありません")
      return
    }

    setIsRunning(true)
    setError("")
    setResults(null)

    try {
      const db = getDb()
      if (!db) {
        throw new Error("Firebase未設定")
      }

      const DEFAULT_STORE_ID = "510"
      const migrationResults: any = {
        players: { updated: 0, skipped: 0 },
        receipts: { updated: 0, skipped: 0 },
        rakeHistory: { updated: 0, skipped: 0 },
        rankings: { updated: 0, skipped: 0 },
      }

      // プレイヤー移行
      console.log("プレイヤー移行開始...")
      const playersSnapshot = await getDocs(collection(db, "players"))
      let batch = writeBatch(db)
      let batchCount = 0

      for (const doc of playersSnapshot.docs) {
        const data = doc.data()
        if (!data.storeId) {
          batch.update(doc.ref, {
            storeId: DEFAULT_STORE_ID,
            updatedAt: new Date(),
          })
          migrationResults.players.updated++
          batchCount++

          if (batchCount >= 500) {
            await batch.commit()
            batch = writeBatch(db)
            batchCount = 0
          }
        } else {
          migrationResults.players.skipped++
        }
      }

      if (batchCount > 0) {
        await batch.commit()
      }
      console.log("プレイヤー移行完了:", migrationResults.players)

      // 伝票移行
      console.log("伝票移行開始...")
      const receiptsSnapshot = await getDocs(collection(db, "receipts"))
      batch = writeBatch(db)
      batchCount = 0

      for (const doc of receiptsSnapshot.docs) {
        const data = doc.data()
        if (!data.storeId) {
          batch.update(doc.ref, {
            storeId: DEFAULT_STORE_ID,
            updatedAt: new Date(),
          })
          migrationResults.receipts.updated++
          batchCount++

          if (batchCount >= 500) {
            await batch.commit()
            batch = writeBatch(db)
            batchCount = 0
          }
        } else {
          migrationResults.receipts.skipped++
        }
      }

      if (batchCount > 0) {
        await batch.commit()
      }
      console.log("伝票移行完了:", migrationResults.receipts)

      // レーキ履歴移行
      console.log("レーキ履歴移行開始...")
      const rakeSnapshot = await getDocs(collection(db, "rakeHistory"))
      batch = writeBatch(db)
      batchCount = 0

      for (const doc of rakeSnapshot.docs) {
        const data = doc.data()
        if (!data.storeId) {
          batch.update(doc.ref, {
            storeId: DEFAULT_STORE_ID,
          })
          migrationResults.rakeHistory.updated++
          batchCount++

          if (batchCount >= 500) {
            await batch.commit()
            batch = writeBatch(db)
            batchCount = 0
          }
        } else {
          migrationResults.rakeHistory.skipped++
        }
      }

      if (batchCount > 0) {
        await batch.commit()
      }
      console.log("レーキ履歴移行完了:", migrationResults.rakeHistory)

      // ランキング移行
      console.log("ランキング移行開始...")
      const dailySnapshot = await getDocs(collection(db, "dailyRankings"))
      const monthlySnapshot = await getDocs(collection(db, "monthlyRankings"))
      batch = writeBatch(db)
      batchCount = 0

      for (const doc of dailySnapshot.docs) {
        const data = doc.data()
        if (!data.storeId) {
          batch.update(doc.ref, { storeId: DEFAULT_STORE_ID })
          migrationResults.rankings.updated++
          batchCount++

          if (batchCount >= 500) {
            await batch.commit()
            batch = writeBatch(db)
            batchCount = 0
          }
        } else {
          migrationResults.rankings.skipped++
        }
      }

      for (const doc of monthlySnapshot.docs) {
        const data = doc.data()
        if (!data.storeId) {
          batch.update(doc.ref, { storeId: DEFAULT_STORE_ID })
          migrationResults.rankings.updated++
          batchCount++

          if (batchCount >= 500) {
            await batch.commit()
            batch = writeBatch(db)
            batchCount = 0
          }
        } else {
          migrationResults.rankings.skipped++
        }
      }

      if (batchCount > 0) {
        await batch.commit()
      }
      console.log("ランキング移行完了:", migrationResults.rankings)

      setResults(migrationResults)
      alert("移行が完了しました！")
    } catch (err: any) {
      console.error("Migration error:", err)
      setError(err.message || "移行エラー")
    } finally {
      setIsRunning(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-md p-6">
        <h1 className="text-2xl font-bold mb-6">データ移行ツール</h1>

        <div className="mb-6">
          <p className="text-gray-700 mb-4">
            全ての既存データに店舗ID (510) を追加します。
          </p>

          <label className="block mb-2 font-medium">パスワード</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full border rounded px-3 py-2 mb-4"
            placeholder="migrate510"
          />

          <button
            onClick={runMigration}
            disabled={isRunning}
            className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 disabled:bg-gray-400"
          >
            {isRunning ? "移行中..." : "移行を実行"}
          </button>
        </div>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        {results && (
          <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded">
            <h2 className="font-bold mb-2">移行結果</h2>
            <ul className="space-y-1">
              <li>
                プレイヤー: {results.players.updated}件更新, {results.players.skipped}件スキップ
              </li>
              <li>
                伝票: {results.receipts.updated}件更新, {results.receipts.skipped}件スキップ
              </li>
              <li>
                レーキ履歴: {results.rakeHistory.updated}件更新, {results.rakeHistory.skipped}件スキップ
              </li>
              <li>
                ランキング: {results.rankings.updated}件更新, {results.rankings.skipped}件スキップ
              </li>
            </ul>
          </div>
        )}
      </div>
    </div>
  )
}
