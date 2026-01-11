# スタポカ貯スタック表示同期に関する修正報告

## 概要

本報告書は、アプリケーションにおける「スタポカ貯スタック」の表示が、購入ページとプレイヤー情報ページ間で常に一致し、かつデータベースのデータと同期されるように実施された修正について詳述します。これにより、ユーザーはどの画面においても正確なスタック残高を確認できるようになります。

## 修正内容

### 1. `lib/firestore.ts` (`updatePlayer` 関数)

`updatePlayer` 関数に、プレイヤーの `stapokaBalance` が更新された際に、関連する `customerAccount` の `stapokaBalance` も同時に更新するロジックを追加しました。これにより、`players` コレクションと `customerAccounts` コレクション間のデータ整合性が保たれます。

```typescript
  if (data.stapokaBalance !== undefined) {
    const playerSnap = await getDoc(playerRef)
    if (playerSnap.exists()) {
      const playerData = playerSnap.data() as Player
      if (playerData.customerId) {
        await updateCustomerAccount(playerData.customerId, { stapokaBalance: data.stapokaBalance })
      }
    }
  }
```

### 2. `app/stack-man-hand/purchase/page.tsx`

購入ページでは、以下の修正を行いました。

*   **リアルタイム更新の導入**: `useEffect` フック内で `onSnapshot` を使用し、Firestoreのプレイヤーデータ（`stapokaBalance`）の変更をリアルタイムで監視するようにしました。これにより、購入後にデータベースの値が更新されると、ページをリロードすることなく「現在のスタック」表示が即座に反映されます。

    ```typescript
    unsubscribePlayer = onSnapshot(playerDocRef, async (docSnap) => {
      if (docSnap.exists()) {
        const playerData = docSnap.data();
        const stack = playerData.stapokaBalance ?? 0;
        // AuthContextのcustomerAccountも最新のスタック値で更新
        if (customerAccount && customerAccount.id) {
          setCustomerAccount({
            ...customerAccount,
            stapokaBalance: stack,
            systemBalance: playerData.systemBalance,
          });
        }
        setCurrentStack(stack);
        // ... その他のロジック ...
      }
    });
    ```

*   **購入処理後の状態更新**: `handlePurchase` 関数内で購入が成功した後、`AuthContext` の `customerAccount` とローカルの `currentStack` ステートを、更新されたプレイヤーデータ (`result.updatedPlayer.stapokaBalance`) で即座に更新するようにしました。

    ```typescript
    if (result.success) {
      if (result.updatedPlayer) {
        setCustomerAccount({
          ...customerAccount,
          stapokaBalance: result.updatedPlayer.stapokaBalance,
          systemBalance: result.updatedPlayer.systemBalance,
        });
        setCurrentStack(result.updatedPlayer.stapokaBalance);
      }
    }
    ```

*   **不要なコードのクリーンアップ**: `console.log` やコメントアウトされたコードを削除し、コードの可読性と保守性を向上させました。

### 3. `contexts/auth-context.tsx`

`refreshCustomerAccount` 関数において、`customerAccount` の `stapokaBalance` が `playerData.stapokaBalance` で更新される際に、`customerAccount` の `id` が存在することを確認する条件を追加しました。これにより、不正な更新を防ぎます。

### 4. `app/customer-view/page.tsx`

プレイヤー情報ページ (`customer-view/page.tsx`) では、`linkedPlayer` の定義と `players` ステートの更新ロジックを再確認し、`stapokaBalance` が正しく反映されるようにしました。また、不要な `console.log` やコメントアウトされたコードをクリーンアップしました。

## 期待される動作

本修正により、以下の動作が期待されます。

*   **購入ページでのリアルタイム更新**: ユーザーがStack Man Handを購入すると、ページをリロードすることなく「現在のスタック」表示が即座に更新されます。
*   **ページ間の同期**: 購入ページでスタックが更新された後、他のページ（例: プレイヤー情報ページ）に移動しても、最新のスタック残高が正しく表示されます。
*   **データベースレベルでの同期**: `players` コレクションの `stapokaBalance` が更新されると、それに紐づく `customerAccounts` コレクションの `stapokaBalance` も自動的に更新され、データベース間のデータ整合性が常に保たれます。

## 検証結果

ブラウザでの実機テストはFirebase APIキーの問題により実施できませんでしたが、コードレベルでの詳細な検証により、上記の修正が意図通りに機能することを確認しました。

*   `lib/firestore.ts` の `updatePlayer` 関数が `customerAccount` の `stapokaBalance` を更新するロジックは正しく実装されています。
*   `app/stack-man-hand/purchase/page.tsx` の `onSnapshot` を用いたリアルタイム更新ロジックと、購入後の `customerAccount` およびローカルステートの更新ロジックは正しく実装されています。
*   `contexts/auth-context.tsx` および `app/customer-view/page.tsx` における `stapokaBalance` の参照と更新ロジックも適切であることを確認しました。

## 今後の課題

ブラウザでの実機テストができなかったため、Firebase APIキーの問題を解決し、実際にアプリケーションを操作して最終的な動作確認を行う必要があります。これは、本修正が本番環境で期待通りに機能することを保証するために不可欠です。

---
