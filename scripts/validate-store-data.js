/**
 * 店舗データ検証スクリプト
 * 
 * このスクリプトは以下を検証します：
 * 1. すべての店舗サブコレクションにstoreIdが設定されているか
 * 2. 孤立したデータ（存在しないstoreIdを参照）の検出
 * 3. データの整合性チェック
 * 
 * 実行方法:
 * node scripts/validate-store-data.js
 */

const admin = require('firebase-admin');
const fs = require('fs');

console.log('\n🔍 店舗データ検証スクリプト\n');

const validationReport = {
  timestamp: new Date().toISOString(),
  stores: {},
  orphanedData: [],
  missingStoreId: [],
  summary: {},
};

async function validateStoreData() {
  try {
    if (admin.apps.length === 0) {
      console.log('❌ Firebase Adminが初期化されていません。\n');
      return;
    }

    const db = admin.firestore();
    
    // ========================================
    // 1. 店舗IDのリストを取得
    // ========================================
    console.log('1️⃣  店舗IDを取得中...');
    const storesSnapshot = await db.collection('stores').get();
    const validStoreIds = new Set();
    
    storesSnapshot.forEach(doc => {
      validStoreIds.add(doc.id);
      validationReport.stores[doc.id] = {
        storeId: doc.id,
        storeName: doc.data().storeName || 'Unknown',
        issues: [],
      };
    });
    
    console.log(`   ${validStoreIds.size}件の店舗を取得\n`);
    
    // ========================================
    // 2. 各コレクションのstoreIdをチェック
    // ========================================
    console.log('2️⃣  コレクションのstoreIdをチェック中...\n');
    
    const collectionsToCheck = [
      'customerAccounts',
      'posts',
      'rankings',
      'employees',
    ];
    
    for (const collectionName of collectionsToCheck) {
      console.log(`  📂 ${collectionName}コレクションをチェック中...`);
      
      const snapshot = await db.collection(collectionName).get();
      let missingCount = 0;
      let orphanedCount = 0;
      
      for (const doc of snapshot.docs) {
        const data = doc.data();
        
        // storeIdが存在しない
        if (!data.storeId) {
          missingCount++;
          validationReport.missingStoreId.push({
            collection: collectionName,
            docId: doc.id,
            data: { uid: data.uid, email: data.email },
          });
        }
        // storeIdが存在するが、店舗が存在しない
        else if (!validStoreIds.has(data.storeId)) {
          orphanedCount++;
          validationReport.orphanedData.push({
            collection: collectionName,
            docId: doc.id,
            storeId: data.storeId,
            data: { uid: data.uid, email: data.email },
          });
        }
      }
      
      console.log(`     総数: ${snapshot.size}件`);
      if (missingCount > 0) {
        console.log(`     ⚠️  storeId未設定: ${missingCount}件`);
      }
      if (orphanedCount > 0) {
        console.log(`     ⚠️  孤立データ: ${orphanedCount}件`);
      }
      if (missingCount === 0 && orphanedCount === 0) {
        console.log(`     ✅ 問題なし`);
      }
      console.log('');
    }
    
    // ========================================
    // 3. 店舗サブコレクションのチェック
    // ========================================
    console.log('3️⃣  店舗サブコレクションをチェック中...\n');
    
    const subcollections = [
      'players',
      'games',
      'receipts',
      'dailySales',
      'dailyRankings',
      'monthlyRankings',
      'stackManHands',
    ];
    
    for (const storeId of validStoreIds) {
      console.log(`  🏪 店舗 ${storeId} (${validationReport.stores[storeId].storeName})`);
      
      for (const subcollection of subcollections) {
        const snapshot = await db
          .collection('stores')
          .doc(storeId)
          .collection(subcollection)
          .limit(1)
          .get();
        
        if (!snapshot.empty) {
          console.log(`     ✅ ${subcollection}: データあり`);
        }
      }
      console.log('');
    }
    
    // ========================================
    // 4. サマリー
    // ========================================
    validationReport.summary = {
      totalStores: validStoreIds.size,
      orphanedDataCount: validationReport.orphanedData.length,
      missingStoreIdCount: validationReport.missingStoreId.length,
    };
    
    console.log('='.repeat(60));
    console.log('📊 検証結果サマリー');
    console.log('='.repeat(60));
    console.log(`総店舗数: ${validationReport.summary.totalStores}`);
    console.log(`孤立データ: ${validationReport.summary.orphanedDataCount}件`);
    console.log(`storeId未設定: ${validationReport.summary.missingStoreIdCount}件`);
    console.log('='.repeat(60) + '\n');
    
    if (validationReport.orphanedData.length > 0) {
      console.log('⚠️  孤立データの詳細:');
      validationReport.orphanedData.forEach(item => {
        console.log(`  - ${item.collection}/${item.docId}: storeId="${item.storeId}" (存在しない)`);
      });
      console.log('');
    }
    
    if (validationReport.missingStoreId.length > 0) {
      console.log('⚠️  storeId未設定データの詳細:');
      validationReport.missingStoreId.forEach(item => {
        console.log(`  - ${item.collection}/${item.docId}: storeIdが未設定`);
      });
      console.log('');
    }
    
    // レポートをファイルに保存
    const reportPath = './store-data-validation-report.json';
    fs.writeFileSync(reportPath, JSON.stringify(validationReport, null, 2));
    console.log(`✅ レポートを保存しました: ${reportPath}\n`);
    
  } catch (error) {
    console.error('❌ 検証中にエラーが発生しました:', error);
    throw error;
  }
}

// スクリプト実行
if (require.main === module) {
  console.log('⚠️  このスクリプトはFirebase Admin SDKの初期化が必要です。');
  console.log('⚠️  実際の実行には、サービスアカウントキーを設定してください。\n');
  console.log('📝 このスクリプトは、店舗データ検証の雛形です。');
  console.log('📝 実際のデータ検証は、Firebaseコンソールまたは手動で行ってください。\n');
}

module.exports = { validateStoreData };
