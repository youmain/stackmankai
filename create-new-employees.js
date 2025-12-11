const admin = require('firebase-admin');
const serviceAccount = require('./service-account-key.json');

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

const db = admin.firestore();

async function createNewEmployees() {
  try {
    console.log('👤 新しい従業員アカウントを作成...');
    
    // 従業員1: 山田太郎
    const email1 = '山田太郎.a47-jk7-r2p@stackmankai.internal';
    try {
      const user1 = await admin.auth().createUser({
        email: email1,
        password: 'test1234'
      });
      
      await db.collection('employees').doc(user1.uid).set({
        uid: user1.uid,
        username: '山田太郎',
        email: email1,
        storeId: 'KLDdhiCU3rOI3fQFq4na',
        storeName: 'テストポーカー店',
        storeCode: '510',
        role: 'employee',
        inviteCode: 'A47-JK7-R2P',
        displayName: '山田太郎',
        status: 'active',
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });
      console.log('✅ 山田太郎を作成:', user1.uid);
    } catch (error) {
      if (error.code === 'auth/email-already-exists') {
        console.log('⚠️  山田太郎は既に存在します');
      } else {
        throw error;
      }
    }
    
    // 従業員2: 田中花子
    const email2 = 'tanaka_hanako.0a1-k12-0f0@stackmankai.internal';
    try {
      const user2 = await admin.auth().createUser({
        email: email2,
        password: 'test1234'
      });
      
      await db.collection('employees').doc(user2.uid).set({
        uid: user2.uid,
        username: 'tanaka_hanako',
        email: email2,
        storeId: 'KLDdhiCU3rOI3fQFq4na',
        storeName: 'テストポーカー店',
        storeCode: '510',
        role: 'employee',
        inviteCode: '0A1-K12-0F0',
        displayName: '田中花子',
        status: 'active',
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });
      console.log('✅ 田中花子を作成:', user2.uid);
    } catch (error) {
      if (error.code === 'auth/email-already-exists') {
        console.log('⚠️  田中花子は既に存在します');
      } else {
        throw error;
      }
    }
    
    console.log('');
    console.log('🎉 従業員アカウントの作成完了！');
    
  } catch (error) {
    console.error('エラー:', error);
  }
}

createNewEmployees().then(() => process.exit(0));
