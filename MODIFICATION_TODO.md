# MenuModal修正 - TODO リスト

## 修正内容
プレイヤー情報の紐付けが成功している場合にのみ、プレイヤー向けメニュー（11項目）を表示

## 要件の11項目
1. ダッシュボード
2. ポーカーランキング
3. 詳細データを見る
4. 統計データをリセット
5. プレイヤーID変更
6. チャット
7. Stack Man Hand購入
8. ハンド記録を見る
9. 自分の投稿履歴
10. スタックマン解約
11. ログアウト

## 修正内容の詳細

### MenuModal.tsx の修正
- [ ] linkedPlayerが存在する場合のみ、11項目のメニューを表示
- [ ] 「AIポーカープレイヤー紹介」を削除
- [ ] 「ダッシュボード」を追加（main viewへの遷移）
- [ ] メニュー項目の順序を要件に合わせて調整
- [ ] linkedPlayerが存在しない場合は、プレイヤー情報紐付けのメッセージのみ表示

### 実装の流れ
1. MenuModal.tsxを修正
2. ローカルで動作確認
3. GitにCommit＆Push
4. Vercelへデプロイ

## 修正ファイル
- components/customer-view/modals/MenuModal.tsx

## デプロイ情報
- リポジトリ: https://github.com/youmain/stackmankai
- デプロイ先: Vercel
