"use client"

import { useEffect, useState } from "react"
import { getAuthInstance } from "@/lib/firebase"
import { signInWithEmailAndPassword } from "firebase/auth"

export default function TestFirebaseAuthPage() {
  const [status, setStatus] = useState<string>("初期化中...")
  const [logs, setLogs] = useState<string[]>([])

  const addLog = (message: string) => {
    const timestamp = new Date().toISOString()
    const logMessage = `[${timestamp}] ${message}`
    console.log(logMessage)
    setLogs((prev) => [...prev, logMessage])
  }

  useEffect(() => {
    async function testAuth() {
      try {
        addLog("Firebase Auth接続テスト開始")
        
        const auth = getAuthInstance()
        if (!auth) {
          addLog("❌ Firebase Authインスタンスの取得失敗")
          setStatus("❌ Firebase Authが初期化されていません")
          return
        }
        addLog("✅ Firebase Authインスタンス取得成功")
        addLog(`Auth config: ${JSON.stringify({ apiKey: auth.config.apiKey?.substring(0, 8) + "...", authDomain: auth.config.authDomain })}`)

        setStatus("Firebase Authに接続中...")
        addLog("signInWithEmailAndPassword呼び出し開始")
        
        const startTime = Date.now()
        const userCredential = await signInWithEmailAndPassword(
          auth,
          "test-customer@example.com",
          "testpass123"
        )
        const duration = Date.now() - startTime
        
        addLog(`✅ ログイン成功！ (${duration}ms)`)
        addLog(`ユーザーUID: ${userCredential.user.uid}`)
        setStatus(`✅ ログイン成功！ (${duration}ms)`)
      } catch (error: any) {
        const errorMessage = error.message || String(error)
        addLog(`❌ エラー発生: ${errorMessage}`)
        addLog(`エラーコード: ${error.code}`)
        setStatus(`❌ エラー: ${errorMessage}`)
      }
    }

    testAuth()
  }, [])

  return (
    <div style={{ padding: "20px", fontFamily: "monospace" }}>
      <h1>Firebase Auth接続テスト</h1>
      <h2>ステータス: {status}</h2>
      <h3>ログ:</h3>
      <div style={{ background: "#f0f0f0", padding: "10px", borderRadius: "5px", maxHeight: "500px", overflow: "auto" }}>
        {logs.map((log, index) => (
          <div key={index} style={{ marginBottom: "5px", fontSize: "12px" }}>
            {log}
          </div>
        ))}
      </div>
    </div>
  )
}
