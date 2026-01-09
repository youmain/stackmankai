import { NextRequest, NextResponse } from 'next/server';
import { getAdminAuth, getAdminDb } from '@/lib/firebase-admin';
import { v4 as uuidv4 } from 'uuid';

export async function POST(req: NextRequest) {
  try {
    // Firebase を初期化（遅延初期化）
    const adminAuth = getAdminAuth();
    const adminDb = getAdminDb();
    
    if (!adminAuth || !adminDb) {
      return NextResponse.json({ error: 'Firebase が初期化されていません' }, { status: 500 });
    }
    
    // リクエストボディを取得
    const { storeId, role, expiresInDays, employeeName } = await req.json();
    
    // Authorizationヘッダーからトークンを取得
    const token = req.headers.get('Authorization')?.split('Bearer ')[1];
    if (!token) {
      return NextResponse.json({ error: '認証が必要です' }, { status: 401 });
    }
    
    // トークンを検証してユーザーIDを取得
    const decodedToken = await adminAuth.verifyIdToken(token);
    const userId = decodedToken.uid;
    
    // ユーザーがオーナーまたはリーダーかチェック
    const hasPermission = await checkInvitePermission(userId, storeId);
    if (!hasPermission) {
      return NextResponse.json({ error: '権限がありません' }, { status: 403 });
    }
    
    // 招待コードを生成（UUID）
    const inviteCode = uuidv4();
    
    // 有効期限を計算
    const expiresAt = expiresInDays 
      ? new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000)
      : null;
    
    // Firestoreに招待コードを保存
    await adminDb.collection('inviteCodes').doc(inviteCode).set({
      storeId,
      role,
      employeeName,
      createdBy: userId,
      createdAt: new Date(),
      expiresAt,
      used: false,
    });
    
    return NextResponse.json({ 
      success: true, 
      inviteCode,
      employeeName,
      expiresAt 
    });
    
  } catch (error) {
    console.error('招待コード生成エラー:', error);
    return NextResponse.json({ error: '招待コードの生成に失敗しました' }, { status: 500 });
  }
}

// オーナーまたはリーダーかチェックする関数
async function checkInvitePermission(userId: string, storeId: string): Promise<boolean> {
  // Firebase を初期化（遅延初期化）
  const adminDb = getAdminDb();
  if (!adminDb) {
    throw new Error('Firebase が初期化されていません');
  }
  
  // 店舗情報を取得
  const storeDoc = await adminDb.collection('stores').doc(storeId).get();
  if (!storeDoc.exists) {
    return false;
  }
  
  const storeData = storeDoc.data();
  
  // オーナーの場合
  if (storeData?.ownerId === userId) {
    return true;
  }
  
  // リーダーの場合
  const employeeQuery = await adminDb
    .collection('employees')
    .where('storeId', '==', storeId)
    .where('id', '==', userId)
    .where('role', '==', 'leader')
    .limit(1)
    .get();
  
  return !employeeQuery.empty;
}
