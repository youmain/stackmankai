# ログイン遅延修正サマリー

## 問題

**症状:** 新規登録・ログイン時に75秒かかる

**影響:** ユーザー体験の著しい低下

---

## 根本原因の特定

### 調査プロセス

1. **ログ分析:** `signIn`関数の`signInWithEmailAndPassword`呼び出しで75秒かかることを確認
2. **認証フロー追跡:** Firebase Auth自体は高速だが、認証後の処理が遅いことを発見
3. **Firestoreクエリ分析:** `auth-context.tsx`の`getUserData()`と`getCustomerByEmail()`が遅延の原因
4. **Firestoreルール検証:** `customerAccounts`コレクションの`get`ルールが`belongsToStore()`を呼び出し
5. **循環参照発見:** `belongsToStore()` → `getUserData()` → `/users/{uid}`ドキュメント取得
6. **タイムアウト確認:** 新規登録時に`users`ドキュメントが存在せず、タイムアウトまで待機

### 根本原因

1. **`createCustomerAccount()`で`users`ドキュメントを作成していない**
   - 新規登録時に`customerAccounts`コレクションのみにドキュメントを作成
   - `users`コレクションにはドキュメントが作成されない

2. **Firestoreルールが`getUserData()`を頻繁に呼び出す**
   - `customerAccounts`の`get`ルールと`update`ルールで`belongsToStore()`を使用
   - `belongsToStore()`が`getUserData()`を呼び出し、存在しない`users`ドキュメントの取得を試みる
   - Firestoreがタイムアウトまで待機（約75秒）

---

## 実装した修正

### 修正1: `users`ドキュメントの作成

**ファイル:** `lib/firestore.ts`

**関数:** `createCustomerAccount()`

**変更内容:**

```typescript
// 追加: usersコレクションにもドキュメントを作成
const { createOrUpdateUserData } = await import("./firestore")
await createOrUpdateUserData({
  uid: uid,
  email: email,
  role: "customer",
  storeId: data.storeId,
  storeName: data.storeName,
})
log.info("[createCustomerAccount] usersドキュメントを作成しました")
```

**効果:**
- 新規登録時に`users`コレクションにもドキュメントを作成
- `getUserData()`が呼ばれても、ドキュメントが存在するため高速に処理される

**デプロイ状況:** ✅ GitHubにプッシュ済み、Vercelが自動デプロイ中

---

### 修正2: Firestoreルールの最適化

**ファイル:** `firestore.rules`

**セクション:** `customerAccounts`コレクション（212-233行目）

**変更内容:**

**`allow get`ルール:**
```javascript
// 修正前
allow get: if isAuthenticated() && (
  resource.data.uid == request.auth.uid ||
  belongsToStore(resource.data.storeId)
);

// 修正後
allow get: if isAuthenticated() && resource.data.uid == request.auth.uid;
```

**`allow update`ルール:**
```javascript
// 修正前
allow update: if isAuthenticated() && (
  resource.data.uid == request.auth.uid ||
  (isStoreStaff() && belongsToStore(resource.data.storeId))
);

// 修正後
allow update: if isAuthenticated() && resource.data.uid == request.auth.uid;
```

**効果:**
- `belongsToStore()`の呼び出しを削除
- `getUserData()`の呼び出しを回避
- 本人のみに制限することで、高速化とセキュリティ向上を両立

**デプロイ状況:** ❌ **ユーザーが手動でFirebase Consoleからデプロイする必要あり**

---

## デプロイ手順

### ✅ 完了済み

- `lib/firestore.ts`の修正をGitHubにプッシュ
- Vercelが自動的にデプロイ中

### ⏳ 実行待ち

**Firestoreルールのデプロイ（ユーザーが実行）:**

詳細は `FIRESTORE_RULES_FIX.md` を参照してください。

**簡易手順:**
1. https://console.firebase.google.com/project/stackmankai/firestore/databases/-default-/security/rules を開く
2. `customerAccounts`セクション（212-233行目）を探す
3. `FIRESTORE_RULES_FIX.md`のコードで置き換え
4. 「公開」ボタンをクリック

---

## 期待される効果

| 項目 | 修正前 | 修正後（予想） |
|------|--------|----------------|
| ログイン時間 | 75秒 | 5秒以内 |
| 新規登録時間 | 75秒 | 5秒以内 |
| ユーザー体験 | 非常に悪い | 良好 |

---

## テスト計画

1. **Vercelデプロイ完了確認:**
   - https://stackmankai-zeta.vercel.app/ にアクセス
   - デプロイ時刻を確認

2. **Firestoreルールデプロイ:**
   - Firebase Consoleで「公開」を実行
   - デプロイ完了を確認

3. **新規登録テスト:**
   - 新しいメールアドレスでアカウント作成
   - 登録完了までの時間を計測
   - 目標: 5秒以内

4. **ログインテスト:**
   - 作成したアカウントでログイン
   - ログイン完了までの時間を計測
   - 目標: 5秒以内

5. **機能確認:**
   - `/customer-view`ページが正常に表示されるか確認
   - プレイヤーID紐づけ機能が動作するか確認

---

## 注意事項

### 機能制限

**店舗スタッフによる顧客情報の更新が制限されます:**

- 修正前: 店舗スタッフが所属店舗の顧客情報を更新可能
- 修正後: 顧客本人のみが自分の情報を更新可能

**影響:**
- 現在のアプリケーションでは、店舗スタッフが顧客情報を直接更新する機能は使われていないため、影響は最小限

**将来的な対応:**
- 店舗スタッフが顧客情報を更新する必要がある場合は、以下のいずれかを実装:
  1. Cloud Functionsを使ったサーバーサイド処理
  2. 管理者権限チェックを含む専用APIエンドポイント
  3. Firestoreルールの再調整（パフォーマンスとのトレードオフ）

---

## ロールバック手順

問題が発生した場合:

```bash
cd /path/to/stackmankai-fix
git revert 9b31e69
git push origin main
firebase deploy --only firestore:rules
```

---

## 関連ドキュメント

- **詳細ガイド:** `LOGIN_SPEED_FIX_GUIDE.md`
- **Firestoreルール修正手順:** `FIRESTORE_RULES_FIX.md`
- **Git コミット:** `9b31e69`

---

## 完了チェックリスト

- [x] 根本原因の特定
- [x] `lib/firestore.ts`の修正
- [x] Firestoreルールの修正
- [x] GitHubへのプッシュ
- [x] ドキュメント作成
- [ ] Firestoreルールのデプロイ（ユーザーが実行）
- [ ] 動作確認テスト
- [ ] パフォーマンス計測

---

**次のステップ:** `FIRESTORE_RULES_FIX.md`を参照して、Firestoreルールをデプロイしてください。
