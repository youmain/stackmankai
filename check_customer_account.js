const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccountKey.json');

// Check if already initialized
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

const db = admin.firestore();

async function checkCustomerAccount() {
  try {
    // Get auth user by email
    const auth = admin.auth();
    const user = await auth.getUserByEmail('testplayer3@example.com');
    console.log('Auth User ID:', user.uid);
    
    // Get customer account
    const accountDoc = await db.collection('customerAccounts').doc(user.uid).get();
    
    if (!accountDoc.exists) {
      console.log('Customer account not found');
      return;
    }
    
    const data = accountDoc.data();
    console.log('\nCustomer Account Data:');
    console.log('  linkedPlayerId:', data.linkedPlayerId);
    console.log('  playerName:', data.playerName);
    console.log('  storeId:', data.storeId);
    console.log('\nAll fields:', JSON.stringify(data, null, 2));
    
    // Now search for the actual player
    if (data.linkedPlayerId) {
      console.log('\n--- Searching for linked player ---');
      const playerDoc = await db.collection('players').doc(data.linkedPlayerId).get();
      
      if (playerDoc.exists) {
        const playerData = playerDoc.data();
        console.log('Player found by document ID!');
        console.log('  uniqueId:', playerData.uniqueId);
        console.log('  storeId:', playerData.storeId);
        console.log('  storeName:', playerData.storeName);
        console.log('  name:', playerData.name);
        console.log('  systemBalance:', playerData.systemBalance);
      } else {
        console.log('Player document not found:', data.linkedPlayerId);
      }
    }
  } catch (error) {
    console.error('Error:', error);
  } finally {
    process.exit(0);
  }
}

checkCustomerAccount();
