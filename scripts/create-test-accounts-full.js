/**
 * テストアカウント作成スクリプト（完全版）
 * 
 * 店舗オーナー、従業員、顧客のテストアカウントを作成します
 */

const admin = require('firebase-admin');
const serviceAccount = require('../serviceAccountKey.json');

// Firebase Admin初期化
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

console.log('\n🔧 テストアカウント作成スクリプト\n');

// テストアカウント情報
const testAccounts = {
  storeOwner: {
    email: 'test-owner@example.com',
    password: 'testpass123',
    storeName: 'テスト店舗',
    storeEmail: 'test-store@example.com',
    storePassword: 'store123',
  },
  employee: {
    email: 'test-employee@example.com',
    password: 'testpass123',
  },
  customer: {
    email: 'test-customer@example.com',
    password: 'testpass123',
  },
};

async function createTestAccounts() {
  try {
    const auth = admin.auth();
    const db = admin.firestore();
    
    console.log('📊 作成するアカウント:');
    console.log(`  - 店舗オーナー: ${testAccounts.storeOwner.email}`);
    console.log(`  - 従業員: ${testAccounts.employee.email}`);
    console.log(`  - 顧客: ${testAccounts.customer.email}\n`);
    
    // ========================================
    // 1. 店舗オーナーアカウントの作成
    // ========================================
    console.log('1️⃣  店舗オーナーアカウントを作成中...\n');
    
    let ownerUser;
    try {
      ownerUser = await auth.createUser({
        email: testAccounts.storeOwner.email,
        password: testAccounts.storeOwner.password,
        displayName: '店舗オーナー',
      });
      console.log(`✅ Firebase Authユーザー作成: ${ownerUser.uid}`);
    } catch (error) {
      if (error.code === 'auth/email-already-exists') {
        console.log(`⚠️  ユーザーは既に存在します: ${testAccounts.storeOwner.email}`);
        ownerUser = await auth.getUserByEmail(testAccounts.storeOwner.email);
        console.log(`   既存UID: ${ownerUser.uid}`);
      } else {
        throw error;
      }
    }
    
    // 店舗IDを生成（3桁のランダムコード）
    const storeId = Math.floor(100 + Math.random() * 900).toString();
    console.log(`   店舗コード: ${storeId}`);
    
    // storesコレクションに店舗情報を保存
    await db.collection('stores').doc(storeId).set({
      storeId: storeId,
      storeName: testAccounts.storeOwner.storeName,
      storeEmail: testAccounts.storeOwner.storeEmail,
      ownerEmail: testAccounts.storeOwner.email,
      ownerUid: ownerUser.uid,
      storePassword: testAccounts.storeOwner.storePassword, // 本番環境ではハッシュ化すべき
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
    console.log(`✅ 店舗情報を保存: stores/${storeId}`);
    
    // usersコレクションにオーナー情報を保存
    await db.collection('users').doc(ownerUser.uid).set({
      uid: ownerUser.uid,
      email: testAccounts.storeOwner.email,
      role: 'store_owner',
      storeId: storeId,
      storeName: testAccounts.storeOwner.storeName,
      displayName: '店舗オーナー',
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
    console.log(`✅ ユーザー情報を保存: users/${ownerUser.uid}\n`);
    
    // ========================================
    // 2. 従業員アカウントの作成
    // ========================================
    console.log('2️⃣  従業員アカウントを作成中...\n');
    
    let employeeUser;
    try {
      employeeUser = await auth.createUser({
        email: testAccounts.employee.email,
        password: testAccounts.employee.password,
        displayName: 'テスト従業員',
      });
      console.log(`✅ Firebase Authユーザー作成: ${employeeUser.uid}`);
    } catch (error) {
      if (error.code === 'auth/email-already-exists') {
        console.log(`⚠️  ユーザーは既に存在します: ${testAccounts.employee.email}`);
        employeeUser = await auth.getUserByEmail(testAccounts.employee.email);
        console.log(`   既存UID: ${employeeUser.uid}`);
      } else {
        throw error;
      }
    }
    
    // usersコレクションに従業員情報を保存
    await db.collection('users').doc(employeeUser.uid).set({
      uid: employeeUser.uid,
      email: testAccounts.employee.email,
      role: 'employee',
      storeId: storeId,
      storeName: testAccounts.storeOwner.storeName,
      displayName: 'テスト従業員',
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
    console.log(`✅ ユーザー情報を保存: users/${employeeUser.uid}\n`);
    
    // ========================================
    // 3. 顧客アカウントの作成
    // ========================================
    console.log('3️⃣  顧客アカウントを作成中...\n');
    
    let customerUser;
    try {
      customerUser = await auth.createUser({
        email: testAccounts.customer.email,
        password: testAccounts.customer.password,
        displayName: 'テスト顧客',
      });
      console.log(`✅ Firebase Authユーザー作成: ${customerUser.uid}`);
    } catch (error) {
      if (error.code === 'auth/email-already-exists') {
        console.log(`⚠️  ユーザーは既に存在します: ${testAccounts.customer.email}`);
        customerUser = await auth.getUserByEmail(testAccounts.customer.email);
        console.log(`   既存UID: ${customerUser.uid}`);
      } else {
        throw error;
      }
    }
    
    // usersコレクションに顧客情報を保存
    await db.collection('users').doc(customerUser.uid).set({
      uid: customerUser.uid,
      email: testAccounts.customer.email,
      role: 'customer',
      storeId: storeId, // 顧客も店舗に紐付け
      storeName: testAccounts.storeOwner.storeName,
      displayName: 'テスト顧客',
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
    console.log(`✅ ユーザー情報を保存: users/${customerUser.uid}\n`);
    
    // customerAccountsコレクションにも保存
    const customerAccountId = db.collection('customerAccounts').doc().id;
    await db.collection('customerAccounts').doc(customerAccountId).set({
      uid: customerUser.uid,
      email: testAccounts.customer.email,
      storeId: storeId,
      storeName: testAccounts.storeOwner.storeName,
      displayName: 'テスト顧客',
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });
    console.log(`✅ 顧客アカウント情報を保存: customerAccounts/${customerAccountId}\n`);
    
    // ========================================
    // サマリー
    // ========================================
    console.log('='.repeat(60));
    console.log('🎉 テストアカウント作成完了！');
    console.log('='.repeat(60));
    console.log('\n📋 アカウント情報:\n');
    console.log('【店舗オーナー】');
    console.log(`  メールアドレス: ${testAccounts.storeOwner.email}`);
    console.log(`  パスワード: ${testAccounts.storeOwner.password}`);
    console.log(`  店舗コード: ${storeId}`);
    console.log(`  店舗名: ${testAccounts.storeOwner.storeName}`);
    console.log(`  UID: ${ownerUser.uid}\n`);
    
    console.log('【従業員】');
    console.log(`  メールアドレス: ${testAccounts.employee.email}`);
    console.log(`  パスワード: ${testAccounts.employee.password}`);
    console.log(`  店舗コード: ${storeId}`);
    console.log(`  店舗パスワード: ${testAccounts.storeOwner.storePassword}`);
    console.log(`  UID: ${employeeUser.uid}\n`);
    
    console.log('【顧客】');
    console.log(`  メールアドレス: ${testAccounts.customer.email}`);
    console.log(`  パスワード: ${testAccounts.customer.password}`);
    console.log(`  UID: ${customerUser.uid}\n`);
    
    console.log('='.repeat(60));
    console.log('\n🔗 ログインURL:\n');
    console.log('  店舗オーナー: https://stackmankai-zeta.vercel.app/store-login');
    console.log('  従業員: https://stackmankai-zeta.vercel.app/employee-login');
    console.log('  顧客: https://stackmankai-zeta.vercel.app/customer-auth\n');
    
    process.exit(0);
    
  } catch (error) {
    console.error('❌ アカウント作成中にエラーが発生しました:', error);
    process.exit(1);
  }
}

createTestAccounts();
