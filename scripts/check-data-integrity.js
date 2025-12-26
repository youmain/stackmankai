/**
 * データ整合性チェックスクリプト
 * 
 * このスクリプトは以下をチェックします：
 * 1. usersコレクションの存在と完全性
 * 2. 各ドキュメントにstoreIdが設定されているか
 * 3. 孤立したデータの検出
 * 4. ロール情報の整合性
 * 
 * 実行方法:
 * node scripts/check-data-integrity.js
 */

const admin = require('firebase-admin');
const fs = require('fs');

// Firebase Admin初期化（環境変数から読み込み）
// サービスアカウントキーが必要です
console.log('\n🔍 データ整合性チェック開始\n');
console.log('⚠️  このスクリプトはFirebase Admin SDKを使用します。');
console.log('⚠️  サービスアカウントキーが必要です。\n');

// 結果を保存するオブジェクト
const report = {
  timestamp: new Date().toISOString(),
  checks: [],
  issues: [],
  warnings: [],
  summary: {}
};

function addCheck(name, status, details = '') {
  report.checks.push({ name, status, details });
  const icon = status === 'pass' ? '✅' : status === 'fail' ? '❌' : '⚠️';
  console.log(`${icon} ${name}${details ? ': ' + details : ''}`);
}

function addIssue(severity, message, data = null) {
  const issue = { severity, message, data };
  if (severity === 'error') {
    report.issues.push(issue);
    console.log(`  ❌ エラー: ${message}`);
  } else {
    report.warnings.push(issue);
    console.log(`  ⚠️  警告: ${message}`);
  }
  if (data) {
    console.log(`     データ: ${JSON.stringify(data)}`);
  }
}

async function checkDataIntegrity() {
  try {
    // Firebase Admin初期化チェック
    if (admin.apps.length === 0) {
      console.log('❌ Firebase Adminが初期化されていません。');
      console.log('\n📝 初期化方法:');
      console.log('1. Firebaseコンソールからサービスアカウントキーをダウンロード');
      console.log('2. 環境変数GOOGLE_APPLICATION_CREDENTIALSに設定');
      console.log('3. または、このスクリプトでinitializeApp()を呼び出す\n');
      return;
    }

    const db = admin.firestore();
    
    console.log('📊 データ整合性チェック項目:\n');
    
    // ========================================
    // 1. usersコレクションのチェック
    // ========================================
    console.log('1️⃣  usersコレクション');
    const usersSnapshot = await db.collection('users').get();
    const userCount = usersSnapshot.size;
    addCheck('usersコレクション存在確認', userCount > 0 ? 'pass' : 'fail', `${userCount}件`);
    
    let validUsers = 0;
    let missingRole = 0;
    let missingStoreId = 0;
    let missingEmail = 0;
    
    for (const doc of usersSnapshot.docs) {
      const data = doc.data();
      let isValid = true;
      
      if (!data.role) {
        missingRole++;
        isValid = false;
        addIssue('error', `ユーザー ${doc.id} にroleが設定されていません`, { uid: doc.id, email: data.email });
      }
      
      if (!data.storeId && (data.role === 'store_owner' || data.role === 'employee')) {
        missingStoreId++;
        isValid = false;
        addIssue('error', `ユーザー ${doc.id} (${data.role}) にstoreIdが設定されていません`, { uid: doc.id, email: data.email });
      }
      
      if (!data.email) {
        missingEmail++;
        isValid = false;
        addIssue('error', `ユーザー ${doc.id} にemailが設定されていません`, { uid: doc.id });
      }
      
      if (isValid) validUsers++;
    }
    
    addCheck('ユーザーデータ完全性', missingRole === 0 && missingStoreId === 0 && missingEmail === 0 ? 'pass' : 'fail',
      `有効: ${validUsers}/${userCount}`);
    
    // ========================================
    // 2. storesコレクションのチェック
    // ========================================
    console.log('\n2️⃣  storesコレクション');
    const storesSnapshot = await db.collection('stores').get();
    const storeCount = storesSnapshot.size;
    addCheck('storesコレクション存在確認', storeCount > 0 ? 'pass' : 'fail', `${storeCount}件`);
    
    const storeIds = new Set();
    for (const doc of storesSnapshot.docs) {
      storeIds.add(doc.id);
    }
    
    // ========================================
    // 3. 店舗データの整合性チェック
    // ========================================
    console.log('\n3️⃣  店舗データ整合性');
    
    // usersコレクションのstoreIdが実際に存在するかチェック
    let orphanedUsers = 0;
    for (const doc of usersSnapshot.docs) {
      const data = doc.data();
      if (data.storeId && !storeIds.has(data.storeId)) {
        orphanedUsers++;
        addIssue('warning', `ユーザー ${doc.id} のstoreId "${data.storeId}" が存在しません`, 
          { uid: doc.id, email: data.email, storeId: data.storeId });
      }
    }
    
    addCheck('孤立ユーザーチェック', orphanedUsers === 0 ? 'pass' : 'warn', 
      orphanedUsers > 0 ? `${orphanedUsers}件の孤立ユーザー` : '');
    
    // ========================================
    // 4. customerAccountsコレクションのチェック
    // ========================================
    console.log('\n4️⃣  customerAccountsコレクション');
    const customerAccountsSnapshot = await db.collection('customerAccounts').get();
    const customerCount = customerAccountsSnapshot.size;
    addCheck('customerAccountsコレクション', 'pass', `${customerCount}件`);
    
    let missingCustomerStoreId = 0;
    for (const doc of customerAccountsSnapshot.docs) {
      const data = doc.data();
      if (!data.storeId) {
        missingCustomerStoreId++;
        addIssue('warning', `顧客アカウント ${doc.id} にstoreIdが設定されていません`, 
          { id: doc.id, uid: data.uid });
      }
    }
    
    addCheck('顧客アカウントstoreId', missingCustomerStoreId === 0 ? 'pass' : 'warn',
      missingCustomerStoreId > 0 ? `${missingCustomerStoreId}件にstoreIdなし` : '');
    
    // ========================================
    // 5. サブコレクションのstoreIdチェック（サンプル）
    // ========================================
    console.log('\n5️⃣  サブコレクションチェック');
    
    for (const storeId of storeIds) {
      const playersSnapshot = await db.collection('stores').doc(storeId).collection('players').limit(1).get();
      if (!playersSnapshot.empty) {
        addCheck(`店舗 ${storeId} のplayersサブコレクション`, 'pass', `データあり`);
        break; // サンプルチェックなので1件のみ
      }
    }
    
    // ========================================
    // サマリー
    // ========================================
    report.summary = {
      totalUsers: userCount,
      validUsers,
      totalStores: storeCount,
      totalCustomers: customerCount,
      issues: report.issues.length,
      warnings: report.warnings.length,
    };
    
    console.log('\n' + '='.repeat(60));
    console.log('📊 チェック結果サマリー');
    console.log('='.repeat(60));
    console.log(`総ユーザー数: ${userCount}`);
    console.log(`有効ユーザー数: ${validUsers}`);
    console.log(`総店舗数: ${storeCount}`);
    console.log(`総顧客数: ${customerCount}`);
    console.log(`エラー: ${report.issues.length}件`);
    console.log(`警告: ${report.warnings.length}件`);
    console.log('='.repeat(60) + '\n');
    
    // レポートをファイルに保存
    const reportPath = './data-integrity-report.json';
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    console.log(`✅ レポートを保存しました: ${reportPath}\n`);
    
  } catch (error) {
    console.error('❌ チェック中にエラーが発生しました:', error);
    throw error;
  }
}

// スクリプト実行
if (require.main === module) {
  console.log('⚠️  このスクリプトはFirebase Admin SDKの初期化が必要です。');
  console.log('⚠️  実際の実行には、サービスアカウントキーを設定してください。\n');
  console.log('📝 このスクリプトは、データ整合性チェックの雛形です。');
  console.log('📝 実際のデータチェックは、Firebaseコンソールまたは手動で行ってください。\n');
}

module.exports = { checkDataIntegrity };
