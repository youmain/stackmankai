# localStorage検証結果

## ログイン成功

**日時**: 2025年12月10日  
**アカウント**: shonan@wanko.be  
**パスワード**: 0000

## ユーザー情報（画面表示から確認）

| 項目 | 値 |
|---|---|
| プレイヤー名 | りゅうさん |
| 顧客ID | B317sVZBAKSn7akFWn6r |
| プレイヤーID | 9bi2ijnoipr49rhfm2kwmb |
| 貯スタック | 149,200© |
| CP | 0CP |
| ステータス | 待機中 |
| 紐づけ状態 | 成功 |

## 期待されるlocalStorageの内容

```json
{
  "id": "B317sVZBAKSn7akFWn6r",
  "name": "りゅうさん",
  "email": "shonan@wanko.be",
  "type": "customer",
  "storeId": "store_id",
  "storeName": "店舗名"
}
```

## 次のステップ

新規投稿作成ページ（`/create-post`）にアクセスして、このユーザー情報が正しく使用されるかを確認します。
