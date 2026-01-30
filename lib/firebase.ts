import * as firebase from "firebase/app"
import * as firestore from "firebase/firestore"
import * as auth from "firebase/auth"

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "AIzaSyB2IryF98PSSX5oToDF8aDtbLzXjJnXcXU",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "stackmankai.firebaseapp.com",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "stackmankai",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "stackmankai.firebasestorage.app",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "1156500357078",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "1:1156500357078:web:86697336338006934882ed",
}

let app: firebase.FirebaseApp | undefined
let db: firestore.Firestore | undefined
let authInstance: auth.Auth | undefined

// 初期化関数
function initializeFirebase() {
  if (typeof window === 'undefined') return; // SSRガード

  const apps = firebase.getApps()
  if (apps.length > 0) {
    app = apps[0]
  } else {
    try {
      app = firebase.initializeApp(firebaseConfig)
      console.log("[Firebase] Initialized successfully")
    } catch (error) {
      console.error("[Firebase] Initialization error:", error)
    }
  }

  if (app) {
    try {
      db = firestore.getFirestore(app)
      authInstance = auth.getAuth(app)
    } catch (error) {
      console.error("[Firebase] Error getting services:", error)
    }
  }
}

// クライアントサイドでの即時初期化試行
if (typeof window !== 'undefined') {
  initializeFirebase()
}

export { app, db, authInstance as auth }

export function getDb(): firestore.Firestore | null {
  if (typeof window === 'undefined') return null;
  
  if (!db) {
    initializeFirebase()
  }
  return db || null
}

export function getAuthInstance(): auth.Auth | null {
  if (typeof window === 'undefined') return null;

  if (!authInstance) {
    initializeFirebase()
  }
  return authInstance || null
}

export function isFirebaseConfigured(): boolean {
  return !!firebaseConfig.apiKey
}
