/**
 * 顧客アカウント削除スクリプト
 */

const admin = require('firebase-admin');
const serviceAccount = require('../serviceAccountKey.json');

// Firebase Admin初期化
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

console.log('\n🗑️  顧客アカウント削除スクリプト\n');

const customerAccountId = 'mP2OCeUEtVptI43Ggn5b';

async function cleanupCustomerAccount() {
  try {
    const db = admin.firestore();
    
    console.log(`📋 削除対象の顧客アカウントID: ${customerAccountId}\n`);
    
    const customerDocRef = db.collection('customerAccounts').doc(customerAccountId);
    const customerDoc = await customerDocRef.get();
    
    if (customerDoc.exists) {
      const data = customerDoc.data();
      console.log(`🗑️  削除中: ${customerAccountId}`);
      console.log(`   データ: ${JSON.stringify(data, null, 2)}`);
      
      await customerDocRef.delete();
      console.log(`   ✅ 削除完了\n`);
      
      console.log('🎉 顧客アカウントを削除しました！\n');
    } else {
      console.log(`⚠️  顧客アカウント ${customerAccountId} は既に存在しません\n`);
    }
    
    process.exit(0);
    
  } catch (error) {
    console.error('❌ 削除中にエラーが発生しました:', error);
    process.exit(1);
  }
}

cleanupCustomerAccount();
