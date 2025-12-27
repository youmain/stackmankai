/**
 * 古いテストデータ削除スクリプト
 */

const admin = require('firebase-admin');
const serviceAccount = require('../serviceAccountKey.json');

// Firebase Admin初期化
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

console.log('\n🗑️  古いテストデータ削除スクリプト\n');

const invalidUserIds = [
  '4lmUIaQaZzYEwIvp2Yec',
  '8y89n7bFcu1Yb62aYRch',
  'GF6QPVEenovuq9kGs21h',
  'jyI8cPyD6SSKeG4brV3m',
  'twDcyt9iSXpQoc2GGAC1',
  'zpZNuhCIgj03CfIwgLrj',
];

async function cleanupOldData() {
  try {
    const db = admin.firestore();
    
    console.log('📋 削除対象のユーザーID:');
    invalidUserIds.forEach(uid => console.log(`  - ${uid}`));
    console.log('');
    
    let deletedCount = 0;
    
    for (const uid of invalidUserIds) {
      try {
        const userDocRef = db.collection('users').doc(uid);
        const userDoc = await userDocRef.get();
        
        if (userDoc.exists) {
          const data = userDoc.data();
          console.log(`🗑️  削除中: ${uid}`);
          console.log(`   データ: ${JSON.stringify(data, null, 2)}`);
          
          await userDocRef.delete();
          deletedCount++;
          console.log(`   ✅ 削除完了\n`);
        } else {
          console.log(`⚠️  ユーザー ${uid} は既に存在しません\n`);
        }
      } catch (error) {
        console.error(`❌ ユーザー ${uid} の削除中にエラー:`, error.message);
      }
    }
    
    console.log('='.repeat(60));
    console.log('📊 削除結果');
    console.log('='.repeat(60));
    console.log(`削除したユーザー数: ${deletedCount}/${invalidUserIds.length}`);
    console.log('='.repeat(60) + '\n');
    
    if (deletedCount === invalidUserIds.length) {
      console.log('🎉 すべての古いテストデータを削除しました！\n');
    } else {
      console.log('⚠️  一部のデータが削除できませんでした。\n');
    }
    
    process.exit(0);
    
  } catch (error) {
    console.error('❌ 削除中にエラーが発生しました:', error);
    process.exit(1);
  }
}

cleanupOldData();
