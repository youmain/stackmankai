# マルチテナント機能デプロイメントガイド

## 概要
このドキュメントでは、マルチテナント機能を本番環境にデプロイする手順を説明します。

## 前提条件

### 必要なアカウント
- ✅ Firebaseプロジェクト
- ✅ Vercelアカウント
- ✅ GitHubリポジトリ（`youmain/stackmankai`）

### 必要な環境変数
```env
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
```

## デプロイ手順

### Step 1: Firebaseセキュリティルールの適用

#### 方法A: Firebaseコンソール（推奨）

1. [Firebase Console](https://console.firebase.google.com/) にアクセス
2. プロジェクトを選択
3. 左メニューから「Firestore Database」を選択
4. 「ルール」タブをクリック
5. `firestore.rules` ファイルの内容をコピー＆ペースト
6. 「公開」ボタンをクリック
7. 確認メッセージが表示されたら「公開」をクリック

#### 方法B: Firebase CLI

```bash
# Firebase CLIをインストール（未インストールの場合）
npm install -g firebase-tools

# Firebaseにログイン
firebase login

# プロジェクトを初期化（初回のみ）
firebase init firestore

# ルールをデプロイ
firebase deploy --only firestore:rules
```

### Step 2: GitHubにプッシュ

```bash
# すべての変更をコミット
git add -A
git commit -m "feat: マルチテナント機能を実装"
git push origin main
```

### Step 3: Vercelで自動デプロイ

GitHubにプッシュすると、Vercelが自動的にデプロイを開始します。

**Vercel Dashboardで確認:**
1. [Vercel Dashboard](https://vercel.com/dashboard) にアクセス
2. プロジェクトを選択
3. 「Deployments」タブでデプロイ状況を確認
4. デプロイが完了したら本番URLにアクセス

### Step 4: 本番環境テスト

#### 1. 店舗登録テスト

1. デプロイされたURLにアクセス
2. `/store-register` にアクセス
3. テスト店舗を登録：
   - 店舗名: テストポーカー店
   - メール: test@example.com
   - オーナーメール: owner@example.com
   - オーナーパスワード: password123
   - 店舗パスワード: store1234
4. 3桁の店舗コードが生成されることを確認
5. 店舗ダッシュボードにリダイレクトされることを確認

#### 2. 店舗ログインテスト

1. `/store-login` にアクセス
2. 従業員ログインをテスト：
   - 店舗コード: （Step 1で生成されたコード）
   - 店舗パスワード: store1234
3. ログインが成功することを確認
4. localStorageに店舗情報が保存されることを確認

#### 3. 顧客登録テスト

1. `/customer-auth` にアクセス
2. 新規登録タブをクリック
3. テスト顧客を登録：
   - メール: customer@example.com
   - パスワード: password123
4. 登録が成功することを確認
5. 店舗情報が顧客に紐付けられることを確認

#### 4. 投稿作成テスト

1. `/create-post` にアクセス
2. テスト投稿を作成
3. 投稿に店舗情報が含まれることを確認
4. Firestoreで投稿データを確認

#### 5. 投稿一覧テスト

1. `/posts` にアクセス
2. 店舗の投稿のみが表示されることを確認
3. 他の店舗の投稿が表示されないことを確認

## トラブルシューティング

### 問題1: Firebaseセキュリティルールエラー

**症状:**
```
FirebaseError: Missing or insufficient permissions
```

**解決方法:**
1. Firebaseコンソールで「ルール」タブを確認
2. `firestore.rules` の内容が正しく適用されているか確認
3. ルールを再度公開

### 問題2: 環境変数が読み込まれない

**症状:**
```
Firebase configuration is missing
```

**解決方法:**
1. Vercel Dashboardで環境変数を確認
2. すべての環境変数が設定されているか確認
3. 環境変数を再設定後、再デプロイ

### 問題3: ビルドエラー

**症状:**
```
Error: Build failed
```

**解決方法:**
1. ローカルでビルドを実行: `pnpm build`
2. エラーメッセージを確認
3. 必要に応じてコードを修正
4. 再度デプロイ

### 問題4: 店舗情報が取得できない

**症状:**
```
店舗情報が見つかりません
```

**解決方法:**
1. ブラウザのlocalStorageを確認
2. 店舗ログインを再度実行
3. ブラウザのキャッシュをクリア

## デプロイ後の確認事項

### セキュリティチェック
- [ ] Firestoreセキュリティルールが適用されている
- [ ] 環境変数が正しく設定されている
- [ ] APIキーが漏洩していない

### 機能チェック
- [ ] 店舗登録が正常に動作する
- [ ] 店舗ログインが正常に動作する
- [ ] 顧客登録が正常に動作する
- [ ] 投稿作成が正常に動作する
- [ ] 投稿一覧のフィルタリングが正常に動作する

### パフォーマンスチェック
- [ ] ページの読み込み速度が適切
- [ ] Firestoreのクエリが最適化されている
- [ ] 画像の最適化が適用されている

## 本番環境の監視

### Firebase Console
- Firestoreの使用量を監視
- セキュリティルールの違反を確認
- エラーログを確認

### Vercel Dashboard
- デプロイメントログを確認
- アクセス数を監視
- エラーレートを確認

## ロールバック手順

### 緊急時のロールバック

1. Vercel Dashboardにアクセス
2. 「Deployments」タブをクリック
3. 前回の正常なデプロイメントを選択
4. 「Promote to Production」をクリック

### Gitでのロールバック

```bash
# 前回のコミットに戻る
git revert HEAD

# 変更をプッシュ
git push origin main

# Vercelが自動的に再デプロイ
```

## 実装済み機能

### Phase 1-3: 基本機能 ✅
- ✅ Store型定義
- ✅ Firestore店舗関連関数
- ✅ 店舗登録ページ（`/store-register`）
- ✅ 店舗ログインページ（`/store-login`）
- ✅ 店舗ダッシュボード（`/store-dashboard`）
- ✅ 投稿作成時の店舗コンテキスト
- ✅ 投稿一覧の店舗フィルタリング
- ✅ 顧客認証時の店舗情報紐付け

### Phase 4-5: セキュリティ ✅
- ✅ Firestoreセキュリティルール
- ✅ セキュリティルール設定ガイド

## 次のステップ

### 短期的な改善
- [ ] Firebase Authenticationの導入
- [ ] エラーハンドリングの強化
- [ ] ローディング状態の改善

### 中期的な改善
- [ ] 店舗スタッフ認証の実装
- [ ] オーナー専用機能の追加
- [ ] 店舗統計情報の表示

### 長期的な改善
- [ ] マルチリージョン対応
- [ ] パフォーマンス最適化
- [ ] A/Bテストの実装

## 参考資料

- [Vercel Deployment Documentation](https://vercel.com/docs/deployments/overview)
- [Firebase Hosting Documentation](https://firebase.google.com/docs/hosting)
- [Next.js Deployment Documentation](https://nextjs.org/docs/deployment)
- [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md) - 基本的なデプロイ手順

---

**作成日**: 2025年12月11日  
**バージョン**: v1.0.0
