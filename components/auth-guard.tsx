"use client"

import type React from "react"
import { useAuth } from "@/contexts/auth-context"
import { LoginForm } from "@/components/login-form"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"

interface AuthGuardProps {
  children: React.ReactNode
}

export function AuthGuard({ children }: AuthGuardProps) {
  const { userName, userType, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">読み込み中...</p>
        </div>
      </div>
    )
  }

  if (userType === "customer") {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="max-w-md w-full">
          <Alert className="border-red-200 bg-red-50">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="text-red-800">
              <div className="space-y-3">
                <p className="font-bold">アクセス権限がありません</p>
                <p className="text-sm">このページは管理者専用です。お客さん専用ページに戻ってください。</p>
                <Button
                  onClick={() => {
                    window.location.href = "/customer-view"
                  }}
                  className="w-full bg-blue-600 hover:bg-blue-700"
                >
                  お客さん専用ページに戻る
                </Button>
              </div>
            </AlertDescription>
          </Alert>
        </div>
      </div>
    )
  }

  if (!userName || userType !== "admin") {
    return <LoginForm />
  }

  return <>{children}</>
}
