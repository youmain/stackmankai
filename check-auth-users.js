const admin = require('firebase-admin');
const serviceAccount = require('./service-account-key.json');

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

async function checkAuthUsers() {
  try {
    const listUsersResult = await admin.auth().listUsers(1000);
    
    console.log('Firebase Authentication ユーザー一覧:');
    console.log('総ユーザー数:', listUsersResult.users.length);
    console.log('');
    
    listUsersResult.users.forEach((userRecord) => {
      console.log('UID:', userRecord.uid);
      console.log('Email:', userRecord.email);
      console.log('作成日:', userRecord.metadata.creationTime);
      console.log('---');
    });
  } catch (error) {
    console.error('エラー:', error);
  }
}

checkAuthUsers().then(() => process.exit(0));
