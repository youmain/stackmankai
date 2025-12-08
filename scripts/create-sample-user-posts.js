import { initializeApp } from "firebase/app"
import { getFirestore, collection, addDoc, serverTimestamp } from "firebase/firestore"

// Firebase設定（環境変数から取得）
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "AIzaSyDxxx",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "poker-stack-manager.firebaseapp.com",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "poker-stack-manager",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "poker-stack-manager.appspot.com",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "123456789",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "1:123456789:web:xxx",
}

// Firebase初期化
const app = initializeApp(firebaseConfig)
const db = getFirestore(app)

const CURRENT_USER_ID = "9bi2ijnoipr49rhfm2kwmb"
const CURRENT_USER_NAME = "りゆうさん"

// サンプル投稿データ（3件）
const samplePosts = [
  {
    title: "AA vs KK オールイン判断について",
    situation:
      "6人テーブル、UTGでAAをもらいました。レイズしたところ、BTNから3BBに3bet、さらにSBから24BBに4betが入りました。",
    visibility: "public",
    seekingAdvice: true,
    authorId: CURRENT_USER_ID,
    authorName: CURRENT_USER_NAME,
    storeId: "store1",
    storeName: "東京ポーカークラブ",
    likes: 12,
    comments: 8,
    views: 156,
    preflop: {
      situation: "UTGでAAをもらい、3BBレイズ。BTNから9BBに3bet、SBから24BBに4bet。",
      players: [
        {
          id: "hero",
          name: "Hero",
          position: 0,
          stack: 200,
          bet: 0,
          cards: [
            { suit: "spades", rank: "A" },
            { suit: "hearts", rank: "A" },
          ],
          isActive: true,
        },
        { id: "btn", name: "BTN", position: 5, stack: 180, bet: 24, action: "raise" },
        { id: "sb", name: "SB", position: 6, stack: 220, bet: 24, action: "raise" },
      ],
      communityCards: [],
      pot: 51,
      currentBet: 24,
      heroPosition: 0,
      holeCards: [
        { suit: "spades", rank: "A" },
        { suit: "hearts", rank: "A" },
      ],
      action: "AAでオールインするべきか悩んでいます。相手のレンジを考えると...",
      betAmount: "24",
      description: "プリフロップでの強いハンドに対する判断",
    },
    reflection: {
      result: "勝利",
      thoughts: "結果的にオールインしましたが、相手がKKだったので運良く勝てました。でも判断が正しかったのか不安です。",
      seekingAdvice: true,
      postCategory: "hand-analysis",
      visibility: "public",
    },
  },
  {
    title: "フラッシュドローでのセミブラフ判断",
    situation:
      "9人テーブルのキャッシュゲーム（1BB/2BB）。MP1でA♠7♠をもらい、フロップでナッツフラッシュドローになりました。",
    visibility: "store",
    seekingAdvice: true,
    authorId: CURRENT_USER_ID,
    authorName: CURRENT_USER_NAME,
    storeId: "store1",
    storeName: "東京ポーカークラブ",
    likes: 18,
    comments: 12,
    views: 234,
    preflop: {
      situation: "MP1でA♠7♠をもらい、2.5BBにオープンレイズ。BTNがコール、BBもコール。",
      players: [
        {
          id: "hero",
          name: "Hero",
          position: 2,
          stack: 180,
          bet: 2.5,
          cards: [
            { suit: "spades", rank: "A" },
            { suit: "spades", rank: "7" },
          ],
          isActive: true,
        },
        { id: "btn", name: "BTN", position: 5, stack: 220, bet: 2.5, action: "call" },
        { id: "bb", name: "BB", position: 7, stack: 195, bet: 2.5, action: "call" },
      ],
      communityCards: [],
      pot: 7.5,
      currentBet: 2.5,
      heroPosition: 2,
      holeCards: [
        { suit: "spades", rank: "A" },
        { suit: "spades", rank: "7" },
      ],
      action: "スーテッドエースなので軽くオープン。マルチウェイになりそうな予感。",
      betAmount: "2.5",
      description: "スーテッドエースでのオープンレイズ",
    },
    flop: {
      communityCards: [
        { suit: "spades", rank: "K" },
        { suit: "spades", rank: "9" },
        { suit: "diamonds", rank: "4" },
      ],
      action: "bet",
      betAmount: "5",
      description: "ナッツフラッシュドロー！Cベットで主導権を取りに行く。",
    },
    turn: {
      communityCard: { suit: "clubs", rank: "2" },
      action: "call",
      betAmount: "35",
      description: "ブランクターン。継続ベットしたら大きくレイズされた。フラッシュドローでコールするべき？",
    },
    river: {
      communityCard: { suit: "spades", rank: "3" },
      action: "call",
      betAmount: "45",
      description: "フラッシュ完成！でも相手のベットサイズが気になる。レイズするべきだった？",
    },
    reflection: {
      result: "勝利",
      thoughts:
        "結果的にナッツフラッシュで勝ちましたが、ターンでのコール判断とリバーでのプレイに疑問が残ります。特にリバーでレイズしなかったのは消極的すぎたかもしれません。",
      seekingAdvice: true,
      postCategory: "hand-analysis",
      visibility: "store",
    },
  },
  {
    title: "トップペアでのバリューベット判断",
    situation: "6人テーブル、COでAKoをもらいました。フロップでトップペアになりましたが、相手の反応が気になります。",
    visibility: "public",
    seekingAdvice: false,
    authorId: CURRENT_USER_ID,
    authorName: CURRENT_USER_NAME,
    storeId: "store1",
    storeName: "東京ポーカークラブ",
    likes: 8,
    comments: 5,
    views: 98,
    preflop: {
      situation: "COでAKoをもらい、3BBにオープンレイズ。BBがコール。",
      players: [
        {
          id: "hero",
          name: "Hero",
          position: 4,
          stack: 150,
          bet: 3,
          cards: [
            { suit: "hearts", rank: "A" },
            { suit: "clubs", rank: "K" },
          ],
          isActive: true,
        },
        { id: "bb", name: "BB", position: 7, stack: 140, bet: 3, action: "call" },
      ],
      communityCards: [],
      pot: 6,
      currentBet: 3,
      heroPosition: 4,
      holeCards: [
        { suit: "hearts", rank: "A" },
        { suit: "clubs", rank: "K" },
      ],
      action: "プレミアムハンドなので標準的なオープンレイズ。",
      betAmount: "3",
      description: "AKoでのオープンレイズ",
    },
    flop: {
      communityCards: [
        { suit: "hearts", rank: "A" },
        { suit: "diamonds", rank: "7" },
        { suit: "clubs", rank: "3" },
      ],
      action: "bet",
      betAmount: "4",
      description: "トップペア・トップキッカー。Cベットでバリューを取りに行く。",
    },
    turn: {
      communityCard: { suit: "spades", rank: "9" },
      action: "bet",
      betAmount: "8",
      description: "ブランクターン。継続してバリューベット。",
    },
    river: {
      communityCard: { suit: "hearts", rank: "2" },
      action: "bet",
      betAmount: "12",
      description: "リバーもブランク。バリューベットを継続。",
    },
    reflection: {
      result: "勝利",
      thoughts: "相手はミドルペアでコールダウンしてくれました。バリューベットのサイジングが適切だったと思います。",
      seekingAdvice: false,
      postCategory: "hand-analysis",
      visibility: "public",
    },
  },
]

async function createSamplePosts() {
  try {
    console.log("[v0] サンプル投稿データ作成開始...")
    console.log(`[v0] ユーザー: ${CURRENT_USER_NAME} (ID: ${CURRENT_USER_ID})`)

    const postsCollection = collection(db, "posts")

    for (let i = 0; i < samplePosts.length; i++) {
      const post = samplePosts[i]
      const postWithTimestamp = {
        ...post,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      }

      const docRef = await addDoc(postsCollection, postWithTimestamp)
      console.log(`[v0] サンプル投稿 ${i + 1}/3 作成完了, ID:`, docRef.id)
      console.log(`[v0] タイトル: ${post.title}`)
    }

    console.log("[v0] ✅ 全てのサンプル投稿データ作成完了！")
    console.log("[v0] 作成された投稿数:", samplePosts.length)
  } catch (error) {
    console.error("[v0] ❌ サンプル投稿データ作成エラー:", error)
    throw error
  }
}

// スクリプト実行
createSamplePosts()
  .then(() => {
    console.log("[v0] スクリプト実行完了")
    process.exit(0)
  })
  .catch((error) => {
    console.error("[v0] スクリプト実行エラー:", error)
    process.exit(1)
  })
