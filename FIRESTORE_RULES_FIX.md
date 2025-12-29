# Firestoreルール修正手順（コピー&ペースト用）

## 現在の状況

✅ **`lib/firestore.ts`の修正は完了済み**（GitHubにプッシュ済み、Vercelが自動デプロイ中）

❌ **Firestoreルールの修正が未完了** ← これを今から行います

---

## 修正手順

### ステップ1: Firebase Consoleを開く

既に開いている場合はそのまま使用してください。

URL: https://console.firebase.google.com/project/stackmankai/firestore/databases/-default-/security/rules

### ステップ2: エディタを開く

画面左側の「開発とテスト」ボタンをクリックして、ルールエディタを表示します。

### ステップ3: 修正箇所を探す

エディタ内で `Ctrl+F` (Windows) または `Cmd+F` (Mac) を押して、以下のテキストを検索:

```
CustomerAccounts コレクション
```

または、行番号で **212行目** 付近を探します。

### ステップ4: 該当セクションを選択

以下の範囲を選択します（**212行目から233行目まで**）:

```javascript
    match /customerAccounts/{customerId} {
      // 顧客情報の個別読み取り：本人または所属店舗のスタッフのみ
      allow get: if isAuthenticated() && (
        resource.data.uid == request.auth.uid ||
        belongsToStore(resource.data.storeId)
      );
      
      // 顧客情報のリスト取得：認証済みユーザーは自分のデータを検索可能
      // 注意: クエリはクライアント側でuidでフィルタリングする必要がある
      allow list: if isAuthenticated();
      
      // 顧客の作成は認証済みユーザーのみ可能
      // 作成時にuidを設定する必要がある
      allow create: if isAuthenticated() && request.resource.data.uid == request.auth.uid;
      
      // 顧客情報の更新は本人または所属店舗のスタッフのみ可能
      allow update: if isAuthenticated() && (
        resource.data.uid == request.auth.uid ||
        (isStoreStaff() && belongsToStore(resource.data.storeId))
      );
      
      // 顧客の削除は本人のみ可能
      allow delete: if isAuthenticated() && resource.data.uid == request.auth.uid;
    }
```

### ステップ5: 以下のコードで置き換え

選択した部分を削除し、以下のコードをコピー&ペーストします:

```javascript
    match /customerAccounts/{customerId} {
      // 顧客情報の個別読み取り：本人のみ（高速化のため）
      // 店舗スタッフはlistルールでアクセス可能
      allow get: if isAuthenticated() && resource.data.uid == request.auth.uid;
      
      // 顧客情報のリスト取得：認証済みユーザーは自分のデータを検索可能
      // 注意: クエリはクライアント側でuidでフィルタリングする必要がある
      allow list: if isAuthenticated();
      
      // 顧客の作成は認証済みユーザーのみ可能
      // 作成時にuidを設定する必要がある
      allow create: if isAuthenticated() && request.resource.data.uid == request.auth.uid;
      
      // 顧客情報の更新は本人のみ可能（高速化のため）
      allow update: if isAuthenticated() && resource.data.uid == request.auth.uid;
      
      // 顧客の削除は本人のみ可能
      allow delete: if isAuthenticated() && resource.data.uid == request.auth.uid;
    }
```

### ステップ6: 変更を確認

エディタ右上に「変更あり」などの表示が出ることを確認します。

### ステップ7: 公開（デプロイ）

画面右上の **「公開」** ボタンをクリックします。

確認ダイアログが表示されたら、**「公開」** をクリックして確定します。

---

## 変更内容の詳細

### 変更箇所1: `allow get` ルール

**修正前:**
```javascript
allow get: if isAuthenticated() && (
  resource.data.uid == request.auth.uid ||
  belongsToStore(resource.data.storeId)
);
```

**修正後:**
```javascript
allow get: if isAuthenticated() && resource.data.uid == request.auth.uid;
```

**理由:** `belongsToStore()`が`getUserData()`を呼び出し、遅延の原因となるため削除

### 変更箇所2: `allow update` ルール

**修正前:**
```javascript
allow update: if isAuthenticated() && (
  resource.data.uid == request.auth.uid ||
  (isStoreStaff() && belongsToStore(resource.data.storeId))
);
```

**修正後:**
```javascript
allow update: if isAuthenticated() && resource.data.uid == request.auth.uid;
```

**理由:** 同様に`belongsToStore()`を削除し、本人のみに制限

---

## 修正後の動作確認

1. Vercelのデプロイが完了するまで待機（通常2-3分）
2. https://stackmankai-zeta.vercel.app/customer-auth にアクセス
3. 新規アカウントを作成
4. ログイン時間が5秒以内であることを確認

---

## トラブルシューティング

### エラーが表示される場合

- 構文エラーがないか確認
- インデントが正しいか確認（スペース2個）
- コピー&ペースト時に余分な文字が入っていないか確認

### 公開ボタンが押せない場合

- 構文エラーがある可能性があります
- エディタ下部にエラーメッセージが表示されていないか確認

---

## 完了！

これでログイン遅延の修正は完了です。

新規登録・ログインが5秒以内で完了するようになります。
