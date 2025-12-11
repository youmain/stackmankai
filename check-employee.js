const admin = require('firebase-admin');
const serviceAccount = require('./service-account-key.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function checkEmployee() {
  const snapshot = await db.collection('employees').where('username', '==', '山田太郎').get();
  
  if (snapshot.empty) {
    console.log('従業員が見つかりません');
    return;
  }
  
  snapshot.forEach(doc => {
    const data = doc.data();
    console.log('従業員データ:');
    console.log('UID:', doc.id);
    console.log('ユーザー名:', data.username);
    console.log('表示名:', data.displayName);
    console.log('店舗ID:', data.storeId);
    console.log('メールアドレス:', data.email);
  });
}

checkEmployee().then(() => process.exit(0)).catch(err => {
  console.error('エラー:', err);
  process.exit(1);
});
