# 本番環境へのデプロイ手順ガイド

## 概要

このガイドでは、ローカルで開発・修正した内容を本番環境にデプロイする手順を説明します。プロジェクトはNext.jsで構築されており、GitHubリポジトリと連携した**Vercel**へのデプロイを推奨します。

## 1. 前提条件

- **Vercelアカウント**: [Vercel](https://vercel.com)に登録済みであること
- **GitHubリポジトリ**: `youmain/stackmankai`へのプッシュ権限があること

## 2. デプロイ手順

### ステップ1: ローカルの変更をGitHubにプッシュ

まず、ローカルで行ったすべての修正をGitHubのリモートリポジトリにプッシュします。

```bash
git push origin main
```

これにより、`origin/main`ブランチがローカルの最新の状態に更新されます。

### ステップ2: Vercelでプロジェクトをインポート

1. [Vercelダッシュボード](https://vercel.com/dashboard)にログインします。
2. **"Add New..."** → **"Project"** をクリックします。
3. **"Import Git Repository"** で `youmain/stackmankai` を選択し、**"Import"** をクリックします。

### ステップ3: プロジェクトの設定

Vercelが自動的にNext.jsプロジェクトを認識します。以下の設定を確認・入力してください。

| 設定項目 | 値 |
|---|---|
| **Framework Preset** | `Next.js` （自動選択） |
| **Root Directory** | `./` （デフォルト） |
| **Build Command** | `pnpm build` |
| **Install Command** | `pnpm install` |
| **Output Directory** | `.next` （自動選択） |

### ステップ4: 環境変数の設定

次に、Firebase連携に必要な環境変数をVercelに設定します。これは**非常に重要**なステップです。

1. プロジェクト設定画面の **"Environment Variables"** を開きます。
2. `.env.local`ファイルの内容を1つずつ追加します。

| 環境変数名 | 値 |
|---|---|
| `NEXT_PUBLIC_FIREBASE_API_KEY` | `your_api_key` |
| `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` | `your_auth_domain` |
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID` | `your_project_id` |
| `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` | `your_storage_bucket` |
| `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` | `your_sender_id` |
| `NEXT_PUBLIC_FIREBASE_APP_ID` | `your_app_id` |

**注**: `.env.local`の値をコピー＆ペーストしてください。

### ステップ5: デプロイの実行

**"Deploy"** ボタンをクリックします。Vercelが自動的にビルドとデプロイを開始します。

数分後、デプロイが完了すると本番URLが発行されます。

## 3. 今後の運用

一度設定すれば、今後は`main`ブランチにプッシュするたびに、Vercelが自動的に新しいバージョンをデプロイします。

```bash
# 1. ローカルで修正
git add .
git commit -m "Fix: 新しいバグを修正"

# 2. GitHubにプッシュ（これだけで自動デプロイが開始）
git push origin main
```

## 4. 注意事項

- **`pnpm`の使用**: Vercelは`pnpm`を自動で認識しますが、もしビルドエラーが発生した場合は、`Install Command`が`pnpm install`になっているか確認してください。
- **環境変数**: 環境変数は一度設定すれば、再デプロイ時も引き継がれます。新しい環境変数を追加した場合は、Vercel側にも追加する必要があります。
- **`next.config.mjs`**: 現在の`next.config.mjs`にはビルドエラーを無視する設定が含まれています。本番環境ではこれらの設定を見直すことを推奨します。

```javascript
// next.config.mjs
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true, // 本番ではfalse推奨
  },
  typescript: {
    ignoreBuildErrors: true, // 本番ではfalse推奨
  },
  // ...
}
```
