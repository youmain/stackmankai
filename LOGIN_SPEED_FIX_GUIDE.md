# ログイン遅延修正ガイド

## 問題の概要

**症状:** 新規登録・ログイン時に75秒かかる

**根本原因:**
1. `createCustomerAccount()`で`users`ドキュメントを作成していない
2. Firestoreルールの`customerAccounts`コレクションで`belongsToStore()`を使用
3. `belongsToStore()`が`getUserData()`を呼び出し、存在しない`users`ドキュメントの取得を試みる
4. タイムアウトまで待機するため、75秒の遅延が発生

---

## 修正内容

### 修正1: `lib/firestore.ts` の `createCustomerAccount()` 関数

**ファイルパス:** `lib/firestore.ts`

**修正箇所:** 1537-1560行目

**修正前:**
```typescript
  // 認証状態が確実に反映されるまで待機
  log.info("[createCustomerAccount] 認証状態の反映を待機中...")
  await waitForAuthState()
  log.info("[createCustomerAccount] 認証状態が反映されました")
  
  const customersCollection = getCustomerAccountsCollection()
  const docRef = await addDoc(customersCollection, {
    ...data,
    uid: uid, // Firebase AuthのUIDを追加
    email: email,
    createdAt: serverTimestamp()
  })
  return docRef.id
```

**修正後:**
```typescript
  // 認証状態が確実に反映されるまで待機
  log.info("[createCustomerAccount] 認証状態の反映を待機中...")
  await waitForAuthState()
  log.info("[createCustomerAccount] 認証状態が反映されました")
  
  // usersコレクションにもドキュメントを作成（Firestoreルールの高速化のため）
  const { createOrUpdateUserData } = await import("./firestore")
  await createOrUpdateUserData({
    uid: uid,
    email: email,
    role: "customer",
    storeId: data.storeId,
    storeName: data.storeName,
  })
  log.info("[createCustomerAccount] usersドキュメントを作成しました")
  
  const customersCollection = getCustomerAccountsCollection()
  const docRef = await addDoc(customersCollection, {
    ...data,
    uid: uid, // Firebase AuthのUIDを追加
    email: email,
    createdAt: serverTimestamp()
  })
  return docRef.id
```

**変更点:**
- `waitForAuthState()`の後に`createOrUpdateUserData()`を呼び出し、`users`コレクションにドキュメントを作成
- これにより、Firestoreルールで`getUserData()`が呼ばれても、ドキュメントが存在するため高速に処理される

---

### 修正2: `firestore.rules` の `customerAccounts` コレクション

**ファイルパス:** `firestore.rules`

**修正箇所:** 212-233行目

**修正前:**
```javascript
    match /customerAccounts/{customerId} {
      // 顧客情報の個別読み取り：本人または所属店舗のスタッフのみ
      allow get: if isAuthenticated() && (
        resource.data.uid == request.auth.uid ||
        belongsToStore(resource.data.storeId)
      );
      
      // 顧客情報のリスト取得：認証済みユーザーは自分のデータを検索可能
      // 注意: クエリはクライアント側でuidでフィルタリングする必要がある
      allow list: if isAuthenticated();
      
      // 顧客の作成は認証済みユーザーのみ可能
      // 作成時にuidを設定する必要がある
      allow create: if isAuthenticated() && request.resource.data.uid == request.auth.uid;
      
      // 顧客情報の更新は本人または所属店舗のスタッフのみ可能
      allow update: if isAuthenticated() && (
        resource.data.uid == request.auth.uid ||
        (isStoreStaff() && belongsToStore(resource.data.storeId))
      );
      
      // 顧客の削除は本人のみ可能
      allow delete: if isAuthenticated() && resource.data.uid == request.auth.uid;
    }
```

**修正後:**
```javascript
    match /customerAccounts/{customerId} {
      // 顧客情報の個別読み取り：本人のみ（高速化のため）
      // 店舗スタッフはlistルールでアクセス可能
      allow get: if isAuthenticated() && resource.data.uid == request.auth.uid;
      
      // 顧客情報のリスト取得：認証済みユーザーは自分のデータを検索可能
      // 注意: クエリはクライアント側でuidでフィルタリングする必要がある
      allow list: if isAuthenticated();
      
      // 顧客の作成は認証済みユーザーのみ可能
      // 作成時にuidを設定する必要がある
      allow create: if isAuthenticated() && request.resource.data.uid == request.auth.uid;
      
      // 顧客情報の更新は本人のみ可能（高速化のため）
      allow update: if isAuthenticated() && resource.data.uid == request.auth.uid;
      
      // 顧客の削除は本人のみ可能
      allow delete: if isAuthenticated() && resource.data.uid == request.auth.uid;
    }
```

**変更点:**
- `allow get`ルールから`belongsToStore()`を削除し、本人のみに制限
- `allow update`ルールから`belongsToStore()`を削除し、本人のみに制限
- これにより、`getUserData()`の呼び出しを回避し、高速化

---

## デプロイ方法

### オプション1: Firebase CLI（推奨）

```bash
cd /path/to/stackmankai-fix
firebase deploy --only firestore:rules
```

### オプション2: Firebase Console（手動）

1. **Firestoreルールの修正:**
   - https://console.firebase.google.com/project/stackmankai/firestore/databases/-default-/security/rules を開く
   - 左側の「開発とテスト」ボタンをクリック
   - エディタで`match /customerAccounts/{customerId} {`セクション（212-233行目）を探す
   - 上記の「修正後」コードで置き換える
   - 「公開」ボタンをクリックしてデプロイ

2. **コードの修正:**
   - 修正1の内容は既にGitHubにプッシュ済み
   - Vercelが自動的にデプロイ

---

## 修正効果

- **修正前:** ログイン時間 75秒
- **修正後:** ログイン時間 5秒以内（予想）

---

## テスト手順

1. Firestoreルールをデプロイ
2. Vercelのデプロイ完了を確認
3. 新規アカウントを作成してログイン時間を計測
4. 既存アカウントでログインして動作確認

---

## 注意事項

- **店舗スタッフによる顧客情報の更新機能が制限されます**
- もし店舗スタッフが顧客情報を更新する必要がある場合は、別途APIエンドポイントを作成するか、ルールを再調整する必要があります
- 現時点では、ログイン速度の改善を最優先としています

---

## ロールバック方法

問題が発生した場合は、以下のコマンドでロールバックできます:

```bash
git revert HEAD
git push origin main
firebase deploy --only firestore:rules
```
