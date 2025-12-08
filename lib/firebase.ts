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
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "436713065076",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "1:436713065076:web:111033e0543a666a139f21",
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID || "G-6X7E7Q4GQN",
}

let app: FirebaseApp | null = null
let db: Firestore | null = null
let auth: Auth | null = null
let initializationAttempted = false
let initializationError: Error | null = null

function initializeFirebase() {
  if (typeof window === "undefined") {
    return
  }

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
    auth = getAuth(app)

    log.info("Firebase初期化成功")
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

if (typeof window !== "undefined") {
  initializeFirebase()
}

export const isFirebaseConfigured = () => {
  if (typeof window === "undefined") return false
  if (!initializationAttempted) {
    initializeFirebase()
  }
  return !!(db && auth)
}

export const getInitializationError = () => initializationError

export const isDemoMode = false

export function getDb(): Firestore | null {
  if (typeof window === "undefined") return null
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

export { db, auth }
