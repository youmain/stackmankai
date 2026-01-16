/**
 * jest.setup.js
 * 
 * Jest セットアップファイル
 * Firebase Admin SDK を使用したテスト環境の初期化
 */

import admin from 'firebase-admin'
import path from 'path'

// Firebase Admin SDK の初期化
const serviceAccountPath = path.join(process.cwd(), 'firebase-adminsdk.json')

if (!admin.apps.length) {
  try {
    const serviceAccount = require(serviceAccountPath)
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      databaseURL: 'https://stackmankai-default-rtdb.firebaseio.com',
    })
    console.log('Firebase Admin SDK initialized for testing')
  } catch (error) {
    console.warn('Firebase Admin SDK initialization skipped:', error.message)
  }
}

// テスト環境の設定
process.env.NODE_ENV = 'test'
