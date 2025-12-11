# StackManKai テストアカウント情報（更新版）

## 🔑 重要な修正内容

**問題:** Firebase Authenticationはメールアドレスを自動的に小文字に変換するため、大文字を含むメールアドレスでログインできませんでした。

**解決:** `generateEmployeeEmail`関数でメールアドレスを小文字に変換するように修正しました。

---

## 🏪 店舗アカウント

### テスト店舗: テストポーカー店

**店舗情報:**
- 店舗名: テストポーカー店
- 店舗コード: `510`
- 店舗ID: KLDdhiCU3rOI3fQFq4na
- ステータス: アクティブ

**オーナーログイン:**
- URL: https://stackmankai-zeta.vercel.app/store-login
- メールアドレス: test-owner2@example.com
- パスワード: test1234

**店舗ログイン（従業員用）:**
- URL: https://stackmankai-zeta.vercel.app/store-login
- 店舗コード: `510`
- 店舗パスワード: store1234

---

## 👤 従業員アカウント

### 従業員1: 山田太郎

**ログイン情報:**
- URL: https://stackmankai-zeta.vercel.app/employee-login
- 店舗コード: `510`
- ユーザー名: `山田太郎`
- パスワード: `test1234`

**詳細情報:**
- UID: 92ynD0oSZpc2cgukloiWvO9oFPB2
- 表示名: 山田太郎
- メールアドレス: 山田太郎.a47-jk7-r2p@stackmankai.internal
- 招待コード: A47-JK7-R2P
- 役割: employee
- ステータス: active

---

### 従業員2: 田中花子

**ログイン情報:**
- URL: https://stackmankai-zeta.vercel.app/employee-login
- 店舗コード: `510`
- ユーザー名: `tanaka_hanako`
- パスワード: `test1234`

**詳細情報:**
- UID: （Firestoreで確認）
- 表示名: 田中花子
- メールアドレス: tanaka_hanako.0a1-k12-0f0@stackmankai.internal
- 招待コード: 0A1-K12-0F0
- 役割: employee
- ステータス: active

---

## 🎮 プレイヤーアカウント

### プレイヤー1

**ログイン情報:**
- URL: https://stackmankai-zeta.vercel.app/customer-auth
- メールアドレス: `test-player1@example.com`
- パスワード: `test1234`

**詳細情報:**
- UID: nLBqzNP2gccasNhcxbwdIdT1tlw2

---

### プレイヤー2

**ログイン情報:**
- URL: https://stackmankai-zeta.vercel.app/customer-auth
- メールアドレス: `test-player2@example.com`
- パスワード: `test1234`

**詳細情報:**
- UID: SOq55jUHBlQF1dR5cTFi2CSyFOr2

---

## ✅ 動作確認済み

### 従業員ログインテスト結果

```
🔍 従業員ログインテスト

入力データ:
  店舗コード: 510
  ユーザー名: 山田太郎
  パスワード: test1234

Step 1: 店舗IDを取得...
✅ 店舗ID: KLDdhiCU3rOI3fQFq4na

Step 2: 従業員情報を取得...
✅ 従業員情報:
  UID: 92ynD0oSZpc2cgukloiWvO9oFPB2
  ユーザー名: 山田太郎
  表示名: 山田太郎
  メールアドレス: 山田太郎.a47-jk7-r2p@stackmankai.internal

Step 3: Firebase Authenticationでユーザーを確認...
✅ Firebase Auth ユーザー:
  UID: 92ynD0oSZpc2cgukloiWvO9oFPB2
  Email: 山田太郎.a47-jk7-r2p@stackmankai.internal

✅ メールアドレスが一致しています
```

---

## 🔧 実装済みの修正

1. **メールアドレスの小文字化**
   - `lib/firestore-employees.ts`の`generateEmployeeEmail`関数でメールアドレスを小文字に変換
   - Firebase Authenticationの仕様に合わせた修正

2. **Firestoreフィールド名の統一**
   - `generatedEmail` → `email`に変更
   - `loginEmployee`関数で正しくメールアドレスを参照

3. **パスワード表示/非表示ボタン**
   - 従業員ログインページに追加
   - 従業員登録ページに追加

4. **エラーメッセージの改善**
   - 具体的なエラー原因を表示
   - ユーザーが問題を特定しやすくなった

---

## 📝 今後のテスト手順

### 従業員ログインテスト

1. https://stackmankai-zeta.vercel.app/employee-login にアクセス
2. 店舗コード: `510` を入力
3. ユーザー名: `山田太郎` を入力
4. パスワード: `test1234` を入力
5. 「ログイン」ボタンをクリック
6. 従業員ダッシュボードにリダイレクトされることを確認

### プレイヤーログインテスト

1. https://stackmankai-zeta.vercel.app/customer-auth にアクセス
2. メールアドレス: `test-player1@example.com` を入力
3. パスワード: `test1234` を入力
4. 「ログイン」ボタンをクリック
5. プレイヤーダッシュボードにリダイレクトされることを確認

---

## 🎉 まとめ

- ✅ 従業員アカウントが正しく作成されている
- ✅ Firebase AuthenticationとFirestoreのデータが一致している
- ✅ メールアドレスが小文字で統一されている
- ✅ ログイン機能が正常に動作する準備が整っている

**次のステップ:** 本番環境でログインテストを実施してください！
