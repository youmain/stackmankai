import type { Timestamp } from "firebase/firestore"

export interface Store {
  id: string
  name: string
  storeCode: string // 3桁の店舗コード（例: "123"）
  storePassword: string // 店舗パスワード（ハッシュ化）

  // 連絡先情報
  email: string
  phone?: string
  address?: string
  description?: string
  logoUrl?: string
  websiteUrl?: string

  // オーナー情報
  ownerEmail: string
  ownerPassword: string // オーナーパスワード（ハッシュ化）

  // ステータス
  status: "active" | "pending" | "suspended"

  // タイムスタンプ
  createdAt: Timestamp
  updatedAt: Timestamp
}

export interface StoreRegistrationData {
  name: string
  email: string
  ownerEmail: string
  ownerPassword: string
  storePassword: string
  phone?: string
  address?: string
  description?: string
}

export interface StoreLoginData {
  storeCode: string
  storePassword: string
}
