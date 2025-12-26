/**
 * ユーザーデータ移行スクリプト
 * 
 * このスクリプトは以下を実行します：
 * 1. Firebase Authユーザーを取得
 * 2. usersコレクションにユーザーデータが存在するか確認
 * 3. 存在しない場合、デフォルトデータを作成
 * 4. 既存データの不整合を修正
 * 
 * 実行方法:
 * node scripts/migrate-user-data.js
 */

const admin = require('firebase-admin');

console.log('\n🔄 ユーザーデータ移行スクリプト\n');
console.log('⚠️  このスクリプトはFirebase Admin SDKを使用します。');
console.log('⚠️  サービスアカウントキーが必要です。\n');

const migrationReport = {
  timestamp: new Date().toISOString(),
  processed: 0,
  created: 0,
  updated: 0,
  skipped: 0,
  errors: [],
};

async function migrateUserData(dryRun = true) {
  try {
    if (admin.apps.length === 0) {
      console.log('❌ Firebase Adminが初期化されていません。\n');
      return;
    }

    const auth = admin.auth();
    const db = admin.firestore();
    
    console.log(`🔍 モード: ${dryRun ? 'DRY RUN（実際の変更なし）' : '本番実行'}\n`);
    
    // ========================================
    // 1. Firebase Authユーザーを取得
    // ========================================
    console.log('1️⃣  Firebase Authユーザーを取得中...');
    const listUsersResult = await auth.listUsers();
    const authUsers = listUsersResult.users;
    console.log(`   ${authUsers.length}件のユーザーを取得\n`);
    
    // ========================================
    // 2. 各ユーザーをチェック・移行
    // ========================================
    console.log('2️⃣  ユーザーデータをチェック・移行中...\n');
    
    for (const authUser of authUsers) {
      migrationReport.processed++;
      
      try {
        const userDocRef = db.collection('users').doc(authUser.uid);
        const userDoc = await userDocRef.get();
        
        if (!userDoc.exists()) {
          // usersコレクションにデータが存在しない
          console.log(`  ⚠️  ユーザー ${authUser.uid} (${authUser.email}) のデータが存在しません`);
          
          // デフォルトデータを作成
          const defaultUserData = {
            uid: authUser.uid,
            email: authUser.email || '',
            role: 'customer', // デフォルトは顧客
            storeId: null,
            storeName: null,
            displayName: authUser.displayName || authUser.email?.split('@')[0] || 'ユーザー',
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
          };
          
          if (!dryRun) {
            await userDocRef.set(defaultUserData);
            console.log(`     ✅ デフォルトデータを作成しました`);
            migrationReport.created++;
          } else {
            console.log(`     [DRY RUN] デフォルトデータを作成します: ${JSON.stringify(defaultUserData, null, 2)}`);
          }
          
        } else {
          // usersコレクションにデータが存在する
          const userData = userDoc.data();
          const updates = {};
          let needsUpdate = false;
          
          // 必須フィールドのチェック
          if (!userData.email && authUser.email) {
            updates.email = authUser.email;
            needsUpdate = true;
          }
          
          if (!userData.role) {
            updates.role = 'customer';
            needsUpdate = true;
            console.log(`  ⚠️  ユーザー ${authUser.uid} にroleが設定されていません → customer`);
          }
          
          if (!userData.displayName) {
            updates.displayName = authUser.displayName || authUser.email?.split('@')[0] || 'ユーザー';
            needsUpdate = true;
          }
          
          if (!userData.updatedAt) {
            updates.updatedAt = admin.firestore.FieldValue.serverTimestamp();
            needsUpdate = true;
          }
          
          if (needsUpdate) {
            if (!dryRun) {
              await userDocRef.update(updates);
              console.log(`  ✅ ユーザー ${authUser.uid} を更新しました`);
              migrationReport.updated++;
            } else {
              console.log(`  [DRY RUN] ユーザー ${authUser.uid} を更新します: ${JSON.stringify(updates, null, 2)}`);
            }
          } else {
            migrationReport.skipped++;
          }
        }
        
      } catch (error) {
        console.error(`  ❌ ユーザー ${authUser.uid} の処理中にエラー:`, error.message);
        migrationReport.errors.push({
          uid: authUser.uid,
          email: authUser.email,
          error: error.message,
        });
      }
    }
    
    // ========================================
    // 3. 移行結果のサマリー
    // ========================================
    console.log('\n' + '='.repeat(60));
    console.log('📊 移行結果サマリー');
    console.log('='.repeat(60));
    console.log(`処理したユーザー数: ${migrationReport.processed}`);
    console.log(`作成したユーザー数: ${migrationReport.created}`);
    console.log(`更新したユーザー数: ${migrationReport.updated}`);
    console.log(`スキップしたユーザー数: ${migrationReport.skipped}`);
    console.log(`エラー数: ${migrationReport.errors.length}`);
    console.log('='.repeat(60) + '\n');
    
    if (migrationReport.errors.length > 0) {
      console.log('❌ エラー詳細:');
      migrationReport.errors.forEach(err => {
        console.log(`  - ${err.uid} (${err.email}): ${err.error}`);
      });
      console.log('');
    }
    
    if (dryRun) {
      console.log('ℹ️  これはDRY RUNです。実際の変更は行われていません。');
      console.log('ℹ️  本番実行するには、dryRun=falseで実行してください。\n');
    } else {
      console.log('✅ 移行が完了しました。\n');
    }
    
  } catch (error) {
    console.error('❌ 移行中にエラーが発生しました:', error);
    throw error;
  }
}

// スクリプト実行
if (require.main === module) {
  console.log('⚠️  このスクリプトはFirebase Admin SDKの初期化が必要です。');
  console.log('⚠️  実際の実行には、サービスアカウントキーを設定してください。\n');
  console.log('📝 このスクリプトは、ユーザーデータ移行の雛形です。');
  console.log('📝 実際のデータ移行は、慎重に行ってください。\n');
  
  // DRY RUNモードで実行例を表示
  console.log('実行例:');
  console.log('  DRY RUN: node scripts/migrate-user-data.js');
  console.log('  本番実行: node scripts/migrate-user-data.js --production\n');
}

module.exports = { migrateUserData };
