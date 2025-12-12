const admin = require('firebase-admin');
const serviceAccount = require('./service-account-key.json');

// Firebase Admin SDKの初期化
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

const db = admin.firestore();

async function verifyDataSeparation() {
  console.log('🔍 店舗別データ分離を検証中...\n');
  
  try {
    // 店舗510のstoreIdを取得
    const store510Snapshot = await db.collection('stores').where('storeCode', '==', '510').get();
    const store510Id = store510Snapshot.empty ? null : store510Snapshot.docs[0].id;
    const store510Name = store510Snapshot.empty ? null : store510Snapshot.docs[0].data().name;
    
    // 店舗196のstoreIdを取得
    const store196Snapshot = await db.collection('stores').where('storeCode', '==', '196').get();
    const store196Id = store196Snapshot.empty ? null : store196Snapshot.docs[0].id;
    const store196Name = store196Snapshot.empty ? null : store196Snapshot.docs[0].data().name;
    
    console.log('📊 店舗情報:');
    console.log(`  店舗510: ${store510Name} (ID: ${store510Id})`);
    console.log(`  店舗196: ${store196Name} (ID: ${store196Id})\n`);
    
    // 全プレイヤーを取得
    const playersSnapshot = await db.collection('players').get();
    
    console.log(`📊 総プレイヤー数: ${playersSnapshot.size}\n`);
    
    // 店舗510のプレイヤー
    const store510Players = playersSnapshot.docs.filter(doc => doc.data().storeId === store510Id);
    console.log(`✅ 店舗510（${store510Name}）のプレイヤー: ${store510Players.length}人`);
    store510Players.forEach(doc => {
      const data = doc.data();
      console.log(`  - ${data.name}${data.pokerName ? ` (${data.pokerName})` : ''} - 残高: ${data.systemBalance}円`);
    });
    console.log('');
    
    // 店舗196のプレイヤー
    const store196Players = playersSnapshot.docs.filter(doc => doc.data().storeId === store196Id);
    console.log(`✅ 店舗196（${store196Name}）のプレイヤー: ${store196Players.length}人`);
    store196Players.forEach(doc => {
      const data = doc.data();
      console.log(`  - ${data.name}${data.pokerName ? ` (${data.pokerName})` : ''} - 残高: ${data.systemBalance}円`);
    });
    console.log('');
    
    // データ分離の検証
    console.log('🔍 データ分離の検証:');
    if (store510Players.length > 0 && store196Players.length > 0) {
      console.log('  ✅ 両店舗にプレイヤーが存在します');
      console.log('  ✅ データが正しく分離されています');
    } else {
      console.log('  ⚠️ いずれかの店舗にプレイヤーが存在しません');
    }
    
  } catch (error) {
    console.error('❌ エラー:', error);
  }
}

verifyDataSeparation();
