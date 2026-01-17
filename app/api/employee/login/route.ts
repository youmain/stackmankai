import { NextRequest, NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebase-admin';

import { v4 as uuidv4 } from 'uuid';

export async function POST(req: NextRequest) {
  try {
    const adminDb = getAdminDb();
    const { inviteCode, deviceInfo } = await req.json();
    
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
    
    // 招待コードから従業員名を取得
    const employeeName = inviteData?.employeeName;
    
    if (!employeeName) {
      return NextResponse.json({ error: '招待コードに従業員名が設定されていません' }, { status: 400 });
    }
    
    // 従業員情報を作成
    const employeeRef = adminDb.collection('employees').doc();
    const employeeId = employeeRef.id;
    
    await employeeRef.set({
      id: employeeId,
      storeId: inviteData?.storeId,
      name: employeeName,
      role: inviteData?.role,
      invitedBy: inviteData?.createdBy,
      invitedAt: inviteData?.createdAt,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    
    // セッションを作成
    const sessionId = uuidv4();
    await adminDb.collection('employeeSessions').doc(sessionId).set({
      id: sessionId,
      storeId: inviteData?.storeId,
      employeeId,
      active: true,
      deviceInfo,
      lastAccessedAt: new Date(),
      createdAt: new Date(),
    });
    
    // 招待コードを使用済みにする
    await inviteDoc.ref.update({
      used: true,
      usedBy: employeeId,
      usedAt: new Date(),
    });
    
    return NextResponse.json({
      success: true,
      sessionId,
      employeeId,
      employeeName,
      storeId: inviteData?.storeId,
      role: inviteData?.role,
    });
    
  } catch (error) {
    console.error('従業員ログインエラー:', error);
    return NextResponse.json({ error: 'ログインに失敗しました' }, { status: 500 });
  }
}
