/**
 * 金額を日本円形式でフォーマット
 * @param amount - フォーマットする金額
 * @param showSign - プラス記号を表示するか（デフォルト: false）
 * @returns フォーマットされた文字列
 */
export function formatCurrency(amount: number, showSign = false): string {
  const formatted = amount.toLocaleString()
  if (showSign && amount >= 0) {
    return `+${formatted}`
  }
  return formatted
}

/**
 * チップ額をフォーマット（©記号付き）
 * @param chips - チップ額
 * @param showSign - プラス記号を表示するか（デフォルト: false）
 * @returns フォーマットされた文字列
 */
export function formatChips(chips: number, showSign = false): string {
  return `${formatCurrency(chips, showSign)}©`
}

/**
 * 日付を日本語形式でフォーマット
 * @param date - フォーマットする日付
 * @param includeTime - 時刻を含めるか（デフォルト: false）
 * @returns フォーマットされた文字列
 */
export function formatDate(date: Date | string, includeTime = false): string {
  const dateObj = typeof date === "string" ? new Date(date) : date

  if (includeTime) {
    return dateObj.toLocaleString("ja-JP")
  }

  return dateObj.toLocaleDateString("ja-JP")
}

/**
 * 月を日本語形式でフォーマット（例: "2024年1月"）
 * @param monthStr - YYYY-MM形式の文字列
 * @returns フォーマットされた文字列
 */
export function formatMonth(monthStr: string | undefined | null): string {
  if (!monthStr || typeof monthStr !== "string") {
    return "不明な月"
  }

  try {
    const parts = monthStr.split("-")
    if (parts.length !== 2) {
      return "不明な月"
    }
    const [year, month] = parts
    return `${year}年${Number.parseInt(month)}月`
  } catch (error) {
    return "不明な月"
  }
}

/**
 * パーセンテージをフォーマット
 * @param value - パーセンテージ値
 * @param decimals - 小数点以下の桁数（デフォルト: 1）
 * @returns フォーマットされた文字列
 */
export function formatPercentage(value: number, decimals = 1): string {
  return `${value.toFixed(decimals)}%`
}

/**
 * ランク順位のアイコンを取得
 * @param index - 0から始まるインデックス
 * @returns ランクアイコン文字列
 */
export function getRankIcon(index: number): string {
  switch (index) {
    case 0:
      return "🥇"
    case 1:
      return "🥈"
    case 2:
      return "🥉"
    default:
      return `${index + 1}位`
  }
}

/**
 * 安全にtoLocaleStringを実行する（エラーハンドリング付き）
 * @param value - フォーマットする値
 * @returns フォーマットされた文字列
 */
export function safeToLocaleString(value: any): string {
  const num = Number(value)
  return isNaN(num) ? "0" : num.toLocaleString()
}
