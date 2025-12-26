# データ整合性維持ガイド

**最終更新**: 2025年12月26日  
**対象**: StackManKai 麻雀店舗管理アプリ

---

## 📋 目次

1. [概要](#概要)
2. [データ構造](#データ構造)
3. [整合性ルール](#整合性ルール)
4. [検証スクリプト](#検証スクリプト)
5. [トラブルシューティング](#トラブルシューティング)
6. [定期メンテナンス](#定期メンテナンス)

---

## 概要

このドキュメントは、StackManKaiアプリのFirestoreデータベースの整合性を維持するためのガイドです。

### 重要な原則

1. **すべてのユーザーは`users`コレクションに登録されている必要がある**
2. **店舗スタッフ・顧客は必ず`storeId`を持つ**
3. **店舗データは完全に隔離される**
4. **ロール情報は`users`コレクションで一元管理**

---

## データ構造

### コアコレクション

#### 1. `users`コレクション
すべてのユーザーの基本情報を管理します。

```typescript
{
  uid: string;              // Firebase Auth UID
  email: string;            // メールアドレス
  role: 'store_owner' | 'employee' | 'customer';  // ロール
  storeId: string | null;   // 所属店舗ID（顧客の場合はnull可）
  storeName: string | null; // 所属店舗名
  displayName: string;      // 表示名
  createdAt: Timestamp;     // 作成日時
  updatedAt: Timestamp;     // 更新日時
}
```

**必須フィールド**:
- `uid`: Firebase Auth UIDと一致
- `email`: Firebase Authのメールアドレスと一致
- `role`: 必ず設定（デフォルト: `customer`）
- `storeId`: `store_owner`と`employee`は必須、`customer`はnull可

#### 2. `stores`コレクション
店舗情報を管理します。

```typescript
{
  storeId: string;          // 店舗ID（ドキュメントIDと同じ）
  storeName: string;        // 店舗名
  ownerEmail: string;       // オーナーのメールアドレス
  storePassword: string;    // 従業員ログイン用パスワード（ハッシュ化）
  createdAt: Timestamp;     // 作成日時
  updatedAt: Timestamp;     // 更新日時
}
```

#### 3. 店舗サブコレクション
各店舗のデータは`stores/{storeId}/`配下に保存されます。

- `stores/{storeId}/players`: プレイヤー情報
- `stores/{storeId}/games`: ゲーム情報
- `stores/{storeId}/receipts`: レシート
- `stores/{storeId}/dailySales`: 日次売上
- `stores/{storeId}/dailyRankings`: 日次ランキング
- `stores/{storeId}/monthlyRankings`: 月次ランキング
- `stores/{storeId}/stackManHands`: Stack Man Hand

---

## 整合性ルール

### ルール1: ユーザー登録の完全性

✅ **正しい状態**:
- Firebase Authにユーザーが存在
- `users`コレクションに対応するドキュメントが存在
- `uid`が一致

❌ **問題のある状態**:
- Firebase Authにユーザーが存在するが、`users`コレクションにない
- `users`コレクションにドキュメントがあるが、Firebase Authにない

**修正方法**:
```bash
node scripts/migrate-user-data.js
```

---

### ルール2: ロールとstoreIdの整合性

✅ **正しい状態**:
- `role === 'store_owner'` → `storeId`が設定されている
- `role === 'employee'` → `storeId`が設定されている
- `role === 'customer'` → `storeId`はnullまたは設定されている

❌ **問題のある状態**:
- `role === 'store_owner'`だが`storeId`がnull
- `role === 'employee'`だが`storeId`がnull
- `storeId`が存在しない店舗IDを参照

**修正方法**:
```bash
node scripts/check-data-integrity.js
```

---

### ルール3: 店舗データの隔離

✅ **正しい状態**:
- 各店舗のデータは`stores/{storeId}/`配下に保存
- ユーザーは自分の`storeId`のデータのみアクセス可能

❌ **問題のある状態**:
- 他店舗のデータにアクセスできる
- `storeId`が設定されていないデータが存在

**修正方法**:
```bash
node scripts/validate-store-data.js
```

---

## 検証スクリプト

### 1. データ整合性チェック

**スクリプト**: `scripts/check-data-integrity.js`

**チェック項目**:
- `users`コレクションの存在と完全性
- ロール情報の整合性
- `storeId`の設定状況
- 孤立ユーザーの検出

**実行方法**:
```bash
cd /path/to/stackmankai-fix
node scripts/check-data-integrity.js
```

**出力**:
- コンソールにチェック結果を表示
- `data-integrity-report.json`にレポートを保存

---

### 2. ユーザーデータ移行

**スクリプト**: `scripts/migrate-user-data.js`

**実行内容**:
- Firebase Authユーザーを取得
- `users`コレクションにデータが存在するか確認
- 存在しない場合、デフォルトデータを作成
- 既存データの不整合を修正

**実行方法**:
```bash
# DRY RUN（変更なし）
node scripts/migrate-user-data.js

# 本番実行
node scripts/migrate-user-data.js --production
```

---

### 3. 店舗データ検証

**スクリプト**: `scripts/validate-store-data.js`

**チェック項目**:
- すべての店舗サブコレクションに`storeId`が設定されているか
- 孤立したデータ（存在しない`storeId`を参照）の検出
- データの整合性チェック

**実行方法**:
```bash
node scripts/validate-store-data.js
```

**出力**:
- コンソールに検証結果を表示
- `store-data-validation-report.json`にレポートを保存

---

## トラブルシューティング

### 問題1: ユーザーがログインできない

**症状**:
- Firebase Authでログインは成功するが、アプリ内でエラーが発生

**原因**:
- `users`コレクションにユーザーデータが存在しない
- `role`が設定されていない

**解決方法**:
1. `scripts/check-data-integrity.js`を実行してユーザーデータを確認
2. `scripts/migrate-user-data.js`を実行してユーザーデータを作成
3. Firebaseコンソールで手動でユーザーデータを作成

---

### 問題2: 他店舗のデータが見える

**症状**:
- 他店舗のプレイヤーやゲームが表示される

**原因**:
- Firestoreセキュリティルールが正しく設定されていない
- `storeId`が正しく設定されていない

**解決方法**:
1. Firestoreセキュリティルールをデプロイ
   ```bash
   firebase deploy --only firestore:rules
   ```
2. `scripts/validate-store-data.js`を実行してデータを検証
3. 必要に応じて手動で`storeId`を修正

---

### 問題3: 孤立データが存在する

**症状**:
- `storeId`が設定されているが、店舗が存在しない

**原因**:
- 店舗が削除されたが、関連データが残っている
- データ作成時に誤った`storeId`が設定された

**解決方法**:
1. `scripts/validate-store-data.js`を実行して孤立データを検出
2. Firebaseコンソールで手動でデータを修正または削除
3. 必要に応じて、正しい`storeId`を設定

---

## 定期メンテナンス

### 月次チェックリスト

- [ ] `scripts/check-data-integrity.js`を実行
- [ ] `scripts/validate-store-data.js`を実行
- [ ] レポートを確認し、問題があれば修正
- [ ] Firebaseコンソールでユーザー数・店舗数を確認
- [ ] 孤立データがないか確認

### 年次チェックリスト

- [ ] すべてのFirestoreセキュリティルールを見直し
- [ ] 不要なデータの削除（古いゲーム記録など）
- [ ] バックアップの確認
- [ ] パフォーマンスの最適化

---

## Firebase Admin SDKの設定

検証スクリプトを実行するには、Firebase Admin SDKの設定が必要です。

### 1. サービスアカウントキーの取得

1. [Firebase Console](https://console.firebase.google.com/) にアクセス
2. プロジェクト「stackmankai」を選択
3. 「プロジェクトの設定」→「サービスアカウント」タブ
4. 「新しい秘密鍵の生成」をクリック
5. JSONファイルをダウンロード

### 2. 環境変数の設定

```bash
export GOOGLE_APPLICATION_CREDENTIALS="/path/to/serviceAccountKey.json"
```

### 3. スクリプトの初期化

各スクリプトの先頭に以下を追加：

```javascript
const admin = require('firebase-admin');
const serviceAccount = require(process.env.GOOGLE_APPLICATION_CREDENTIALS);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});
```

---

## まとめ

データ整合性を維持するために：

1. **定期的にチェックスクリプトを実行**
2. **問題が見つかったら速やかに修正**
3. **新機能追加時はセキュリティルールも更新**
4. **ユーザー登録時は必ず`users`コレクションにデータを作成**

これらのルールを守ることで、安全で整合性の高いデータベースを維持できます。
