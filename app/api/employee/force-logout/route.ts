import { NextRequest, NextResponse } from 'next/server';
import { getAdminAuth, getAdminDb } from '@/lib/firebase-admin';

const adminAuth = getAdminAuth();
const adminDb = getAdminDb();

export async function POST(req: NextRequest) {
  try {
    const { employeeId } = await req.json();
    
    // Authorizationヘッダーからトークンを取得
    const token = req.headers.get('Authorization')?.split('Bearer ')[1];
    if (!token) {
      return NextResponse.json({ error: '認証が必要です' }, { status: 401 });
    }
    
    // トークンを検証
    const decodedToken = await adminAuth.verifyIdToken(token);
    const userId = decodedToken.uid;
    
    // 対象従業員の情報を取得
    const employeeDoc = await adminDb.collection('employees').doc(employeeId).get();
    if (!employeeDoc.exists) {
      return NextResponse.json({ error: '従業員が見つかりません' }, { status: 404 });
    }
    
    const employeeData = employeeDoc.data();
    const storeId = employeeData?.storeId;
    
    // ユーザーがオーナーまたはリーダーかチェック
    const hasPermission = await checkLogoutPermission(userId, storeId);
    if (!hasPermission) {
      return NextResponse.json({ error: '権限がありません' }, { status: 403 });
    }
    
    // 対象従業員がリーダーの場合、実行者がオーナーかチェック
    if (employeeData?.role === 'leader') {
      const storeDoc = await adminDb.collection('stores').doc(storeId).get();
      const storeData = storeDoc.data();
      
      if (storeData?.ownerId !== userId) {
        return NextResponse.json({ 
          error: 'リーダーをログアウトさせることができるのはオーナーのみです' 
        }, { status: 403 });
      }
    }
    
    // 自分自身をログアウトさせることを防ぐ
    const currentEmployeeQuery = await adminDb
      .collection('employees')
      .where('storeId', '==', storeId)
      .where('id', '==', userId)
      .limit(1)
      .get();

    if (!currentEmployeeQuery.empty && currentEmployeeQuery.docs[0].id === employeeId) {
      return NextResponse.json({ 
        error: '自分自身をログアウトさせることはできません' 
      }, { status: 400 });
    }
    
    // 対象従業員の全セッションを取得
    const sessionsSnapshot = await adminDb
      .collection('employeeSessions')
      .where('employeeId', '==', employeeId)
      .where('active', '==', true)
      .get();
    
    // 全セッションを無効化
    const batch = adminDb.batch();
    const now = new Date();
    
    sessionsSnapshot.docs.forEach((doc) => {
      batch.update(doc.ref, {
        active: false,
        deactivatedAt: now,
        deactivatedBy: userId,
      });
    });
    
    await batch.commit();
    
    return NextResponse.json({ 
      success: true,
      deactivatedSessions: sessionsSnapshot.size 
    });
    
  } catch (error) {
    console.error('強制ログアウトエラー:', error);
    return NextResponse.json({ error: 'ログアウトに失敗しました' }, { status: 500 });
  }
}

// オーナーまたはリーダーかチェックする関数
async function checkLogoutPermission(userId: string, storeId: string): Promise<boolean> {
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
