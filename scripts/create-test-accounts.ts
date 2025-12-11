/**
 * テストアカウント作成スクリプト
 * 
 * 実行方法:
 * npx ts-node scripts/create-test-accounts.ts
 */

import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';

// Firebase Admin初期化
if (getApps().length === 0) {
  const serviceAccountPath = __dirname + '/../service-account-key.json';
  const serviceAccount = require(serviceAccountPath);
  
  initializeApp({
    credential: cert(serviceAccount),
  });
}

const auth = getAuth();
const db = getFirestore();

// 店舗情報
const STORE_CODE = '510';
const STORE_ID = 'KLDdhiCU3rOI3fQFq4na';

/**
 * 招待コードを生成
 */
function generateInviteCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  const segments = [];
  
  for (let i = 0; i < 3; i++) {
    let segment = '';
    for (let j = 0; j < 3; j++) {
      segment += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    segments.push(segment);
  }
  
  return segments.join('-');
}

/**
 * 招待コードを発行
 */
async function createInviteCode(storeId: string): Promise<string> {
  const code = generateInviteCode();
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7); // 7日後に期限切れ

  await db.collection('inviteCodes').add({
    code,
    storeId,
    createdAt: new Date(),
    expiresAt,
    used: false,
    usedBy: null,
    usedAt: null,
  });

  console.log(`✅ 招待コード発行: ${code}`);
  return code;
}

/**
 * 従業員を登録
 */
async function registerEmployee(
  storeId: string,
  inviteCode: string,
  username: string,
  displayName: string,
  password: string
): Promise<void> {
  try {
    // 招待コードを検証
    const inviteSnapshot = await db
      .collection('inviteCodes')
      .where('code', '==', inviteCode)
      .where('storeId', '==', storeId)
      .where('used', '==', false)
      .limit(1)
      .get();

    if (inviteSnapshot.empty) {
      throw new Error('招待コードが無効です');
    }

    const inviteDoc = inviteSnapshot.docs[0];
    const inviteData = inviteDoc.data();

    // 有効期限チェック
    if (inviteData.expiresAt.toDate() < new Date()) {
      throw new Error('招待コードの有効期限が切れています');
    }

    // メールアドレスを生成
    const email = `${username}.${inviteCode}@stackmankai.internal`;

    // Firebase Authenticationにユーザーを作成
    const userRecord = await auth.createUser({
      email,
      password,
      displayName,
    });

    // Firestoreに従業員情報を保存
    await db.collection('employees').doc(userRecord.uid).set({
      uid: userRecord.uid,
      storeId,
      username,
      displayName: displayName || username,
      email,
      inviteCode,
      role: 'employee',
      createdAt: new Date(),
      isActive: true,
    });

    // 招待コードを使用済みにする
    await inviteDoc.ref.update({
      used: true,
      usedBy: userRecord.uid,
      usedAt: new Date(),
    });

    console.log(`✅ 従業員登録成功: ${username} (${displayName})`);
    console.log(`   UID: ${userRecord.uid}`);
    console.log(`   Email: ${email}`);
  } catch (error: any) {
    console.error(`❌ 従業員登録失敗 (${username}):`, error.message);
    throw error;
  }
}

/**
 * プレイヤーを登録
 */
async function registerPlayer(
  email: string,
  password: string
): Promise<void> {
  try {
    // Firebase Authenticationにユーザーを作成
    const userRecord = await auth.createUser({
      email,
      password,
    });

    // Firestoreにプレイヤー情報を保存
    await db.collection('customers').doc(userRecord.uid).set({
      uid: userRecord.uid,
      email,
      createdAt: new Date(),
      isActive: true,
      isPremium: false,
    });

    console.log(`✅ プレイヤー登録成功: ${email}`);
    console.log(`   UID: ${userRecord.uid}`);
  } catch (error: any) {
    console.error(`❌ プレイヤー登録失敗 (${email}):`, error.message);
    throw error;
  }
}

/**
 * メイン処理
 */
async function main() {
  console.log('🚀 テストアカウント作成開始\n');

  try {
    // 1. 招待コードを2つ発行
    console.log('📝 Step 1: 招待コード発行');
    const inviteCode1 = await createInviteCode(STORE_ID);
    const inviteCode2 = await createInviteCode(STORE_ID);
    console.log('');

    // 2. 従業員1を登録
    console.log('👤 Step 2: 従業員1登録');
    await registerEmployee(
      STORE_ID,
      inviteCode1,
      '山田太郎',
      '山田太郎',
      'test1234'
    );
    console.log('');

    // 3. 従業員2を登録
    console.log('👤 Step 3: 従業員2登録');
    await registerEmployee(
      STORE_ID,
      inviteCode2,
      'tanaka_hanako',
      '田中花子',
      'test1234'
    );
    console.log('');

    // 4. プレイヤー1を登録
    console.log('🎮 Step 4: プレイヤー1登録');
    await registerPlayer('test-player1@example.com', 'test1234');
    console.log('');

    // 5. プレイヤー2を登録
    console.log('🎮 Step 5: プレイヤー2登録');
    await registerPlayer('test-player2@example.com', 'test1234');
    console.log('');

    console.log('🎉 テストアカウント作成完了！\n');
    console.log('📋 作成されたアカウント:\n');
    console.log('【従業員アカウント】');
    console.log('1. 山田太郎');
    console.log('   - ユーザー名: 山田太郎');
    console.log('   - パスワード: test1234');
    console.log('   - ログイン: 店舗コード 510 + ユーザー名 + パスワード\n');
    console.log('2. 田中花子');
    console.log('   - ユーザー名: tanaka_hanako');
    console.log('   - パスワード: test1234');
    console.log('   - ログイン: 店舗コード 510 + ユーザー名 + パスワード\n');
    console.log('【プレイヤーアカウント】');
    console.log('1. test-player1@example.com');
    console.log('   - パスワード: test1234\n');
    console.log('2. test-player2@example.com');
    console.log('   - パスワード: test1234\n');
  } catch (error) {
    console.error('❌ エラーが発生しました:', error);
    process.exit(1);
  }
}

// スクリプト実行
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
