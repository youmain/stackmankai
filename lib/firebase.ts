import { initializeApp, getApps, type FirebaseApp } from "firebase/app"
import { getFirestore, type Firestore } from "firebase/firestore"
import { getAuth, type Auth } from "firebase/auth"

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "AIzaSyB2IryF98PSSX5oToDF8aDtbLzXjJnXcXU",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "stackmankai.firebaseapp.com",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "stackmankai",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "stackmankai.firebasestorage.app",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "1156500357078",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "1:1156500357078:web:86697336338006934882ed",
}

let app: FirebaseApp | undefined
let db: Firestore | undefined
let auth: Auth | undefined

// サーバーサイドとクライアントサイドの両方で安全に初期化
const apps = getApps()
if (apps.length > 0) {
  app = apps[0]
} else {
  try {
    app = initializeApp(firebaseConfig)
  } catch (error) {
    console.error("[Firebase] Initialization error:", error)
  }
}

if (app) {
  db = getFirestore(app)
  auth = getAuth(app)
}

export { app, db, auth }

export function getDb(): Firestore | null {
  if (!db && app) {
    db = getFirestore(app)
  }
  return db || null
}

export function getAuthInstance(): Auth | null {
  if (!auth && app) {
    auth = getAuth(app)
  }
  return auth || null
}

export function isFirebaseConfigured(): boolean {
  return !!app && !!firebaseConfig.apiKey
}
