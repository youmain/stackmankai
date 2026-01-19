import { NextRequest, NextResponse } from "next/server"
import type { StoreRegistrationData } from "@/types/store"
import { getAdminDb } from "@/lib/firebase-admin"

/**
 * 6桁のランダムな店舗コードを生成
 */
function generateRandomCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString()
}

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
    const db = getAdminDb()

    // パスワードのハッシュ化
    const hashedOwnerPassword = Buffer.from(data.ownerPassword).toString("base64")

    let storeCode = ""

    // 店舗コードの重複チェック（最大10回試行）
    let codeFound = false

    for (let i = 0; i < 10; i++) {
      const code = generateRandomCode()

      try {
        const querySnapshot = await db
          .collection("stores")
          .where("storeCode", "==", code)
          .get()

        if (querySnapshot.empty) {
          storeCode = code
          codeFound = true
          break
        }
      } catch (e) {
        console.warn("店舗コード重複チェックエラー:", e)
        continue
      }
    }

    if (!codeFound) {
      throw new Error(
        "店舗コードの生成に失敗しました。しばらくしてから再度お試しください。"
      )
    }

    // Firestoreに店舗情報を保存
    const storeRef = db.collection("stores").doc()
    const storeId = storeRef.id

    await storeRef.set({
      uid: uid,
      ownerId: uid,  // 招待コード生成APIの権限チェック用
      name: data.name,
      email: data.email,
      phone: data.phone || "",
      address: data.address || "",
      description: data.description || "",
      ownerEmail: data.ownerEmail,
      ownerPassword: hashedOwnerPassword,
      storeCode: storeCode,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    })

    // usersコレクションにもユーザーデータを作成（ログイン用）
    await db.collection("users").doc(uid).set({
      email: data.ownerEmail,
      role: "store_owner",
      storeId: storeId,
      storeName: data.name,
      displayName: data.name,
      phoneVerified: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    })

    console.log(`[API] 店舗登録成功: ${storeId}, コード: ${storeCode}`)

    return NextResponse.json({
      success: true,
      storeId,
      storeCode,
      uid,
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
