const { initializeApp } = require('firebase/app');
const { getAuth, createUserWithEmailAndPassword } = require('firebase/auth');
const { getFirestore, collection, addDoc, doc, getDoc, serverTimestamp } = require('firebase/firestore');

// Firebase設定
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "AIzaSyDEg_JQfgDHWOJxcLHs8VDLMwNXe1cJhKc",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "stackmankai.firebaseapp.com",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "stackmankai",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "stackmankai.firebasestorage.app",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "1064841836597",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "1:1064841836597:web:f8d7a9d0d3e2b1c4a5f6g7",
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

async function createChatTestAccounts() {
  try {
    const storeId = "KLDdhiCU3rOI3fQFq4na"; // 店舗510
    
    // 店舗情報を取得
    const storeDoc = await getDoc(doc(db, 'stores', storeId));
    if (!storeDoc.exists()) {
      console.log("❌ 店舗が見つかりません");
      return;
    }
    
    const storeName = storeDoc.data().storeName;
    console.log(`\n店舗: ${storeName} (ID: ${storeId})`);
    
    // テストアカウント1を作成
    console.log("\n=== テストアカウント1を作成 ===");
    const email1 = "chattest1@example.com";
    const password1 = "test1234";
    
    try {
      const userCredential1 = await createUserWithEmailAndPassword(auth, email1, password1);
      const user1 = userCredential1.user;
      
      // Firestoreに顧客アカウントを作成
      await addDoc(collection(db, 'customerAccounts'), {
        uid: user1.uid,
        email: email1,
        storeId: storeId,
        storeName: storeName,
        createdAt: serverTimestamp(),
      });
      
      console.log("✅ テストアカウント1を作成しました");
      console.log("   メールアドレス:", email1);
      console.log("   パスワード:", password1);
      console.log("   UID:", user1.uid);
    } catch (error) {
      if (error.code === 'auth/email-already-in-use') {
        console.log("✅ テストアカウント1は既に存在します");
        console.log("   メールアドレス:", email1);
        console.log("   パスワード:", password1);
      } else {
        throw error;
      }
    }
    
    // テストアカウント2を作成
    console.log("\n=== テストアカウント2を作成 ===");
    const email2 = "chattest2@example.com";
    const password2 = "test1234";
    
    try {
      const userCredential2 = await createUserWithEmailAndPassword(auth, email2, password2);
      const user2 = userCredential2.user;
      
      // Firestoreに顧客アカウントを作成
      await addDoc(collection(db, 'customerAccounts'), {
        uid: user2.uid,
        email: email2,
        storeId: storeId,
        storeName: storeName,
        createdAt: serverTimestamp(),
      });
      
      console.log("✅ テストアカウント2を作成しました");
      console.log("   メールアドレス:", email2);
      console.log("   パスワード:", password2);
      console.log("   UID:", user2.uid);
    } catch (error) {
      if (error.code === 'auth/email-already-in-use') {
        console.log("✅ テストアカウント2は既に存在します");
        console.log("   メールアドレス:", email2);
        console.log("   パスワード:", password2);
      } else {
        throw error;
      }
    }
    
    console.log("\n=== チャットテストの手順 ===");
    console.log("1. ブラウザ1でログイン:");
    console.log("   URL: https://stackmankai-zeta.vercel.app/customer-auth");
    console.log("   メールアドレス: chattest1@example.com");
    console.log("   パスワード: test1234");
    console.log("");
    console.log("2. ブラウザ2（シークレットモード）でログイン:");
    console.log("   URL: https://stackmankai-zeta.vercel.app/customer-auth");
    console.log("   メールアドレス: chattest2@example.com");
    console.log("   パスワード: test1234");
    console.log("");
    console.log("3. 両方のブラウザでメニューから「チャット」を選択");
    console.log("4. 一方でメッセージを送信し、もう一方でリアルタイムに表示されることを確認");
    
  } catch (error) {
    console.error("エラー:", error);
  }
}

createChatTestAccounts();
