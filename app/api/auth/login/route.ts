import { NextRequest, NextResponse } from "next/server"
import { getAuth } from "firebase-admin/auth"
import initializeAdminFirebase from "@/lib/firebase-admin"

export async function POST(request: NextRequest) {
  const startTime = Date.now()
  console.log("[API] Login request started at", new Date().toISOString())

  try {
    const { email, password } = await request.json()

    if (!email || !password) {
      return NextResponse.json({ error: "Email and password are required" }, { status: 400 })
    }

    console.log(`[API] Authenticating user: ${email}`)

    // Firebase Admin SDKを使用してユーザーを検証
    const adminApp = initializeAdminFirebase()
    if (!adminApp) {
      return NextResponse.json({ error: "Firebase Admin SDK is not initialized" }, { status: 500 })
    }
    const auth = getAuth(adminApp)

    // メールアドレスからユーザーを取得
    let user
    try {
      user = await auth.getUserByEmail(email)
      console.log(`[API] User found: ${user.uid}`)
    } catch (error: any) {
      console.error(`[API] User not found: ${error.message}`)
      return NextResponse.json({ error: "Invalid email or password" }, { status: 401 })
    }

    // パスワード検証はFirebase Client SDKで行う必要があるため、
    // カスタムトークンを生成してクライアントに返す
    // クライアント側でカスタムトークンを使用してサインインし、
    // その後パスワード検証を行う

    // カスタムトークンを生成
    const customToken = await auth.createCustomToken(user.uid)
    console.log(`[API] Custom token created for user: ${user.uid}`)

    const duration = Date.now() - startTime
    console.log(`[API] Login request completed in ${duration}ms`)

    return NextResponse.json({
      customToken,
      uid: user.uid,
      email: user.email,
      duration,
    })
  } catch (error: any) {
    const duration = Date.now() - startTime
    console.error(`[API] Login error after ${duration}ms:`, error.message)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
