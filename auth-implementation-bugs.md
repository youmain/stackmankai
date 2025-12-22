# Firebase Auth 実装のバグレポート

## 発見した問題

### 問題1: handleRegister が auth_customerAccount を保存していない

**ファイル:** `app/customer-auth/page.tsx`
**行:** 82-153

**問題:**
```typescript
const handleRegister = async (e: React.FormEvent) => {
  const customerId = await createCustomerAccount(...)
  
  // localStorageに保存
  localStorage.setItem("currentUser", JSON.stringify({...}))
  
  // でも auth_customerAccount は保存していない ❌
  setCurrentCustomer(testCustomer)
}
```

**影響:**
- 新規登録後、ページをリロードすると「未ログイン」状態になる
- onAuthStateChanged が動作しても、localStorageに情報がない

**修正:**
```typescript
// auth-contextに保存
localStorage.setItem("auth_customerAccount", JSON.stringify(fullCustomer))
localStorage.setItem("auth_userType", "customer")
```

---

### 問題2: createUser に永続化設定がない

**ファイル:** `lib/firebase-auth.ts`
**行:** 18-32

**問題:**
```typescript
export async function createUser(email: string, password: string): Promise<UserCredential> {
  const auth = getAuthInstance()
  
  // setPersistence がない ❌
  const userCredential = await createUserWithEmailAndPassword(auth, email, password)
  return userCredential
}
```

**影響:**
- 新規登録時に自動ログインはされるが、永続化されない
- ブラウザを閉じると、再度ログインが必要

**修正:**
```typescript
export async function createUser(email: string, password: string): Promise<UserCredential> {
  const auth = getAuthInstance()
  
  // 永続化設定を追加
  await setPersistence(auth, browserLocalPersistence)
  
  const userCredential = await createUserWithEmailAndPassword(auth, email, password)
  return userCredential
}
```

---

### 問題3: auth-context の unsubscribe が正しく動作しない

**ファイル:** `contexts/auth-context.tsx`
**行:** 33-130

**問題:**
```typescript
useEffect(() => {
  const initializeAuth = async () => {
    try {
      const unsubscribe = onAuthStateChanged(async (user) => { ... })
      
      return () => unsubscribe()  // ← try ブロックの中にある！
    } catch (error) {
      ...
    }
  }
  
  initializeAuth()  // async関数を呼ぶだけで、returnを受け取っていない
}, [])
```

**影響:**
- unsubscribe が useEffect のクリーンアップ関数として機能しない
- コンポーネントがアンマウントされても、onAuthStateChanged のリスナーが残る
- メモリリーク

**修正:**
```typescript
useEffect(() => {
  let unsubscribe: (() => void) | undefined
  
  const initializeAuth = async () => {
    try {
      unsubscribe = onAuthStateChanged(async (user) => { ... })
    } catch (error) {
      ...
    }
  }
  
  initializeAuth()
  
  return () => {
    if (unsubscribe) unsubscribe()
  }
}, [])
```

---

## 修正の優先度

### 高（必須）
1. **問題3**: メモリリークの原因
2. **問題1**: 新規登録後のログイン状態が維持されない

### 中（推奨）
3. **問題2**: 新規登録時の永続化

---

## 修正後のテスト項目

### 新規登録フロー
1. [ ] 新規登録できる
2. [ ] 登録後、ページをリロードしてもログイン状態が維持される
3. [ ] 登録後、ブラウザを閉じて再度開いてもログイン状態が維持される

### ログインフロー
1. [ ] ログインできる
2. [ ] ログイン後、ページをリロードしてもログイン状態が維持される
3. [ ] ログイン後、ブラウザを閉じて再度開いてもログイン状態が維持される

### メモリリーク
1. [ ] コンポーネントのマウント/アンマウントを繰り返してもメモリ使用量が増加しない
2. [ ] ブラウザのコンソールにエラーが出ない
