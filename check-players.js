const admin = require('firebase-admin');
const serviceAccount = require('./service-account-key.json');

// Firebase Admin SDKの初期化
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

const db = admin.firestore();

async function checkPlayers() {
  console.log('🔍 プレイヤーデータを確認中...\n');
  
  try {
    const playersSnapshot = await db.collection('players').get();
    
    console.log(`📊 総プレイヤー数: ${playersSnapshot.size}\n`);
    
    if (playersSnapshot.empty) {
      console.log('❌ プレイヤーが見つかりませんでした');
      return;
    }
    
    playersSnapshot.forEach((doc) => {
      const data = doc.data();
      console.log(`プレイヤーID: ${doc.id}`);
      console.log(`  名前: ${data.name}`);
      console.log(`  ポーカーネーム: ${data.pokerName || '(なし)'}`);
      console.log(`  読み仮名: ${data.furigana || '(なし)'}`);
      console.log(`  店舗ID: ${data.storeId || '(なし)'}`);
      console.log(`  残高: ${data.systemBalance}`);
      console.log('');
    });
    
  } catch (error) {
    console.error('❌ エラー:', error);
  }
}

checkPlayers();
