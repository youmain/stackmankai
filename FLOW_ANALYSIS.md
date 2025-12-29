# 全体フロー分析

## 現在の問題

新規登録後、`/customer-view`ページが「読み込み中...」のまま60秒以上停止する。

## 全体のフロー

### 1. 新規登録処理 (`app/customer-auth/page.tsx`)

```
handleRegister()
  ↓
createCustomerAccount(email, password, data)
  ↓
[lib/firestore.ts: 1529-1570]
```

**処理内容:**
1. Firebase Authユーザー作成 (1534行目)
2. 認証状態の反映待機 (1539行目)
3. **usersドキュメント作成** (1544-1550行目)
4. **usersドキュメントの読み取り確認（リトライ）** (1555-1562行目) ← **新規追加**
5. customerAccountsドキュメント作成 (1565-1569行目)
6. `/customer-view`へリダイレクト

### 2. 認証状態の監視 (`contexts/auth-context.tsx`)

```
useEffect(() => {
  onAuthStateChanged(auth, async (firebaseUser) => {
    if (firebaseUser) {
      // ユーザーデータ取得
      const userData = await getUserData(firebaseUser.uid)  // ← ここで遅延？
      
      if (userData) {
        // 顧客の場合
        if (userData.role === "customer") {
          const customer = await getCustomerByEmail(userData.email)  // ← ここでも遅延？
        }
      } else {
        // usersドキュメントがない場合（後方互換性）
        const customer = await getCustomerByEmail(firebaseUser.email!)
      }
    }
    setLoading(false)
  })
}, [])
```

**問題点:**
- `getUserData()`が遅い、またはタイムアウトしている
- `getCustomerByEmail()`も遅い可能性
- エラーハンドリングが不十分で、例外が発生すると`setLoading(false)`が呼ばれない

### 3. データ取得関数

#### `getUserData(uid)` [lib/firestore.ts: 2201-2208]

```typescript
export const getUserData = async (uid: string): Promise<UserData | null> => {
  if (!isFirebaseConfigured()) return null
  const userDoc = await getDoc(doc(db, "users", uid))
  if (!userDoc.exists()) return null
  return userDoc.data() as UserData
}
```

**Firestoreルール (firestore.rules: 64行目):**
```javascript
allow read: if request.auth != null && request.auth.uid == userId;
```

#### `getCustomerByEmail(email)` [lib/firestore.ts: 1520-1527]

```typescript
export const getCustomerByEmail = async (email: string): Promise<CustomerAccount | null> => {
  if (!isFirebaseConfigured()) return null
  const customersCollection = getCustomerAccountsCollection()
  const q = query(customersCollection, where("email", "==", email), limit(1))
  const snapshot = await getDocs(q)
  if (!snapshot.empty) return null
  return { id: snapshot.docs[0].id, ...snapshot.docs[0].data() } as CustomerAccount
}
```

**Firestoreルール (firestore.rules: 215, 219行目):**
```javascript
allow get: if isAuthenticated() && resource.data.uid == request.auth.uid;
allow list: if isAuthenticated();
```

## 問題の仮説

### 仮説1: `getUserData()`のタイミング問題

`createCustomerAccount()`で`users`ドキュメントを作成した直後、`auth-context`の`onAuthStateChanged`が発火する。しかし、**Firestoreの書き込みがまだ完全に反映されていない**可能性がある。

**証拠:**
- `createCustomerAccount()`でリトライロジックを追加したが、問題が解決していない
- リトライロジックは`createCustomerAccount()`内でのみ機能し、`auth-context`では機能しない

### 仮説2: `getCustomerByEmail()`のクエリ問題

`getCustomerByEmail()`は`customerAccounts`コレクションをクエリする。Firestoreルールの`allow list`は`isAuthenticated()`のみをチェックするが、**クエリ結果のドキュメントに対して`get`ルールも評価される**可能性がある。

**証拠:**
- Firestoreルールの`get`ルールは`resource.data.uid == request.auth.uid`をチェック
- クエリ結果が本人のドキュメントでない場合、拒否される

### 仮説3: エラーハンドリングの欠如

`auth-context`の`onAuthStateChanged`内で例外が発生した場合、`setLoading(false)`が呼ばれず、永遠に「読み込み中...」のままになる。

**証拠:**
- `try-catch`ブロックはあるが、`catch`内で`setLoading(false)`が呼ばれていない可能性

## 解決策の方向性

### 方向性1: エラーハンドリングの強化

`auth-context`の`onAuthStateChanged`内で、**必ず`setLoading(false)`が呼ばれる**ようにする。

### 方向性2: データ取得のリトライロジック

`getUserData()`と`getCustomerByEmail()`にリトライロジックを追加する。

### 方向性3: 認証フローの簡素化

`users`ドキュメントと`customerAccounts`ドキュメントを統合し、1回のクエリで済むようにする。

### 方向性4: Firestoreルールの最適化

`customerAccounts`の`list`ルールを、本人のドキュメントのみを返すように最適化する。

## 次のステップ

1. `auth-context.tsx`のエラーハンドリングを確認
2. 実際のエラーログを確認（ブラウザのコンソール）
3. 最も影響の大きい修正を実装
