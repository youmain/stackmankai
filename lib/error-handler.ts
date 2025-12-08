import { toast } from "@/hooks/use-toast"

/**
 * エラーメッセージを抽出する
 */
export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message
  }
  if (typeof error === "string") {
    return error
  }
  return "不明なエラーが発生しました"
}

/**
 * 統一的なエラーハンドリング
 * Toast通知でエラーを表示し、コンソールにログを記録
 */
export function handleError(error: unknown, context?: string): void {
  const message = getErrorMessage(error)

  // コンソールにコンテキスト付きでログ記録
  if (context) {
    console.error(`[${context}]`, error)
  } else {
    console.error("エラー:", error)
  }

  // Toast通知でユーザーにエラーを表示
  toast({
    title: "エラー",
    description: message,
    variant: "destructive",
  })
}

/**
 * 成功メッセージを表示
 */
export function handleSuccess(message: string, description?: string): void {
  toast({
    title: message,
    description,
    variant: "default",
  })
}

/**
 * Firebase関連のエラーを処理
 */
export function handleFirebaseError(error: unknown, context?: string): void {
  const message = getErrorMessage(error)

  // Firebase特有のエラーメッセージを日本語化
  let localizedMessage = message

  if (message.includes("permission-denied")) {
    localizedMessage = "アクセス権限がありません"
  } else if (message.includes("not-found")) {
    localizedMessage = "データが見つかりません"
  } else if (message.includes("already-exists")) {
    localizedMessage = "既に存在しています"
  } else if (message.includes("unavailable")) {
    localizedMessage = "サービスが一時的に利用できません"
  }

  if (context) {
    console.error(`[Firebase - ${context}]`, error)
  } else {
    console.error("[Firebase]", error)
  }

  toast({
    title: "データベースエラー",
    description: localizedMessage,
    variant: "destructive",
  })
}

/**
 * API関連のエラーを処理
 */
export function handleApiError(error: unknown, context?: string): void {
  const message = getErrorMessage(error)

  if (context) {
    console.error(`[API - ${context}]`, error)
  } else {
    console.error("[API]", error)
  }

  toast({
    title: "通信エラー",
    description: message,
    variant: "destructive",
  })
}

/**
 * バリデーションエラーを処理
 */
export function handleValidationError(message: string): void {
  console.warn("[Validation]", message)

  toast({
    title: "入力エラー",
    description: message,
    variant: "destructive",
  })
}
