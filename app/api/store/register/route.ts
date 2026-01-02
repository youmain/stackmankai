import { NextRequest, NextResponse } from "next/server"
import { registerStoreAdmin } from "@/lib/firestore-stores-admin"
import type { StoreRegistrationData } from "@/types/store"

export async function POST(request: NextRequest) {
  try {
    const data: StoreRegistrationData = await request.json()
    
    // バリデーション
    if (!data.name || !data.email || !data.ownerEmail || !data.ownerPassword || !data.storePassword) {
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

    if (data.storePassword.length < 4) {
      return NextResponse.json(
        { error: "店舗パスワードは4文字以上で設定してください" },
        { status: 400 }
      )
    }

    // 店舗登録を実行（Firebase Admin SDK版）
    const result = await registerStoreAdmin(data)

    return NextResponse.json({
      success: true,
      storeId: result.storeId,
      storeCode: result.storeCode,
      uid: result.uid,
    })
  } catch (error: any) {
    console.error("店舗登録APIエラー:", error)
    
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
