# ユーザー認証統合の実装結果

## 概要

新規投稿作成ページ（`/create-post`）に、実際のログインユーザー情報を統合しました。localStorage直接使用による短期的な解決策を実装し、ハードコーディングされたユーザー情報を実際のログインユーザー情報に置き換えました。

## 実装日時

2025年12月10日

## 実装内容

### 1. 顧客認証ページの修正（`/app/customer-auth/page.tsx`）

#### ログイン処理にlocalStorage保存を追加

**変更箇所**：110-143行目

```typescript
const handleLogin = async (e: React.FormEvent) => {
  e.preventDefault()
  setIsLoading(true)
  setError("")
  setSuccess("")

  try {
    if (!isFirebaseConfigured) {
      setError("Firebase設定が必要です。Project Settingsで環境変数を設定してください。")
      return
    }

    const customer = await getCustomerByEmail(loginForm.email)
    if (!customer) {
      throw new Error("メールアドレスまたはパスワードが正しくありません")
    }

    sessionStorage.setItem("currentUserEmail", loginForm.email)
    console.log("[v0] 💾 セッションにメールアドレス保存:", loginForm.email)

    // 🆕 localStorageにユーザー情報を保存（投稿作成用）
    localStorage.setItem("currentUser", JSON.stringify({
      id: customer.id,
      name: customer.name || customer.email,
      email: customer.email,
      type: "customer",
      storeId: customer.storeId,
      storeName: customer.storeName,
    }))
    console.log("[v0] 💾 localStorageにユーザー情報保存:", customer.email)

    setCurrentCustomer(customer)
    setSuccess("ログインしました")
    setLoginForm({ email: "", password: "" })
  } catch (error) {
    setError(error instanceof Error ? error.message : "ログインに失敗しました")
  } finally {
    setIsLoading(false)
  }
}
```

#### 新規登録処理にもlocalStorage保存を追加

**変更箇所**：62-113行目

```typescript
const handleRegister = async (e: React.FormEvent) => {
  // ... バリデーション処理 ...

  // 仮の顧客データを作成（実際のFirestore登録は別途実装が必要）
  const testCustomer = {
    id: `test_${Date.now()}`,
    email: registerForm.email,
    isBetaTester: true,
    registeredAt: new Date().toISOString(),
    subscriptionStatus: "free_trial",
  }

  // 🆕 localStorageにユーザー情報を保存（投稿作成用）
  localStorage.setItem("currentUser", JSON.stringify({
    id: testCustomer.id,
    name: testCustomer.email,
    email: testCustomer.email,
    type: "customer",
    storeId: "store1",
    storeName: "テスト店舗",
  }))
  console.log("[v0] 💾 localStorageにユーザー情報保存:", testCustomer.email)

  setCurrentCustomer(testCustomer)
  setSuccess("テスト期間中の無料登録が完了しました！プレイヤーIDを紐づけてください。")
  setRegisterForm({ email: "", password: "", confirmPassword: "" })
}
```

### 2. 新規投稿作成ページの修正（`/app/create-post/page.tsx`）

#### useEffectとcurrentUser状態を追加

**変更箇所**：3行目、23-43行目

```typescript
import { useState, useEffect } from "react"  // 🆕 useEffectを追加

export default function CreatePostPage() {
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState(1)
  const [isSaving, setIsSaving] = useState(false)
  const [currentUser, setCurrentUser] = useState<any>(null)  // 🆕
  
  // 🆕 localStorageからユーザー情報を取得
  useEffect(() => {
    const userStr = localStorage.getItem("currentUser")
    if (userStr) {
      try {
        const user = JSON.parse(userStr)
        setCurrentUser(user)
        console.log("[v0] 👤 ユーザー情報をlocalStorageから読み込み:", user)
      } catch (error) {
        console.error("Failed to parse user from localStorage:", error)
      }
    } else {
      console.warn("[v0] ⚠️ localStorageにユーザー情報がありません")
    }
  }, [])
  
  // ... 残りのコード ...
}
```

#### 投稿作成処理でcurrentUserを使用

**変更箇所**：117-153行目

```typescript
const handleSave = async () => {
  try {
    // バリデーション
    if (!title.trim()) {
      alert("タイトルを入力してください")
      return
    }

    if (!situation.description.trim()) {
      alert("状況説明を入力してください")
      setCurrentStep(1)
      return
    }

    // 🆕 ユーザー情報の確認
    if (!currentUser) {
      alert("ログインが必要です。顧客認証ページに移動します。")
      router.push("/customer-auth")
      return
    }

    setIsSaving(true)

    // 投稿データの準備
    const postToSave: Partial<PostData> = {
      title: title.trim(),
      situation: situation,
      visibility: visibility,
      seekingAdvice: seekingAdvice,
      // 🆕 ハードコーディングからcurrentUserに変更
      authorId: currentUser.id,
      authorName: currentUser.name,
      storeId: currentUser.storeId || "store1",
      storeName: currentUser.storeName || "テスト店舗",
      likes: 0,
      comments: 0,
      views: 0,
    }

    // オプショナルなステップデータを追加
    if (preflop) postToSave.preflop = preflop
    if (flop) postToSave.flop = flop
    if (turn) postToSave.turn = turn
    if (river) postToSave.river = river
    if (reflection) postToSave.reflection = reflection

    console.log("投稿データ:", postToSave)

    // Firestoreに保存
    const postId = await createPost(postToSave)

    console.log("投稿ID:", postId)

    alert("投稿を作成しました！")
    router.push(`/posts/${postId}`)
  } catch (error) {
    console.error("投稿の作成に失敗しました:", error)
    alert("投稿の作成に失敗しました。もう一度お試しください。")
  } finally {
    setIsSaving(false)
  }
}
```

## 変更ファイル一覧

1. **`/app/customer-auth/page.tsx`**
   - ログイン処理にlocalStorage保存を追加
   - 新規登録処理にlocalStorage保存を追加

2. **`/app/create-post/page.tsx`**
   - useEffectとcurrentUser状態を追加
   - localStorageからユーザー情報を取得
   - 投稿作成処理でcurrentUserを使用

3. **`/USER_AUTH_INTEGRATION_PLAN.md`**（新規作成）
   - 実装計画ドキュメント

## テスト結果

### ✅ 実装完了

- localStorageへのユーザー情報保存
- localStorageからのユーザー情報取得
- 投稿作成時のユーザー情報使用
- ログイン状態の確認とリダイレクト

### ⚠️ 実際の動作テスト未実施

ブラウザ接続が不安定なため、以下のテストは未実施です：

1. ログイン後のlocalStorage保存確認
2. 投稿作成時のユーザー情報使用確認
3. 未ログイン時のリダイレクト確認

### 推奨される追加テスト

実際の動作テストを実施する際は、以下を確認してください：

1. **ログインテスト**
   - `/customer-auth`でログイン
   - ブラウザの開発者ツールでlocalStorageを確認
   - `currentUser`が正しく保存されているか確認

2. **投稿作成テスト**
   - `/create-post`にアクセス
   - ブラウザのコンソールで「👤 ユーザー情報をlocalStorageから読み込み」ログを確認
   - 投稿を作成
   - 投稿データに正しいauthorIdとauthorNameが含まれているか確認

3. **未ログインテスト**
   - localStorageをクリア
   - `/create-post`にアクセス
   - 投稿作成ボタンをクリック
   - `/customer-auth`にリダイレクトされるか確認

## 実装の評価

### ✅ メリット

1. **実装が簡単**：約30分で実装完了
2. **既存コードへの影響が最小限**：3ファイルのみ修正
3. **即座に動作**：追加のセットアップ不要
4. **ページ遷移後も認証状態を保持**：localStorageによる永続化

### ⚠️ デメリット

1. **グローバルな状態管理がない**：React Contextを使用していない
2. **セキュリティリスク**：localStorageはXSS攻撃に脆弱
3. **認証状態の同期が難しい**：複数のタブで同期されない
4. **パスワードは保存していない**：セキュリティのため意図的に除外

## セキュリティ考慮事項

### 実装済みのセキュリティ対策

1. **パスワードは保存しない**：localStorageにパスワードを保存していない
2. **最小限の情報のみ保存**：id、name、email、type、storeId、storeNameのみ

### 推奨される追加のセキュリティ対策

1. **HTTPSを使用**：本番環境では必ずHTTPSを使用
2. **トークンの有効期限**：将来的にはJWTトークンと有効期限を実装
3. **サーバーサイド検証**：投稿作成時にサーバーサイドでユーザー検証を実装
4. **XSS対策**：入力値のサニタイゼーション

## 今後の改善計画

### 短期（次回）：React Context実装

- 実装時間：約2-3時間
- 影響範囲：全ページ
- メリット：グローバルな認証状態管理、複数のページで簡単にユーザー情報にアクセス可能

### 中期：JWT認証とサーバーサイド検証

- 実装時間：約1日
- メリット：セキュリティの大幅な向上、トークンの有効期限管理

### 長期：Firebase Authenticationの統合

- 実装時間：約2-3日
- メリット：エンタープライズレベルのセキュリティ、ソーシャルログイン、パスワードリセット機能

## Gitコミット

```bash
commit 2a8a107
feat: Integrate user authentication with localStorage for create-post functionality

- Add localStorage save on login/register in customer-auth page
- Add useEffect to load user info from localStorage in create-post page
- Replace hardcoded user info with currentUser in post creation
- Add user authentication check before post creation
```

## まとめ

localStorage直接使用による短期的な解決策を実装しました。これにより、ユーザーが投稿を作成する際に、実際のログインユーザー情報が使用されるようになります。

実装はシンプルで効果的ですが、長期的にはReact Contextによるグローバルな認証状態管理を実装し、セキュリティとユーザー体験を向上させることを推奨します。

## 次のステップ

1. **実際の動作テスト**：ブラウザ接続が安定した状態で、実際に投稿を作成してテスト
2. **Firestoreデータの確認**：投稿データに正しいauthorIdとauthorNameが含まれているか確認
3. **React Context実装**：グローバルな認証状態管理を実装
4. **セキュリティ強化**：JWT認証とサーバーサイド検証を実装
