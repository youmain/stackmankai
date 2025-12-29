# 新しい認証フロー設計

## 問題の根本原因

現在の設計では、**2つのコレクション**（`users`と`customerAccounts`）を使用しており、**2回のFirestoreクエリ**が必要です。

1. `getUserData(uid)` - `users`コレクションから取得
2. `getCustomerByEmail(email)` - `customerAccounts`コレクションから取得

これが遅延の主な原因です。

## 新しい設計方針

### 原則1: シングルソース

顧客の場合、**`customerAccounts`コレクションのみ**を使用します。`users`コレクションは不要です。

### 原則2: UID による直接取得

`email`でクエリする代わりに、**`uid`で直接ドキュメントを取得**します。

```typescript
// 遅い（クエリ）
const q = query(collection, where("email", "==", email))
const snapshot = await getDocs(q)

// 速い（直接取得）
const docRef = doc(db, "customerAccounts", uid)
const snapshot = await getDoc(docRef)
```

### 原則3: 必要な情報を全て含める

`customerAccounts`ドキュメントに、認証に必要な全ての情報を含めます：

```typescript
{
  uid: string,           // Firebase Auth UID（ドキュメントIDとしても使用）
  email: string,
  role: "customer",
  storeId: string,
  storeName: string,
  playerId: string,
  playerName: string,
  createdAt: Timestamp,
}
```

## 新しいフロー

### 1. 新規登録

```typescript
async function createCustomerAccount(email, password, data) {
  // 1. Firebase Authユーザー作成
  const userCredential = await createUser(email, password)
  const uid = userCredential.user.uid
  
  // 2. customerAccountsドキュメント作成（UIDをドキュメントIDとして使用）
  await setDoc(doc(db, "customerAccounts", uid), {
    uid: uid,
    email: email,
    role: "customer",
    storeId: data.storeId,
    storeName: data.storeName,
    playerId: data.playerId,
    playerName: data.playerName,
    createdAt: serverTimestamp(),
  })
  
  // 3. リダイレクト
  router.push("/customer-view")
}
```

### 2. 認証状態の監視

```typescript
onAuthStateChanged(auth, async (firebaseUser) => {
  if (!firebaseUser) {
    setUser(null)
    setLoading(false)
    return
  }
  
  try {
    // customerAccountsドキュメントを直接取得（UIDで）
    const docRef = doc(db, "customerAccounts", firebaseUser.uid)
    const docSnap = await getDoc(docRef)
    
    if (docSnap.exists()) {
      const data = docSnap.data()
      setUser({
        uid: firebaseUser.uid,
        email: data.email,
        role: "customer",
        storeId: data.storeId,
        storeName: data.storeName,
        playerId: data.playerId,
        playerName: data.playerName,
      })
      setCustomerAccountState(data)
    } else {
      // ドキュメントが存在しない場合（エラー）
      console.error("[Auth] ❌ 顧客アカウントが見つかりません")
      setError("顧客アカウントが見つかりません")
    }
    
    setLoading(false)
  } catch (err) {
    console.error("[Auth] ❌ 認証エラー:", err)
    setError("認証に失敗しました")
    setLoading(false)
  }
})
```

## Firestoreルールの変更

```javascript
match /customerAccounts/{uid} {
  // UIDをドキュメントIDとして使用するため、本人確認が簡単
  allow read, write: if isAuthenticated() && request.auth.uid == uid;
}
```

## メリット

1. **高速**: 1回の`getDoc()`のみ（クエリ不要）
2. **シンプル**: 1つのコレクションのみ
3. **安全**: UIDによる直接アクセスで、Firestoreルールがシンプル
4. **スケーラブル**: インデックス不要

## 移行戦略

### ステップ1: 新しい構造でドキュメント作成

`createCustomerAccount()`を修正して、UIDをドキュメントIDとして使用します。

### ステップ2: 認証ロジックを修正

`auth-context.tsx`を修正して、直接取得を使用します。

### ステップ3: 後方互換性の維持

既存のドキュメント（自動生成IDを使用）も引き続き動作するように、フォールバックロジックを追加します。

### ステップ4: 既存データの移行（オプション）

既存の`customerAccounts`ドキュメントを新しい構造に移行します（別タスク）。

## 実装順序

1. `lib/firestore.ts`の`createCustomerAccount()`を修正
2. `contexts/auth-context.tsx`の認証ロジックを修正
3. Firestoreルールを更新
4. デプロイとテスト
