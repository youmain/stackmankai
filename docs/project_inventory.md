# プロジェクトインベントリ：Stack Mankai

このドキュメントは、Stack Mankai プロジェクトの主要なファイル構造、ルーティング、データモデル、およびコアロジックの概要を提供します。今後の開発をスムーズに進めるための共通理解を深めることを目的とします。

## 1. プロジェクト概要

Stack Mankai は、店舗オーナーがポーカーゲームのプレイヤー管理、売上管理、ランキング設定などを行えるWebアプリケーションです。Firebase (Firestore, Authentication) をバックエンドとして利用し、Next.js (App Router) と React で構築されています。

## 2. ディレクトリ構造の概要

| ディレクトリ | 概要 |
| :--- | :--- |
| `app/` | Next.js の App Router に基づくルーティングとページコンポーネント。各URLパスに対応するUIロジックが含まれます。 |
| `components/` | 共通して利用されるUIコンポーネント。再利用可能なボタン、カード、モーダルなどが含まれます。 |
| `contexts/` | React Context API を利用したグローバルな状態管理。認証情報 (`AuthContext`) などが定義されます。 |
| `lib/` | アプリケーションのコアロジック。Firebaseとの連携、Firestoreのデータ操作、認証処理、ポーカーゲームロジックなどが含まれます。 |
| `public/` | 静的ファイル（画像、アイコンなど）。 |
| `scripts/` | 開発・運用時に利用するスクリプト。データ移行、テストアカウント作成などが含まれます。 |
| `styles/` | グローバルなCSSスタイルシート。 |
| `types/` | TypeScript の型定義ファイル。アプリケーション全体で利用されるデータ構造が定義されます。 |

## 3. 主要なルーティング (`app/`)

`app/` ディレクトリには、以下の主要なページコンポーネントが含まれます。

| パス | 概要 |
| :--- | :--- |
| `/` | ホームページ（ランディングページ） |
| `/store-login` | 店舗オーナー・従業員向けのログインページ |
| `/store-register` | 店舗オーナー向けの新規登録ページ |
| `/admin` | 店舗オーナー・従業員向けのダッシュボード |
| `/players` | プレイヤー管理ページ（プレイヤー一覧、登録、編集） |
| `/receipts` | 伝票管理ページ |
| `/daily-sales` | 日次売上管理ページ |
| `/monthly-sales` | 月次売上管理ページ |
| `/rankings` | ランキング表示ページ |
| `/store-ranking-settings` | ランキング設定ページ |
| `/employee-management` | 従業員管理ページ |
| `/store-settings` | 店舗設定ページ |
| `/customer-view` | 顧客向けのビューページ |
| `/my-posts` | ユーザーの投稿一覧ページ |
| `/posts` | 投稿一覧ページ |
| `/games` | ゲーム関連ページ |
| `/stack-man-hand` | スタックマンハンド関連ページ |
| `/password-change` | パスワード変更ページ |
| `/test-firebase-auth` | Firebase認証テストページ（開発用） |

## 4. データモデル (`types/`)

`types/` ディレクトリには、アプリケーションで利用される主要なデータ構造が定義されています。

| ファイル | 主要な型 | 概要 |
| :--- | :--- | :--- |
| `employee.ts` | `Employee` | 従業員情報 |
| `firestore.ts` | `Player`, `Game`, `PaymentHistory` | Firestoreに保存されるプレイヤー、ゲーム、支払い履歴などの主要データ |
| `poker.ts` | `PlayingCard`, `HandRank` | ポーカーゲームのカードや役の定義 |
| `post.ts` | `PostData`, `Comment` | 投稿やコメントのデータ構造 |
| `stack-man-hand.ts` | `StackManHand`, `RakeCollection`, `StackReset` | スタックマンハンド機能、レーキ収集、スタックリセットに関するデータ |
| `store.ts` | `Store`, `StoreRegistrationData` | 店舗情報、店舗登録データ |

## 5. コアロジック (`lib/`)

`lib/` ディレクトリには、アプリケーションのバックエンド連携やビジネスロジックが実装されています。

| ファイル | 概要 |
| :--- | :--- |
| `firebase.ts` | Firebaseアプリケーションの初期化、Firestore/Authインスタンスの取得、`isFirebaseConfigured` や `isDemoMode` の定義。 |
| `firebase-auth.ts` | Firebase Authentication を利用した認証処理（サインイン、サインアウト、ユーザーデータ取得など）。 |
| `firestore.ts` | Firestore のデータ操作（CRUD処理、リアルタイムリスナー `onSnapshot`）。プレイヤー、ゲーム、店舗などのコレクションに対する操作が中心。 |
| `firestore-converters.ts` | Firestore のカスタムオブジェクト変換（`withConverter`）の定義。 |
| `mock-data.ts` | 開発・テスト用のモックデータ。 |
| `performance-monitor.ts` | パフォーマンス計測用のユーティリティ。 |
| `poker-game.ts` | ポーカーゲームのメインロジック。 |
| `scheduled-tasks.ts` | 定期実行されるタスク（レーキ収集、スタックリセットなど）。 |
| `utils.ts` | 汎用的なユーティリティ関数。 |
| `validation.ts` | 入力値のバリデーションロジック。 |

## 6. 共通コンポーネント (`components/`)

`components/` ディレクトリには、UIライブラリ (`shadcn/ui`) をベースとした再利用可能なコンポーネントが含まれます。

| ファイル | 概要 |
| :--- | :--- |
| `auth-guard.tsx` | 認証状態に基づいてアクセスを制御するコンポーネント。 |
| `header.tsx` | アプリケーションのヘッダー部分。ログイン状態に応じた表示切り替え。 |
| `player-registration-modal.tsx` | プレイヤー登録用のモーダルフォーム。 |
| `firebase-config-warning.tsx` | Firebase設定が不完全な場合に表示される警告コンポーネント。 |
| `online-users.tsx` | オンラインユーザー表示コンポーネント。 |
| `ui/` | `shadcn/ui` のラッパーコンポーネント群（ボタン、カード、入力フィールドなど）。 |

このインベントリは、プロジェクトの全体像を把握し、今後の開発における共通言語として機能します。次のステップでは、この情報をもとに具体的な開発ガイドラインを作成します。
