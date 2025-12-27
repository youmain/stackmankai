/**
 * プレイヤーアカウント作成と顧客紐付けスクリプト
 */

const admin = require('firebase-admin');
const serviceAccount = require('../serviceAccountKey.json');

// Firebase Admin初期化
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

console.log('\n🎮 プレイヤーアカウント作成と紐付けスクリプト\n');

async function createAndLinkPlayers() {
  try {
    const db = admin.firestore();
    const auth = admin.auth();
    
    // テスト店舗ID
    const storeId = '528';
    const storeName = 'テスト店舗';
    
    // 既存の顧客アカウント
    const existingCustomerEmail = 'test-customer@example.com';
    
    console.log('📊 作業内容:');
    console.log(`  - 店舗: ${storeName} (ID: ${storeId})`);
    console.log(`  - プレイヤー1を作成して既存顧客に紐付け: ${existingCustomerEmail}`);
    console.log(`  - プレイヤー2を作成して新規顧客に紐付け\n`);
    
    // ========================================
    // 1. 既存顧客のUIDを取得
    // ========================================
    console.log('1️⃣  既存顧客のUID取得中...\n');
    
    const existingCustomerUser = await auth.getUserByEmail(existingCustomerEmail);
    const existingCustomerUid = existingCustomerUser.uid;
    console.log(`✅ 既存顧客UID: ${existingCustomerUid}`);
    
    // customerAccountsから既存顧客のドキュメントIDを取得
    const customerAccountsSnapshot = await db.collection('customerAccounts')
      .where('uid', '==', existingCustomerUid)
      .limit(1)
      .get();
    
    if (customerAccountsSnapshot.empty) {
      throw new Error('既存顧客のcustomerAccountsドキュメントが見つかりません');
    }
    
    const existingCustomerAccountId = customerAccountsSnapshot.docs[0].id;
    console.log(`✅ 既存顧客アカウントID: ${existingCustomerAccountId}\n`);
    
    // ========================================
    // 2. プレイヤー1を作成（既存顧客用）
    // ========================================
    console.log('2️⃣  プレイヤー1を作成中（既存顧客用）...\n');
    
    const player1Id = `player_${Date.now()}_1`;
    const player1Ref = db.collection('stores').doc(storeId).collection('players').doc(player1Id);
    
    await player1Ref.set({
      playerId: player1Id,
      playerName: 'テストプレイヤー1',
      storeId: storeId,
      storeName: storeName,
      totalGames: 0,
      totalBuyIn: 0,
      totalCashOut: 0,
      totalProfit: 0,
      linkedCustomerId: existingCustomerAccountId,
      linkedCustomerEmail: existingCustomerEmail,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
    
    console.log(`✅ プレイヤー1作成: ${player1Id}`);
    console.log(`   名前: テストプレイヤー1`);
    console.log(`   紐付け顧客: ${existingCustomerEmail}\n`);
    
    // customerAccountsを更新してplayerIdを設定
    await db.collection('customerAccounts').doc(existingCustomerAccountId).update({
      playerId: player1Id,
      playerName: 'テストプレイヤー1',
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
    
    console.log(`✅ 既存顧客アカウントにplayerId設定: ${player1Id}\n`);
    
    // ========================================
    // 3. 新規顧客アカウントを作成
    // ========================================
    console.log('3️⃣  新規顧客アカウントを作成中...\n');
    
    const newCustomerEmail = 'test-customer2@example.com';
    const newCustomerPassword = 'testpass123';
    
    let newCustomerUser;
    try {
      newCustomerUser = await auth.createUser({
        email: newCustomerEmail,
        password: newCustomerPassword,
        displayName: 'テスト顧客2',
      });
      console.log(`✅ Firebase Authユーザー作成: ${newCustomerUser.uid}`);
    } catch (error) {
      if (error.code === 'auth/email-already-exists') {
        console.log(`⚠️  ユーザーは既に存在します: ${newCustomerEmail}`);
        newCustomerUser = await auth.getUserByEmail(newCustomerEmail);
        console.log(`   既存UID: ${newCustomerUser.uid}`);
      } else {
        throw error;
      }
    }
    
    // usersコレクションに顧客情報を保存
    await db.collection('users').doc(newCustomerUser.uid).set({
      uid: newCustomerUser.uid,
      email: newCustomerEmail,
      role: 'customer',
      storeId: storeId,
      storeName: storeName,
      displayName: 'テスト顧客2',
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
    console.log(`✅ ユーザー情報を保存: users/${newCustomerUser.uid}`);
    
    // customerAccountsコレクションに保存
    const newCustomerAccountRef = db.collection('customerAccounts').doc();
    const newCustomerAccountId = newCustomerAccountRef.id;
    
    await newCustomerAccountRef.set({
      uid: newCustomerUser.uid,
      email: newCustomerEmail,
      storeId: storeId,
      storeName: storeName,
      displayName: 'テスト顧客2',
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });
    console.log(`✅ 顧客アカウント情報を保存: customerAccounts/${newCustomerAccountId}\n`);
    
    // ========================================
    // 4. プレイヤー2を作成（新規顧客用）
    // ========================================
    console.log('4️⃣  プレイヤー2を作成中（新規顧客用）...\n');
    
    const player2Id = `player_${Date.now()}_2`;
    const player2Ref = db.collection('stores').doc(storeId).collection('players').doc(player2Id);
    
    await player2Ref.set({
      playerId: player2Id,
      playerName: 'テストプレイヤー2',
      storeId: storeId,
      storeName: storeName,
      totalGames: 0,
      totalBuyIn: 0,
      totalCashOut: 0,
      totalProfit: 0,
      linkedCustomerId: newCustomerAccountId,
      linkedCustomerEmail: newCustomerEmail,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
    
    console.log(`✅ プレイヤー2作成: ${player2Id}`);
    console.log(`   名前: テストプレイヤー2`);
    console.log(`   紐付け顧客: ${newCustomerEmail}\n`);
    
    // customerAccountsを更新してplayerIdを設定
    await db.collection('customerAccounts').doc(newCustomerAccountId).update({
      playerId: player2Id,
      playerName: 'テストプレイヤー2',
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
    
    console.log(`✅ 新規顧客アカウントにplayerId設定: ${player2Id}\n`);
    
    // ========================================
    // サマリー
    // ========================================
    console.log('='.repeat(60));
    console.log('🎉 プレイヤーアカウント作成と紐付け完了！');
    console.log('='.repeat(60));
    console.log('\n📋 作成したアカウント:\n');
    
    console.log('【プレイヤー1】');
    console.log(`  プレイヤーID: ${player1Id}`);
    console.log(`  プレイヤー名: テストプレイヤー1`);
    console.log(`  紐付け顧客: ${existingCustomerEmail}`);
    console.log(`  顧客UID: ${existingCustomerUid}\n`);
    
    console.log('【プレイヤー2】');
    console.log(`  プレイヤーID: ${player2Id}`);
    console.log(`  プレイヤー名: テストプレイヤー2`);
    console.log(`  紐付け顧客: ${newCustomerEmail}`);
    console.log(`  顧客UID: ${newCustomerUser.uid}\n`);
    
    console.log('【新規顧客アカウント】');
    console.log(`  メールアドレス: ${newCustomerEmail}`);
    console.log(`  パスワード: ${newCustomerPassword}`);
    console.log(`  UID: ${newCustomerUser.uid}\n`);
    
    console.log('='.repeat(60));
    console.log('\n🔗 ログインURL:\n');
    console.log('  顧客ログイン: https://stackmankai-zeta.vercel.app/customer-auth\n');
    
    process.exit(0);
    
  } catch (error) {
    console.error('❌ エラーが発生しました:', error);
    process.exit(1);
  }
}

createAndLinkPlayers();
