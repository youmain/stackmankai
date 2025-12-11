/**
 * 従業員と招待コード関連のFirestore関数
 */

import { db } from "./firebase"
import { 
  collection, 
  doc, 
  setDoc, 
  getDoc,
  getDocs,
  query, 
  where, 
  serverTimestamp,
  Timestamp,
  updateDoc,
  increment
} from "firebase/firestore"
import { createUser, signIn } from "./firebase-auth"
import type { InviteCode, Employee, EmployeeRegistrationData, EmployeeLoginData } from "@/types/employee"

/**
 * ランダムな招待コードを生成
 * 形式: ABC-DEF-123
 */
function generateInviteCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789" // 紛らわしい文字を除外
  const segments = [3, 3, 3] // 3文字-3文字-3文字
  
  return segments.map(length => {
    let segment = ""
    for (let i = 0; i < length; i++) {
      segment += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    return segment
  }).join("-")
}

/**
 * 招待コードの重複チェック
 */
async function isInviteCodeUnique(code: string): Promise<boolean> {
  const inviteCodesRef = collection(db, "inviteCodes")
  const q = query(inviteCodesRef, where("code", "==", code))
  const querySnapshot = await getDocs(q)
  return querySnapshot.empty
}

/**
 * ユニークな招待コードを生成
 */
async function generateUniqueInviteCode(): Promise<string> {
  for (let i = 0; i < 10; i++) {
    const code = generateInviteCode()
    if (await isInviteCodeUnique(code)) {
      return code
    }
  }
  throw new Error("招待コードの生成に失敗しました")
}

/**
 * 招待コードを作成
 */
export async function createInviteCode(
  storeId: string,
  storeName: string,
  storeCode: string,
  createdBy: string,
  expiresInDays: number = 30,
  maxUses: number = -1 // -1で無制限
): Promise<InviteCode> {
  try {
    const code = await generateUniqueInviteCode()
    const inviteCodesRef = collection(db, "inviteCodes")
    const docRef = doc(inviteCodesRef)
    
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + expiresInDays)
    
    const inviteCodeData = {
      code,
      storeId,
      storeName,
      storeCode,
      createdBy,
      createdAt: serverTimestamp(),
      expiresAt: Timestamp.fromDate(expiresAt),
      maxUses,
      usedCount: 0,
      usedBy: [],
      status: "active",
    }
    
    await setDoc(docRef, inviteCodeData)
    
    return {
      id: docRef.id,
      ...inviteCodeData,
    } as InviteCode
  } catch (error) {
    console.error("招待コード作成エラー:", error)
    throw error
  }
}

/**
 * 招待コードを取得
 */
export async function getInviteCode(code: string): Promise<InviteCode | null> {
  try {
    const inviteCodesRef = collection(db, "inviteCodes")
    const q = query(inviteCodesRef, where("code", "==", code))
    const querySnapshot = await getDocs(q)
    
    if (querySnapshot.empty) {
      return null
    }
    
    const inviteCodeDoc = querySnapshot.docs[0]
    return {
      id: inviteCodeDoc.id,
      ...inviteCodeDoc.data(),
    } as InviteCode
  } catch (error) {
    console.error("招待コード取得エラー:", error)
    throw error
  }
}

/**
 * 招待コードの有効性をチェック
 */
export async function validateInviteCode(code: string): Promise<{ valid: boolean; message?: string; inviteCode?: InviteCode }> {
  const inviteCode = await getInviteCode(code)
  
  if (!inviteCode) {
    return { valid: false, message: "招待コードが見つかりません" }
  }
  
  if (inviteCode.status !== "active") {
    return { valid: false, message: "この招待コードは無効です" }
  }
  
  const now = new Date()
  const expiresAt = inviteCode.expiresAt.toDate()
  if (now > expiresAt) {
    return { valid: false, message: "この招待コードは期限切れです" }
  }
  
  if (inviteCode.maxUses !== -1 && inviteCode.usedCount >= inviteCode.maxUses) {
    return { valid: false, message: "この招待コードは使用回数の上限に達しています" }
  }
  
  return { valid: true, inviteCode }
}

/**
 * 自動生成メールアドレスを作成
 */
function generateEmployeeEmail(username: string, inviteCode: string): string {
  // ユーザー名と招待コードを組み合わせてユニークなメールアドレスを生成
  return `${username}.${inviteCode}@stackmankai.internal`
}

/**
 * 従業員を登録
 */
export async function registerEmployee(data: EmployeeRegistrationData): Promise<Employee> {
  try {
    // 招待コードの検証
    const validation = await validateInviteCode(data.inviteCode)
    if (!validation.valid || !validation.inviteCode) {
      throw new Error(validation.message || "招待コードが無効です")
    }
    
    const inviteCode = validation.inviteCode
    
    // ユーザー名の重複チェック（同じ店舗内）
    const employeesRef = collection(db, "employees")
    const q = query(
      employeesRef, 
      where("storeId", "==", inviteCode.storeId),
      where("username", "==", data.username)
    )
    const querySnapshot = await getDocs(q)
    if (!querySnapshot.empty) {
      throw new Error("このユーザー名は既に使用されています")
    }
    
    // 自動生成メールアドレス
    const generatedEmail = generateEmployeeEmail(data.username, data.inviteCode)
    
    // Firebase Authenticationでアカウント作成
    const userCredential = await createUser(generatedEmail, data.password)
    const uid = userCredential.user.uid
    
    // Firestoreに従業員情報を保存
    const employeeDocRef = doc(employeesRef)
    const employeeData = {
      uid,
      username: data.username,
      generatedEmail,
      storeId: inviteCode.storeId,
      storeName: inviteCode.storeName,
      storeCode: inviteCode.storeCode,
      role: "employee",
      inviteCode: data.inviteCode,
      displayName: data.displayName || data.username,
      status: "active",
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    }
    
    await setDoc(employeeDocRef, employeeData)
    
    // 招待コードの使用回数を更新
    const inviteCodeDocRef = doc(db, "inviteCodes", inviteCode.id)
    await updateDoc(inviteCodeDocRef, {
      usedCount: increment(1),
      usedBy: [...inviteCode.usedBy, uid],
    })
    
    return {
      id: employeeDocRef.id,
      ...employeeData,
    } as Employee
  } catch (error) {
    console.error("従業員登録エラー:", error)
    throw error
  }
}

/**
 * 従業員ログイン
 */
export async function loginEmployee(data: EmployeeLoginData): Promise<Employee | null> {
  try {
    // 店舗コードとユーザー名から従業員情報を取得
    const employeesRef = collection(db, "employees")
    const q = query(
      employeesRef,
      where("storeCode", "==", data.storeCode),
      where("username", "==", data.username)
    )
    const querySnapshot = await getDocs(q)
    
    if (querySnapshot.empty) {
      return null
    }
    
    const employeeDoc = querySnapshot.docs[0]
    const employeeData = employeeDoc.data()
    
    // Firebase Authenticationでサインイン
    await signIn(employeeData.email, data.password)
    
    return {
      id: employeeDoc.id,
      ...employeeData,
    } as Employee
  } catch (error) {
    console.error("従業員ログインエラー:", error)
    throw error
  }
}

/**
 * 店舗の招待コード一覧を取得
 */
export async function getStoreInviteCodes(storeId: string): Promise<InviteCode[]> {
  try {
    const inviteCodesRef = collection(db, "inviteCodes")
    const q = query(inviteCodesRef, where("storeId", "==", storeId))
    const querySnapshot = await getDocs(q)
    
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    })) as InviteCode[]
  } catch (error) {
    console.error("招待コード一覧取得エラー:", error)
    throw error
  }
}

/**
 * 店舗の従業員一覧を取得
 */
export async function getStoreEmployees(storeId: string): Promise<Employee[]> {
  try {
    const employeesRef = collection(db, "employees")
    const q = query(employeesRef, where("storeId", "==", storeId))
    const querySnapshot = await getDocs(q)
    
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    })) as Employee[]
  } catch (error) {
    console.error("従業員一覧取得エラー:", error)
    throw error
  }
}
