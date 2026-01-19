import { getCustomerByEmail, linkPlayerToCustomer, createCustomerAccount, getCustomerAccountsCollection } from "@/lib/firestore"
import { signIn, createUser, signInWithGoogle, getGoogleRedirectResult } from "@/lib/firebase-auth"
import { saveAuthCache } from "@/lib/auth-cache"
import { handleError, handleSuccess } from "@/lib/error-handler"

export const handleRegister = async (
  email: string,
  password: string,
  confirmPassword: string,
  storeInfo: any,
  onSuccess: (customer: any) => void,
  onError: (error: string) => void,
) => {
  try {
    if (password !== confirmPassword) {
      onError("パスワードが一致しません")
      return
    }

    if (password.length < 6) {
      onError("パスワードは6文字以上である必要があります")
      return
    }

    const user = await createUser(email, password)
    saveAuthCache(email, user.uid)

    const customer = await createCustomerAccount({
      email,
      storeId: storeInfo?.storeId || null,
      storeName: storeInfo?.storeName || null,
      isBetaTester: true,
      subscriptionStatus: "free_trial",
    })

    onSuccess(customer)
  } catch (error: any) {
    console.error("[Auth] ❌ 登録エラー:", error)
    onError(error.message || "登録に失敗しました")
  }
}

export const handleLogin = async (
  email: string,
  password: string,
  onSuccess: (customer: any) => void,
  onError: (error: string) => void,
) => {
  try {
    const user = await signIn(email, password)
    saveAuthCache(email, user.uid)

    const customer = await getCustomerByEmail(email)
    if (!customer) {
      onError("顧客情報が見つかりません")
      return
    }

    onSuccess(customer)
  } catch (error: any) {
    console.error("[Auth] ❌ ログインエラー:", error)
    onError(error.message || "ログインに失敗しました")
  }
}

export const handleGoogleLogin = async (
  storeInfo: any,
  onSuccess: (customer: any) => void,
  onError: (error: string) => void,
) => {
  try {
    await signInWithGoogle()
  } catch (error: any) {
    console.error("[Auth] ❌ Googleログインエラー:", error)
    onError(error.message || "Googleログインに失敗しました")
  }
}

export const handleLinkPlayer = async (
  customerId: string,
  playerId: string,
  onSuccess: () => void,
  onError: (error: string) => void,
) => {
  try {
    if (!playerId.trim()) {
      onError("プレイヤーIDを入力してください")
      return
    }

    await linkPlayerToCustomer(customerId, playerId)
    onSuccess()
  } catch (error: any) {
    console.error("[Auth] ❌ プレイヤーリンクエラー:", error)
    onError(error.message || "プレイヤーのリンクに失敗しました")
  }
}

export const checkAuthStateOnMount = async (
  storeInfo: any,
  onSuccess: (customer: any) => void,
  onError: (error: string) => void,
) => {
  try {
    console.log("[Auth] 🔍 ログイン状態チェック開始")

    const redirectResult = await getGoogleRedirectResult()

    if (redirectResult) {
      console.log("[Auth] ✅ Googleログイン成功（リダイレクト後）:", redirectResult.user.email)

      saveAuthCache(redirectResult.user.email!, redirectResult.user.uid)

      console.log("[Auth] 💾 Firestoreから顧客情報を取得中...")
      let customer = await getCustomerByEmail(redirectResult.user.email!)

      if (!customer) {
        console.warn("[Auth] ⚠️ 顧客情報が見つかりません。自動作成します...")

        const { createCustomerInFirestore } = await import("@/lib/firestore")
        const customerId = await createCustomerInFirestore(
          {
            storeId: storeInfo?.storeId || null,
            storeName: storeInfo?.storeName || null,
            isBetaTester: true,
            subscriptionStatus: "free_trial",
          },
          redirectResult.user.email!,
          redirectResult.user.uid,
        )

        console.log("[Auth] ✅ 顧客情報を自動作成しました:", customerId)
        customer = await getCustomerByEmail(redirectResult.user.email!)

        if (!customer) {
          throw new Error("顧客情報の作成に失敗しました")
        }
      }

      const finalStoreId = customer.storeId || storeInfo?.storeId || null
      const finalStoreName = customer.storeName || storeInfo?.storeName || null

      const fullCustomer = {
        ...customer,
        storeId: finalStoreId,
        storeName: finalStoreName,
      }

      onSuccess(fullCustomer)
    }
  } catch (error: any) {
    console.error("[Auth] ❌ ログイン状態チェックエラー:", error)
    onError(error.message || "ログイン状態の確認に失敗しました")
  }
}
