# StackManKai テストアカウント情報

**作成日:** 2025年12月11日  
**店舗コード:** 510  
**店舗名:** テストポーカー店

---

## 🏪 店舗アカウント

### オーナーログイン
- **メールアドレス:** test-owner2@example.com
- **パスワード:** test1234
- **ログインURL:** https://stackmankai-zeta.vercel.app/store-login

### 店舗ログイン（従業員用）
- **店舗コード:** 510
- **店舗パスワード:** store1234
- **ログインURL:** https://stackmankai-zeta.vercel.app/store-login

---

## 👤 従業員アカウント

### 従業員1: 山田太郎

**ログイン情報:**
- **店舗コード:** 510
- **ユーザー名:** 山田太郎
- **パスワード:** test1234
- **ログインURL:** https://stackmankai-zeta.vercel.app/employee-login

**詳細情報:**
- **UID:** uVxBSCuZxcNb9mhCBBHRpIk6Eay1
- **表示名:** 山田太郎
- **内部メールアドレス:** 山田太郎.A47-JK7-R2P@stackmankai.internal
- **招待コード:** A47-JK7-R2P
- **役割:** employee
- **ステータス:** アクティブ

---

### 従業員2: 田中花子

**ログイン情報:**
- **店舗コード:** 510
- **ユーザー名:** tanaka_hanako
- **パスワード:** test1234
- **ログインURL:** https://stackmankai-zeta.vercel.app/employee-login

**詳細情報:**
- **UID:** bGSsuh0bLYOFkL4qCmlRkCC0vLV2
- **表示名:** 田中花子
- **内部メールアドレス:** tanaka_hanako.0A1-K12-0F0@stackmankai.internal
- **招待コード:** 0A1-K12-0F0
- **役割:** employee
- **ステータス:** アクティブ

---

## 🎮 プレイヤーアカウント

### プレイヤー1

**ログイン情報:**
- **メールアドレス:** test-player1@example.com
- **パスワード:** test1234
- **ログインURL:** https://stackmankai-zeta.vercel.app/customer-auth

**詳細情報:**
- **UID:** nLBqzNP2gccasNhcxbwdIdT1tlw2
- **ステータス:** アクティブ
- **プレミアム:** なし

---

### プレイヤー2

**ログイン情報:**
- **メールアドレス:** test-player2@example.com
- **パスワード:** test1234
- **ログインURL:** https://stackmankai-zeta.vercel.app/customer-auth

**詳細情報:**
- **UID:** SOq55jUHBlQF1dR5cTFi2CSyFOr2
- **ステータス:** アクティブ
- **プレミアム:** なし

---

## 📝 ログイン手順

### 従業員ログイン

1. https://stackmankai-zeta.vercel.app/employee-login にアクセス
2. 以下を入力：
   - 店舗コード: `510`
   - ユーザー名: `山田太郎` または `tanaka_hanako`
   - パスワード: `test1234`
3. 「ログイン」ボタンをクリック
4. 従業員ダッシュボードにリダイレクト

### プレイヤーログイン

1. https://stackmankai-zeta.vercel.app/customer-auth にアクセス
2. 「ログイン」タブを選択
3. 以下を入力：
   - メールアドレス: `test-player1@example.com` または `test-player2@example.com`
   - パスワード: `test1234`
4. 「ログイン」ボタンをクリック
5. プレイヤーダッシュボードにリダイレクト

### オーナーログイン

1. https://stackmankai-zeta.vercel.app/store-login にアクセス
2. 「オーナー」タブを選択
3. 以下を入力：
   - 店舗コード: `510`
   - 店舗パスワード: `store1234`
4. 「ログイン」ボタンをクリック
5. 店舗ダッシュボードにリダイレクト

---

## 🧪 テスト項目

### 従業員機能テスト

- [ ] 従業員ログイン
- [ ] 従業員ダッシュボード表示
- [ ] スタック管理
- [ ] レシート入力
- [ ] プレイヤー管理
- [ ] ゲーム管理
- [ ] 売上確認
- [ ] ランキング確認

### プレイヤー機能テスト

- [ ] プレイヤーログイン
- [ ] プレイヤーダッシュボード表示
- [ ] 貯スタック表示
- [ ] 伝票表示
- [ ] ランキング表示
- [ ] ハンド投稿

### オーナー機能テスト

- [ ] オーナーログイン
- [ ] 店舗ダッシュボード表示
- [ ] 従業員管理
- [ ] 招待コード発行
- [ ] 招待コード共有（コピー・LINE・メッセージ）
- [ ] 売上分析
- [ ] データ分析

---

## 🔐 セキュリティ注意事項

- **本番環境のテストアカウントです**
- パスワードはすべて `test1234` で統一
- テスト終了後、必要に応じてアカウントを削除してください
- サービスアカウントキー (`service-account-key.json`) は `.gitignore` に追加済み

---

## 📊 作成スクリプト

テストアカウントは以下のスクリプトで作成されました：

```bash
npx ts-node --project tsconfig.scripts.json scripts/create-test-accounts.ts
```

再度テストアカウントを作成する場合は、上記コマンドを実行してください。

---

**作成者:** AI Assistant (Manus)  
**最終更新:** 2025年12月11日
