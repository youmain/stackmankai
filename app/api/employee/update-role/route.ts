import { NextRequest, NextResponse } from 'next/server';
import { getAdminAuth, getAdminDb } from '@/lib/firebase-admin';

const adminAuth = getAdminAuth();
const adminDb = getAdminDb();

export async function POST(req: NextRequest) {
  try {
    const { employeeId, newRole } = await req.json();
    
    // Authorizationヘッダーからトークンを取得
    const token = req.headers.get('Authorization')?.split('Bearer ')[1];
    if (!token) {
      return NextResponse.json({ error: '認証が必要です' }, { status: 401 });
    }
    
    // トークンを検証
    const decodedToken = await adminAuth.verifyIdToken(token);
    const userId = decodedToken.uid;
    
    // 従業員情報を取得
    const employeeDoc = await adminDb.collection('employees').doc(employeeId).get();
    if (!employeeDoc.exists) {
      return NextResponse.json({ error: '従業員が見つかりません' }, { status: 404 });
    }
    
    const employeeData = employeeDoc.data();
    const storeId = employeeData?.storeId;
    
    // ユーザーがオーナーかチェック
    const storeDoc = await adminDb.collection('stores').doc(storeId).get();
    const storeData = storeDoc.data();
    
    if (storeData?.ownerId !== userId) {
      return NextResponse.json({ error: 'オーナーのみがリーダーを設定できます' }, { status: 403 });
    }
    
    // 権限を更新
    await employeeDoc.ref.update({
      role: newRole,
      updatedAt: new Date(),
    });
    
    return NextResponse.json({ success: true });
    
  } catch (error) {
    console.error('権限更新エラー:', error);
    return NextResponse.json({ error: '権限の更新に失敗しました' }, { status: 500 });
  }
}
