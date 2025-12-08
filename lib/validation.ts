/**
 * 入力値検証ユーティリティ
 * XSS対策、入力値の検証、サニタイゼーションを提供
 */

// 文字列のサニタイゼーション（XSS対策）
export function sanitizeString(input: string): string {
  if (typeof input !== "string") {
    throw new Error("入力値は文字列である必要があります")
  }

  return input
    .trim()
    .replace(/[<>]/g, "") // HTMLタグの除去
    .replace(/javascript:/gi, "") // JavaScriptプロトコルの除去
    .replace(/on\w+=/gi, "") // イベントハンドラの除去
    .slice(0, 1000) // 最大長制限
}

// 数値の検証
export function validateNumber(
  value: number,
  options: {
    min?: number
    max?: number
    allowNegative?: boolean
    fieldName?: string
  } = {},
): number {
  const { min = 0, max = Number.MAX_SAFE_INTEGER, allowNegative = false, fieldName = "値" } = options

  if (typeof value !== "number" || isNaN(value) || !isFinite(value)) {
    throw new Error(`${fieldName}は有効な数値である必要があります`)
  }

  if (!allowNegative && value < 0) {
    throw new Error(`${fieldName}は0以上である必要があります`)
  }

  if (value < min) {
    throw new Error(`${fieldName}は${min}以上である必要があります`)
  }

  if (value > max) {
    throw new Error(`${fieldName}は${max}以下である必要があります`)
  }

  return value
}

// プレイヤー名の検証
export function validatePlayerName(name: string): string {
  const sanitized = sanitizeString(name)

  if (sanitized.length === 0) {
    throw new Error("プレイヤー名を入力してください")
  }

  if (sanitized.length < 1) {
    throw new Error("プレイヤー名は1文字以上である必要があります")
  }

  if (sanitized.length > 100) {
    throw new Error("プレイヤー名は100文字以内である必要があります")
  }

  return sanitized
}

// ゲーム名の検証
export function validateGameName(name: string): string {
  const sanitized = sanitizeString(name)

  if (sanitized.length === 0) {
    throw new Error("ゲーム名を入力してください")
  }

  if (sanitized.length < 1) {
    throw new Error("ゲーム名は1文字以上である必要があります")
  }

  if (sanitized.length > 200) {
    throw new Error("ゲーム名は200文字以内である必要があります")
  }

  return sanitized
}

// 金額の検証
export function validateAmount(amount: number, fieldName = "金額"): number {
  return validateNumber(amount, {
    min: 0,
    max: 10000000, // 最大1000万
    allowNegative: false,
    fieldName,
  })
}

// スタック額の検証
export function validateStack(stack: number): number {
  return validateNumber(stack, {
    min: 1,
    max: 10000000,
    allowNegative: false,
    fieldName: "スタック額",
  })
}

// IDの検証
export function validateId(id: string, fieldName = "ID"): string {
  if (typeof id !== "string") {
    throw new Error(`${fieldName}は文字列である必要があります`)
  }

  const sanitized = id.trim()

  if (sanitized.length === 0) {
    throw new Error(`${fieldName}を入力してください`)
  }

  if (sanitized.length > 200) {
    throw new Error(`${fieldName}は200文字以内である必要があります`)
  }

  // 英数字、ハイフン、アンダースコアのみ許可
  if (!/^[a-zA-Z0-9_-]+$/.test(sanitized)) {
    throw new Error(`${fieldName}は英数字、ハイフン、アンダースコアのみ使用できます`)
  }

  return sanitized
}

// 説明文の検証
export function validateDescription(description: string): string {
  const sanitized = sanitizeString(description)

  if (sanitized.length > 1000) {
    throw new Error("説明文は1000文字以内である必要があります")
  }

  return sanitized
}

// パスワードの検証
export function validatePassword(password: string): string {
  if (typeof password !== "string") {
    throw new Error("パスワードは文字列である必要があります")
  }

  const trimmed = password.trim()

  if (trimmed.length === 0) {
    throw new Error("パスワードを入力してください")
  }

  if (trimmed.length < 4) {
    throw new Error("パスワードは4文字以上である必要があります")
  }

  if (trimmed.length > 100) {
    throw new Error("パスワードは100文字以内である必要があります")
  }

  return trimmed
}

// メールアドレスの検証
export function validateEmail(email: string): string {
  const sanitized = sanitizeString(email)

  if (sanitized.length === 0) {
    throw new Error("メールアドレスを入力してください")
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(sanitized)) {
    throw new Error("有効なメールアドレスを入力してください")
  }

  return sanitized
}

// 配列の検証
export function validateArray<T>(
  array: T[],
  options: {
    minLength?: number
    maxLength?: number
    fieldName?: string
  } = {},
): T[] {
  const { minLength = 0, maxLength = 1000, fieldName = "配列" } = options

  if (!Array.isArray(array)) {
    throw new Error(`${fieldName}は配列である必要があります`)
  }

  if (array.length < minLength) {
    throw new Error(`${fieldName}は${minLength}個以上の要素が必要です`)
  }

  if (array.length > maxLength) {
    throw new Error(`${fieldName}は${maxLength}個以下の要素である必要があります`)
  }

  return array
}

// オブジェクトの検証
export function validateObject<T extends Record<string, any>>(
  obj: T,
  requiredFields: (keyof T)[],
  fieldName = "オブジェクト",
): T {
  if (typeof obj !== "object" || obj === null || Array.isArray(obj)) {
    throw new Error(`${fieldName}は有効なオブジェクトである必要があります`)
  }

  for (const field of requiredFields) {
    if (!(field in obj) || obj[field] === undefined || obj[field] === null) {
      throw new Error(`${fieldName}には${String(field)}フィールドが必要です`)
    }
  }

  return obj
}

// 日付の検証
export function validateDate(date: Date, fieldName = "日付"): Date {
  if (!(date instanceof Date) || isNaN(date.getTime())) {
    throw new Error(`${fieldName}は有効な日付である必要があります`)
  }

  return date
}

// ブール値の検証
export function validateBoolean(value: boolean, fieldName = "値"): boolean {
  if (typeof value !== "boolean") {
    throw new Error(`${fieldName}はブール値である必要があります`)
  }

  return value
}
