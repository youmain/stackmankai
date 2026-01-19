"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { isFirebaseConfigured } from "@/lib/firebase"
import { checkFirebaseConfig } from "@/lib/firestore-common"
import { useRouter } from "next/navigation"

// New components
import { LoginForm } from "@/components/customer-auth/login-form"
import { RegisterForm } from "@/components/customer-auth/register-form"
import { LinkPlayerForm } from "@/components/customer-auth/link-player-form"
import { CompletionScreen } from "@/components/customer-auth/completion-screen"
import {
  handleRegister,
  handleLogin,
  handleGoogleLogin,
  handleLinkPlayer,
  checkAuthStateOnMount,
} from "@/components/customer-auth/auth-handlers"

export default function CustomerAuthPage() {
  const router = useRouter()

  // Loading and error states
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")

  // Customer and auth states
  const [currentCustomer, setCurrentCustomer] = useState<any>(null)
  const [hideCompletionScreen, setHideCompletionScreen] = useState(false)
  const [shouldShowCompletion, setShouldShowCompletion] = useState(true)
  const [activeTab, setActiveTab] = useState<"login" | "register">("login")
  const [storeInfo, setStoreInfo] = useState<any>(null)

  // Form states
  const [registerForm, setRegisterForm] = useState({
    email: "",
    password: "",
    confirmPassword: "",
  })

  const [loginForm, setLoginForm] = useState({
    email: "",
    password: "",
  })

  const [linkForm, setLinkForm] = useState({
    playerId: "",
  })

  const [showQRScanner, setShowQRScanner] = useState(false)

  // Check auth state on mount
  useEffect(() => {
    const checkAuth = async () => {
      setIsLoading(true)
      try {
        // checkFirebaseConfig を呼び出して Firestore が初期化されているか確認
        checkFirebaseConfig()
        await checkAuthStateOnMount(storeInfo, setCurrentCustomer, setError)
      } catch (err: any) {
        console.error("[Auth] Initialization error:", err)
        setError(err.message || "初期化エラーが発生しました")
      } finally {
        setIsLoading(false)
      }
    }

    if (isFirebaseConfigured()) {
      checkAuth()
    }
  }, [storeInfo])

  // Handle register
  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")
    setSuccess("")

    try {
      await handleRegister(
        registerForm.email,
        registerForm.password,
        registerForm.confirmPassword,
        storeInfo,
        (customer) => {
          setCurrentCustomer(customer)
          setSuccess("登録成功！")
          setRegisterForm({ email: "", password: "", confirmPassword: "" })
        },
        setError,
      )
    } finally {
      setIsLoading(false)
    }
  }

  // Handle login
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")
    setSuccess("")

    try {
      await handleLogin(
        loginForm.email,
        loginForm.password,
        (customer) => {
          setCurrentCustomer(customer)
          setSuccess("ログイン成功！")
          setLoginForm({ email: "", password: "" })
        },
        setError,
      )
    } finally {
      setIsLoading(false)
    }
  }

  // Handle Google login
  const handleGoogleLoginClick = async () => {
    setIsLoading(true)
    setError("")

    try {
      await handleGoogleLogin(storeInfo, setCurrentCustomer, setError)
    } finally {
      setIsLoading(false)
    }
  }

  // Handle link player
  const handleLinkPlayerSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!currentCustomer) return

    setIsLoading(true)
    setError("")
    setSuccess("")

    try {
      await handleLinkPlayer(
        currentCustomer.id,
        linkForm.playerId,
        () => {
          setSuccess("プレイヤーをリンクしました！")
          setLinkForm({ playerId: "" })
        },
        setError,
      )
    } finally {
      setIsLoading(false)
    }
  }

  // Handle skip to ranking
  const handleSkipToRanking = () => {
    if (hideCompletionScreen) {
      localStorage.setItem("hideCompletionScreen", "true")
    }
    router.push("/rankings")
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>顧客認証</CardTitle>
          <CardDescription>
            ログインまたは新規登録してください
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <Alert className="border-red-200 bg-red-50">
              <AlertDescription className="text-red-600">{error}</AlertDescription>
            </Alert>
          )}

          {success && (
            <Alert className="border-green-200 bg-green-50">
              <AlertDescription className="text-green-600">{success}</AlertDescription>
            </Alert>
          )}

          {!currentCustomer ? (
            <div className="w-full">
              <div className="inline-flex h-10 items-center justify-center rounded-md bg-muted p-1 text-muted-foreground w-full mb-4">
                <Button
                  variant="ghost"
                  onClick={() => setActiveTab("login")}
                  className={`flex-1 ${activeTab === "login" ? "bg-background text-foreground shadow-sm" : ""}`}
                >
                  ログイン
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => setActiveTab("register")}
                  className={`flex-1 ${activeTab === "register" ? "bg-background text-foreground shadow-sm" : ""}`}
                >
                  新規登録
                </Button>
              </div>

              {activeTab === "login" && (
                <LoginForm
                  email={loginForm.email}
                  password={loginForm.password}
                  isLoading={isLoading}
                  onEmailChange={(value) => setLoginForm({ ...loginForm, email: value })}
                  onPasswordChange={(value) => setLoginForm({ ...loginForm, password: value })}
                  onSubmit={handleLoginSubmit}
                  onGoogleLogin={handleGoogleLoginClick}
                />
              )}

              {activeTab === "register" && (
                <RegisterForm
                  email={registerForm.email}
                  password={registerForm.password}
                  confirmPassword={registerForm.confirmPassword}
                  isLoading={isLoading}
                  onEmailChange={(value) => setRegisterForm({ ...registerForm, email: value })}
                  onPasswordChange={(value) => setRegisterForm({ ...registerForm, password: value })}
                  onConfirmPasswordChange={(value) => setRegisterForm({ ...registerForm, confirmPassword: value })}
                  onSubmit={handleRegisterSubmit}
                  onGoogleLogin={handleGoogleLoginClick}
                />
              )}
            </div>
          ) : (
            <div className="space-y-4">
              <CompletionScreen
                customer={currentCustomer}
                hideCompletionScreen={hideCompletionScreen}
                onHideCompletionChange={setHideCompletionScreen}
                onSkipToRanking={handleSkipToRanking}
              />

              <div className="border-t pt-4">
                <h3 className="font-semibold mb-4">プレイヤーをリンク</h3>
                <LinkPlayerForm
                  playerId={linkForm.playerId}
                  isLoading={isLoading}
                  onPlayerIdChange={(value) => setLinkForm({ playerId: value })}
                  onSubmit={handleLinkPlayerSubmit}
                  onShowQRScanner={() => setShowQRScanner(true)}
                />
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
