import { NextRequest, NextResponse } from "next/server"
import type { StoreRegistrationData } from "@/types/store"

export async function POST(request: NextRequest) {
  console.log("[API] Store registration API called")
  try {
    const data: StoreRegistrationData & { uid?: string } = await request.json()
    console.log("[API] Request data:", { ...data, ownerPassword: "***" })
    
    // バリデーション
    if (!data.name || !data.email || !data.ownerEmail || !data.ownerPassword) {
      return NextResponse.json(
        { error: "必須項目を入力してください" },
        { status: 400 }
      )
    }

    if (data.ownerPassword.length < 6) {
      return NextResponse.json(
        { error: "オーナーパスワードは6文字以上で設定してください" },
        { status: 400 }
      )
    }

    // UID がクライアント側から提供されているか確認
    if (!data.uid) {
      return NextResponse.json(
        { error: "ユーザー認証が必要です。先にクライアント側で登録してください。" },
        { status: 400 }
      )
    }

    const uid = data.uid

    // 店舗コードを生成
    const storeCode = Math.floor(100000 + Math.random() * 900000).toString()

    console.log(`[API] 店舗登録成功: ${uid}, コード: ${storeCode}`)

    return NextResponse.json({
      success: true,
      storeId: uid,
      storeCode,
      uid,
    })
  } catch (error: any) {
    console.error("[API] 店舗登録APIエラー:", error)
    console.error("[API] Error details:", { code: error.code, message: error.message })
    
    let errorMessage = "店舗登録に失敗しました。"
    
    if (error.message) {
      errorMessage += ` ${error.message}`
    }

    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    )
  }
}
