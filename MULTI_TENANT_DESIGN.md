# マルチテナント化設計ドキュメント

**作成日**: 2025年12月10日  
**作成者**: Manus AI

---

## 📋 概要

現在の単一店舗実装を、複数店舗が登録・管理できるマルチテナント型システムに拡張します。

---

## 🎯 目標

### 現状
- 1店舗固定（`storeId: "store1"`, `storeName: "テスト店舗"`）
- 顧客は特定の店舗に紐付いている
- 店舗の登録・管理機能がない

### 目指す姿
- 複数店舗が独立して登録・運営できる
- 各店舗が独自の顧客を管理できる
- 顧客は1つの店舗にのみ所属
- 店舗オーナーが店舗情報を管理できる

---

## 🏗️ システムアーキテクチャ

### ユーザーロール

| ロール | 説明 | 権限 |
|---|---|---|
| **プラットフォーム管理者** | システム全体の管理者 | 全店舗の管理、システム設定 |
| **店舗オーナー** | 店舗の運営者 | 自店舗の管理、顧客管理、投稿管理 |
| **プレイヤー（顧客）** | ポーカープレイヤー | 投稿作成、コメント、いいね |

### データモデル

#### 1. **Stores（店舗）コレクション**

```typescript
interface Store {
  id: string                    // 自動生成ID
  name: string                  // 店舗名
  storeCode: string             // 3桁の店舗コード（例: "123"）
  storePassword: string         // 店舗パスワード（従業員ログイン用）
  
  email: string                 // 店舗の連絡先メール
  phone?: string                // 電話番号
  address?: string              // 住所
  description?: string          // 店舗説明
  logoUrl?: string              // ロゴ画像URL
  websiteUrl?: string           // 公式サイトURL
  
  // 認証情報
  ownerEmail: string            // オーナーのメールアドレス
  ownerPassword: string         // オーナーのパスワード
  
  // ステータス
  status: "active" | "pending" | "suspended"  // 店舗の状態
  
  // タイムスタンプ
  createdAt: Timestamp
  updatedAt: Timestamp
}
```

#### 2. **StoreOwners（店舗オーナー）コレクション** - 削除

店舗オーナーは`Stores`コレクションに統合されます。

#### 3. **Customers（顧客）コレクション** - 既存を拡張

```typescript
interface Customer {
  id: string                    // 自動生成ID
  email: string                 // メールアドレス
  name: string                  // プレイヤー名
  
  // 店舗との紐付け（1店舗のみ）
  storeId: string               // 所属店舗ID
  storeName: string             // 店舗名
  joinedAt: Timestamp           // 参加日時
  
  // タイムスタンプ
  createdAt: Timestamp
  updatedAt: Timestamp
}
```

#### 4. **Posts（投稿）コレクション** - 既存を拡張

```typescript
interface Post {
  // 既存フィールド
  id: string
  title: string
  authorId: string
  authorName: string
  
  // 店舗情報（必須に変更）
  storeId: string               // 投稿が属する店舗ID
  storeName: string             // 店舗名
  
  // 公開範囲
  visibility: "public" | "store" | "friends" | "private"
  // "store": 同じ店舗の顧客のみ閲覧可能
  // "public": 全ユーザーが閲覧可能
  
  // その他既存フィールド...
}
```

---

## 🚀 実装フェーズ

### Phase 1: データベーススキーマの準備
1. Firestoreに`stores`コレクションを作成
2. 既存の`customers`コレクションに`storeId`フィールドを追加
3. 3桁の店舗コード生成ロジックを実装

### Phase 2: 店舗登録・認証機能
1. 店舗オーナー登録ページ（`/store-owner/register`）
2. 店舗オーナーログインページ（`/store-owner/login`）
3. 店舗情報登録フォーム

### Phase 3: 店舗管理ダッシュボード
1. 店舗ダッシュボード（`/store-owner/dashboard`）
2. 店舗情報編集ページ
3. 顧客一覧・管理ページ
4. 投稿管理ページ

### Phase 4: 顧客側の店舗選択機能
1. 顧客登録時の店舗選択
2. 複数店舗への参加機能
3. 店舗切り替え機能

### Phase 5: 投稿の店舗フィルタリング
1. 店舗別投稿一覧
2. 店舗内ランキング
3. 店舗別検索機能

---

## 🔐 認証フロー

### 店舗オーナーの認証フロー

```
【登録】
1. /store-register にアクセス
2. 店舗名、メールアドレス、パスワード、店舗パスワード（従業員用）を入力
3. 3桁の店舗コードを自動生成（例: 123）
4. storesコレクションに店舗情報を作成
5. localStorageに認証情報を保存
6. /store-dashboard にリダイレクト

【ログイン】
1. /store-login にアクセス
2. 店舗コード（3桁）+ 店舗パスワードを入力
3. storesコレクションで認証
4. localStorageに認証情報を保存
5. /store-dashboard にリダイレクト
```

### 顧客の認証フロー（既存を拡張）

```
【登録】
1. /customer-auth にアクセス
2. 店舗コード（3桁）を入力
3. メールアドレス、パスワード、プレイヤー名を入力
4. customersコレクションに登録（storeIdを設定）
5. localStorageに認証情報を保存
6. /customer-view にリダイレクト

【ログイン】
1. /customer-auth にアクセス
2. メールアドレス、パスワードを入力
3. customersコレクションで認証
4. localStorageに認証情報を保存
5. /customer-view にリダイレクト
```

---

## 📊 データアクセス制御

### 投稿の閲覧権限

| visibility | 閲覧可能なユーザー |
|---|---|
| **public** | 全ユーザー |
| **store** | 同じ店舗の顧客のみ |
| **friends** | フレンド登録した顧客のみ（将来実装） |
| **private** | 投稿者本人のみ |

### Firestoreセキュリティルール（例）

```javascript
// 店舗情報は誰でも閲覧可能、オーナーのみ編集可能
match /stores/{storeId} {
  allow read: if true;
  allow write: if request.auth.uid == resource.data.ownerId;
}

// 投稿は公開範囲に応じて閲覧制限
match /posts/{postId} {
  allow read: if resource.data.visibility == 'public' 
              || (resource.data.visibility == 'store' && isStoreCustomer(resource.data.storeId))
              || request.auth.uid == resource.data.authorId;
  allow write: if request.auth.uid == resource.data.authorId;
}
```

---

## 🎨 UI/UX設計

### 店舗オーナー向けページ

1. **店舗登録ページ** (`/store-register`)
   - 店舗名、メールアドレス、パスワード入力
   - 店舗パスワード（従業員ログイン用）入力
   - 3桁の店舗コードを自動生成して表示
   - 店舗情報（住所、電話番号、説明）入力

2. **店舗ログインページ** (`/store-login`)
   - 店舗コード（3桁）入力
   - 店舗パスワード入力
   - 「店舗コードを忘れた場合」リンク

3. **店舗ダッシュボード** (`/store-dashboard`)
   - 店舗コードの表示（大きく目立つように）
   - 店舗の統計情報（顧客数、投稿数、アクティブユーザー数）
   - 最近の投稿一覧
   - 顧客管理へのリンク

4. **顧客管理ページ** (`/store-dashboard/customers`)
   - 顧客一覧（テーブル形式）
   - 顧客の投稿数、最終ログイン日時
   - 顧客の有効化/無効化

### 顧客向けページ（既存を拡張）

1. **顧客認証ページ** (`/customer-auth`) - 既存を拡張
   - 登録タブ：店舗コード（3桁）入力フィールドを追加
   - ログインタブ：既存のまま（メール・パスワード）

2. **顧客ビューページ** (`/customer-view`) - 既存を拡張
   - ヘッダーに現在の店舗名を表示

---

## 🔄 マイグレーション計画

### 既存データの移行

1. **テスト店舗の作成**
   ```javascript
   {
     id: "store1",
     name: "テスト店舗",
     slug: "test-store",
     email: "test@example.com",
     ownerId: "owner1",
     ownerEmail: "owner@example.com",
     status: "active",
     isVerified: true,
     plan: "free",
     createdAt: serverTimestamp()
   }
   ```

2. **既存顧客データの更新**
   - 全顧客の`storeId`を`"store1"`に設定
   - `storeName`を`"テスト店舗"`に設定

3. **既存投稿データの更新**
   - 全投稿の`storeId`を`"store1"`に設定
   - `storeName`を`"テスト店舗"`に設定

---

## ⚠️ 注意事項

### セキュリティ
- 店舗パスワードは平文で保存せず、ハッシュ化して保存
- 店舗コードは重複しないように生成（既存コードをチェック）
- Firestoreセキュリティルールを厳密に設定
- 店舗間のデータ漏洩を防ぐ

### パフォーマンス
- 店舗数が増えた場合のクエリ最適化
- インデックスの適切な設定
- キャッシュ戦略の検討

### スケーラビリティ
- 店舗数の上限を検討（初期は999店舗まで：3桁コードの上限）
- 4桁コードへの拡張可能性
- 将来的なサブドメイン分離の可能性

---

## 📅 実装スケジュール

| フェーズ | 期間 | 内容 |
|---|---|---|
| **Phase 1** | 1日 | データベーススキーマの準備 |
| **Phase 2** | 2日 | 店舗登録・認証機能 |
| **Phase 3** | 3日 | 店舗管理ダッシュボード |
| **Phase 4** | 2日 | 顧客側の店舗選択機能 |
| **Phase 5** | 2日 | 投稿の店舗フィルタリング |
| **テスト** | 1日 | 統合テストとバグ修正 |

**合計**: 約11日

---

## 🎯 次のステップ

1. この設計ドキュメントのレビューと承認
2. Phase 1のデータベーススキーマ実装開始
3. 店舗登録ページのUI/UXモックアップ作成

---

## 📚 参考資料

- [Firestore Data Modeling Best Practices](https://firebase.google.com/docs/firestore/data-model)
- [Multi-Tenancy Patterns](https://docs.microsoft.com/en-us/azure/architecture/patterns/multi-tenancy)
- [Next.js Authentication Patterns](https://nextjs.org/docs/authentication)
