"use client"

import { useEffect, useState } from "react"
import { useSearchParams } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, CheckCircle, XCircle, ArrowLeft } from "lucide-react"

export default function PaymentConfirmationPage() {
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading")
  const [message, setMessage] = useState("")
  const searchParams = useSearchParams()
  const clientSecret = searchParams.get("client_secret")

  useEffect(() => {
    if (!clientSecret) {
      setStatus("error")
      setMessage("決済情報が見つかりません")
      return
    }

    // In a real implementation, you would use Stripe Elements to handle the payment
    // For now, we'll simulate the payment confirmation process
    const confirmPayment = async () => {
      try {
        // Simulate payment confirmation delay
        await new Promise((resolve) => setTimeout(resolve, 2000))

        // Get pending subscription data
        const pendingData = sessionStorage.getItem("pendingSubscription")
        if (pendingData) {
          const subscriptionData = JSON.parse(pendingData)

          // Clear the pending data
          sessionStorage.removeItem("pendingSubscription")

          setStatus("success")
          setMessage("決済が完了しました！プレイヤーIDの紐づけを行ってください。")

          // Redirect to customer auth page after a short delay
          setTimeout(() => {
            window.location.href = "/customer-auth"
          }, 3000)
        } else {
          throw new Error("サブスクリプション情報が見つかりません")
        }
      } catch (error) {
        setStatus("error")
        setMessage("決済の確認に失敗しました")
      }
    }

    confirmPayment()
  }, [clientSecret])

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <Button
        variant="ghost"
        onClick={() => (window.location.href = "/")}
        className="absolute top-4 left-4 flex items-center gap-2 text-gray-600 hover:text-gray-800"
      >
        <ArrowLeft className="h-4 w-4" />
        トップページに戻る
      </Button>

      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">
            {status === "loading" && "決済確認中"}
            {status === "success" && "決済完了"}
            {status === "error" && "決済エラー"}
          </CardTitle>
          <CardDescription>
            {status === "loading" && "決済の確認を行っています..."}
            {status === "success" && "サブスクリプションが開始されました"}
            {status === "error" && "決済処理でエラーが発生しました"}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {status === "loading" && (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            </div>
          )}

          {status === "success" && (
            <div className="text-center space-y-4">
              <CheckCircle className="h-16 w-16 text-green-600 mx-auto" />
              <Alert className="border-green-200 bg-green-50">
                <AlertDescription className="text-green-600">{message}</AlertDescription>
              </Alert>
              <p className="text-sm text-gray-600">3秒後に自動的にプレイヤーID紐づけページに移動します...</p>
            </div>
          )}

          {status === "error" && (
            <div className="text-center space-y-4">
              <XCircle className="h-16 w-16 text-red-600 mx-auto" />
              <Alert className="border-red-200 bg-red-50">
                <AlertDescription className="text-red-600">{message}</AlertDescription>
              </Alert>
              <div className="space-y-2">
                <Button onClick={() => (window.location.href = "/customer-auth")} className="w-full">
                  登録ページに戻る
                </Button>
                <Button variant="outline" onClick={() => (window.location.href = "/")} className="w-full">
                  トップページに戻る
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
