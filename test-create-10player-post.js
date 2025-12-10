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

async function create10PlayerPost() {
  try {
    const postData = {
      title: "【10人テーブルテスト】フルリングでのAKo判断",
      situation: {
        gameType: "キャッシュゲーム",
        position: "BTN",
        smallBlind: "50",
        bigBlind: "100",
        stackSize: "10000",
        description: "10人フルリングのキャッシュゲーム。UTGとUTG+1がリンプ、MP1がレイズ。自分はBTNでAKoを持っています。"
      },
      preflop: {
        holeCards: [
          { suit: "spades", rank: "A" },
          { suit: "hearts", rank: "K" }
        ],
        action: "raise",
        betAmount: "1200",
        description: "UTGとUTG+1がリンプ、MP1が300にレイズ。BTNでAKoを持っているので1200に3betしました。UTG、UTG+1、MP1がコール。",
        players: [
          {
            id: "utg",
            name: "UTG",
            position: 0,
            stack: 9900,
            bet: 1200,
            action: "call",
            isActive: true
          },
          {
            id: "utg1",
            name: "UTG+1",
            position: 1,
            stack: 9900,
            bet: 1200,
            action: "call",
            isActive: true
          },
          {
            id: "utg2",
            name: "UTG+2",
            position: 2,
            stack: 10000,
            bet: 0,
            action: "fold",
            isActive: false
          },
          {
            id: "mp1",
            name: "MP1",
            position: 3,
            stack: 9900,
            bet: 1200,
            action: "call",
            isActive: true
          },
          {
            id: "mp2",
            name: "MP2",
            position: 4,
            stack: 10000,
            bet: 0,
            action: "fold",
            isActive: false
          },
          {
            id: "mp3",
            name: "MP3",
            position: 5,
            stack: 10000,
            bet: 0,
            action: "fold",
            isActive: false
          },
          {
            id: "co",
            name: "CO",
            position: 6,
            stack: 10000,
            bet: 0,
            action: "fold",
            isActive: false
          },
          {
            id: "hero",
            name: "Hero (BTN)",
            position: 7,
            stack: 8800,
            bet: 1200,
            cards: [
              { suit: "spades", rank: "A" },
              { suit: "hearts", rank: "K" }
            ],
            action: "raise",
            isActive: true
          },
          {
            id: "sb",
            name: "SB",
            position: 8,
            stack: 10000,
            bet: 0,
            action: "fold",
            isActive: false
          },
          {
            id: "bb",
            name: "BB",
            position: 9,
            stack: 10000,
            bet: 0,
            action: "fold",
            isActive: false
          }
        ],
        communityCards: [],
        pot: 5050,
        currentBet: 1200,
        heroPosition: 7
      },
      flop: {
        cards: "A♦ Q♣ 7♠",
        action: "bet",
        betAmount: "3000",
        description: "フロップでAがヒット。全員チェック、ヒーローベット3000、UTGとMP1がコール。",
        communityCards: [
          { suit: "diamonds", rank: "A" },
          { suit: "clubs", rank: "Q" },
          { suit: "spades", rank: "7" }
        ],
        players: [
          {
            id: "utg",
            name: "UTG",
            position: 0,
            stack: 6900,
            bet: 3000,
            action: "call",
            isActive: true
          },
          {
            id: "utg1",
            name: "UTG+1",
            position: 1,
            stack: 8700,
            bet: 0,
            action: "fold",
            isActive: false
          },
          {
            id: "mp1",
            name: "MP1",
            position: 3,
            stack: 6900,
            bet: 3000,
            action: "call",
            isActive: true
          },
          {
            id: "hero",
            name: "Hero (BTN)",
            position: 7,
            stack: 5800,
            bet: 3000,
            cards: [
              { suit: "spades", rank: "A" },
              { suit: "hearts", rank: "K" }
            ],
            action: "bet",
            isActive: true
          }
        ],
        pot: 14050,
        currentBet: 3000,
        heroPosition: 7
      },
      turn: {
        card: "2♥",
        action: "check",
        betAmount: "0",
        description: "ターンは2♥。全員チェック。",
        communityCard: { suit: "hearts", rank: "2" },
        players: [
          {
            id: "utg",
            name: "UTG",
            position: 0,
            stack: 6900,
            bet: 0,
            action: "check",
            isActive: true
          },
          {
            id: "mp1",
            name: "MP1",
            position: 3,
            stack: 6900,
            bet: 0,
            action: "check",
            isActive: true
          },
          {
            id: "hero",
            name: "Hero (BTN)",
            position: 7,
            stack: 5800,
            bet: 0,
            cards: [
              { suit: "spades", rank: "A" },
              { suit: "hearts", rank: "K" }
            ],
            action: "check",
            isActive: true
          }
        ],
        communityCards: [
          { suit: "diamonds", rank: "A" },
          { suit: "clubs", rank: "Q" },
          { suit: "spades", rank: "7" },
          { suit: "hearts", rank: "2" }
        ],
        pot: 14050,
        currentBet: 0,
        heroPosition: 7
      },
      river: {
        card: "K♦",
        action: "bet",
        betAmount: "5000",
        description: "リバーでKがヒットしてツーペア。UTGチェック、MP1チェック、ヒーローベット5000、UTGフォールド、MP1コール。ヒーローの勝利！",
        communityCard: { suit: "diamonds", rank: "K" },
        players: [
          {
            id: "utg",
            name: "UTG",
            position: 0,
            stack: 6900,
            bet: 0,
            action: "fold",
            isActive: false
          },
          {
            id: "mp1",
            name: "MP1",
            position: 3,
            stack: 1900,
            bet: 5000,
            action: "call",
            isActive: true,
            cards: [
              { suit: "clubs", rank: "A" },
              { suit: "diamonds", rank: "J" }
            ]
          },
          {
            id: "hero",
            name: "Hero (BTN)",
            position: 7,
            stack: 800,
            bet: 5000,
            cards: [
              { suit: "spades", rank: "A" },
              { suit: "hearts", rank: "K" }
            ],
            action: "bet",
            isActive: true
          }
        ],
        communityCards: [
          { suit: "diamonds", rank: "A" },
          { suit: "clubs", rank: "Q" },
          { suit: "spades", rank: "7" },
          { suit: "hearts", rank: "2" },
          { suit: "diamonds", rank: "K" }
        ],
        pot: 24050,
        currentBet: 5000,
        heroPosition: 7
      },
      reflection: {
        result: "勝利 - AKoのツーペアでAJに勝利し、約24000のポットを獲得",
        thoughts: "10人テーブルでのAKoの3betは正しかったと思います。フロップでトップペアを作り、リバーでツーペアに改善できました。",
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

    console.log("10人テーブルの投稿データを作成中...")
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

create10PlayerPost()
