'use client';

import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { db } from '@/lib/firebase';
import { doc, onSnapshot, getDoc } from 'firebase/firestore';

export function useEmployeeSession() {
  const router = useRouter();
  const checkIntervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const sessionId = localStorage.getItem('employeeSessionId');
    
    if (!sessionId) {
      router.push('/employee-login');
      return;
    }
    
    // リアルタイムリスナーを設定
    const unsubscribe = onSnapshot(
      doc(db, 'employeeSessions', sessionId),
      (snapshot) => {
        if (!snapshot.exists() || !snapshot.data()?.active) {
          handleLogout();
        }
      },
      (error) => {
        console.error('セッション監視エラー:', error);
      }
    );
    
    // 定期的なセッションチェック（30秒ごと）
    checkIntervalRef.current = setInterval(async () => {
      try {
        const sessionDoc = await getDoc(doc(db, 'employeeSessions', sessionId));
        if (!sessionDoc.exists() || !sessionDoc.data()?.active) {
          handleLogout();
        }
      } catch (error) {
        console.error('セッションチェックエラー:', error);
      }
    }, 30000);
    
    return () => {
      unsubscribe();
      if (checkIntervalRef.current) {
        clearInterval(checkIntervalRef.current);
      }
    };
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem('employeeSessionId');
    localStorage.removeItem('employeeId');
    localStorage.removeItem('employeeName');
    localStorage.removeItem('storeId');
    localStorage.removeItem('employeeRole');
    router.push('/employee-login?message=logged_out');
  };
}
