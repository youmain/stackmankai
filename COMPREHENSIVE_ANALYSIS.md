# 全体調査レポート：ログイン遅延の原因

## 調査方針

1. **データフロー全体を追跡**
2. **各コンポーネントの依存関係を確認**
3. **全ての潜在的な問題を洗い出す**

## 1. 新規登録フロー

### 1.1 `app/customer-auth/page.tsx` の `handleRegister`

**呼び出し箇所**: 187-196行目

```typescript
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
```

**問題点**:
- ❌ `playerName` が含まれていない
- ❌ `playerId` が含まれていない
- ❌ `role` が含まれていない

### 1.2 `lib/firestore.ts` の `createCustomerAccount`

**実装箇所**: 1529-1550行目

```typescript
export async function createCustomerAccount(
  data: Partial<CustomerAccount>,
  email: string,
  password: string
): Promise<string> {
  // ...
  const docRef = doc(db, "customerAccounts", uid)
  await setDoc(docRef, {
    ...data,
    uid: uid,
    email: email,
    role: "customer",
    createdAt: serverTimestamp()
  })
  return uid
}
```

**問題点**:
- ✅ `uid` を設定している
- ✅ `email` を設定している
- ✅ `role` を設定している
- ❌ `data` に `playerName` と `playerId` が含まれていない場合、ドキュメントにも含まれない

### 1.3 `contexts/auth-context.tsx` の認証処理

**実装箇所**: 107-156行目

```typescript
const docRef = doc(db, "customerAccounts", firebaseUser.uid)
const docSnap = await getDoc(docRef)

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
    storeId: customer.storeId,
    storeName: customer.storeName,
    playerName: customer.playerName,  // ← undefined の可能性
    playerId: customer.playerId,      // ← undefined の可能性
  })
  setCustomerAccountState(customer)
}
```

**問題点**:
- ❌ `customer.playerName` が `undefined` の場合、エラーは発生しないが、UIで問題が起こる可能性
- ❌ `customer.playerId` が `undefined` の場合、エラーは発生しないが、UIで問題が起こる可能性

## 2. CustomerAccount 型定義の確認

**確認が必要**: `types/customer.ts` または `lib/firestore.ts` の型定義

## 3. customer-view ページの依存関係

**確認が必要**: `/customer-view/page.tsx` が `playerName` や `playerId` を必須としているか

## 4. Firestore ルールの検証

**現在のルール**: 212-230行目

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
- ✅ `allow create` で `request.resource.data.uid == uid` をチェックしている
- ❓ 他の必須フィールドのバリデーションがない（`playerName`, `playerId` など）

## 5. 潜在的な問題のリスト

### 問題1: playerName と playerId が未設定

**影響範囲**:
- `auth-context` で `undefined` が設定される
- `customer-view` ページで表示エラーが発生する可能性
- データベースに不完全なドキュメントが作成される

**解決策**:
- 新規登録時にデフォルト値を設定する
- または、後で設定できるようにする

### 問題2: storeId と storeName が null の可能性

**影響範囲**:
- `auth-context` で `null` が設定される
- 店舗に紐づかない顧客が作成される

**解決策**:
- 新規登録時に店舗を選択させる
- または、後で設定できるようにする

### 問題3: 型定義と実装の不一致

**確認が必要**:
- `CustomerAccount` 型で `playerName` と `playerId` が必須かオプショナルか

### 問題4: customer-view ページの読み込みロジック

**確認が必要**:
- `/customer-view/page.tsx` が `authLoading` を正しく処理しているか
- `playerName` や `playerId` が `undefined` の場合の処理

### 問題5: 後方互換性の問題

**確認が必要**:
- 既存の `customerAccounts` ドキュメント（自動生成IDを使用）との互換性
- `getCustomerByEmail` のフォールバックロジックが正しく動作しているか

## 次のステップ

1. ✅ `CustomerAccount` 型定義を確認
2. ✅ `/customer-view/page.tsx` の実装を確認
3. ✅ `handleRegister` を修正して必要なフィールドを全て設定
4. ✅ Firestoreルールにバリデーションを追加（オプション）
5. ✅ テストして動作確認
