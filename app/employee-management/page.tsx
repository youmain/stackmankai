'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';
import EmployeeInvite from '@/components/EmployeeInvite';
import EmployeeList from '@/components/EmployeeList';
import { ArrowLeft, Users } from 'lucide-react';
import { AuthGuard } from '@/components/auth-guard';

export default function EmployeeManagementPage() {
  const router = useRouter();
  const { user, storeId, isStoreOwner, loading } = useAuth();

  useEffect(() => {
    if (!loading && !user) {
      router.push('/store-login');
      return;
    }

    if (!loading && !storeId) {
      alert('店舗情報が見つかりません');
      router.push('/store-login');
      return;
    }
  }, [user, storeId, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">読み込み中...</p>
        </div>
      </div>
    );
  }

  if (!user || !storeId) {
    return null;
  }

  return (
    <AuthGuard>
      <div className="min-h-screen bg-gray-100">
      {/* ヘッダー */}
      <div className="bg-white shadow-md">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <button
                onClick={() => router.push('/admin')}
                className="mr-4 text-gray-600 hover:text-gray-800"
              >
                <ArrowLeft size={24} />
              </button>
              <Users className="text-blue-600 mr-2" size={28} />
              <h1 className="text-2xl font-bold">従業員管理</h1>
            </div>
          </div>
        </div>
      </div>

      {/* メインコンテンツ */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* 招待コンポーネント */}
          <EmployeeInvite storeId={storeId} />
        </div>

        {/* 従業員一覧 */}
        <EmployeeList 
          storeId={storeId} 
          currentUserId={user.uid}
          isOwner={isStoreOwner}
        />
      </div>
    </div>
    </AuthGuard>
  );
}
