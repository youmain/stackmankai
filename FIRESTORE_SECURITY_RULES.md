# Firestoreセキュリティルール設定ガイド

## 概要
このドキュメントでは、マルチテナント機能に対応したFirestoreセキュリティルールの設定方法を説明します。

## セキュリティルールファイル
`firestore.rules` ファイルに、以下のコレクションに対するアクセス制御ルールを定義しています。

## コレクション別ルール

### 1. Stores（店舗）
```javascript
match /stores/{storeId} {
  allow read: if true;     // 誰でも読み取り可能（店舗コードでログインするため）
  allow create: if true;   // 誰でも新規登録可能
  allow update: if true;   // 更新可能（将来的にオーナー認証を追加）
  allow delete: if false;  // 削除不可
}
```

**理由:**
- 店舗コードでログインするため、店舗情報の読み取りは公開
- 新規店舗登録は誰でも可能（無料サービス）
- 削除は禁止（データ保護）

### 2. Customers（顧客）
```javascript
match /customers/{customerId} {
  allow read: if true;     // 誰でも読み取り可能（テスト期間中）
  allow create: if true;   // 誰でも新規登録可能
  allow update: if true;   // 更新可能（将来的に本人のみに制限）
  allow delete: if false;  // 削除不可
}
```

**理由:**
- テスト期間中は制限を緩和
- 将来的にFirebase Authenticationを導入して本人のみに制限

### 3. Posts（投稿）
```javascript
match /posts/{postId} {
  allow read: if true;     // 誰でも読み取り可能
  allow create: if true;   // 誰でも作成可能（テスト期間中）
  allow update: if true;   // 更新可能（将来的に作成者のみに制限）
  allow delete: if true;   // 削除可能（将来的に作成者のみに制限）
}
```

**理由:**
- コミュニティ機能のため、投稿は公開
- 将来的に作成者のみが編集・削除できるように制限

### 4. Players（プレイヤー）
```javascript
match /players/{playerId} {
  allow read: if true;     // 誰でも読み取り可能
  allow create: if true;   // 作成可能（将来的に店舗スタッフのみに制限）
  allow update: if true;   // 更新可能（将来的に店舗スタッフのみに制限）
  allow delete: if true;   // 削除可能（将来的に店舗スタッフのみに制限）
}
```

**理由:**
- ランキング表示のため、プレイヤー情報は公開
- 将来的に店舗スタッフのみが編集できるように制限

### 5. Games（ゲーム）
```javascript
match /games/{gameId} {
  allow read: if true;     // 誰でも読み取り可能
  allow create: if true;   // 作成可能（将来的に店舗スタッフのみに制限）
  allow update: if true;   // 更新可能（将来的に店舗スタッフのみに制限）
  allow delete: if true;   // 削除可能（将来的に店舗スタッフのみに制限）
}
```

**理由:**
- ゲーム履歴は公開情報
- 将来的に店舗スタッフのみが編集できるように制限

### 6. Rankings（ランキング）
```javascript
match /rankings/{rankingId} {
  allow read: if true;     // 誰でも読み取り可能
  allow create: if true;   // 作成可能（将来的に店舗スタッフのみに制限）
  allow update: if true;   // 更新可能（将来的に店舗スタッフのみに制限）
  allow delete: if true;   // 削除可能（将来的に店舗スタッフのみに制限）
}
```

**理由:**
- ランキングは公開情報
- 将来的に店舗スタッフのみが編集できるように制限

## 設定方法

### 1. Firebaseコンソールで設定

1. [Firebase Console](https://console.firebase.google.com/) にアクセス
2. プロジェクトを選択
3. 左メニューから「Firestore Database」を選択
4. 「ルール」タブをクリック
5. `firestore.rules` ファイルの内容をコピー＆ペースト
6. 「公開」ボタンをクリック

### 2. Firebase CLIで設定

```bash
# Firebase CLIをインストール
npm install -g firebase-tools

# Firebaseにログイン
firebase login

# プロジェクトを初期化
firebase init firestore

# ルールをデプロイ
firebase deploy --only firestore:rules
```

## 将来の改善計画

### Phase 1: Firebase Authentication導入
- [ ] Firebase Authenticationを導入
- [ ] メール/パスワード認証を実装
- [ ] 顧客情報の更新・削除を本人のみに制限

### Phase 2: 店舗スタッフ認証
- [ ] 店舗スタッフ用のカスタムクレームを追加
- [ ] プレイヤー・ゲーム・ランキングの編集を店舗スタッフのみに制限

### Phase 3: オーナー認証
- [ ] オーナー用のカスタムクレームを追加
- [ ] 店舗情報の更新をオーナーのみに制限

### Phase 4: 店舗ごとのデータ分離
- [ ] 投稿の読み取りを店舗メンバーのみに制限（店舗限定投稿）
- [ ] プレイヤー・ゲーム・ランキングの読み取りを店舗メンバーのみに制限

## セキュリティルールの例（将来の実装）

### 店舗スタッフ認証の例
```javascript
// カスタムクレームで店舗スタッフを識別
function isStoreStaff(storeId) {
  return isAuthenticated() && 
         request.auth.token.storeId == storeId &&
         request.auth.token.role == 'staff';
}

match /players/{playerId} {
  allow read: if true;
  allow create, update, delete: if isStoreStaff(resource.data.storeId);
}
```

### オーナー認証の例
```javascript
// カスタムクレームで店舗オーナーを識別
function isStoreOwner(storeId) {
  return isAuthenticated() && 
         request.auth.token.storeId == storeId &&
         request.auth.token.role == 'owner';
}

match /stores/{storeId} {
  allow read: if true;
  allow create: if true;
  allow update: if isStoreOwner(storeId);
  allow delete: if false;
}
```

### 店舗限定投稿の例
```javascript
match /posts/{postId} {
  // 公開投稿は誰でも読める
  allow read: if resource.data.visibility == 'public';
  
  // 店舗限定投稿は店舗メンバーのみ読める
  allow read: if resource.data.visibility == 'store' && 
                 isAuthenticated() && 
                 request.auth.token.storeId == resource.data.storeId;
  
  // 作成は認証済みユーザーのみ
  allow create: if isAuthenticated();
  
  // 更新・削除は作成者のみ
  allow update, delete: if isAuthenticated() && 
                           request.auth.uid == resource.data.userId;
}
```

## テスト方法

### 1. Firebaseコンソールでテスト

1. Firebaseコンソールの「ルール」タブで「ルールプレイグラウンド」をクリック
2. テストケースを入力して実行

### 2. Firebase Emulatorでテスト

```bash
# Emulatorをインストール
firebase init emulators

# Emulatorを起動
firebase emulators:start

# ブラウザで http://localhost:4000 にアクセス
```

## 注意事項

### 現在の制限事項
- ⚠️ テスト期間中は認証なしでアクセス可能
- ⚠️ 本番環境では必ずFirebase Authenticationを導入すること
- ⚠️ 顧客データの保護が不十分

### 推奨事項
- ✅ 本番環境デプロイ前にFirebase Authenticationを導入
- ✅ 定期的にセキュリティルールを見直す
- ✅ Firebase Emulatorでテストを実施

## 参考資料

- [Firebase Security Rules Documentation](https://firebase.google.com/docs/firestore/security/get-started)
- [Firebase Authentication Documentation](https://firebase.google.com/docs/auth)
- [Custom Claims Documentation](https://firebase.google.com/docs/auth/admin/custom-claims)

---

**作成日**: 2025年12月11日  
**バージョン**: v1.0.0
