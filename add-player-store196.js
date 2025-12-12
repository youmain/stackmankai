const admin = require('firebase-admin');
const serviceAccount = require('./service-account-key.json');

// Firebase Admin SDKの初期化
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

const db = admin.firestore();

async function addPlayerToStore196() {
  console.log('🔍 店舗196のstoreIdを取得中...\n');
  
  try {
    // 店舗コード196の店舗IDを取得
    const storesSnapshot = await db.collection('stores').where('storeCode', '==', '196').get();
    
    if (storesSnapshot.empty) {
      console.log('❌ 店舗196が見つかりませんでした');
      return;
    }
    
    const storeDoc = storesSnapshot.docs[0];
    const storeId = storeDoc.id;
    const storeName = storeDoc.data().name;
    
    console.log(`✅ 店舗情報:`);
    console.log(`  店舗ID: ${storeId}`);
    console.log(`  店舗名: ${storeName}`);
    console.log(`  店舗コード: 196\n`);
    
    // プレイヤーを追加
    const playerData = {
      name: 'テストプレイヤーC',
      pokerName: 'ポーカーC',
      furigana: '',
      systemBalance: 15000,
      storeId: storeId,
      status: 'active',
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    };
    
    const playerRef = await db.collection('players').add(playerData);
    
    console.log(`✅ プレイヤーを追加しました:`);
    console.log(`  プレイヤーID: ${playerRef.id}`);
    console.log(`  名前: ${playerData.name}`);
    console.log(`  ポーカーネーム: ${playerData.pokerName}`);
    console.log(`  残高: ${playerData.systemBalance}`);
    console.log(`  店舗ID: ${playerData.storeId}\n`);
    
  } catch (error) {
    console.error('❌ エラー:', error);
  }
}

addPlayerToStore196();
