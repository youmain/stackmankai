import { NextResponse } from "next/server"

export async function GET() {
  try {
    const apiKey = process.env.DEEPSEEK_API_KEY

    console.log("[v0] 🔑 APIキー存在確認:", !!apiKey)
    console.log("[v0] 🔑 APIキー長さ:", apiKey?.length || 0)
    console.log("[v0] 🔑 APIキー最初の10文字:", apiKey?.substring(0, 10))

    if (!apiKey) {
      return NextResponse.json({
        success: false,
        error: "DEEPSEEK_API_KEYが設定されていません",
      })
    }

    // DeepSeek APIに直接リクエスト
    const response = await fetch("https://api.deepseek.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "deepseek-chat",
        messages: [
          {
            role: "user",
            content: "こんにちは！簡単に自己紹介してください。",
          },
        ],
        max_tokens: 100,
      }),
    })

    console.log("[v0] 📡 レスポンスステータス:", response.status)
    console.log("[v0] 📡 レスポンスステータステキスト:", response.statusText)

    const responseText = await response.text()
    console.log("[v0] 📡 レスポンス本文:", responseText)

    if (!response.ok) {
      return NextResponse.json({
        success: false,
        error: `DeepSeek APIエラー: ${response.status} ${response.statusText}`,
        responseBody: responseText,
        apiKeyPrefix: apiKey.substring(0, 10),
      })
    }

    const data = JSON.parse(responseText)

    return NextResponse.json({
      success: true,
      message: "DeepSeek APIが正常に動作しています",
      response: data.choices[0].message.content,
      apiKeyPrefix: apiKey.substring(0, 10),
    })
  } catch (error: unknown) {
    console.error("[v0] ❌ エラー:", error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : "不明なエラー",
      errorDetails: error,
    })
  }
}
