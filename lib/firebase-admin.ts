import * as admin from "firebase-admin"

const firebaseAdminConfig = {
  type: "service_account",
  project_id: process.env.FIREBASE_PROJECT_ID || "stackmankai",
  private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID,
  private_key: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
  client_email: process.env.FIREBASE_CLIENT_EMAIL,
  client_id: process.env.FIREBASE_CLIENT_ID,
  auth_uri: "https://accounts.google.com/o/oauth2/auth",
  token_uri: "https://oauth2.googleapis.com/token",
  auth_provider_x509_cert_url: "https://www.googleapis.com/oauth2/v1/certs",
  client_x509_cert_url: process.env.FIREBASE_CLIENT_X509_CERT_URL,
}

let adminApp: admin.app.App | null = null

function initializeAdminFirebase() {
  if (adminApp) {
    return adminApp
  }

  try {
    const existingApps = admin.apps
    if (existingApps.length > 0) {
      adminApp = existingApps[0]
    } else {
      adminApp = admin.initializeApp({
        credential: admin.credential.cert(firebaseAdminConfig as admin.ServiceAccount),
      })
    }

    console.log("[Firebase Admin] 初期化成功")
    return adminApp
  } catch (error) {
    console.error("[Firebase Admin] 初期化エラー:", error)
    throw error
  }
}

export function getAdminDb() {
  const app = initializeAdminFirebase()
  return admin.firestore(app)
}

export function getAdminAuth() {
  const app = initializeAdminFirebase()
  return admin.auth(app)
}

export default initializeAdminFirebase
