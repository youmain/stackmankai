const admin = require('firebase-admin');
const serviceAccount = require('./service-account-key.json');

// Firebase Admin SDKの初期化
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

const db = admin.firestore();

async function checkStore196() {
  console.log('🔍 店舗196の設定を確認中...\n');
  
  try {
    const storesSnapshot = await db.collection('stores').where('storeCode', '==', '196').get();
    
    if (storesSnapshot.empty) {
      console.log('❌ 店舗196が見つかりませんでした');
      return;
    }
    
    const storeDoc = storesSnapshot.docs[0];
    const storeData = storeDoc.data();
    
    console.log(`✅ 店舗情報:`);
    console.log(`  店舗ID: ${storeDoc.id}`);
    console.log(`  店舗名: ${storeData.name}`);
    console.log(`  店舗コード: ${storeData.storeCode}`);
    console.log(`  メールアドレス: ${storeData.email}`);
    console.log(`  ステータス: ${storeData.status}`);
    console.log(`  オーナーUID: ${storeData.ownerUid || '(なし)'}`);
    console.log(`  パスワード設定: ${storeData.password ? 'あり' : 'なし'}`);
    console.log('');
    
  } catch (error) {
    console.error('❌ エラー:', error);
  }
}

checkStore196();
