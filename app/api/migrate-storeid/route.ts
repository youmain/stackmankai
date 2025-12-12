import { NextResponse } from 'next/server';
import { getFirestore, writeBatch } from 'firebase/firestore';
import { collection, getDocs } from 'firebase/firestore';
import { getDb } from '@/lib/firebase';

export async function POST(request: Request) {
  try {
    const { password } = await request.json();
    
    // 簡易的なパスワード認証
    if (password !== 'migrate510') {
      return NextResponse.json({ error: '認証エラー' }, { status: 401 });
    }
    
    const db = getDb();
    if (!db) {
      return NextResponse.json({ error: 'Firebase未設定' }, { status: 500 });
    }
    
    const DEFAULT_STORE_ID = '510';
    const results: any = {
      players: { updated: 0, skipped: 0 },
      receipts: { updated: 0, skipped: 0 },
      rakeHistory: { updated: 0, skipped: 0 },
      rankings: { updated: 0, skipped: 0 },
    };
    
    // プレイヤー移行
    const playersSnapshot = await getDocs(collection(db, 'players'));
    let batch = writeBatch(db);
    let batchCount = 0;
    
    for (const doc of playersSnapshot.docs) {
      const data = doc.data();
      if (!data.storeId) {
        batch.update(doc.ref, {
          storeId: DEFAULT_STORE_ID,
          updatedAt: new Date(),
        });
        results.players.updated++;
        batchCount++;
        
        // Firestoreのバッチは500件まで
        if (batchCount >= 500) {
          await batch.commit();
          batch = writeBatch(db);
          batchCount = 0;
        }
      } else {
        results.players.skipped++;
      }
    }
    
    if (batchCount > 0) {
      await batch.commit();
    }
    
    // 伝票移行
    const receiptsSnapshot = await getDocs(collection(db, 'receipts'));
    batch = writeBatch(db);
    batchCount = 0;
    
    for (const doc of receiptsSnapshot.docs) {
      const data = doc.data();
      if (!data.storeId) {
        batch.update(doc.ref, {
          storeId: DEFAULT_STORE_ID,
          updatedAt: new Date(),
        });
        results.receipts.updated++;
        batchCount++;
        
        if (batchCount >= 500) {
          await batch.commit();
          batch = writeBatch(db);
          batchCount = 0;
        }
      } else {
        results.receipts.skipped++;
      }
    }
    
    if (batchCount > 0) {
      await batch.commit();
    }
    
    // レーキ履歴移行
    const rakeSnapshot = await getDocs(collection(db, 'rakeHistory'));
    batch = writeBatch(db);
    batchCount = 0;
    
    for (const doc of rakeSnapshot.docs) {
      const data = doc.data();
      if (!data.storeId) {
        batch.update(doc.ref, {
          storeId: DEFAULT_STORE_ID,
        });
        results.rakeHistory.updated++;
        batchCount++;
        
        if (batchCount >= 500) {
          await batch.commit();
          batch = writeBatch(db);
          batchCount = 0;
        }
      } else {
        results.rakeHistory.skipped++;
      }
    }
    
    if (batchCount > 0) {
      await batch.commit();
    }
    
    // ランキング移行（日別・月別）
    const dailySnapshot = await getDocs(collection(db, 'dailyRankings'));
    const monthlySnapshot = await getDocs(collection(db, 'monthlyRankings'));
    batch = writeBatch(db);
    batchCount = 0;
    
    for (const doc of dailySnapshot.docs) {
      const data = doc.data();
      if (!data.storeId) {
        batch.update(doc.ref, { storeId: DEFAULT_STORE_ID });
        results.rankings.updated++;
        batchCount++;
        
        if (batchCount >= 500) {
          await batch.commit();
          batch = writeBatch(db);
          batchCount = 0;
        }
      } else {
        results.rankings.skipped++;
      }
    }
    
    for (const doc of monthlySnapshot.docs) {
      const data = doc.data();
      if (!data.storeId) {
        batch.update(doc.ref, { storeId: DEFAULT_STORE_ID });
        results.rankings.updated++;
        batchCount++;
        
        if (batchCount >= 500) {
          await batch.commit();
          batch = writeBatch(db);
          batchCount = 0;
        }
      } else {
        results.rankings.skipped++;
      }
    }
    
    if (batchCount > 0) {
      await batch.commit();
    }
    
    return NextResponse.json({
      success: true,
      message: '移行完了',
      results,
    });
    
  } catch (error: any) {
    console.error('Migration error:', error);
    return NextResponse.json(
      { error: error.message || '移行エラー' },
      { status: 500 }
    );
  }
}
