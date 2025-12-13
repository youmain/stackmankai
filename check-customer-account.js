const admin = require('firebase-admin');

// Firebase Admin SDKの初期化
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "stackmankai",
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    }),
  });
}

const db = admin.firestore();

async function checkCustomerAccount() {
  try {
    const customerId = "B317sVZBAKSn7akFWn6r";
    
    console.log("\n=== 顧客アカウント情報 ===");
    
    const customerDoc = await db.collection('customerAccounts').doc(customerId).get();
    
    if (!customerDoc.exists) {
      console.log("❌ 顧客アカウントが見つかりません");
      return;
    }
    
    const customerData = customerDoc.data();
    console.log("\n顧客ID:", customerId);
    console.log("メールアドレス:", customerData.email);
    console.log("プレイヤーID:", customerData.playerId || "(なし)");
    console.log("プレイヤー名:", customerData.playerName || "(なし)");
    console.log("店舗ID:", customerData.storeId);
    console.log("店舗名:", customerData.storeName);
    
    // プレイヤーIDが設定されている場合、プレイヤーが存在するか確認
    if (customerData.playerId) {
      console.log("\n=== プレイヤー存在確認 ===");
      
      // 店舗IDからプレイヤーを検索
      const storeId = customerData.storeId;
      const playerSnapshot = await db
        .collection('stores')
        .doc(storeId)
        .collection('players')
        .where('uniqueId', '==', customerData.playerId)
        .get();
      
      if (playerSnapshot.empty) {
        console.log("❌ プレイヤーが見つかりません（削除された可能性があります）");
        console.log("   → 紐づけ情報をリセットする必要があります");
      } else {
        console.log("✅ プレイヤーが存在します");
        const playerData = playerSnapshot.docs[0].data();
        console.log("   プレイヤー名:", playerData.name);
        console.log("   残高:", playerData.systemBalance);
      }
    } else {
      console.log("\n✅ プレイヤーIDが設定されていません（正常な状態）");
    }
    
  } catch (error) {
    console.error("エラー:", error);
  }
}

checkCustomerAccount();
