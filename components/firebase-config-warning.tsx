"use client"

import { isFirebaseConfigured } from "@/lib/firebase"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertTriangle } from "lucide-react"

export function FirebaseConfigWarning() {
  if (isFirebaseConfigured()) return null

  return (
    <Alert className="mb-4 border-red-200 bg-red-50">
      <AlertTriangle className="h-4 w-4 text-red-600" />
      <AlertTitle className="text-red-800">Firebase設定が必要です</AlertTitle>
      <AlertDescription className="text-red-700">
        <div className="font-semibold mb-2">
          このアプリケーションはFirebaseが必須です。以下の環境変数をProject Settingsで設定してください：
        </div>
        <ul className="mt-2 list-disc list-inside space-y-1 text-sm">
          <li>NEXT_PUBLIC_FIREBASE_API_KEY</li>
          <li>NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN</li>
          <li>NEXT_PUBLIC_FIREBASE_PROJECT_ID</li>
          <li>NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET</li>
          <li>NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID</li>
          <li>NEXT_PUBLIC_FIREBASE_APP_ID</li>
        </ul>
        <p className="mt-2 text-sm">
          これらの値は
          <a
            href="https://console.firebase.google.com/"
            target="_blank"
            rel="noopener noreferrer"
            className="underline font-medium"
          >
            Firebaseコンソール
          </a>
          で確認できます。
        </p>
        <div className="mt-4 p-3 bg-blue-50 rounded-md border border-blue-200">
          <p className="text-sm font-medium text-blue-800 mb-2">新しいFirebaseプロジェクトの作成手順：</p>
          <ol className="text-sm text-blue-700 list-decimal list-inside space-y-1">
            <li>Firebase Consoleで新しいプロジェクトを作成</li>
            <li>Firestoreデータベースを有効化</li>
            <li>Authenticationを有効化（必要に応じて）</li>
            <li>プロジェクト設定から上記の環境変数を取得</li>
            <li>v0のProject Settingsで環境変数を設定</li>
          </ol>
        </div>
        <div className="mt-4 p-3 bg-yellow-50 rounded-md border border-yellow-200">
          <p className="text-sm font-medium text-yellow-800">
            ⚠️ 重要: Firebase未設定の場合、データの保存・読み込み機能は動作しません。
          </p>
        </div>
      </AlertDescription>
    </Alert>
  )
}
