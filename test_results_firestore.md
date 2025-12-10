# Firestoreデータ確認結果

## テスト日時
2025年12月10日

## 確認対象
- **コレクション**: `posts`
- **ドキュメントID**: `5omYkwG0NmRy62L64SV7`

## Firestoreに保存されたデータ

### ✅ 保存されたフィールド一覧

| フィールド名 | 値 | データ型 | 判定 |
|---|---|---|---|
| authorId | B317sVZBAKSn7akFWn6r | string | ✅ |
| authorName | りゅうさん | string | ✅ |
| comments | 0 | number | ✅ |
| createdAt | 2025年12月10日 14:30:31 UTC+9 | timestamp | ✅ |
| likes | 0 | number | ✅ |
| seekingAdvice | true | boolean | ✅ |
| storeId | store1 | string | ✅ |
| storeName | テスト店舗 | string | ✅ |
| title | 【テスト投稿】Node.jsスクリプトからの投稿作成 | string | ✅ |
| views | 0 | number | ✅ |
| visibility | public | string | ✅ |

### ✅ situation（map型）の内容

| フィールド名 | 値 | データ型 | 判定 |
|---|---|---|---|
| bigBlind | 200 | string | ✅ |
| description | 6人テーブルのキャッシュゲーム。UTGがタイトなプレイヤーでレイズ。自分はBTNでポケットAAを持っています。スタックは十分にあり、どのようにプレイすべきか悩んでいます。 | string | ✅ |
| gameType | キャッシュゲーム | string | ✅ |
| position | BTN | string | ✅ |
| smallBlind | 100 | string | ✅ |
| stackSize | 20000 | string | ✅ |

## 検証結果

### ✅ 成功した項目

1. **Firestoreへのデータ保存**: すべてのフィールドが正しく保存されました
2. **ユーザー情報の紐付け**: `authorId`と`authorName`が正しく保存されました
3. **タイムスタンプ**: `createdAt`がサーバータイムスタンプで正しく保存されました
4. **ネストされたデータ**: `situation`がmap型として正しく保存されました

### 📊 データ整合性

- **投稿ID**: `5omYkwG0NmRy62L64SV7`
- **作成日時**: 2025年12月10日 14:30:31 UTC+9
- **データベース場所**: asia-northeast2

## 結論

**Node.jsスクリプトから直接Firestoreに投稿データを作成し、すべてのフィールドが正しく保存されていることを確認しました。**

これにより、以下が実証されました：

1. ✅ **Firestoreへのデータ保存機能が正常に動作している**
2. ✅ **ユーザー情報が正しく紐づけられている**
3. ✅ **タイムスタンプが正しく記録されている**
4. ✅ **ネストされたデータ構造が正しく保存されている**
