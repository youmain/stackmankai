/**
 * Fix existing poker games by adding timeoutSeconds field
 * 
 * Usage:
 * npx tsx scripts/fix-timeout-seconds.ts <storeId>
 */

import { initializeApp, cert } from 'firebase-admin/app'
import { getFirestore } from 'firebase-admin/firestore'

// Initialize Firebase Admin
const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT_KEY
  ? JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY)
  : null

if (!serviceAccount) {
  console.error('Error: FIREBASE_SERVICE_ACCOUNT_KEY environment variable not set')
  process.exit(1)
}

initializeApp({
  credential: cert(serviceAccount)
})

const db = getFirestore()

async function fixTimeoutSeconds(storeId: string) {
  console.log(`Fixing timeout seconds for store: ${storeId}`)
  
  const gamesRef = db.collection('pokerGames').doc(`store_${storeId}`).collection('games')
  const snapshot = await gamesRef.get()
  
  console.log(`Found ${snapshot.size} games`)
  
  let updated = 0
  let skipped = 0
  
  for (const doc of snapshot.docs) {
    const data = doc.data()
    
    if (data.timeoutSeconds === undefined) {
      await doc.ref.update({
        timeoutSeconds: 30
      })
      console.log(`✅ Updated game ${doc.id}`)
      updated++
    } else {
      console.log(`⏭️  Skipped game ${doc.id} (already has timeoutSeconds: ${data.timeoutSeconds})`)
      skipped++
    }
  }
  
  console.log(`\n✅ Done! Updated: ${updated}, Skipped: ${skipped}`)
}

const storeId = process.argv[2]

if (!storeId) {
  console.error('Usage: npx tsx scripts/fix-timeout-seconds.ts <storeId>')
  process.exit(1)
}

fixTimeoutSeconds(storeId)
  .then(() => process.exit(0))
  .catch(error => {
    console.error('Error:', error)
    process.exit(1)
  })
