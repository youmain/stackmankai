#!/bin/bash

# GitHubにpushするスクリプト
# 使い方: ./git-push.sh

set -e

echo "🚀 GitHubにpushします..."

# リモートURLを確認
CURRENT_URL=$(git remote get-url origin)
echo "📍 現在のリモートURL: $CURRENT_URL"

# GitHubトークンが設定されているか確認
if [ -z "$GITHUB_TOKEN" ]; then
    echo "❌ エラー: GITHUB_TOKENが設定されていません"
    exit 1
fi

# リモートURLにトークンを含める形式に変更
git remote set-url origin "https://x-access-token:${GITHUB_TOKEN}@github.com/youman1314/stackmankai.git"

# push実行
echo "📤 Pushを実行中..."
git push origin main

echo "✅ Pushが完了しました！"
echo "🔄 Vercelが自動的にデプロイを開始します"
