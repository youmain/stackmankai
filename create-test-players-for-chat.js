const admin = require('firebase-admin');

// Initialize Firebase Admin
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "stackman-f8a2c",
      clientEmail: `firebase-adminsdk@${process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "stackman-f8a2c"}.iam.gserviceaccount.com`,
      privateKey: process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    }),
  });
}

const db = admin.firestore();

async function createTestPlayers() {
  try {
    // 店舗510のIDを取得
    const storesSnapshot = await db.collection('stores').where('storeCode', '==', '510').get();
    
    if (storesSnapshot.empty) {
      console.error('店舗510が見つかりません');
      return;
    }
    
    const storeId = storesSnapshot.docs[0].id;
    console.log('店舗510のID:', storeId);
    
    // テスト用プレイヤー1を作成
    const player1Ref = await db.collection('players').add({
      name: 'チャットテストユーザー1',
      pokerName: 'ChatUser1',
      balance: 10000,
      storeId: storeId,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
    
    console.log('✅ テスト用プレイヤー1を作成しました');
    console.log('プレイヤー1 ID:', player1Ref.id);
    console.log('プレイヤー1 名前: チャットテストユーザー1');
    console.log('プレイヤー1 ポーカーネーム: ChatUser1');
    console.log('');
    
    // テスト用プレイヤー2を作成
    const player2Ref = await db.collection('players').add({
      name: 'チャットテストユーザー2',
      pokerName: 'ChatUser2',
      balance: 10000,
      storeId: storeId,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
    
    console.log('✅ テスト用プレイヤー2を作成しました');
    console.log('プレイヤー2 ID:', player2Ref.id);
    console.log('プレイヤー2 名前: チャットテストユーザー2');
    console.log('プレイヤー2 ポーカーネーム: ChatUser2');
    console.log('');
    
    console.log('='.repeat(60));
    console.log('テスト用プレイヤーの作成が完了しました！');
    console.log('='.repeat(60));
    console.log('');
    console.log('次のステップ:');
    console.log('1. chatuser1@example.com でログイン');
    console.log(`2. プレイヤーID「${player1Ref.id}」を紐づける`);
    console.log('3. chatuser2@example.com でログイン（新規登録）');
    console.log(`4. プレイヤーID「${player2Ref.id}」を紐づける`);
    console.log('5. 両方のアカウントでチャットにアクセス');
    
  } catch (error) {
    console.error('エラーが発生しました:', error);
  } finally {
    process.exit(0);
  }
}

createTestPlayers();
