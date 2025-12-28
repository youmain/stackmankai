"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
// import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs" // Not used anymore
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Checkbox } from "@/components/ui/checkbox"
import { Loader2, Mail, Lock, User, ArrowLeft, Gift } from "lucide-react"
import { isFirebaseConfigured } from "@/lib/firebase"
import { getCustomerByEmail, linkPlayerToCustomer, createCustomerAccount } from "@/lib/firestore"

export default function CustomerAuthPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [currentCustomer, setCurrentCustomer] = useState<any>(null)
  const [selectedPaymentType, setSelectedPaymentType] = useState<"subscription" | "one_time">("subscription")
  const [hideCompletionScreen, setHideCompletionScreen] = useState(false)
  const [shouldShowCompletion, setShouldShowCompletion] = useState(true)
  const [activeTab, setActiveTab] = useState<"login" | "register">("login")
  const [storeInfo, setStoreInfo] = useState<any>(null)

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

  // ページ読み込み時にログイン状態をチェック
  useEffect(() => {
    const checkAuthState = async () => {
      try {
        console.log("[Auth] 🔍 ログイン状態チェック開始")
        const { getCurrentUser } = await import("@/lib/firebase-auth")
        const user = await getCurrentUser()
        
        if (user) {
          console.log("[Auth] ✅ ログイン済みユーザーを検出:", user.email)
          // すでにログイン済みの場合、customer-viewにリダイレクト
          window.location.href = "/customer-view"
        } else {
          console.log("[Auth] ℹ️ 未ログイン状態")
        }
      } catch (error) {
        console.error("[Auth] ❌ ログイン状態チェックエラー:", error)
      }
    }
    
    checkAuthState()
    
    const hideCompletion = localStorage.getItem("hidePlayerLinkingCompletion")
    if (hideCompletion === "true") {
      setShouldShowCompletion(false)
    }
  }, [])

  const handleHideCompletionChange = (checked: boolean) => {
    setHideCompletionScreen(checked)
    if (checked) {
      localStorage.setItem("hidePlayerLinkingCompletion", "true")
    } else {
      localStorage.removeItem("hidePlayerLinkingCompletion")
    }
  }

  const handleSkipToRanking = () => {
    window.location.href = "/customer-view"
  }

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")
    setSuccess("")

    try {
      if (registerForm.password !== registerForm.confirmPassword) {
        throw new Error("パスワードが一致しません")
      }

      if (registerForm.password.length < 6) {
        throw new Error("パスワードは6文字以上で入力してください")
      }

      if (!isFirebaseConfigured) {
        setError("Firebase設定が必要です。Project Settingsで環境変数を設定してください。")
        setIsLoading(false)
        return
      }

      const existingCustomer = await getCustomerByEmail(registerForm.email)
      if (existingCustomer) {
        throw new Error("このメールアドレスは既に登録されています")
      }

      // Firestoreに顧客アカウントを作成（Firebase Auth統合）
      // 店舗情報は後で追加されるため、登録時はnullでもOK
      const customerId = await createCustomerAccount(
        {
          storeId: storeInfo?.storeId || null,
          storeName: storeInfo?.storeName || null,
          isBetaTester: true,
          subscriptionStatus: "free_trial",
        },
        registerForm.email,
        registerForm.password
      )

      const testCustomer = {
        id: customerId,
        email: registerForm.email,
        isBetaTester: true,
        registeredAt: new Date().toISOString(),
        subscriptionStatus: "free_trial",
        storeId: storeInfo?.storeId || null,
        storeName: storeInfo?.storeName || null,
      }

      // localStorageにユーザー情報を保存（投稿作成用）
      localStorage.setItem("currentUser", JSON.stringify({
        id: testCustomer.id,
        name: testCustomer.email,
        email: testCustomer.email,
        type: "customer",
        storeId: storeInfo?.storeId || null,
        storeName: storeInfo?.storeName || null,
      }))
      console.log("[Auth] 💾 localStorageにユーザー情報保存:", testCustomer.email)

      // auth-contextに保存（sessionStorage/localStorageにも保存される）
      localStorage.setItem("auth_customerAccount", JSON.stringify(testCustomer))
      localStorage.setItem("auth_userType", "customer")

      setCurrentCustomer(testCustomer)
      setSuccess("無料登録が完了しました！プレイヤーIDを紐づけてください。")
      setRegisterForm({ email: "", password: "", confirmPassword: "" })
    } catch (error) {
      setError(error instanceof Error ? error.message : "登録に失敗しました")
    } finally {
      setIsLoading(false)
    }
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")
    setSuccess("")

    try {
      console.log("[Auth] 🔑 ログイン処理開始:", loginForm.email)
      
      if (!isFirebaseConfigured) {
        console.error("[Auth] ❌ Firebase設定がありません")
        setError("Firebase設定が必要です。Project Settingsで環境変数を設定してください。")
        setIsLoading(false)
        return
      }
      
      console.log("[Auth] 🔥 Firebase設定確認完了")

      // Firebase Authでログイン（パスワード認証 + 永続ログイン）
      console.log("[Auth] 🔑 Firebase Authログイン試行中...")
      const { signIn, getCurrentUser } = await import("@/lib/firebase-auth")
      
      // タイムアウト処理を追加（90秒）
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error("ログインがタイムアウトしました。ネットワーク接続を確認してください。")), 90000)
      )
      
      const userCredential = await Promise.race([
        signIn(loginForm.email, loginForm.password),
        timeoutPromise
      ]) as any
      
      console.log("[Auth] ✅ Firebase Authログイン成功:", loginForm.email)

      // Firestoreから顧客情報を取得
      console.log("[Auth] 💾 Firestoreから顧客情報を取得中...")
      let customer = await getCustomerByEmail(loginForm.email)
      console.log("[Auth] 💾 顧客情報取得結果:", customer ? "FOUND" : "NOT FOUND")
      
      // 自動修復: Firebase AuthにはあるがFirestoreにない場合、自動作成
      if (!customer) {
        console.warn("[Auth] ⚠️ 顧客情報が見つかりません。自動作成します...")
        
        // Firestoreのみに顧客情報を作成（Firebase Authユーザーは既に存在）
        const { createCustomerInFirestore } = await import("@/lib/firestore")
        const customerId = await createCustomerInFirestore(
          {
            storeId: storeInfo?.storeId || null,
            storeName: storeInfo?.storeName || null,
            isBetaTester: true,
            subscriptionStatus: "free_trial",
          },
          loginForm.email,
          userCredential.user.uid
        )
        
        console.log("[Auth] ✅ 顧客情報を自動作成しました:", customerId)
        
        // 作成した顧客情報を取得
        customer = await getCustomerByEmail(loginForm.email)
        
        if (!customer) {
          throw new Error("顧客情報の作成に失敗しました")
        }
      }

      // 店舗情報の確認（ログイン時は顧客データから取得、なければlocalStorageから）
      const finalStoreId = customer.storeId || storeInfo?.storeId || null
      const finalStoreName = customer.storeName || storeInfo?.storeName || null

      // 顧客情報を完全な形で保存
      const fullCustomer = {
        ...customer,
        storeId: finalStoreId,
        storeName: finalStoreName,
      }

      // localStorageにユーザー情報を保存（投稿作成用）
      localStorage.setItem("currentUser", JSON.stringify({
        id: fullCustomer.id,
        name: fullCustomer.name || fullCustomer.email,
        email: fullCustomer.email,
        type: "customer",
        storeId: finalStoreId,
        storeName: finalStoreName,
      }))
      console.log("[Auth] 💾 localStorageにユーザー情報保存:", fullCustomer.email)

      // auth-contextに保存（sessionStorage/localStorageにも保存される）
      localStorage.setItem("auth_customerAccount", JSON.stringify(fullCustomer))
      localStorage.setItem("auth_userType", "customer")

      setCurrentCustomer(fullCustomer)
      setSuccess("ログインしました")
      setLoginForm({ email: "", password: "" })
      
      // auth-contextのonAuthStateChangedが発火するまで少し待ってからリダイレクト
      console.log("[Auth] 🚀 /customer-viewへリダイレクト")
      setTimeout(() => {
        window.location.href = "/customer-view"
      }, 500)
      
      // リダイレクトするのでfinallyでsetIsLoading(false)を実行しない
      return
    } catch (error: any) {
      console.error("[Auth] ❌ ログインエラー:", error)
      
      // Firebase Authのエラーメッセージを日本語化
      let errorMessage = "ログインに失敗しました"
      if (error.code === "auth/invalid-credential" || error.code === "auth/wrong-password" || error.code === "auth/user-not-found") {
        errorMessage = "メールアドレスまたはパスワードが正しくありません"
      } else if (error.code === "auth/too-many-requests") {
        errorMessage = "ログイン試行回数が多すぎます。しばらく待ってから再度お試しください。"
      } else if (error.message) {
        errorMessage = error.message
      }
      
      setError(errorMessage)
      setIsLoading(false)
    } finally {
      // リダイレクト時はsetIsLoadingを実行しない
    }
  }

  const handleLinkPlayer = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")
    setSuccess("")

    try {
      if (!currentCustomer) {
        throw new Error("ログインが必要です")
      }

      if (!linkForm.playerId) {
        throw new Error("プレイヤーIDを入力してください")
      }

      if (!isFirebaseConfigured) {
        setError("Firebase設定が必要です。Project Settingsで環境変数を設定してください。")
        setIsLoading(false)
        return
      }

      const playerName = `プレイヤー${linkForm.playerId}`

      await linkPlayerToCustomer(currentCustomer.id, linkForm.playerId, playerName)

      setSuccess("プレイヤーIDが紐づけされました。ランキングページにアクセスできます。")
      setLinkForm({ playerId: "" })

      setCurrentCustomer({
        ...currentCustomer,
        playerId: linkForm.playerId,
        playerName: playerName,
      })
    } catch (error) {
      setError(error instanceof Error ? error.message : "紐づけに失敗しました")
    } finally {
      setIsLoading(false)
    }
  }

  if (currentCustomer && currentCustomer.playerId) {
    // 次回から表示しない設定がされている場合は直接ランキングページに移動
    if (!shouldShowCompletion) {
      handleSkipToRanking()
      return null
    }

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
            <CardTitle className="text-2xl font-bold text-green-600">紐づけ完了</CardTitle>
            <CardDescription>プレイヤーID: {currentCustomer.playerId} と紐づけされました</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-center">
              <p className="text-sm text-gray-600 mb-4">
                ランキングページにアクセスして、あなたの戦績を確認しましょう！
              </p>
              <Button onClick={() => (window.location.href = "/customer-view")} className="w-full mb-4">
                ランキングページへ
              </Button>

              <div className="flex items-center space-x-2 justify-center">
                <Checkbox
                  id="hide-completion"
                  checked={hideCompletionScreen}
                  onCheckedChange={handleHideCompletionChange}
                />
                <Label htmlFor="hide-completion" className="text-sm text-gray-600 cursor-pointer">
                  次回から表示しない
                </Label>
              </div>
              <p className="text-xs text-gray-500 mt-2">
                チェックすると、今後は紐づけ完了後に直接ランキングページに移動します
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

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
          <CardTitle className="text-2xl font-bold">ポーカーランキング</CardTitle>
          <CardDescription>お好みの支払い方法でランキングに参加しよう</CardDescription>
        </CardHeader>
        <CardContent>
          <Alert className="mb-6 border-green-500 bg-green-50">
            <Gift className="h-5 w-5 text-green-600" />
            <AlertDescription className="text-green-800 space-y-2">
              <div className="font-bold text-lg">🎉 現在テストプレイ中につき無料！</div>
              <div className="text-sm">
                <p className="mb-2">
                  本サービスは現在テスト期間中のため、<strong>完全無料</strong>でご利用いただけます。
                </p>
                <p className="mb-2">
                  <strong>有料化予定：</strong>30日前に事前告知の上、月額<strong>1,650円（税込）</strong>
                  に変更予定です。
                </p>
                <p className="text-xs bg-green-100 p-2 rounded mt-2">
                  💡 <strong>テスト期間中に登録された方は特別価格でご利用いただける予定です</strong>
                </p>
              </div>
            </AlertDescription>
          </Alert>

          {error && (
            <Alert className="mb-4 border-red-200 bg-red-50">
              <AlertDescription className="text-red-600">{error}</AlertDescription>
            </Alert>
          )}

          {success && (
            <Alert className="mb-4 border-green-200 bg-green-50">
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
                <form onSubmit={handleLogin} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="login-email">メールアドレス</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <Input
                        id="login-email"
                        type="email"
                        placeholder="your@email.com"
                        value={loginForm.email}
                        onChange={(e) => setLoginForm({ ...loginForm, email: e.target.value })}
                        className="pl-10"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="login-password">パスワード</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <Input
                        id="login-password"
                        type="password"
                        placeholder="パスワード"
                        value={loginForm.password}
                        onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                        className="pl-10"
                        required
                      />
                    </div>
                  </div>

                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ログイン中...
                      </>
                    ) : (
                      "ログイン"
                    )}
                  </Button>
                </form>
              )}

              {activeTab === "register" && (
                <form onSubmit={handleRegister} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="register-email">メールアドレス</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <Input
                        id="register-email"
                        type="email"
                        placeholder="your@email.com"
                        value={registerForm.email}
                        onChange={(e) => setRegisterForm({ ...registerForm, email: e.target.value })}
                        className="pl-10"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="register-password">パスワード</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <Input
                        id="register-password"
                        type="password"
                        placeholder="6文字以上"
                        value={registerForm.password}
                        onChange={(e) => setRegisterForm({ ...registerForm, password: e.target.value })}
                        className="pl-10"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="confirm-password">パスワード確認</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <Input
                        id="confirm-password"
                        type="password"
                        placeholder="パスワードを再入力"
                        value={registerForm.confirmPassword}
                        onChange={(e) => setRegisterForm({ ...registerForm, confirmPassword: e.target.value })}
                        className="pl-10"
                        required
                      />
                    </div>
                  </div>

                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        登録中...
                      </>
                    ) : (
                      "無料で登録する"
                    )}
                  </Button>

                  <div className="text-xs text-gray-500 text-center">
                    現在はテスト期間中のため完全無料です
                    <br />
                    将来的に月額1,650円（税込）に変更予定（30日前に告知）
                  </div>
                </form>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              <div className="text-center">
                <h3 className="text-lg font-semibold mb-2">プレイヤーID紐づけ</h3>
                <p className="text-sm text-gray-600 mb-4">店舗でお聞きしたプレイヤーIDを入力してください</p>
              </div>

              <form onSubmit={handleLinkPlayer} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="player-id">プレイヤーID</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      id="player-id"
                      type="text"
                      placeholder="例: 123456"
                      value={linkForm.playerId}
                      onChange={(e) => setLinkForm({ playerId: e.target.value })}
                      className="pl-10"
                      required
                    />
                  </div>
                  <p className="text-xs text-gray-500">プレイヤーIDは店舗スタッフにお尋ねください</p>
                </div>

                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      紐づけ中...
                    </>
                  ) : (
                    "プレイヤーIDを紐づける"
                  )}
                </Button>

                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-white px-2 text-muted-foreground">または</span>
                  </div>
                </div>

                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  onClick={() => setShowQRScanner(!showQRScanner)}
                >
                  {showQRScanner ? "QRコードスキャンを閉じる" : "QRコードで紐づける"}
                </Button>

                {showQRScanner && (
                  <div className="p-4 border rounded-lg bg-gray-50">
                    <p className="text-sm text-center text-gray-600 mb-2">
                      店舗から受け取ったQRコードデータを貼り付けてください
                    </p>
                    <textarea
                      className="w-full p-2 border rounded text-sm font-mono"
                      rows={4}
                      placeholder='{"storeId":"...","playerId":"...",...}'
                      onChange={(e) => {
                        try {
                          const data = JSON.parse(e.target.value)
                          if (data.playerUniqueId) {
                            setLinkForm({ playerId: data.playerUniqueId })
                            setShowQRScanner(false)
                          }
                        } catch (err) {
                          // Invalid JSON, ignore
                        }
                      }}
                    />
                  </div>
                )}
              </form>

              <div className="space-y-2">
                <Button
                  variant="secondary"
                  onClick={() => (window.location.href = "/customer-view")}
                  className="w-full"
                >
                  紐づけを後回しにしてランキングを見る
                </Button>
                <p className="text-xs text-gray-500 text-center">後からプレイヤーIDを紐づけることもできます</p>
              </div>

              <div className="text-center">
                <Button variant="outline" onClick={() => setCurrentCustomer(null)} className="text-sm">
                  ログアウト
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
