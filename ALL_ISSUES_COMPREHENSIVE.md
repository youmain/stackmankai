# 全ての問題点の徹底調査

## 調査対象
1. `createCustomerAccount()` - 新規登録処理
2. `waitForAuthState()` - 認証状態待機
3. `auth-context.tsx` - 認証コンテキスト
4. Firestoreルール - セキュリティルール
5. データフロー - 全体の流れ

---

## 問題1: `waitForAuthState()`の実装不備

### 場所
- `lib/firebase-auth.ts` 168-182行目
- `lib/firestore.ts` 1546行目

### 問題内容
- `waitForAuthState(uid)`と呼び出しているが、関数は引数を受け取っていない
- 特定のUIDのユーザーが認証されているかを確認していない
- 単に「誰かがログインしている」ことしか確認していない

### 影響
- 別のユーザーでログインしていても成功してしまう
- セキュリティリスク

---

## 問題2: `createCustomerAccount()`のFirestoreドキュメント作成タイミング

### 場所
- `lib/firestore.ts` 1534-1560行目

### 問題内容
- Firebase Authユーザー作成（1539行目）
- `waitForAuthState()`呼び出し（1546行目）
- しかし、`waitForAuthState()`は即座に返る可能性がある
- Firestoreの書き込みルールが認証状態を要求するが、認証状態が反映されていない可能性

### 影響
- "Missing or insufficient permissions"エラー
- 新規登録が失敗する

---

## 問題3: Firestoreルールの`create`ルールが厳しすぎる

### 場所
- `firestore.rules` 223行目

### 問題内容
```javascript
allow create: if isAuthenticated() && request.auth.uid == uid && request.resource.data.uid == uid;
```

- `isAuthenticated()`は`request.auth != null`をチェック
- しかし、Firebase Authユーザー作成直後は`request.auth`がまだ設定されていない可能性
- Firebaseの認証トークンの反映に時間がかかる

### 影響
- "Missing or insufficient permissions"エラー
- 新規登録が失敗する

---

## 問題4: `createCustomerAccount()`の遅延

### 場所
- `lib/firestore.ts` 1534-1560行目

### 問題内容
- `createUserWithEmailAndPassword()`が遅い（約30秒）
- 原因不明だが、Firebase SDKの問題の可能性

### 影響
- 新規登録に30秒かかる

---

## 問題5: `auth-context`の`getDoc()`が遅い

### 場所
- `contexts/auth-context.tsx` 125-135行目

### 問題内容
- `getDoc(doc(db, "customerAccounts", firebaseUser.uid))`が遅い（約30秒）
- Firestoreからの取得に時間がかかっている

### 影響
- ログイン後のページ表示に30秒かかる

---

## 問題6: Firebase SDK v10.14.1の問題

### 場所
- `package.json`

### 問題内容
- Firebase SDK v10.14.1にダウングレードしている
- このバージョンに既知の問題がある可能性

### 影響
- 全体的な遅延

---

## 問題7: 不要な`getUserData()`呼び出し

### 場所
- `contexts/auth-context.tsx` 125行目

### 問題内容
- `customerAccounts`コレクションから直接取得しているのに、`users`コレクションも取得しようとしている
- 二重の取得が発生している

### 影響
- 不要なFirestoreクエリ
- 遅延の原因

---

## 合計: 7つの問題を発見
