/**
 * 従業員の型定義
 */

export interface Employee {
  id: string
  uid: string // Firebase Authentication UID
  username: string // ユーザー名（ログイン用）
  generatedEmail: string // 自動生成されたメールアドレス
  storeId: string // 所属店舗ID
  storeName: string // 所属店舗名
  storeCode: string // 所属店舗コード
  role: "employee" // 役割
  inviteCode: string // 使用した招待コード
  displayName?: string // 表示名（任意）
  status: "active" | "suspended" // ステータス
  createdAt: any // Firestore Timestamp
  updatedAt: any // Firestore Timestamp
}

/**
 * 招待コードの型定義
 */
export interface InviteCode {
  id: string
  code: string // 招待コード（例: ABC-DEF-123）
  storeId: string // 店舗ID
  storeName: string // 店舗名
  storeCode: string // 店舗コード
  createdBy: string // 作成者のUID（オーナー）
  createdAt: any // Firestore Timestamp
  expiresAt: any // 有効期限
  maxUses: number // 最大使用回数（-1で無制限）
  usedCount: number // 使用回数
  usedBy: string[] // 使用した従業員のUIDリスト
  status: "active" | "expired" | "disabled" // ステータス
}

/**
 * 従業員登録用のデータ
 */
export interface EmployeeRegistrationData {
  inviteCode: string
  username: string
  password: string
  displayName?: string
}

/**
 * 従業員ログイン用のデータ
 */
export interface EmployeeLoginData {
  storeCode: string
  username: string
  password: string
}
