import { NextRequest, NextResponse } from "next/server"
import { registerStoreAdmin } from "@/lib/firestore-stores-admin"
import type { StoreRegistrationData } from "@/types/store"

export async function POST(request: NextRequest) {
  console.log("[API] Store registration API called")
  try {
    const data: StoreRegistrationData = await request.json()
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

    // 店舗登録を実行（Firebase Admin SDK版）
    console.log("[API] Calling registerStoreAdmin...")
    const result = await registerStoreAdmin(data)
    console.log("[API] Registration successful:", result)

    return NextResponse.json({
      success: true,
      storeId: result.storeId,
      storeCode: result.storeCode,
      uid: result.uid,
    })
  } catch (error: any) {
    console.error("[API] 店舗登録APIエラー:", error)
    console.error("[API] Error details:", { code: error.code, message: error.message, stack: error.stack })
    
    let errorMessage = "店舗登録に失敗しました。"
    
    if (error.code === 'auth/email-already-in-use') {
      errorMessage = "このメールアドレスは既に使用されています。"
    } else if (error.code === 'auth/invalid-email') {
      errorMessage = "メールアドレスの形式が正しくありません。"
    } else if (error.code === 'auth/weak-password') {
      errorMessage = "パスワードが弱すぎます。より強力なパスワードを設定してください。"
    } else if (error.message) {
      errorMessage += ` ${error.message}`
    }

    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    )
  }
}
