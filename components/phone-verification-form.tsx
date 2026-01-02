"use client"

import { useState, useEffect } from "react"
import {
  initializeRecaptcha,
  sendPhoneVerificationCode,
  verifyPhoneCode,
  cleanPhoneNumber,
  validatePhoneNumber,
  clearConfirmationResult,
} from "@/lib/phone-auth"
import { updateUserProfile } from "@/lib/firestore"
import type { RecaptchaVerifier } from "firebase/auth"

type Step = "input" | "verify" | "success" | "error"

interface PhoneVerificationFormProps {
  userId: string
  onVerificationComplete?: (phoneNumber: string) => void
}

export function PhoneVerificationForm({
  userId,
  onVerificationComplete,
}: PhoneVerificationFormProps) {
  const [phoneNumber, setPhoneNumber] = useState("")
  const [verificationCode, setVerificationCode] = useState("")
  const [step, setStep] = useState<Step>("input")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [recaptchaVerifier, setRecaptchaVerifier] = useState<RecaptchaVerifier | null>(null)
  const [verifiedPhoneNumber, setVerifiedPhoneNumber] = useState("")

  // reCAPTCHAを初期化
  useEffect(() => {
    const verifier = initializeRecaptcha("recaptcha-container")
    setRecaptchaVerifier(verifier)

    return () => {
      clearConfirmationResult()
    }
  }, [])

  // ステップ1: 電話番号入力
  const handleSendCode = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setLoading(true)

    try {
      // 電話番号の形式を検証
      const cleanedNumber = cleanPhoneNumber(phoneNumber)

      if (!validatePhoneNumber(cleanedNumber)) {
        setError("有効な電話番号を入力してください（例：+81 90 1234 5678）")
        setLoading(false)
        return
      }

      if (!recaptchaVerifier) {
        setError("reCAPTCHAの初期化に失敗しました。ページをリロードしてください。")
        setLoading(false)
        return
      }

      // 確認コードを送信
      const result = await sendPhoneVerificationCode(cleanedNumber, recaptchaVerifier)

      if (result.success) {
        setVerifiedPhoneNumber(cleanedNumber)
        setStep("verify")
      } else {
        setError(result.error || "確認コードの送信に失敗しました")
        setStep("error")
      }
    } catch (err) {
      const errorMessage = (err as Error).message || "予期しないエラーが発生しました"
      setError(errorMessage)
      setStep("error")
    } finally {
      setLoading(false)
    }
  }

  // ステップ2: 確認コード検証
  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setLoading(true)

    try {
      // 確認コードを検証
      const result = await verifyPhoneCode(verificationCode)

      if (result.success) {
        // Firestoreに phoneVerified フラグを保存
        await updateUserProfile(userId, {
          phoneVerified: true,
          phoneNumber: verifiedPhoneNumber,
          phoneVerifiedAt: new Date(),
        })

        setStep("success")
        onVerificationComplete?.(verifiedPhoneNumber)
      } else {
        setError(result.error || "確認コードが無効です")
        setStep("error")
      }
    } catch (err) {
      const errorMessage = (err as Error).message || "予期しないエラーが発生しました"
      setError(errorMessage)
      setStep("error")
    } finally {
      setLoading(false)
    }
  }

  // エラーから入力画面に戻る
  const handleRetry = () => {
    setError("")
    setStep("input")
    setPhoneNumber("")
    setVerificationCode("")
  }

  return (
    <div className="phone-verification-form">
      {/* reCAPTCHA コンテナ */}
      <div id="recaptcha-container"></div>

      {step === "input" && (
        <form onSubmit={handleSendCode} className="space-y-4">
          <div>
            <h2 className="text-xl font-bold mb-2">電話番号確認</h2>
            <p className="text-gray-600 text-sm mb-4">
              店舗作成のため、電話番号の確認が必要です
            </p>
          </div>

          <div>
            <label htmlFor="phone" className="block text-sm font-medium mb-1">
              電話番号
            </label>
            <input
              id="phone"
              type="tel"
              placeholder="+81 90 1234 5678"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              disabled={loading}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
            <p className="text-gray-500 text-xs mt-1">
              国際形式で入力してください（例：+81 90 1234 5678）
            </p>
          </div>

          <button
            type="submit"
            disabled={loading || !phoneNumber}
            className="w-full bg-blue-500 text-white py-2 rounded-md hover:bg-blue-600 disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {loading ? "送信中..." : "確認コードを送信"}
          </button>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-md text-sm">
              {error}
            </div>
          )}
        </form>
      )}

      {step === "verify" && (
        <form onSubmit={handleVerifyCode} className="space-y-4">
          <div>
            <h2 className="text-xl font-bold mb-2">確認コード入力</h2>
            <p className="text-gray-600 text-sm mb-4">
              {verifiedPhoneNumber}に送信された確認コードを入力してください
            </p>
          </div>

          <div>
            <label htmlFor="code" className="block text-sm font-medium mb-1">
              確認コード（6桁）
            </label>
            <input
              id="code"
              type="text"
              placeholder="000000"
              value={verificationCode}
              onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
              maxLength={6}
              disabled={loading}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
            <p className="text-gray-500 text-xs mt-1">
              SMSで受け取った6桁のコードを入力してください
            </p>
          </div>

          <div className="flex gap-2">
            <button
              type="submit"
              disabled={loading || verificationCode.length !== 6}
              className="flex-1 bg-blue-500 text-white py-2 rounded-md hover:bg-blue-600 disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {loading ? "検証中..." : "確認"}
            </button>
            <button
              type="button"
              onClick={handleRetry}
              disabled={loading}
              className="flex-1 bg-gray-300 text-gray-700 py-2 rounded-md hover:bg-gray-400 disabled:bg-gray-200"
            >
              戻る
            </button>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-md text-sm">
              {error}
            </div>
          )}
        </form>
      )}

      {step === "success" && (
        <div className="space-y-4">
          <div className="bg-green-50 border border-green-200 rounded-md p-4">
            <h2 className="text-xl font-bold text-green-700 mb-2">✅ 電話番号確認完了</h2>
            <p className="text-green-600">
              {verifiedPhoneNumber} が確認されました
            </p>
          </div>
        </div>
      )}

      {step === "error" && (
        <div className="space-y-4">
          <div className="bg-red-50 border border-red-200 rounded-md p-4">
            <h2 className="text-xl font-bold text-red-700 mb-2">❌ エラーが発生しました</h2>
            <p className="text-red-600 mb-4">{error}</p>
            <button
              onClick={handleRetry}
              className="w-full bg-red-500 text-white py-2 rounded-md hover:bg-red-600"
            >
              もう一度試す
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
