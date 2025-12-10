require('dotenv').config({ path: '.env.local' })
const { initializeApp } = require('firebase/app')
const { getFirestore, collection, addDoc, serverTimestamp } = require('firebase/firestore')

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
}

const app = initializeApp(firebaseConfig)
const db = getFirestore(app)

async function createFullPost() {
  try {
    const postData = {
      title: "【完全版テスト】AA vs KK プリフロップ4betの判断",
      situation: {
        gameType: "キャッシュゲーム",
        position: "BTN",
        smallBlind: "100",
        bigBlind: "200",
        stackSize: "20000",
        description: "6人テーブルのキャッシュゲーム。UTGがタイトなプレイヤーで3bbにレイズ。COが9bbに3bet。自分はBTNでポケットAAを持っています。どのようにプレイすべきか悩んでいます。"
      },
      preflop: {
        holeCards: [
          { suit: "spades", rank: "A" },
          { suit: "hearts", rank: "A" }
        ],
        action: "raise",
        betAmount: "2400",
        description: "UTGが600にレイズ、COが1800に3bet。BTNでAAを持っているので24bbに4betしました。UTGフォールド、COコール。",
        players: [
          {
            id: "utg",
            name: "UTG",
            position: 0,
            stack: 20000,
            bet: 0,
            action: "fold",
            isActive: false
          },
          {
            id: "co",
            name: "CO",
            position: 4,
            stack: 17600,
            bet: 2400,
            action: "call",
            isActive: true
          },
          {
            id: "hero",
            name: "Hero (BTN)",
            position: 5,
            stack: 17600,
            bet: 2400,
            cards: [
              { suit: "spades", rank: "A" },
              { suit: "hearts", rank: "A" }
            ],
            isActive: true
          }
        ],
        communityCards: [],
        pot: 5100,
        currentBet: 2400,
        heroPosition: 5
      },
      flop: {
        cards: "K♥ 7♦ 2♣",
        action: "bet",
        betAmount: "3000",
        description: "フロップでKが出ました。COチェック、ヒーローベット3000、COコール。",
        communityCards: [
          { suit: "hearts", rank: "K" },
          { suit: "diamonds", rank: "7" },
          { suit: "clubs", rank: "2" }
        ],
        players: [
          {
            id: "co",
            name: "CO",
            position: 4,
            stack: 15200,
            bet: 3000,
            action: "call",
            isActive: true
          },
          {
            id: "hero",
            name: "Hero (BTN)",
            position: 5,
            stack: 14600,
            bet: 3000,
            cards: [
              { suit: "spades", rank: "A" },
              { suit: "hearts", rank: "A" }
            ],
            isActive: true,
            action: "bet"
          }
        ],
        pot: 11100,
        currentBet: 3000,
        heroPosition: 5
      },
      turn: {
        card: "4♠",
        action: "bet",
        betAmount: "7000",
        description: "ターンは4♠。COチェック、ヒーローベット7000、COコール。",
        communityCard: { suit: "spades", rank: "4" },
        players: [
          {
            id: "co",
            name: "CO",
            position: 4,
            stack: 8200,
            bet: 7000,
            action: "call",
            isActive: true
          },
          {
            id: "hero",
            name: "Hero (BTN)",
            position: 5,
            stack: 7600,
            bet: 7000,
            cards: [
              { suit: "spades", rank: "A" },
              { suit: "hearts", rank: "A" }
            ],
            isActive: true,
            action: "bet"
          }
        ],
        communityCards: [
          { suit: "hearts", rank: "K" },
          { suit: "diamonds", rank: "7" },
          { suit: "clubs", rank: "2" },
          { suit: "spades", rank: "4" }
        ],
        pot: 25100,
        currentBet: 7000,
        heroPosition: 5
      },
      river: {
        card: "9♥",
        action: "all-in",
        betAmount: "7600",
        description: "リバーは9♥。COチェック、ヒーローオールイン7600、COコール。相手はKKでセットを持っていましたが、私のAAが勝利しました！",
        communityCard: { suit: "hearts", rank: "9" },
        players: [
          {
            id: "co",
            name: "CO",
            position: 4,
            stack: 600,
            bet: 7600,
            action: "call",
            isActive: true,
            cards: [
              { suit: "diamonds", rank: "K" },
              { suit: "clubs", rank: "K" }
            ]
          },
          {
            id: "hero",
            name: "Hero (BTN)",
            position: 5,
            stack: 0,
            bet: 7600,
            cards: [
              { suit: "spades", rank: "A" },
              { suit: "hearts", rank: "A" }
            ],
            isActive: true,
            action: "all-in"
          }
        ],
        communityCards: [
          { suit: "hearts", rank: "K" },
          { suit: "diamonds", rank: "7" },
          { suit: "clubs", rank: "2" },
          { suit: "spades", rank: "4" },
          { suit: "hearts", rank: "9" }
        ],
        pot: 40300,
        currentBet: 7600,
        heroPosition: 5
      },
      reflection: {
        result: "勝利 - AAがKKのセットに勝利し、約40000のポットを獲得",
        thoughts: "結果的にオールインして勝つことができましたが、フロップでKが出た時点で相手がKKを持っている可能性を考慮すべきでした。ターンでのベットサイズも大きすぎたかもしれません。",
        seekingAdvice: true,
        postCategory: "プリフロップ戦略",
        visibility: "public"
      },
      visibility: "public",
      seekingAdvice: true,
      authorId: "B317sVZBAKSn7akFWn6r",
      authorName: "りゅうさん",
      storeId: "store1",
      storeName: "テスト店舗",
      likes: 0,
      comments: 0,
      views: 0,
      createdAt: serverTimestamp()
    }

    console.log("投稿データを作成中...")
    const docRef = await addDoc(collection(db, "posts"), postData)
    console.log("✅ 投稿作成成功！")
    console.log("投稿ID:", docRef.id)
    console.log("投稿詳細ページURL:", `http://localhost:3000/posts/${docRef.id}`)
    
    process.exit(0)
  } catch (error) {
    console.error("❌ エラー:", error)
    process.exit(1)
  }
}

createFullPost()
