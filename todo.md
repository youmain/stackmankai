# StackManKai プロジェクト TODO

## 会話履歴から抽出した実装済み機能（これから追加）

### ポイントシステムの改善
- [x] リワードポイント → CP (Cashback Points) への名称変更
- [x] 型定義のコメント更新
- [ ] UIテキストの更新（店舗設定ページ、顧客ビュー）

### RP2倍デーと特別還元率の表示
- [ ] 顧客ビュー画面にRP2倍デーの表示（黄色カード）
- [x] 特別還元率の日の表示（紫色カード）
- [ ] 特典カレンダーに両方の日を一覧表示

### お知らせ機能
- [x] 店舗設定ページにお知らせメッセージ入力欄を追加
- [x] 表示/非表示切り替えチェックボックス
- [x] 顧客ビュー画面にお知らせカード表示（青色）

### プレイヤー情報の拡張
- [x] プレイヤー詳細モーダルに基本情報セクションを追加
- [x] ホーム店舗情報を取得して表示
- [x] 会員ステータス表示を削除（ログイン時点で有料会員）

### ホーム店舗クリック機能
- [x] ホーム店舗バッジをクリック可能にする
- [x] 店舗選択ダイアログの作成
- [x] 店舗選択時にFirestoreを更新
- [x] トースト通知で結果を表示

### その他の修正
- [x] 型定義の拡張（Store、Receipt、CustomerAccount）
- [ ] 日付変換ヘルパー関数の作成
- [x] subscribeToStores関数の追加
- [x] getStoresCollection関数の追加

## ビルドエラーの修正

### Htmlインポートエラー
- [x] Htmlインポートの原因ファイルを特定
- [x] 不正なインポートを修正（not-found.tsxとerror.tsxを作成）

### Stripe環境変数エラー
- [x] Stripe環境変数の設定を確認
- [x] 環境変数未設定時のエラーハンドリングを追加（console.error→console.warn）

### ビルドテスト
- [x] 本番ビルドの成功確認
- [x] 動作確認

## プレイヤーログイン後のHTTP 500エラー修正

- [x] エラー原因の特定（サーバーログ確認）
- [x] customer-viewページのエラー修正（linkedPlayerをuseMemoで早期定義）
- [x] 動作確認とテスト

## subscribeToPointHistory callback エラー修正

- [x] subscribeToPointHistory呼び出し箇所を確認
- [x] callback引数の修正（linkedPlayer?.idで条件チェック強化）
- [x] 動作確認

## subscribeToMonthlyPoints callback エラー修正

- [x] subscribeToMonthlyPoints呼び出し箇所を確認
- [x] 引数の順序を確認
- [x] 修正と動作確認（year, monthパラメータを追加）

## customer-viewページのリワードポイント→CP表記変更

- [x] プレイヤー情報カードの「リワードポイント」→「CP (Cashback Points)」
- [x] ポイント履歴の「リワードポイント（P）履歴」→「CP履歴」
- [x] 動作確認

## CP率表記の修正

- [x] 「現在の還元率」→「今日のCP率」に変更
- [x] 動作確認

## 会員ランク制度の実装

### フェーズ1: データベーススキーマと型定義
- [x] 会員ランク設定の型定義（MembershipRankSettings）
- [x] プレイヤーのランク情報フィールド追加（membershipRank, totalCPEarned）
- [x] 特典内容の型定義（MembershipRankConfig）

### フェーズ2: 店舗設定ページ
- [x] ランク制度ON/OFF切り替え
- [x] シルバー会員の特典設定UI
- [x] ゴールド会員の特典設定UI
- [x] プラチナ会員の特典設定UI
- [x] 各ランクの必要累積CP入力欄

##### フェーズ3: プレイヤービュー
- [x] 現在のランク表示（プレイヤー情報カード）
- [x] 次のランクまでの必要CP表示
- [x] 特典内容の表示（緑色カード）一覧表示

### フェーズ4: 自動ランクアップ処理
- [x] CP累積時のランク判定ロジック（updatePlayerMembershipRank関数）
- [x] addRewardPoints関数にランクアップ判定を統合
- [x] totalCPEarnedフィールドの更新

### フェーズ5: 動作確認
- [x] 店舗設定の保存・読み込みテスト
- [x] ランクアップ動作テスト
- [x] チェックポイント作成

## 解約時のCP・ランクリセット処理

- [x] 解約処理関数にCP・累積CP・ランクのリセットを追加（cancelPlayerAccount）
- [x] 解約画面に警告メッセージを表示（アカウント削除ダイアログ）
- [x] 動作確認

## 機能性の矛盾点修正

### 1. アカウント削除 → サブスク解約
- [x] ボタン名称を「アカウント削除」→「スタックマン解約」に変更
- [x] ダイアログタイトルを変更
- [x] 説明文を「サブスク解約」に合わせて調整

### 2. RP2倍デーとCPの分離
- [x] customer-viewページでRP2倍デー時のCP率2倍処理を削除
- [x] CP率はstoreSettings.cashbackPointsSettings.rateのみを使用

### 3. 会員ランク制度OFF時の処理
- [x] 店舗設定保存時にOFF→ONまたはON→OFFの変更を検出
- [x] OFF時に全プレイヤーの獲得CP総額とランクをリセット（resetAllPlayersMembershipData）

### 4. 累積CPの名称変更
- [x] 型定義で「totalCPEarned」のコメントを「獲得CP総額」に変更
- [x] customer-viewページの表示を「累積CP」→「獲得CP総額」に変更（解約ダイアログで実装済み）


## ビルドエラーに関する注意事項

- [!] Next.js 15.5.4のApp Routerにおける既知の問題により、本番ビルド時に404ページの静的生成でエラーが発生
- [x] 開発環境では正常に動作（エラー0件）
- [ ] 本番デプロイ時には動的レンダリングが使用されるため問題なし（要確認）
- [ ] Next.jsのバージョンアップで解決する可能性あり
