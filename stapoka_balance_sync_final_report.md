## スタポカ貯スタック同期問題の最終検証報告

### 1. 問題の再特定と原因分析

当初、Stack Man Hand (SMH) の購入後、購入ページでは「現在のスタック」が正しく更新されるにもかかわらず、プレイヤー情報ページでは「スタポカ貯スタック」が50,000のまま固定されるという問題が報告されました。

**原因分析の結果、以下の点が判明しました。**

*   **モック環境の初期設定**: FirebaseのAPIキーが利用できないため導入したモック環境において、`lib/firestore.ts` 内の `subscribeToCustomerAccount` 関数が、常に `stapokaBalance` の初期値として50,000を返すように設定されていました。これにより、プレイヤー情報ページは常に固定値を受け取っていました。
*   **モックデータ更新の不完全性**: `updatePlayer` 関数がモック環境下で `players` コレクションの `stapokaBalance` を更新しても、それに紐づく `customerAccounts` のモックデータがリアルタイムで更新され、リスナーに通知される仕組みが不十分でした。
*   **データ参照の不整合**: プレイヤー情報ページが `AuthContext` を介して `customerAccount.stapokaBalance` を参照しているにもかかわらず、その `customerAccount` 自体が最新の `stapokaBalance` を反映していなかったため、表示が固定されていました。

### 2. 同期ロジックの修正

上記の問題を解決するため、以下の修正を `lib/firestore.ts` および `lib/firebase.ts` に適用しました。

*   **`lib/firebase.ts` の `isDemoMode` 定義の改善**: 
    `export const isDemoMode = process.env.NEXT_PUBLIC_USE_MOCK_DATA === 'true'`
    環境変数 `NEXT_PUBLIC_USE_MOCK_DATA` を参照するように修正し、モックモードの制御をより柔軟にしました。

*   **`lib/firebase.ts` の `isFirebaseConfigured()` 関数の修正**: 
    `if (process.env.NEXT_PUBLIC_USE_MOCK_DATA === 'true') return false;`
    `isDemoMode` が `true` の場合、Firebaseが設定されていないと見なすことで、モック環境下ではFirebaseの実際の関数が呼び出されないようにしました。

*   **`lib/firestore.ts` の `mockCustomerAccounts` と `mockPlayersData` の導入**: 
    モック環境下での `players` および `customerAccounts` の状態を保持するための内部データストアを導入しました。これにより、モック環境でもデータの永続性と同期をシミュレートできます。

*   **`lib/firestore.ts` の `updatePlayer` 関数の修正**: 
    `isDemoMode` が `true` の場合、`mockPlayersData` の該当プレイヤーの `stapokaBalance` を更新するとともに、そのプレイヤーに紐づく `mockCustomerAccounts` の `stapokaBalance` も更新するようにロジックを追加しました。これにより、`players` コレクションの更新が `customerAccounts` に伝播するようになりました。

*   **`lib/firestore.ts` の `updateCustomerAccount` 関数のモック実装**: 
    `isDemoMode` が `true` の場合、`mockCustomerAccounts` を更新し、さらに `notifyCustomerAccountListeners` を呼び出すことで、この変更を購読しているリスナーに通知するようにしました。

*   **`lib/firestore.ts` の `subscribeToCustomerAccount` 関数の修正**: 
    `isDemoMode` が `true` の場合、`mockCustomerAccountListeners` にコールバック関数を登録し、`mockCustomerAccounts` の変更が通知されるたびに `callback` を呼び出すようにしました。これにより、プレイヤー情報ページがモック環境下でもリアルタイム更新を受け取れるようになりました。

### 3. 最終検証と期待される動作

ブラウザの不安定性により実機での最終検証は完了できませんでしたが、上記のコード修正により、以下の動作が期待されます。

*   **購入ページ**: SMH購入後、`players` コレクションの `stapokaBalance` が更新され、その変更が `customerAccounts` に伝播し、購入ページの「現在のスタック」表示がリアルタイムで更新されます。
*   **プレイヤー情報ページ**: `AuthContext` を介して `customerAccount` の `stapokaBalance` を購読しているため、`players` コレクションの `stapokaBalance` が更新されると、その変更が `customerAccounts` を経由してプレイヤー情報ページにもリアルタイムで反映され、表示が更新されます。
*   **データソースの整合性**: `players` コレクションの `stapokaBalance` が「真実の源」となり、`customerAccounts` コレクションの `stapokaBalance` も常にそれに同期されるため、アプリケーション全体でスタポカ貯スタックの値に一貫性が保たれます。

この修正により、プレイヤー情報ページでスタポカ貯スタックが50,000に固定される問題は解決され、SMH購入によるスタックの増減がすべての関連ページで正しく反映されるはずです。

もし、実際のFirebase環境での動作確認をご希望される場合は、Firebaseコンソールからクライアント側の設定情報（`apiKey`, `authDomain`, `projectId`, `storageBucket`, `messagingSenderId`, `appId`）をご提供いただければ、再度テストを試みることが可能です。

---
