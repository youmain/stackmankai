# ロギングシステム使用ガイド

## 概要

このプロジェクトでは、環境変数で制御可能なロギングシステムを使用しています。本番環境では重要なログのみを出力し、開発環境では詳細なデバッグ情報を出力できます。

## 基本的な使い方

### 1. モジュールロガーの作成

\`\`\`typescript
import { createModuleLogger } from "@/lib/logger"

const log = createModuleLogger('ModuleName')
\`\`\`

### 2. ログの出力

\`\`\`typescript
// デバッグ情報（開発環境のみ）
log.debug("詳細なデバッグ情報", { data: someData })

// 一般的な情報
log.info("処理が成功しました")

// 警告
log.warn("非推奨の機能を使用しています")

// エラー（本番環境でも出力）
log.error("エラーが発生しました", error)
\`\`\`

## ログレベル

ログレベルは以下の4つがあります（優先度順）：

1. **debug** - 詳細なデバッグ情報（開発環境のみ推奨）
2. **info** - 一般的な情報メッセージ
3. **warn** - 警告メッセージ
4. **error** - エラーメッセージ（本番環境でも出力）

## 環境変数の設定

### `.env.local` または `.env.production`

\`\`\`env
# ログレベルの設定
NEXT_PUBLIC_LOG_LEVEL=error  # 本番環境では error を推奨

# ログを完全に無効化
NEXT_PUBLIC_ENABLE_LOGGING=false
\`\`\`

### デフォルト設定

- **開発環境** (`NODE_ENV=development`): `debug` レベル
- **本番環境** (`NODE_ENV=production`): `error` レベル

## 既存のconsole.logからの移行

### 移行前

\`\`\`typescript
console.log("データを取得しました:", data)
console.error("エラーが発生:", error)
\`\`\`

### 移行後

\`\`\`typescript
import { createModuleLogger } from "@/lib/logger"

const log = createModuleLogger('DataFetcher')

log.debug("データを取得しました:", data)
log.error("エラーが発生:", error)
\`\`\`

## パフォーマンスへの影響

- 本番環境で `NEXT_PUBLIC_LOG_LEVEL=error` に設定すると、debug/info/warnログは完全にスキップされます
- ログが無効化されている場合、ログ処理のオーバーヘッドはほぼゼロです
- 本番環境では必要最小限のログのみを出力することで、パフォーマンスを最適化できます

## ベストプラクティス

1. **モジュールごとにロガーを作成** - `createModuleLogger('ModuleName')` を使用
2. **適切なログレベルを選択** - デバッグ情報は `debug`、エラーは `error`
3. **本番環境では error レベルのみ** - `NEXT_PUBLIC_LOG_LEVEL=error` を設定
4. **機密情報をログに含めない** - パスワード、トークンなどは絶対にログに出力しない
5. **構造化されたデータを渡す** - オブジェクトをそのまま渡すことで、詳細な情報を記録

## 今後の移行計画

現在、コードベース全体に427件以上の `console.log` が存在します。以下の優先順位で段階的に移行します：

1. ✅ コアモジュール（Firebase、Auth）
2. データ取得フック（use-players、use-receipts など）
3. 主要なページコンポーネント
4. その他のコンポーネント
5. スクリプトファイル
