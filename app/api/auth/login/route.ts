import { NextRequest, NextResponse } from "next/server"
import { initializeApp, cert, getApps, App } from "firebase-admin/app"
import { getAuth } from "firebase-admin/auth"

// Firebase Admin SDKの初期化
let adminApp: App | null = null

function getAdminApp() {
  if (adminApp) {
    return adminApp
  }

  const existingApps = getApps()
  if (existingApps.length > 0) {
    adminApp = existingApps[0]
    return adminApp
  }

  // 環境変数からサービスアカウントキーを取得
  const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT_KEY
  if (!serviceAccount) {
    throw new Error("FIREBASE_SERVICE_ACCOUNT_KEY environment variable is not set")
  }

  try {
    const serviceAccountJson = JSON.parse(serviceAccount)
    adminApp = initializeApp({
      credential: cert(serviceAccountJson),
    })
    return adminApp
  } catch (error) {
    console.error("Failed to initialize Firebase Admin SDK:", error)
    throw new Error("Failed to initialize Firebase Admin SDK")
  }
}

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
    const adminApp = getAdminApp()
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
