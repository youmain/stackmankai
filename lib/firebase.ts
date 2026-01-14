import { initializeApp, type FirebaseApp, getApps } from "firebase/app"
import { getFirestore, type Firestore } from "firebase/firestore"
import { getAuth, type Auth } from "firebase/auth"
import { createModuleLogger } from "@/lib/logger"

const log = createModuleLogger("Firebase")

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "AIzaSyB2IryF98PSSX5oToDF8aDtbLzXjJnXcXU",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "stackmankai.firebaseapp.com",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "stackmankai",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "stackmankai.firebasestorage.app",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "1156500357078",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "1:1156500357078:web:86697336338006934882ed",
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID || "",
}

let app: FirebaseApp | null = null
let db: Firestore | null = null
let auth: Auth | null = null
let initializationAttempted = false
let initializationError: Error | null = null

export const isDemoMode = process.env.NEXT_PUBLIC_USE_MOCK_DATA === 'true'

function initializeFirebase() {
  if (initializationAttempted) {
    return
  }

  initializationAttempted = true

  try {
    const existingApps = getApps()
    if (existingApps.length > 0) {
      app = existingApps[0]
    } else {
      app = initializeApp(firebaseConfig)
    }

    db = getFirestore(app)
    
    // Authはクライアント側でのみ初期化
    if (typeof window !== "undefined") {
      auth = getAuth(app)
    }

    // デバッグ: 環境変数の読み込み確認
    if (typeof window !== "undefined") {
      console.log("[Firebase] Initialized with config:", {
        apiKey: firebaseConfig.apiKey.substring(0, 8) + "...",
        authDomain: firebaseConfig.authDomain,
        projectId: firebaseConfig.projectId,
        isEnvSet: !!process.env.NEXT_PUBLIC_FIREBASE_API_KEY
      });
    }
    log.info(`Firebase初期化成功 - apiKey: ${firebaseConfig.apiKey.substring(0, 8)}..., authDomain: ${firebaseConfig.authDomain}`)
  } catch (error) {
    initializationError = error as Error
    const errorMessage = (error as Error).message

    if (errorMessage.includes("Service firestore is not available")) {
      console.warn(
        "[v0] ⚠️ v0プレビュー環境ではFirestoreが利用できません。\n" +
          "Vercelにデプロイすると正常に動作します。\n" +
          "デプロイ方法: 右上の「Publish」ボタンをクリック",
      )
      log.warn("v0プレビュー環境ではFirestoreが制限されています。デプロイ環境では正常に動作します。")
    } else {
      log.error("Firebase初期化エラー:", errorMessage)
    }

    db = null
    auth = null
  }
}

// サーバー側とクライアント側の両方で初期化
initializeFirebase()

export const isFirebaseConfigured = process.env.NEXT_PUBLIC_USE_MOCK_DATA !== 'true' && !!firebaseConfig.apiKey

export const getInitializationError = () => initializationError


export function getDb(): Firestore | null {
  if (!initializationAttempted) {
    initializeFirebase()
  }
  return db
}

export function getAuthInstance(): Auth | null {
  if (typeof window === "undefined") return null
  if (!initializationAttempted) {
    initializeFirebase()
  }
  return auth
}

// 常に初期化されたインスタンスをエクスポート
export const dbInstance = getDb()
export const authInstance = getAuthInstance()
export { dbInstance as db, authInstance as auth, app }
