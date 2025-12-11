const admin = require('firebase-admin');
const serviceAccount = require('./service-account-key.json');

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

const db = admin.firestore();

async function testEmployeeLogin() {
  try {
    console.log('🔍 従業員ログインテスト');
    console.log('');
    
    // テストデータ
    const storeCode = '510';
    const username = '山田太郎';
    const password = 'test1234';
    
    console.log('入力データ:');
    console.log('  店舗コード:', storeCode);
    console.log('  ユーザー名:', username);
    console.log('  パスワード:', password);
    console.log('');
    
    // Step 1: 店舗IDを取得
    console.log('Step 1: 店舗IDを取得...');
    const storesSnapshot = await db.collection('stores').where('storeCode', '==', storeCode).get();
    
    if (storesSnapshot.empty) {
      console.log('❌ 店舗が見つかりません');
      return;
    }
    
    const storeDoc = storesSnapshot.docs[0];
    const storeId = storeDoc.id;
    console.log('✅ 店舗ID:', storeId);
    console.log('');
    
    // Step 2: 従業員情報を取得
    console.log('Step 2: 従業員情報を取得...');
    const employeesSnapshot = await db.collection('employees')
      .where('storeId', '==', storeId)
      .where('username', '==', username)
      .get();
    
    if (employeesSnapshot.empty) {
      console.log('❌ 従業員が見つかりません');
      return;
    }
    
    const employeeDoc = employeesSnapshot.docs[0];
    const employeeData = employeeDoc.data();
    console.log('✅ 従業員情報:');
    console.log('  UID:', employeeData.uid);
    console.log('  ユーザー名:', employeeData.username);
    console.log('  表示名:', employeeData.displayName);
    console.log('  メールアドレス:', employeeData.email);
    console.log('');
    
    // Step 3: Firebase Authenticationでユーザーを確認
    console.log('Step 3: Firebase Authenticationでユーザーを確認...');
    try {
      const userRecord = await admin.auth().getUser(employeeData.uid);
      console.log('✅ Firebase Auth ユーザー:');
      console.log('  UID:', userRecord.uid);
      console.log('  Email:', userRecord.email);
      console.log('');
      
      // メールアドレスが一致するか確認
      if (userRecord.email === employeeData.email) {
        console.log('✅ メールアドレスが一致しています');
      } else {
        console.log('❌ メールアドレスが一致しません');
        console.log('  Firestore:', employeeData.email);
        console.log('  Firebase Auth:', userRecord.email);
      }
      
    } catch (error) {
      console.log('❌ Firebase Authenticationにユーザーが存在しません');
      console.error('エラー:', error.message);
    }
    
  } catch (error) {
    console.error('エラー:', error);
  }
}

testEmployeeLogin().then(() => process.exit(0));
