# Firestore クォータ超過分析

## 問題の概要

Firestore の読み取り量が異常に多い（78万回/日）

## Query Insights から判明した最大の問題

### 1. `COLLECTION * SELECT _collection_` - 74回実行

**これが最大の問題です！**

- 全コレクションをスキャンしているクエリ
- 1回のクエリで数千回の読み取りを消費している可能性

**原因の推測：**

`lib/firestore.ts` の 1238 行目の `initializeMockData()` 関数内で、以下のコードが実行されている：

```typescript
for (const collectionName in collections) {
  const docs = await getDocs(collection(db, collectionName))
  // ...
}
```

このコードは、デモモード（`isDemoMode`）が有効な場合に、複数のコレクション全体をスキャンしている。

## 修正方法

### 方法1: デモモードを無効化

`isDemoMode` を `false` に設定すれば、`initializeMockData()` が実行されなくなる。

### 方法2: `initializeMockData()` を削除

デモモード自体が不要であれば、関数全体を削除する。

### 方法3: クエリを最適化

`getDocs(collection(db, collectionName))` の代わりに、`limit()` を使用して読み取り量を制限する。

```typescript
const docs = await getDocs(query(collection(db, collectionName), limit(1)))
```

## 次のステップ

1. `isDemoMode` の値を確認
2. デモモードが有効な場合、無効化するか削除する
3. または、クエリを最適化する
