# 認証システム エッジケース分析

## 分析対象
- customer-auth/page.tsx
- contexts/auth-context.tsx  
- lib/firebase-auth.ts

## エッジケースチェックリスト

### 1. 新規登録フロー

#### ケース1.1: 登録中にページをリロード
**シナリオ:**
1. メールアドレス・パスワード入力
2. 「登録」ボタンクリック
3. Firebase Authユーザー作成中にF5リロード

**現在の実装:**
```typescript
const customerId = await createCustomerAccount(...)  // ← ここでリロードしたら？
```

**問題:**
- Firebase Authにユーザーは作成される
- でもFirestoreに顧客情報は保存されない
- 次回ログイン時に「顧客情報が見つかりません」エラー

**重要度:** 高
**状態:** ⚠️ 未対応

---

#### ケース1.2: 同じメールアドレスで2回登録
**シナリオ:**
1. test@example.com で登録
2. ログアウト
3. 再度 test@example.com で登録

**現在の実装:**
```typescript
const existingCustomer = await getCustomerByEmail(registerForm.email)
if (existingCustomer) {
  throw new Error("このメールアドレスは既に登録されています")
}
```

**問題:**
- Firestoreはチェックしている
- でもFirebase Authはチェックしていない
- Firebase Authで既に存在する場合、`createUser` がエラーを投げる

**重要度:** 低（Firebase Authのエラーで適切に処理される）
**状態:** ✅ OK

---

#### ケース1.3: 店舗情報がない状態で登録
**シナリオ:**
1. 直接 /customer-auth にアクセス
2. localStorageに店舗情報がない
3. 登録しようとする

**現在の実装:**
```typescript
if (!storeInfo || !storeInfo.storeId) {
  throw new Error("店舗情報が見つかりません。店舗ログインページに移動してください。")
}
```

**問題:** なし
**重要度:** -
**状態:** ✅ OK

---

### 2. ログインフロー

#### ケース2.1: パスワード間違い
**シナリオ:**
1. 正しいメールアドレス
2. 間違ったパスワード
3. ログインボタンクリック

**現在の実装:**
```typescript
await signIn(loginForm.email, loginForm.password)  // ← Firebase Authがエラー
```

**問題:** なし（エラーハンドリングあり）
**重要度:** -
**状態:** ✅ OK

---

#### ケース2.2: Firebase Authにはあるが、Firestoreにない
**シナリオ:**
1. Firebase Authでユーザー作成
2. Firestoreへの保存が失敗（ケース1.1）
3. ログインしようとする

**現在の実装:**
```typescript
await signIn(loginForm.email, loginForm.password)  // ← 成功
const customer = await getCustomerByEmail(loginForm.email)  // ← null
if (!customer) {
  throw new Error("顧客情報が見つかりません")
}
```

**問題:**
- Firebase Authではログイン成功
- でも顧客情報がないのでエラー
- ユーザーは「ログインできない」と思う

**重要度:** 高
**状態:** ⚠️ 未対応（ケース1.1の副作用）

---

#### ケース2.3: 店舗情報がない状態でログイン
**シナリオ:**
1. 直接 /customer-auth にアクセス
2. localStorageに店舗情報がない
3. ログインする

**現在の実装:**
```typescript
const finalStoreId = customer.storeId || storeInfo?.storeId
const finalStoreName = customer.storeName || storeInfo?.storeName

if (!finalStoreId || !finalStoreName) {
  throw new Error("店舗情報が見つかりません。店舗ログインページに移動してください。")
}
```

**問題:**
- `customer.storeId` があれば問題なし
- でも新規登録直後の顧客は `storeId` がない可能性

**重要度:** 中
**状態:** ⚠️ 要確認（customer.storeIdが必ず設定されるか？）

---

### 3. セッション復元フロー

#### ケース3.1: Firebase Authトークンは有効だが、Firestoreの顧客が削除された
**シナリオ:**
1. ログイン成功
2. 管理者がFirestoreから顧客データを削除
3. ページをリロード

**現在の実装:**
```typescript
onAuthStateChanged(async (user) => {
  if (user && user.email) {
    const customer = await getCustomerByEmail(user.email)
    if (customer) {
      // セッション復元
    }
  }
})
```

**問題:**
- `customer` が null の場合、何も起きない
- ユーザーは「ログインしているのに何も表示されない」状態

**重要度:** 中
**状態:** ⚠️ 未対応

---

#### ケース3.2: onAuthStateChanged が2回呼ばれる
**シナリオ:**
1. ページロード
2. onAuthStateChanged が呼ばれる（user = null）
3. すぐに再度呼ばれる（user = 有効なユーザー）

**現在の実装:**
```typescript
onAuthStateChanged(async (user) => {
  if (user && user.email) {
    // Firestoreから取得
    setLoading(false)
    return
  }
  
  // localStorageから復元
  await restoreFromLocalStorage()
  setLoading(false)
})
```

**問題:**
- 1回目: user = null → restoreFromLocalStorage() → setLoading(false)
- 2回目: user = 有効 → Firestore取得 → setLoading(false)
- `setLoading(false)` が2回呼ばれる

**重要度:** 低（動作には影響なし）
**状態:** ✅ OK

---

### 4. 並行処理・競合状態

#### ケース4.1: ログイン中に別タブでログアウト
**シナリオ:**
1. タブA: ログイン中
2. タブB: ログアウト
3. タブA: ログイン完了

**現在の実装:**
- Firebase Authは複数タブで同期される
- localStorageも共有される

**問題:** なし（Firebase Authが自動で同期）
**重要度:** -
**状態:** ✅ OK

---

#### ケース4.2: 登録とログインを同時に実行
**シナリオ:**
1. タブA: 新規登録開始
2. タブB: 同じメールアドレスでログイン開始
3. 両方が同時に完了

**現在の実装:**
- タブA: `createUser` → Firebase Authユーザー作成
- タブB: `signIn` → 「ユーザーが見つかりません」エラー（タイミング次第）

**問題:** なし（通常起こらない）
**重要度:** 極低
**状態:** ✅ OK

---

### 5. データ整合性

#### ケース5.1: localStorageとFirebase Authの不一致
**シナリオ:**
1. ログイン成功
2. 手動でlocalStorageの `auth_customerAccount` を削除
3. ページをリロード

**現在の実装:**
```typescript
onAuthStateChanged(async (user) => {
  if (user && user.email) {
    const customer = await getCustomerByEmail(user.email)
    if (customer) {
      // localStorageに保存し直す
      localStorage.setItem("auth_customerAccount", JSON.stringify(customer))
    }
  }
})
```

**問題:** なし（Firestoreから再取得して復元）
**重要度:** -
**状態:** ✅ OK

---

#### ケース5.2: Firestoreの顧客情報が更新された
**シナリオ:**
1. ログイン成功
2. 管理者がFirestoreの顧客情報を更新（例: playerIdを変更）
3. ページをリロード

**現在の実装:**
```typescript
const customer = await getCustomerByEmail(user.email)
localStorage.setItem("auth_customerAccount", JSON.stringify(customer))
```

**問題:** なし（最新データを取得）
**重要度:** -
**状態:** ✅ OK

---

## 発見した問題まとめ

### 高（要修正）

1. **ケース1.1**: 登録中にリロード → Firebase Authにユーザーは作成されるが、Firestoreに顧客情報なし
2. **ケース2.2**: Firebase Authにはあるが、Firestoreにない → ログインできない

### 中（要確認）

3. **ケース2.3**: 新規登録直後の顧客に `storeId` が設定されているか？
4. **ケース3.1**: Firestoreの顧客が削除された場合の処理

### 低（問題なし）

- その他のケースは適切に処理されている

---

## 推奨する修正

### 修正1: トランザクション的な登録処理

**問題:** ケース1.1, 2.2

**現在:**
```typescript
// 1. Firebase Authユーザー作成
const customerId = await createCustomerAccount(...)

// 2. Firestoreに保存（ここで失敗する可能性）
```

**修正案:**
```typescript
try {
  const customerId = await createCustomerAccount(...)
  // 成功
} catch (error) {
  // Firebase Authユーザーは作成されたが、Firestoreに失敗
  // → Firebase Authユーザーを削除
  await deleteFirebaseAuthUser()
  throw error
}
```

または、ログイン時に自動修復:
```typescript
const customer = await getCustomerByEmail(loginForm.email)
if (!customer) {
  // Firebase Authにはあるが、Firestoreにない
  // → Firestoreに顧客情報を作成
  await createCustomerInFirestore(user.email, user.uid)
}
```

### 修正2: 顧客削除時の処理

**問題:** ケース3.1

**修正案:**
```typescript
onAuthStateChanged(async (user) => {
  if (user && user.email) {
    const customer = await getCustomerByEmail(user.email)
    if (!customer) {
      // 顧客情報が見つからない → ログアウト
      await signOutUser()
      setError("アカウント情報が見つかりません。再度登録してください。")
      setLoading(false)
      return
    }
    // ...
  }
})
```

### 修正3: storeId の確認

**問題:** ケース2.3

**確認事項:**
- `createCustomerAccount` で `storeId` が必ず設定されるか？
- 設定されない場合、どう処理するか？
