import { getAdminDb, getAdminAuth } from "./firebase-admin"
import type { StoreRegistrationData } from "@/types/store"

/**
 * 6桁のランダムな店舗コードを生成
 */
function generateRandomCode(): string {
  // 100000-999999のランダムな6桁の数字を生成
  return Math.floor(100000 + Math.random() * 900000).toString()
}

/**
 * 店舗を登録 (Firebase Admin SDK版)
 */
export async function registerStoreAdmin(
  data: StoreRegistrationData
): Promise<{ storeId: string; storeCode: string; uid: string }> {
  try {
    const auth = getAdminAuth()
    const db = getAdminDb()

    // Firebase Authenticationでユーザーを作成
    const userRecord = await auth.createUser({
      email: data.ownerEmail,
      password: data.ownerPassword,
      emailVerified: false,
    })

    const uid = userRecord.uid

    // パスワードのハッシュ化
    const hashedStorePassword = Buffer.from(data.storePassword).toString("base64")
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
      name: data.name,
      email: data.email,
      phone: data.phone || "",
      address: data.address || "",
      description: data.description || "",
      ownerEmail: data.ownerEmail,
      ownerPassword: hashedOwnerPassword,
      storePassword: hashedStorePassword,
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

    console.log(`[registerStoreAdmin] 店舗登録成功: ${storeId}, コード: ${storeCode}`)

    return {
      storeId,
      storeCode,
      uid,
    }
  } catch (error: any) {
    console.error("[registerStoreAdmin] エラー:", error)
    throw error
  }
}
