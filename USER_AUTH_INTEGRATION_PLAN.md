# ユーザー認証統合の実装計画

## 概要

新規投稿作成ページ（`/create-post`）に、実際のログインユーザー情報を統合する必要があります。

現在、ハードコーディングされたユーザー情報を使用しています：
- `authorId: "user1"`
- `authorName: "りゅうさん"`
- `storeId: "store1"`
- `storeName: "テスト店舗"`

## 現状分析

### 1. 認証システムの確認

プロジェクトを調査した結果、以下のことが判明しました：

- **認証コンテキストなし**：React Contextによるグローバルな認証状態管理は実装されていない
- **localStorageの使用**：顧客認証ページでlocalStorageを使用している（プレイヤー紐づけ完了画面の表示制御のみ）
- **Firestore直接アクセス**：各ページで直接Firestoreから顧客情報を取得している

### 2. 既存の認証フロー

#### 顧客認証ページ（`/customer-auth`）
1. ユーザーがメールアドレスとパスワードでログイン
2. `getCustomerByEmail()`でFirestoreから顧客情報を取得
3. `currentCustomer`状態に保存
4. プレイヤーIDと紐づけ

#### 伝票管理ページ（`/receipts`）
1. ユーザーが名前とパスワードで「開始」
2. `getEmployeeByName()`でFirestoreから従業員情報を取得
3. ローカル状態で管理

## 実装方針

### オプション1：React Context + localStorage（推奨）

**メリット**：
- グローバルな認証状態管理
- ページ遷移後も認証状態を保持
- 複数のページで簡単にユーザー情報にアクセス可能

**デメリット**：
- 実装に時間がかかる（約2-3時間）
- 既存のページも修正が必要

**実装手順**：
1. `AuthContext`を作成（`/lib/auth-context.tsx`）
2. `layout.tsx`でAuthProviderをラップ
3. `useAuth()`フックを提供
4. localStorageで認証状態を永続化
5. 既存のページを修正してAuthContextを使用

### オプション2：localStorage直接使用（簡易版）

**メリット**：
- 実装が簡単（約30分）
- 既存のコードへの影響が最小限

**デメリット**：
- グローバルな状態管理がない
- 各ページで個別にlocalStorageにアクセス
- 認証状態の同期が難しい

**実装手順**：
1. ログイン時にlocalStorageにユーザー情報を保存
2. `/create-post`ページでlocalStorageからユーザー情報を取得
3. 投稿作成時にlocalStorageのユーザー情報を使用

### オプション3：URLパラメータ/クエリ文字列（非推奨）

**メリット**：
- 実装が非常に簡単

**デメリット**：
- セキュリティリスク（URLにユーザー情報が露出）
- ブックマークやシェア時に問題
- 推奨されない方法

## 推奨実装：オプション2（localStorage直接使用）

短期的な解決策として、localStorage直接使用を推奨します。

### 実装詳細

#### 1. 顧客認証ページの修正（`/app/customer-auth/page.tsx`）

ログイン成功時にlocalStorageにユーザー情報を保存：

```typescript
// ログイン成功後
const customer = await getCustomerByEmail(loginForm.email)
if (customer) {
  // localStorageに保存
  localStorage.setItem("currentUser", JSON.stringify({
    id: customer.id,
    name: customer.name || customer.email,
    email: customer.email,
    type: "customer",
    storeId: customer.storeId,
    storeName: customer.storeName,
  }))
  
  setCurrentCustomer(customer)
  // ...
}
```

#### 2. 伝票管理ページの修正（`/app/receipts/page.tsx`）

従業員ログイン成功時にlocalStorageにユーザー情報を保存：

```typescript
// ログイン成功後
const employee = await getEmployeeByName(name)
if (employee) {
  // localStorageに保存
  localStorage.setItem("currentUser", JSON.stringify({
    id: employee.id,
    name: employee.name,
    type: "employee",
    storeId: employee.storeId,
    storeName: employee.storeName,
  }))
  
  // ...
}
```

#### 3. 新規投稿作成ページの修正（`/app/create-post/page.tsx`）

localStorageからユーザー情報を取得：

```typescript
"use client"

import { useState, useEffect } from "react"
// ... other imports

export default function CreatePostPage() {
  const [currentUser, setCurrentUser] = useState<any>(null)
  
  // ユーザー情報をlocalStorageから取得
  useEffect(() => {
    const userStr = localStorage.getItem("currentUser")
    if (userStr) {
      try {
        const user = JSON.parse(userStr)
        setCurrentUser(user)
      } catch (error) {
        console.error("Failed to parse user from localStorage:", error)
      }
    }
  }, [])
  
  // 投稿作成時にcurrentUserを使用
  const handleSubmit = async () => {
    // ...
    
    if (!currentUser) {
      alert("ログインが必要です")
      router.push("/customer-auth")
      return
    }
    
    const postToSave: Partial<PostData> = {
      title: title.trim(),
      situation: situation,
      visibility: visibility,
      seekingAdvice: seekingAdvice,
      authorId: currentUser.id,  // localStorageから取得
      authorName: currentUser.name,  // localStorageから取得
      storeId: currentUser.storeId || "store1",  // localStorageから取得
      storeName: currentUser.storeName || "テスト店舗",  // localStorageから取得
      likes: 0,
      comments: 0,
      views: 0,
    }
    
    // ...
  }
  
  // ...
}
```

#### 4. ログアウト機能の追加

各ページにログアウトボタンを追加：

```typescript
const handleLogout = () => {
  localStorage.removeItem("currentUser")
  router.push("/customer-auth")
}
```

### セキュリティ考慮事項

**注意**：localStorageはXSS攻撃に脆弱です。以下の対策を推奨します：

1. **パスワードは保存しない**：localStorageにパスワードを保存しないこと
2. **HTTPSを使用**：本番環境では必ずHTTPSを使用
3. **トークンの有効期限**：将来的にはJWTトークンと有効期限を実装
4. **サーバーサイド検証**：投稿作成時にサーバーサイドでユーザー検証を実装

## 長期的な改善（オプション1の実装）

将来的には、React Contextによるグローバルな認証状態管理を実装することを推奨します。

### 実装例

#### `/lib/auth-context.tsx`

```typescript
"use client"

import React, { createContext, useContext, useState, useEffect } from "react"

interface User {
  id: string
  name: string
  email?: string
  type: "customer" | "employee"
  storeId?: string
  storeName?: string
}

interface AuthContextType {
  user: User | null
  login: (user: User) => void
  logout: () => void
  isAuthenticated: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  
  useEffect(() => {
    // localStorageからユーザー情報を復元
    const userStr = localStorage.getItem("currentUser")
    if (userStr) {
      try {
        const user = JSON.parse(userStr)
        setUser(user)
      } catch (error) {
        console.error("Failed to parse user from localStorage:", error)
      }
    }
  }, [])
  
  const login = (user: User) => {
    setUser(user)
    localStorage.setItem("currentUser", JSON.stringify(user))
  }
  
  const logout = () => {
    setUser(null)
    localStorage.removeItem("currentUser")
  }
  
  return (
    <AuthContext.Provider value={{
      user,
      login,
      logout,
      isAuthenticated: !!user,
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
```

#### `/app/layout.tsx`の修正

```typescript
import { AuthProvider } from "@/lib/auth-context"

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja">
      <body>
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  )
}
```

#### 各ページでの使用

```typescript
import { useAuth } from "@/lib/auth-context"

export default function CreatePostPage() {
  const { user, isAuthenticated } = useAuth()
  
  if (!isAuthenticated) {
    // ログインページにリダイレクト
    router.push("/customer-auth")
    return null
  }
  
  // userを使用して投稿を作成
  const postToSave: Partial<PostData> = {
    authorId: user.id,
    authorName: user.name,
    storeId: user.storeId || "store1",
    storeName: user.storeName || "テスト店舗",
    // ...
  }
}
```

## 実装スケジュール

### 短期（今回）：localStorage直接使用
- 実装時間：約30分
- 影響範囲：3ファイル（customer-auth, receipts, create-post）

### 中期（次回）：React Context実装
- 実装時間：約2-3時間
- 影響範囲：全ページ

### 長期：JWT認証とサーバーサイド検証
- 実装時間：約1日
- セキュリティの大幅な向上

## まとめ

短期的な解決策として、localStorage直接使用を実装します。これにより、ユーザーが投稿を作成する際に、実際のログインユーザー情報が使用されるようになります。

長期的には、React Contextによるグローバルな認証状態管理を実装し、セキュリティとユーザー体験を向上させることを推奨します。
