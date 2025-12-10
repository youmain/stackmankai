// 投稿作成テストスクリプト
// ブラウザを使わずに直接Firestoreに投稿を作成します

require('dotenv').config({ path: '.env.local' });

const { initializeApp } = require('firebase/app');
const { getFirestore, collection, addDoc, serverTimestamp } = require('firebase/firestore');

// Firebase設定を読み込む
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

console.log('Firebase設定:', {
  ...firebaseConfig,
  apiKey: firebaseConfig.apiKey ? '***' : 'undefined'
});

// Firebaseを初期化
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// テスト用の投稿データ
const testPostData = {
  title: "【テスト投稿】Node.jsスクリプトからの投稿作成",
  situation: {
    gameType: "キャッシュゲーム",
    smallBlind: "100",
    bigBlind: "200",
    position: "BTN",
    stackSize: "20000",
    description: "6人テーブルのキャッシュゲーム。UTGがタイトなプレイヤーでレイズ。自分はBTNでポケットAAを持っています。スタックは十分にあり、どのようにプレイすべきか悩んでいます。"
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
};

// 投稿を作成
async function createTestPost() {
  try {
    console.log('\n投稿データを作成中...');
    
    const postsCollection = collection(db, 'posts');
    const postWithTimestamp = {
      ...testPostData,
      createdAt: serverTimestamp()
    };
    
    const docRef = await addDoc(postsCollection, postWithTimestamp);
    
    console.log('\n✅ 投稿作成成功！');
    console.log('投稿ID:', docRef.id);
    console.log('投稿詳細ページURL: http://localhost:3000/posts/' + docRef.id);
    
    return docRef.id;
  } catch (error) {
    console.error('\n❌ 投稿作成失敗:', error);
    console.error('エラー詳細:', error.message);
    throw error;
  }
}

// スクリプトを実行
createTestPost()
  .then(() => {
    console.log('\nテスト完了');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\nテスト失敗');
    process.exit(1);
  });
