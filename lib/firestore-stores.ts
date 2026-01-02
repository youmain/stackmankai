import {
  collection,
  addDoc,
  getDocs,
  query,
  where,
  serverTimestamp,
  Timestamp,
  runTransaction,
  doc,
} from "firebase/firestore"
import { db } from "./firebase"
import { createUser, signIn, waitForAuthState } from "./firebase-auth"
import type { Store, StoreRegistrationData } from "@/types/store"

/**
 * 6桁のランダムな店舗コードを生成
 */
function generateRandomCode(): string {
  // 100000-999999のランダムな6桁の数字を生成
  return Math.floor(100000 + Math.random() * 900000).toString()
}

/**
 * 店舗を登録
 */
export async function registerStore(
  data: StoreRegistrationData
): Promise<{ storeId: string; storeCode: string; uid: string }> {
  try {
    // Firebase Authenticationでユーザーを作成
    const userCredential = await createUser(data.ownerEmail, data.ownerPassword)
    const uid = userCredential.user.uid

    // Auth状態がFirestoreに伝播するのを待機 (最大5秒)
    await waitForAuthState(uid, 5000)
    
    // パスワードのハッシュ化
    const hashedStorePassword = btoa(data.storePassword)
    const hashedOwnerPassword = btoa(data.ownerPassword)
    
    let storeId: string = ""
    let storeCode: string = ""
    
    // 店舗コードの重複チェック（最大10回試行）
    let codeFound = false
    let code = ""
    
    for (let i = 0; i < 10; i++) {
      code = generateRandomCode()
      
      try {
        const q = query(collection(db, "stores"), where("storeCode", "==", code))
        const querySnapshot = await getDocs(q)
        
        if (querySnapshot.empty) {
          codeFound = true
          break
        }
      } catch (e) {
        console.warn("店舗コード重複チェックエラー:", e)
        continue
      }
    }
    
    if (!codeFound) {
      throw new Error("店舗コードの生成に失敗しました。しばらくしてから再度お試しください。")
    }
    
    storeCode = code
    
    // トランザクション内で登録をアトミックに実行
    await runTransaction(db, async (transaction) => {
      // 新しいドキュメント参照を作成
      const newStoreRef = doc(collection(db, "stores"))
      storeId = newStoreRef.id
      
      // トランザクション内でドキュメントを書き込み
      transaction.set(newStoreRef, {
        uid: uid,
        name: data.name,
        storeCode: storeCode,
        storePassword: hashedStorePassword,
        email: data.email,
        phone: data.phone || "",
        address: data.address || "",
        description: data.description || "",
        logoUrl: "",
        websiteUrl: "",
        ownerEmail: data.ownerEmail,
        ownerPassword: hashedOwnerPassword,
        status: "active",
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        stackManHandSettings: {
          enabled: true,
          purchasePrice: 1000,
          rewardAmount: 5000,
          businessHours: {
            open: "12:00",
            close: "23:59"
          }
        },
      })
    })
    
    // usersコレクションにユーザーデータを保存 (トランザクション外)
    const { createOrUpdateUserData } = await import("./firestore")
    await createOrUpdateUserData({
      uid: uid,
      email: data.ownerEmail,
      role: "store_owner",
      storeId: storeId,
      storeName: data.name,
      displayName: data.name,
    })
    
    return {
      storeId: storeId,
      storeCode: storeCode,
      uid: uid,
    }
  } catch (error) {
    console.error("店舗登録エラー:", error)
    throw error
  }
}

/**
 * 店舗コードとパスワードでログイン
 */
export async function loginStore(
  storeCode: string,
  storePassword: string
): Promise<Store | null> {
  try {
    const storesRef = collection(db, "stores")
    const q = query(storesRef, where("storeCode", "==", storeCode))
    const querySnapshot = await getDocs(q)
    
    if (querySnapshot.empty) {
      return null
    }
    
    const storeDoc = querySnapshot.docs[0]
    const storeData = storeDoc.data()
    
    // パスワードの検証
    const hashedPassword = btoa(storePassword)
    if (storeData.storePassword !== hashedPassword) {
      return null
    }
    
    return {
      id: storeDoc.id,
      ...storeData,
    } as Store
  } catch (error) {
    console.error("店舗ログインエラー:", error)
    throw error
  }
}

/**
 * オーナーメールとパスワードでログイン
 */
export async function loginStoreOwner(
  ownerEmail: string,
  ownerPassword: string
): Promise<Store | null> {
  try {
    // Firebase Authenticationでサインイン
    const userCredential = await signIn(ownerEmail, ownerPassword)
    const uid = userCredential.user.uid
    
    const storesRef = collection(db, "stores")
    const q = query(storesRef, where("ownerEmail", "==", ownerEmail))
    const querySnapshot = await getDocs(q)
    
    if (querySnapshot.empty) {
      return null
    }
    
    const storeDoc = querySnapshot.docs[0]
    const storeData = storeDoc.data()
    
    return {
      id: storeDoc.id,
      uid: uid,
      ...storeData,
    } as Store
  } catch (error) {
    console.error("オーナーログインエラー:", error)
    throw error
  }
}
