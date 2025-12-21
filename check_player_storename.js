const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccountKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function checkPlayer() {
  try {
    // Search by uniqueId
    const playersRef = db.collection('players');
    const snapshot = await playersRef.where('uniqueId', '==', '498161').get();
    
    if (snapshot.empty) {
      console.log('Player 498161 not found');
      return;
    }
    
    snapshot.forEach(doc => {
      const data = doc.data();
      console.log('Player Document ID:', doc.id);
      console.log('Player Data:');
      console.log('  uniqueId:', data.uniqueId);
      console.log('  storeId:', data.storeId);
      console.log('  storeName:', data.storeName);
      console.log('  name:', data.name);
      console.log('  systemBalance:', data.systemBalance);
      console.log('\nAll fields:', JSON.stringify(data, null, 2));
    });
  } catch (error) {
    console.error('Error:', error);
  } finally {
    process.exit(0);
  }
}

checkPlayer();
