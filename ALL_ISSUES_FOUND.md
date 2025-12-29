# 全ての問題点のまとめ

## 調査結果

### 1. CustomerAccount 型定義（types/index.ts:295-309）

```typescript
export interface CustomerAccount {
  id: string
  email: string
  playerId?: string        // ← オプショナル
  playerName?: string      // ← オプショナル
  storeId: string          // ← 必須
  storeName: string        // ← 必須
  stripeCustomerId: string // ← 必須
  subscriptionStatus: "active" | "inactive" | "canceled" | "past_due" | "trialing"
  subscriptionId?: string
  currentPeriodStart?: Date
  currentPeriodEnd?: Date
  createdAt: Date
  updatedAt: Date
}
```

**問題点**:
- ❌ `storeId` と `storeName` が必須だが、新規登録時に `null` が渡されている
- ❌ `stripeCustomerId` が必須だが、新規登録時に設定されていない
- ❌ `createdAt` と `updatedAt` が必須だが、`serverTimestamp()` は `Date` 型ではない

### 2. handleRegister（app/customer-auth/page.tsx:187-196）

```typescript
const customerId = await createCustomerAccount(
  {
    storeId: storeInfo?.storeId || null,  // ← null が渡される可能性
    storeName: storeInfo?.storeName || null, // ← null が渡される可能性
    isBetaTester: true,
    subscriptionStatus: "free_trial",
  },
  registerForm.email,
  registerForm.password
)
```

**問題点**:
- ❌ `storeId` が `null` の場合、型定義と矛盾
- ❌ `storeName` が `null` の場合、型定義と矛盾
- ❌ `stripeCustomerId` が設定されていない
- ❌ `playerId` と `playerName` が設定されていない（オプショナルなので問題ないはずだが、UIで使用される）

### 3. createCustomerAccount（lib/firestore.ts:1537-1549）

```typescript
const docRef = doc(db, "customerAccounts", uid)
await setDoc(docRef, {
  ...data,
  uid: uid,
  email: email,
  role: "customer",
  createdAt: serverTimestamp()
})
```

**問題点**:
- ❌ `data` に含まれない必須フィールドが設定されていない
- ❌ `serverTimestamp()` は Firestore の特殊な型で、`Date` 型ではない
- ❌ `updatedAt` が設定されていない

### 4. auth-context（contexts/auth-context.tsx:107-156）

```typescript
if (docSnap.exists()) {
  const customer = { id: docSnap.id, ...docSnap.data() } as CustomerAccount
  console.log("[Auth] ✅ 顧客アカウント取得:", {
    playerId: customer.playerId,
    playerName: customer.playerName,
  })
  
  setUser({
    uid: firebaseUser.uid,
    email: customer.email,
    role: "customer",
    storeId: customer.storeId,      // ← null の可能性
    storeName: customer.storeName,  // ← null の可能性
    playerName: customer.playerName, // ← undefined の可能性
    playerId: customer.playerId,     // ← undefined の可能性
  })
  setCustomerAccountState(customer)
}
```

**問題点**:
- ❌ `customer.storeId` が `null` の場合、`setUser` に `null` が渡される
- ❌ `customer.storeName` が `null` の場合、`setUser` に `null` が渡される
- ⚠️ `customer.playerName` が `undefined` の場合、UIで問題が起こる可能性
- ⚠️ `customer.playerId` が `undefined` の場合、UIで問題が起こる可能性

### 5. customer-view ページ（app/customer-view/page.tsx:923-932）

```typescript
if (authLoading) {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
        <p className="text-gray-600">読み込み中...</p>
      </div>
    </div>
  )
}
```

**問題点**:
- ✅ `authLoading` が `true` の間、「読み込み中...」が表示される
- ❌ `authLoading` が `false` にならない場合、永遠に「読み込み中...」が表示される

### 6. Firestore ルール（firestore.rules:212-230）

```javascript
match /customerAccounts/{uid} {
  allow get: if isAuthenticated() && request.auth.uid == uid;
  allow list: if isAuthenticated();
  allow create: if isAuthenticated() && request.auth.uid == uid && request.resource.data.uid == uid;
  allow update: if isAuthenticated() && request.auth.uid == uid;
  allow delete: if isAuthenticated() && request.auth.uid == uid;
}
```

**問題点**:
- ⚠️ 必須フィールドのバリデーションがない
- ⚠️ `storeId` や `stripeCustomerId` が `null` でも作成できてしまう

## 根本原因

### 原因1: 型定義と実装の不一致

**CustomerAccount 型定義**では `storeId`, `storeName`, `stripeCustomerId` が必須だが、**実装では `null` や未設定が許容されている**。

### 原因2: 新規登録時のデータ不足

**新規登録時**に必要なフィールドが全て設定されていない。

### 原因3: auth-context のエラーハンドリング不足

**auth-context**で `setLoading(false)` が呼ばれない場合、永遠に「読み込み中...」が表示される。

## 解決策

### 解決策1: 型定義を修正（オプショナルに変更）

```typescript
export interface CustomerAccount {
  id: string
  email: string
  playerId?: string
  playerName?: string
  storeId?: string | null  // ← オプショナルに変更
  storeName?: string | null // ← オプショナルに変更
  stripeCustomerId?: string // ← オプショナルに変更
  subscriptionStatus: "active" | "inactive" | "canceled" | "past_due" | "trialing" | "free_trial"
  subscriptionId?: string
  currentPeriodStart?: Date
  currentPeriodEnd?: Date
  createdAt?: Date | any  // ← serverTimestamp() を許容
  updatedAt?: Date | any  // ← serverTimestamp() を許容
  isBetaTester?: boolean
  role?: string
  uid?: string
}
```

### 解決策2: createCustomerAccount を修正

```typescript
const docRef = doc(db, "customerAccounts", uid)
await setDoc(docRef, {
  ...data,
  uid: uid,
  email: email,
  role: "customer",
  createdAt: serverTimestamp(),
  updatedAt: serverTimestamp(),
  // デフォルト値を設定
  playerName: data.playerName || null,
  playerId: data.playerId || null,
  storeId: data.storeId || null,
  storeName: data.storeName || null,
  stripeCustomerId: data.stripeCustomerId || null,
})
```

### 解決策3: auth-context のエラーハンドリングを強化

```typescript
try {
  const docRef = doc(db, "customerAccounts", firebaseUser.uid)
  const docSnap = await getDoc(docRef)
  
  if (docSnap.exists()) {
    // 処理
  } else {
    // フォールバック
  }
  
  setLoading(false) // ← 必ず呼ぶ
} catch (err) {
  console.error("[Auth] ❌ 認証エラー:", err)
  setError("認証に失敗しました")
  setLoading(false) // ← 必ず呼ぶ
}
```

### 解決策4: Firestore ルールにバリデーションを追加（オプション）

```javascript
allow create: if isAuthenticated() 
  && request.auth.uid == uid 
  && request.resource.data.uid == uid
  && request.resource.data.email is string
  && request.resource.data.role == "customer";
```

## 優先順位

1. **最優先**: 型定義を修正してオプショナルに変更
2. **高**: `createCustomerAccount` でデフォルト値を設定
3. **中**: `auth-context` のエラーハンドリングを確認
4. **低**: Firestoreルールにバリデーションを追加

## 次のアクション

1. ✅ 型定義を修正
2. ✅ `createCustomerAccount` を修正
3. ✅ デプロイしてテスト
4. ✅ 動作確認
