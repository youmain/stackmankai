// りゅうさんのサンプルハンド記録を3つ作成するスクリプト
import { initializeApp } from "firebase/app"
import { getFirestore, collection, addDoc, serverTimestamp } from "firebase/firestore"

// Firebase設定（環境変数から取得）
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
}

// Firebase初期化
const app = initializeApp(firebaseConfig)
const db = getFirestore(app)

// りゅうさんのサンプルハンド記録データ
const samplePosts = [
  {
    // 投稿1: アドバイス求む - AAでオールイン負け
    userId: "9bi2ijnoipr49rhfm2kwmb",
    userName: "りゅうさん",
    situation: {
      gameType: "キャッシュゲーム",
      blinds: "1/2",
      position: "UTG",
      stackSize: "200bb",
      description:
        "フルリングでUTGからAAを持ちました。レイズしたところ、BTNから3betが来て、さらにSBから4betが来ました。",
    },
    preflop: {
      holeCards: ["As", "Ah"],
      action: "レイズ → コール（4betに対して）",
      potSize: "40bb",
      description: "AAなのでコールしました。フロップを見てから判断しようと思いました。",
    },
    flop: {
      communityCards: ["Kh", "Qc", "Jd"],
      action: "チェック → オールイン",
      potSize: "120bb",
      description: "相手がオールインしてきました。ストレートドローもあるボードで悩みましたが、AAなのでコールしました。",
    },
    turn: {
      communityCards: ["Kh", "Qc", "Jd", "10s"],
      action: "オールイン済み",
      potSize: "400bb",
      description: "ストレートが完成してしまいました。相手はA9でナッツストレートでした。",
    },
    river: {
      communityCards: ["Kh", "Qc", "Jd", "10s", "2c"],
      action: "オールイン済み",
      potSize: "400bb",
      description: "リバーでも何も変わらず、200bbを失いました。",
    },
    reflection: {
      postCategory: "アドバイス求む",
      handResult: "ショーダウン負け",
      thoughts:
        "AAでフロップオールインをコールしたのは正しかったでしょうか？相手のレンジを考えるとフォールドも検討すべきだったのか悩んでいます。",
      learnings: "ドライボードではないときのAAの扱い方を学びたいです。",
    },
    visibility: {
      isPublic: true,
      allowComments: true,
    },
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  },
  {
    // 投稿2: 気持ちよかったハンド - ブラフ成功
    userId: "9bi2ijnoipr49rhfm2kwmb",
    userName: "りゅうさん",
    situation: {
      gameType: "トーナメント",
      blinds: "100/200",
      position: "CO",
      stackSize: "25bb",
      description: "トーナメント中盤、ショートスタックでCOからのスチール狙いでした。",
    },
    preflop: {
      holeCards: ["7h", "5h"],
      action: "レイズ",
      potSize: "3bb",
      description: "スーテッドコネクターでスチールを狙いました。BTNがコールしてきました。",
    },
    flop: {
      communityCards: ["Ac", "Kd", "2s"],
      action: "ベット",
      potSize: "7bb",
      description: "完全にミスしましたが、Cベットを打ちました。相手がコール。",
    },
    turn: {
      communityCards: ["Ac", "Kd", "2s", "8h"],
      action: "チェック",
      potSize: "15bb",
      description: "何も引けずチェック。相手もチェック。",
    },
    river: {
      communityCards: ["Ac", "Kd", "2s", "8h", "3c"],
      action: "オールイン",
      potSize: "15bb",
      description: "思い切ってオールインブラフを決行。相手がフォールドしてくれました！",
    },
    reflection: {
      postCategory: "気持ちよかったハンド",
      handResult: "ブラフ勝利",
      thoughts:
        "完全にエアーでしたが、相手の弱さを感じ取ってブラフを決めました。トーナメントでは時にはこういう勝負も必要ですね。",
      learnings: "相手の反応をよく観察することの大切さを実感しました。",
    },
    visibility: {
      isPublic: true,
      allowComments: true,
    },
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  },
  {
    // 投稿3: 運が悪かったハンド - セットでフルハウスに負け
    userId: "9bi2ijnoipr49rhfm2kwmb",
    userName: "りゅうさん",
    situation: {
      gameType: "キャッシュゲーム",
      blinds: "2/5",
      position: "MP",
      stackSize: "100bb",
      description: "6人テーブルでMPから参戦。調子よく勝っていた矢先の出来事でした。",
    },
    preflop: {
      holeCards: ["8c", "8d"],
      action: "レイズ",
      potSize: "3bb",
      description: "ポケット8でレイズ。BBがコールしてヘッズアップ。",
    },
    flop: {
      communityCards: ["8s", "Ah", "As"],
      action: "チェック → ベット",
      potSize: "7bb",
      description: "セットができました！相手がチェックしたのでベット。相手がコール。",
    },
    turn: {
      communityCards: ["8s", "Ah", "As", "Kh"],
      action: "ベット → レイズ → コール",
      potSize: "25bb",
      description: "ターンでもベット。相手がレイズしてきましたが、フルハウスドローもあるのでコール。",
    },
    river: {
      communityCards: ["8s", "Ah", "As", "Kh", "Ac"],
      action: "チェック → オールイン → コール",
      potSize: "75bb",
      description:
        "リバーでAが落ちてフルハウス完成！相手のオールインをコールしましたが、相手はAKでより強いフルハウスでした...",
    },
    reflection: {
      postCategory: "運が悪かったハンド",
      handResult: "バッドビート",
      thoughts: "セットでフルハウスができたのに、相手がより強いフルハウスとは...。こういうのがポーカーですね。",
      learnings:
        "フルハウス同士の勝負は避けられない運の要素。長期的に正しい判断を続けることが大切だと改めて思いました。",
    },
    visibility: {
      isPublic: true,
      allowComments: true,
    },
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  },
]

// サンプル投稿を作成する関数
async function createSamplePosts() {
  console.log("[v0] りゅうさんのサンプルハンド記録作成開始...")

  try {
    const postsCollection = collection(db, "posts")

    for (let i = 0; i < samplePosts.length; i++) {
      const post = samplePosts[i]
      console.log(`[v0] 投稿${i + 1}を作成中...`)

      const docRef = await addDoc(postsCollection, post)
      console.log(`[v0] 投稿${i + 1}が作成されました。ID: ${docRef.id}`)
    }

    console.log("[v0] ✅ りゅうさんのサンプルハンド記録3件の作成が完了しました！")
  } catch (error) {
    console.error("[v0] ❌ サンプル投稿作成エラー:", error)
  }
}

// スクリプト実行
createSamplePosts()
