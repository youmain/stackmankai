# 店舗登録エラー修正サマリー

## 問題点

### 1. Firebase Admin SDK JWT署名エラー
- **エラー内容**: `Invalid JWT Signature`
- **原因**: Firebase Admin SDKの秘密鍵がJWT署名エラーを返していた
- **影響**: サーバー側からのユーザー作成とFirestoreアクセスが失敗

### 2. Firestore REST API権限エラー
- **エラー内容**: `PERMISSION_DENIED: Missing or insufficient permissions`
- **原因**: Firebaseのセキュリティルールがサーバー側からのアクセスを拒否
- **影響**: REST APIを使用したFirestoreアクセスが失敗

## 修正方法

### アプローチの変更
Firebase Admin SDKとREST APIの両方でサーバー側からのFirestoreアクセスが失敗したため、アーキテクチャを以下のように変更しました：

```
修正前:
ユーザー入力 → クライアント → サーバーAPI → Firebase Admin SDK → Firestore
                                            → Firebase Auth

修正後:
ユーザー入力 → クライアント → Firebase Auth (クライアント側)
                            → Firestore (クライアント側)
                            → サーバーAPI (確認のみ)
```

### 実装変更

#### 1. フロントエンド (`app/store-register/page.tsx`)
- **変更前**: サーバーAPIにすべてを委譲
- **変更後**: クライアント側で以下を実行
  - Firebase Authenticationでユーザーを作成
  - Firebase SDKを使用してFirestoreに直接店舗情報を保存
  - ユーザー情報もFirestoreに保存

```typescript
// ユーザー作成
const userCredential = await createUserWithEmailAndPassword(
  auth,
  formData.ownerEmail,
  formData.ownerPassword
)

// Firestoreに直接保存
await setDoc(doc(db, "stores", uid), storeData)
await setDoc(doc(db, "users", uid), userData)
```

#### 2. バックエンド (`app/api/store/register/route.ts`)
- **変更前**: Firebase Admin SDKを使用してユーザー作成とFirestore保存を実行
- **変更後**: 簡略化し、クライアント側で保存されたデータを確認するのみ
  - 店舗コードを生成して返す
  - バリデーションを実行

## メリット

1. **認証の問題を回避**
   - クライアント側の認証済みユーザーとして動作
   - セキュリティルールを満たす

2. **権限の問題を回避**
   - ユーザー認証を通じてFirestoreにアクセス
   - REST APIの権限エラーを回避

3. **シンプルな実装**
   - サーバー側の複雑な認証処理を削除
   - クライアント側のFirebase SDKの標準的な使用方法

## テスト方法

1. ストア登録ページにアクセス: `http://localhost:3002/store-register`
2. フォームに入力して登録
3. Firebase Authenticationでユーザーが作成されることを確認
4. Firestoreの`stores`と`users`コレクションにドキュメントが作成されることを確認

## 関連ファイル

- `app/store-register/page.tsx` - フロントエンド修正
- `app/api/store/register/route.ts` - バックエンド修正
- `lib/firebase-admin.ts` - Firebase Admin SDK初期化（変更なし）
- `lib/firebase.ts` - Firebase SDK初期化（使用）

## 今後の改善案

1. **エラーハンドリングの強化**
   - クライアント側のエラーハンドリングを改善
   - ネットワークエラーの処理

2. **トランザクション処理**
   - 複数のFirestore操作をトランザクションでラップ
   - 一貫性を確保

3. **ローディング状態の改善**
   - 登録処理中の詳細なステップ表示
   - タイムアウト処理の追加
