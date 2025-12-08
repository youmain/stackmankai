import type { Player, Receipt, ReceiptItem, Transaction, GameParticipant } from "@/types"

/**
 * Firestoreから取得したデータがPlayer型として有効かチェック
 */
export function isValidPlayer(data: any): data is Player {
  return (
    typeof data === "object" &&
    data !== null &&
    typeof data.name === "string" &&
    typeof data.systemBalance === "number" &&
    typeof data.isPlaying === "boolean"
  )
}

/**
 * Firestoreから取得したデータがReceipt型として有効かチェック
 */
export function isValidReceipt(data: any): data is Receipt {
  return (
    typeof data === "object" &&
    data !== null &&
    typeof data.playerId === "string" &&
    typeof data.playerName === "string" &&
    typeof data.status === "string" &&
    typeof data.totalAmount === "number"
  )
}

/**
 * Firestoreから取得したデータがReceiptItem型として有効かチェック
 */
export function isValidReceiptItem(data: any): data is ReceiptItem {
  return (
    typeof data === "object" &&
    data !== null &&
    typeof data.receiptId === "string" &&
    typeof data.itemName === "string" &&
    typeof data.unitPrice === "number" &&
    typeof data.quantity === "number"
  )
}

/**
 * Firestoreから取得したデータがTransaction型として有効かチェック
 */
export function isValidTransaction(data: any): data is Transaction {
  return (
    typeof data === "object" &&
    data !== null &&
    typeof data.playerId === "string" &&
    typeof data.type === "string" &&
    typeof data.amount === "number"
  )
}

/**
 * Firestoreから取得したデータがGameParticipant型として有効かチェック
 */
export function isValidGameParticipant(data: any): data is GameParticipant {
  return (
    typeof data === "object" &&
    data !== null &&
    typeof data.playerId === "string" &&
    typeof data.playerName === "string" &&
    typeof data.buyInAmount === "number" &&
    typeof data.currentStack === "number"
  )
}

/**
 * Firestoreのタイムスタンプを安全にDateに変換
 */
export function toSafeDate(timestamp: any): Date {
  if (timestamp instanceof Date) {
    return timestamp
  }
  if (timestamp && typeof timestamp.toDate === "function") {
    return timestamp.toDate()
  }
  if (typeof timestamp === "string") {
    return new Date(timestamp)
  }
  return new Date()
}

/**
 * プレイヤー名を安全に文字列として取得
 */
export function getPlayerName(player: Player | any): string {
  if (typeof player.name === "string") {
    return player.name
  }
  if (typeof player.name === "object" && player.name !== null && "name" in player.name) {
    return String(player.name.name)
  }
  return "Unknown"
}
