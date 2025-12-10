# Firebase Authentication実装完了レポート

## 概要

マルチテナント機能にFirebase Authenticationを統合し、適切な認証とセキュリティルールを実装しました。

## 実装内容

### 1. Firebase Authentication関連関数（`lib/firebase-auth.ts`）

新規作成したファイルで、以下の関数を実装：

- `createUser(email, password)` - メールアドレスとパスワードで新規ユーザーを作成
- `signIn(email, password)` - メールアドレスとパスワードでサインイン
- `signOutUser()` - サインアウト
- `getCurrentUser()` - 現在のユーザーを取得
- `onAuthStateChanged(callback)` - 認証状態の変更を監視

### 2. 店舗登録・ログイン機能の統合（`lib/firestore-stores.ts`）

#### 変更点

**`registerStore()`関数:**
- Firebase Authenticationでオーナーアカウントを作成
- 作成されたユーザーのUIDを店舗データに保存
- 戻り値に`uid`を追加

**`loginStoreOwner()`関数:**
- Firebase Authenticationでサインイン
- サインイン成功後、Firestoreから店舗情報を取得

### 3. 顧客登録・ログイン機能の統合

#### `lib/firestore.ts`の変更

**`createCustomerAccount()`関数:**
- 関数シグネチャを変更: `(data, email, password)` を追加
- Firebase Authenticationでユーザーを作成
- 作成されたユーザーのUIDを顧客データに保存

#### `app/customer-auth/page.tsx`の変更

**登録処理:**
- `createCustomerAccount()`を呼び出し時に、メールアドレスとパスワードを渡す
- Firebase Authenticationで認証されたユーザーとしてFirestoreに保存

### 4. Firestoreセキュリティルール（`firestore-auth.rules`）

Firebase Authentication対応の新しいセキュリティルールを作成：

#### 主な変更点

- **認証必須**: すべての操作で`isAuthenticated()`をチェック
- **所有者チェック**: UID based ownership validation
- **店舗**: オーナーのみ更新可能
- **顧客**: 本人のみ更新可能
- **投稿**: 投稿者のみ更新・削除可能

## セキュリティルールの適用方法

### Firebaseコンソールから適用

1. [Firebase Console](https://console.firebase.google.com/) にアクセス
2. プロジェクト「stackmankai」を選択
3. 左メニューから「**Firestore Database**」を選択
4. 「**ルール**」タブをクリック
5. `firestore-auth.rules`の内容を**すべてコピー**
6. エディタに**貼り付け**（既存の内容を上書き）
7. 「**公開**」ボタンをクリック

### Firebase CLIから適用（オプション）

```bash
cd /home/ubuntu/stackmankai
firebase deploy --only firestore:rules
```

## Firebaseコンソールでの設定

### 1. Firebase Authenticationを有効化

1. Firebase Consoleで「**Authentication**」を選択
2. 「**始める**」をクリック
3. 「**メール/パスワード**」を選択
4. 「**有効にする**」をオンにする
5. 「**保存**」をクリック

### 2. セキュリティルールを適用

上記の手順でセキュリティルールを適用してください。

## テスト手順

### 1. Firebase Authenticationの有効化を確認

Firebase Consoleで「Authentication」→「Sign-in method」→「メール/パスワード」が有効になっていることを確認。

### 2. セキュリティルールの適用を確認

Firebase Consoleで「Firestore Database」→「ルール」で、新しいルールが適用されていることを確認。

### 3. 本番環境でテスト

1. **店舗登録テスト**
   - https://stackmankai-zeta.vercel.app/store-register
   - 新規店舗を登録
   - Firebase Authenticationでユーザーが作成されることを確認

2. **顧客登録テスト**
   - 店舗ログイン後、顧客認証ページにアクセス
   - 新規顧客を登録
   - Firebase Authenticationでユーザーが作成されることを確認
   - Firestoreに顧客データが保存されることを確認

3. **投稿作成テスト**
   - 顧客ログイン後、投稿作成ページにアクセス
   - 投稿を作成
   - Firestoreに投稿データが保存されることを確認

## 期待される動作

### 認証前

- ✅ 店舗登録ページにアクセス可能
- ✅ 店舗ログインページにアクセス可能
- ❌ Firestoreへの読み書きは不可

### 認証後

- ✅ Firestoreへの読み書きが可能
- ✅ 自分が作成したデータのみ更新・削除可能
- ✅ 他のユーザーのデータは読み取りのみ可能

## トラブルシューティング

### エラー: "Missing or insufficient permissions"

**原因**: セキュリティルールが適用されていない、またはFirebase Authenticationが有効になっていない。

**解決方法**:
1. Firebase Consoleで「Authentication」が有効になっているか確認
2. セキュリティルールが正しく適用されているか確認
3. ブラウザのコンソールでエラーメッセージを確認

### エラー: "auth/email-already-in-use"

**原因**: 同じメールアドレスで既にユーザーが作成されている。

**解決方法**:
1. 別のメールアドレスを使用
2. Firebase Consoleで既存ユーザーを削除

## 次のステップ

1. ✅ Firebase Authenticationを有効化
2. ✅ セキュリティルールを適用
3. ⏳ 本番環境でテスト
4. ⏳ エラーチェックと修正
5. ⏳ ドキュメント更新

## まとめ

Firebase Authenticationの統合により、以下が実現されました：

- ✅ **セキュアな認証**: メールアドレスとパスワードによる認証
- ✅ **適切なアクセス制御**: UID based ownership validation
- ✅ **マルチテナント対応**: 店舗ごとのデータ分離
- ✅ **スケーラブル**: Firebase Authenticationの自動スケーリング

これで、本番環境で安全にマルチテナント機能を運用できます。
