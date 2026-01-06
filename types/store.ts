import type { Timestamp } from "firebase/firestore"
import type { PokerOperationHours } from "./stack-man-hand"

export interface Store {
  id: string
  name: string
  storeCode: string // 6桁の店舗コード（例: "123456")

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
  
  // チャットポーカー稼働時間設定
  pokerOperationHours?: PokerOperationHours
}

export interface StoreRegistrationData {
  name: string
  email: string
  ownerEmail: string
  ownerPassword: string
  phone?: string
  address?: string
  description?: string
}


