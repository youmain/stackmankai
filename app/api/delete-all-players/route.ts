import { NextResponse } from 'next/server';
import { getFirestore, writeBatch } from 'firebase/firestore';
import { collection, getDocs } from 'firebase/firestore';
import { getDb } from '@/lib/firebase';

export async function POST(request: Request) {
  try {
    const { password } = await request.json();
    
    // 簡易的なパスワード認証
    if (password !== 'delete-all-510') {
      return NextResponse.json({ error: '認証エラー' }, { status: 401 });
    }
    
    const db = getDb();
    if (!db) {
      return NextResponse.json({ error: 'Firebase未設定' }, { status: 500 });
    }
    
    let deletedCount = 0;
    
    // 全プレイヤーを取得
    const playersSnapshot = await getDocs(collection(db, 'players'));
    console.log(`全プレイヤー数: ${playersSnapshot.size}`);
    
    let batch = writeBatch(db);
    let batchCount = 0;
    
    for (const doc of playersSnapshot.docs) {
      batch.delete(doc.ref);
      deletedCount++;
      batchCount++;
      
      // Firestoreのバッチは500件まで
      if (batchCount >= 500) {
        await batch.commit();
        batch = writeBatch(db);
        batchCount = 0;
      }
    }
    
    if (batchCount > 0) {
      await batch.commit();
    }
    
    return NextResponse.json({
      success: true,
      message: `${deletedCount}人のプレイヤーを削除しました`,
      deletedCount,
    });
    
  } catch (error: any) {
    console.error('Delete error:', error);
    return NextResponse.json(
      { error: error.message || '削除エラー' },
      { status: 500 }
    );
  }
}
