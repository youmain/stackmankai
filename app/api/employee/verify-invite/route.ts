import { NextRequest, NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebase-admin';

const adminDb = getAdminDb();

export async function POST(req: NextRequest) {
  try {
    const { inviteCode } = await req.json();
    
    if (!inviteCode) {
      return NextResponse.json({ error: '招待コードが必要です' }, { status: 400 });
    }
    
    // 招待コードを検証
    const inviteDoc = await adminDb.collection('inviteCodes').doc(inviteCode).get();
    
    if (!inviteDoc.exists) {
      return NextResponse.json({ error: '無効な招待コードです' }, { status: 400 });
    }
    
    const inviteData = inviteDoc.data();
    
    // 使用済みチェック
    if (inviteData?.used) {
      return NextResponse.json({ error: 'この招待コードは既に使用されています' }, { status: 400 });
    }
    
    // 有効期限チェック
    if (inviteData?.expiresAt && inviteData.expiresAt.toDate() < new Date()) {
      return NextResponse.json({ error: '招待コードの有効期限が切れています' }, { status: 400 });
    }
    
    // 従業員名が設定されているかチェック
    if (!inviteData?.employeeName) {
      return NextResponse.json({ error: '招待コードに従業員名が設定されていません' }, { status: 400 });
    }
    
    return NextResponse.json({
      success: true,
      employeeName: inviteData.employeeName,
      role: inviteData.role,
    });
    
  } catch (error) {
    console.error('招待コード検証エラー:', error);
    return NextResponse.json({ error: '招待コードの検証に失敗しました' }, { status: 500 });
  }
}
