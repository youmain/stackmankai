import { NextResponse } from "next/server"
import { createOpenAI } from "@ai-sdk/openai"
import { generateText } from "ai"

export const dynamic = "force-dynamic"

export async function GET() {
  try {
    console.log("[v0] 🧪 DeepSeek APIテスト開始")
    console.log("[v0] 🔑 DEEPSEEK_API_KEY exists:", !!process.env.DEEPSEEK_API_KEY)
    console.log("[v0] 🔑 DEEPSEEK_API_KEY value:", process.env.DEEPSEEK_API_KEY?.substring(0, 10) + "...")

    if (!process.env.DEEPSEEK_API_KEY) {
      return NextResponse.json({
        success: false,
        error: "DEEPSEEK_API_KEY環境変数が設定されていません",
      })
    }

    const deepseek = createOpenAI({
      apiKey: process.env.DEEPSEEK_API_KEY,
      baseURL: "https://api.deepseek.com/v1",
    })

    console.log("[v0] 📡 DeepSeek APIにリクエスト送信中...")

    const { text } = await generateText({
      model: deepseek("deepseek-chat"),
      prompt: "こんにちは。簡単な挨拶を20文字以内で返してください。",
    })

    console.log("[v0] ✅ DeepSeek APIレスポンス受信成功")
    console.log("[v0] 📝 生成されたテキスト:", text)

    return NextResponse.json({
      success: true,
      message: "DeepSeek APIが正常に動作しています",
      generatedText: text,
      apiKeyConfigured: true,
    })
  } catch (error: any) {
    console.error("[v0] ❌ DeepSeek APIテストエラー:", error)
    console.error("[v0] エラーメッセージ:", error.message)
    console.error("[v0] エラースタック:", error.stack)
    console.error("[v0] エラー全体:", JSON.stringify(error, Object.getOwnPropertyNames(error), 2))

    return NextResponse.json({
      success: false,
      error: error.message || "Unknown error",
      errorType: error.constructor.name,
      errorDetails: {
        message: error.message,
        cause: error.cause,
        stack: error.stack?.split("\n").slice(0, 5),
      },
    })
  }
}
