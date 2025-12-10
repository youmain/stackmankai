import {
  collection,
  addDoc,
  getDocs,
  query,
  where,
  serverTimestamp,
  Timestamp,
} from "firebase/firestore"
import { db } from "./firebase"
import { createUser, signIn } from "./firebase-auth"
import type { Store, StoreRegistrationData } from "@/types/store"

/**
 * 3桁の店舗コードを生成（重複チェック付き）
 */
export async function generateStoreCode(): Promise<string> {
  const storesRef = collection(db, "stores")
  
  // 最大10回試行
  for (let i = 0; i < 10; i++) {
    // 100-999のランダムな3桁の数字を生成
    const code = Math.floor(100 + Math.random() * 900).toString()
    
    // 既存コードをチェック
    const q = query(storesRef, where("storeCode", "==", code))
    const querySnapshot = await getDocs(q)
    
    if (querySnapshot.empty) {
      return code
    }
  }
  
  throw new Error("店舗コードの生成に失敗しました。しばらくしてから再度お試しください。")
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
    
    // 3桁の店舗コードを生成
    const storeCode = await generateStoreCode()
    
    // パスワードのハッシュ化（本番環境ではbcryptなどを使用すべき）
    // 現在は簡易的に実装
    const hashedStorePassword = btoa(data.storePassword) // Base64エンコード
    const hashedOwnerPassword = btoa(data.ownerPassword)
    
    const storesRef = collection(db, "stores")
    const docRef = await addDoc(storesRef, {
      uid: uid, // Firebase AuthのUIDを追加
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
    })
    
    return {
      storeId: docRef.id,
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
    await signIn(ownerEmail, ownerPassword)
    
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
      ...storeData,
    } as Store
  } catch (error) {
    console.error("オーナーログインエラー:", error)
    throw error
  }
}
