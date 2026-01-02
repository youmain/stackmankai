import {
  RecaptchaVerifier,
  signInWithPhoneNumber,
  type ConfirmationResult,
} from "firebase/auth"
import { getAuthInstance } from "@/lib/firebase"
import { createModuleLogger } from "@/lib/logger"

const log = createModuleLogger("PhoneAuth")

// グローバルに確認結果を保存
let globalConfirmationResult: ConfirmationResult | null = null

/**
 * reCAPTCHA検証器を初期化
 */
export function initializeRecaptcha(containerId: string): RecaptchaVerifier | null {
  const auth = getAuthInstance()
  if (!auth) {
    log.error("Firebase Auth not initialized")
    return null
  }

  try {
    const recaptchaVerifier = new RecaptchaVerifier(containerId, {
      size: "invisible",
      callback: (response) => {
        log.info("reCAPTCHA verified")
      },
      "expired-callback": () => {
        log.warn("reCAPTCHA expired")
      },
      "error-callback": () => {
        log.error("reCAPTCHA error")
      },
    }, auth)

    return recaptchaVerifier
  } catch (error) {
    log.error("Error initializing reCAPTCHA:", error)
    return null
  }
}

/**
 * 電話番号に確認コードを送信
 */
export async function sendPhoneVerificationCode(
  phoneNumber: string,
  recaptchaVerifier: RecaptchaVerifier
): Promise<{ success: boolean; error?: string }> {
  const auth = getAuthInstance()
  if (!auth) {
    return { success: false, error: "Firebase Auth not initialized" }
  }

  try {
    log.info(`Sending verification code to ${phoneNumber}`)

    // 電話番号の形式を検証
    if (!phoneNumber.startsWith("+")) {
      return { success: false, error: "Phone number must start with +" }
    }

    // 確認コードを送信
    const confirmationResult = await signInWithPhoneNumber(
      auth,
      phoneNumber,
      recaptchaVerifier
    )

    // グローバルに保存
    globalConfirmationResult = confirmationResult

    log.info(`Verification code sent to ${phoneNumber}`)
    return { success: true }
  } catch (error) {
    const errorMessage = (error as any).message || "Failed to send verification code"
    log.error("Error sending verification code:", errorMessage)
    return { success: false, error: errorMessage }
  }
}

/**
 * 確認コードを検証
 */
export async function verifyPhoneCode(
  code: string
): Promise<{ success: boolean; error?: string; uid?: string }> {
  if (!globalConfirmationResult) {
    return { success: false, error: "No verification code sent. Please send code first." }
  }

  try {
    log.info("Verifying phone code")

    const result = await globalConfirmationResult.confirm(code)
    const user = result.user

    log.info(`Phone verified successfully: ${user.phoneNumber}`)

    // 確認結果をクリア
    globalConfirmationResult = null

    return { success: true, uid: user.uid }
  } catch (error) {
    const errorMessage = (error as any).message || "Failed to verify code"
    log.error("Error verifying code:", errorMessage)
    return { success: false, error: errorMessage }
  }
}

/**
 * 確認結果をクリア
 */
export function clearConfirmationResult() {
  globalConfirmationResult = null
}

/**
 * 電話番号の形式を検証
 */
export function validatePhoneNumber(phoneNumber: string): boolean {
  // 国際形式の電話番号（+で始まり、数字とハイフン、スペース、括弧を含む）
  const phoneRegex = /^\+[1-9]\d{1,14}$/
  const cleanedNumber = phoneNumber.replace(/[\s\-()]/g, "")
  return phoneRegex.test(cleanedNumber)
}

/**
 * 電話番号をクリーンアップ（スペース、ハイフン等を削除）
 */
export function cleanPhoneNumber(phoneNumber: string): string {
  // スペース、ハイフン、括弧を削除
  let cleaned = phoneNumber.replace(/[\s\-()]/g, "")

  // +で始まらない場合は追加
  if (!cleaned.startsWith("+")) {
    // 日本の番号の場合、0を削除して+81を追加
    if (cleaned.startsWith("0")) {
      cleaned = "+81" + cleaned.substring(1)
    } else {
      cleaned = "+" + cleaned
    }
  }

  return cleaned
}
