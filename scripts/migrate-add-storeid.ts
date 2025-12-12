import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

// Firebase Admin初期化
if (getApps().length === 0) {
  initializeApp({
    credential: cert({
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    }),
  });
}

const db = getFirestore();

async function migratePlayersStoreId() {
  console.log('🚀 プレイヤーデータ移行開始...');
  
  const DEFAULT_STORE_ID = '510'; // デフォルトの店舗ID
  
  try {
    // 全プレイヤーを取得
    const playersSnapshot = await db.collection('players').get();
    console.log(`📊 全プレイヤー数: ${playersSnapshot.size}`);
    
    let updatedCount = 0;
    let skippedCount = 0;
    
    const batch = db.batch();
    
    for (const doc of playersSnapshot.docs) {
      const data = doc.data();
      
      // storeIdが既に設定されている場合はスキップ
      if (data.storeId) {
        skippedCount++;
        continue;
      }
      
      // storeIdを追加
      batch.update(doc.ref, {
        storeId: DEFAULT_STORE_ID,
        updatedAt: new Date(),
      });
      
      updatedCount++;
    }
    
    // バッチ更新を実行
    if (updatedCount > 0) {
      await batch.commit();
      console.log(`✅ ${updatedCount}人のプレイヤーにstoreId: ${DEFAULT_STORE_ID}を追加しました`);
    }
    
    console.log(`⏭️  ${skippedCount}人のプレイヤーは既にstoreIdが設定されているためスキップしました`);
    console.log('🎉 移行完了！');
    
  } catch (error) {
    console.error('❌ エラーが発生しました:', error);
    throw error;
  }
}

// 他のコレクションも同様に移行
async function migrateReceiptsStoreId() {
  console.log('🚀 伝票データ移行開始...');
  
  const DEFAULT_STORE_ID = '510';
  
  try {
    const receiptsSnapshot = await db.collection('receipts').get();
    console.log(`📊 全伝票数: ${receiptsSnapshot.size}`);
    
    let updatedCount = 0;
    let skippedCount = 0;
    
    const batch = db.batch();
    
    for (const doc of receiptsSnapshot.docs) {
      const data = doc.data();
      
      if (data.storeId) {
        skippedCount++;
        continue;
      }
      
      batch.update(doc.ref, {
        storeId: DEFAULT_STORE_ID,
        updatedAt: new Date(),
      });
      
      updatedCount++;
    }
    
    if (updatedCount > 0) {
      await batch.commit();
      console.log(`✅ ${updatedCount}件の伝票にstoreId: ${DEFAULT_STORE_ID}を追加しました`);
    }
    
    console.log(`⏭️  ${skippedCount}件の伝票は既にstoreIdが設定されているためスキップしました`);
    console.log('🎉 移行完了！');
    
  } catch (error) {
    console.error('❌ エラーが発生しました:', error);
    throw error;
  }
}

async function migrateRakeHistoryStoreId() {
  console.log('🚀 レーキ履歴データ移行開始...');
  
  const DEFAULT_STORE_ID = '510';
  
  try {
    const rakeSnapshot = await db.collection('rakeHistory').get();
    console.log(`📊 全レーキ履歴数: ${rakeSnapshot.size}`);
    
    let updatedCount = 0;
    let skippedCount = 0;
    
    const batch = db.batch();
    
    for (const doc of rakeSnapshot.docs) {
      const data = doc.data();
      
      if (data.storeId) {
        skippedCount++;
        continue;
      }
      
      batch.update(doc.ref, {
        storeId: DEFAULT_STORE_ID,
      });
      
      updatedCount++;
    }
    
    if (updatedCount > 0) {
      await batch.commit();
      console.log(`✅ ${updatedCount}件のレーキ履歴にstoreId: ${DEFAULT_STORE_ID}を追加しました`);
    }
    
    console.log(`⏭️  ${skippedCount}件のレーキ履歴は既にstoreIdが設定されているためスキップしました`);
    console.log('🎉 移行完了！');
    
  } catch (error) {
    console.error('❌ エラーが発生しました:', error);
    throw error;
  }
}

async function migrateRankingsStoreId() {
  console.log('🚀 ランキングデータ移行開始...');
  
  const DEFAULT_STORE_ID = '510';
  
  try {
    // 日別ランキング
    const dailySnapshot = await db.collection('dailyRankings').get();
    console.log(`📊 全日別ランキング数: ${dailySnapshot.size}`);
    
    let updatedCount = 0;
    const batch = db.batch();
    
    for (const doc of dailySnapshot.docs) {
      const data = doc.data();
      if (!data.storeId) {
        batch.update(doc.ref, { storeId: DEFAULT_STORE_ID });
        updatedCount++;
      }
    }
    
    // 月別ランキング
    const monthlySnapshot = await db.collection('monthlyRankings').get();
    console.log(`📊 全月別ランキング数: ${monthlySnapshot.size}`);
    
    for (const doc of monthlySnapshot.docs) {
      const data = doc.data();
      if (!data.storeId) {
        batch.update(doc.ref, { storeId: DEFAULT_STORE_ID });
        updatedCount++;
      }
    }
    
    if (updatedCount > 0) {
      await batch.commit();
      console.log(`✅ ${updatedCount}件のランキングにstoreId: ${DEFAULT_STORE_ID}を追加しました`);
    }
    
    console.log('🎉 移行完了！');
    
  } catch (error) {
    console.error('❌ エラーが発生しました:', error);
    throw error;
  }
}

// メイン実行
async function main() {
  console.log('========================================');
  console.log('📦 データ移行スクリプト');
  console.log('全データに店舗ID (510) を追加します');
  console.log('========================================\n');
  
  await migratePlayersStoreId();
  console.log('');
  await migrateReceiptsStoreId();
  console.log('');
  await migrateRakeHistoryStoreId();
  console.log('');
  await migrateRankingsStoreId();
  
  console.log('\n========================================');
  console.log('✨ 全ての移行が完了しました！');
  console.log('========================================');
  
  process.exit(0);
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
