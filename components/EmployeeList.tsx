'use client';

import { useState, useEffect } from 'react';
import { auth, db } from '@/lib/firebase';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { Users, LogOut, Crown, Shield } from 'lucide-react';

interface Employee {
  id: string;
  name: string;
  role: 'leader' | 'employee';
  invitedAt: any;
}

interface EmployeeListProps {
  storeId: string;
  currentUserId: string;
  isOwner: boolean;
}

export default function EmployeeList({ storeId, currentUserId, isOwner }: EmployeeListProps) {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 従業員一覧をリアルタイムで取得
    const q = query(
      collection(getDb()!, 'employees'),
      where('storeId', '==', storeId)
    );
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const employeeList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      })) as Employee[];
      
      setEmployees(employeeList);
      setLoading(false);
    });
    
    return () => unsubscribe();
  }, [storeId]);

  const handleForceLogout = async (employeeId: string, employeeName: string) => {
    if (!confirm(`${employeeName}さんをログアウトさせますか？`)) {
      return;
    }
    
    try {
      const user = auth.currentUser;
      if (!user) {
        throw new Error('ログインが必要です');
      }
      
      const token = await user.getIdToken();
      
      const response = await fetch('/api/employee/force-logout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ employeeId }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'ログアウトに失敗しました');
      }
      
      alert(`${employeeName}さんをログアウトさせました（${data.deactivatedSessions}セッション）`);
      
    } catch (error: any) {
      alert(`エラー: ${error.message}`);
    }
  };

  const handleUpdateRole = async (employeeId: string, currentRole: string) => {
    const newRole = currentRole === 'leader' ? 'employee' : 'leader';
    const action = newRole === 'leader' ? 'リーダーに昇格' : '従業員に降格';
    
    if (!confirm(`この従業員を${action}させますか？`)) {
      return;
    }
    
    try {
      const user = auth.currentUser;
      if (!user) {
        throw new Error('ログインが必要です');
      }
      
      const token = await user.getIdToken();
      
      const response = await fetch('/api/employee/update-role', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ employeeId, newRole }),
      });
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || '権限の更新に失敗しました');
      }
      
      alert(`権限を更新しました`);
      
    } catch (error: any) {
      alert(`エラー: ${error.message}`);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="text-center text-gray-500">読み込み中...</div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <div className="flex items-center mb-4">
        <Users className="text-blue-600 mr-2" size={24} />
        <h2 className="text-2xl font-bold">従業員一覧</h2>
        <span className="ml-2 bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-semibold">
          {employees.length}人
        </span>
      </div>
      
      {employees.length === 0 ? (
        <div className="text-center text-gray-500 py-8">
          従業員がまだいません
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b-2 border-gray-200">
                <th className="text-left py-3 px-2">名前</th>
                <th className="text-left py-3 px-2">権限</th>
                <th className="text-left py-3 px-2">招待日時</th>
                <th className="text-left py-3 px-2">操作</th>
              </tr>
            </thead>
            <tbody>
              {employees.map((employee) => (
                <tr key={employee.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-3 px-2 font-medium">{employee.name}</td>
                  <td className="py-3 px-2">
                    {employee.role === 'leader' ? (
                      <span className="inline-flex items-center bg-purple-100 text-purple-800 px-3 py-1 rounded-full text-sm font-semibold">
                        <Crown size={14} className="mr-1" />
                        リーダー
                      </span>
                    ) : (
                      <span className="inline-flex items-center bg-gray-100 text-gray-800 px-3 py-1 rounded-full text-sm font-semibold">
                        <Shield size={14} className="mr-1" />
                        従業員
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-2 text-sm text-gray-600">
                    {employee.invitedAt?.toDate?.()?.toLocaleDateString() || '-'}
                  </td>
                  <td className="py-3 px-2">
                    <div className="flex space-x-2">
                      {isOwner && (
                        <button
                          onClick={() => handleUpdateRole(employee.id, employee.role)}
                          className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700 transition-all"
                        >
                          {employee.role === 'leader' ? '降格' : '昇格'}
                        </button>
                      )}
                      <button
                        onClick={() => handleForceLogout(employee.id, employee.name)}
                        className="bg-red-600 text-white px-3 py-1 rounded text-sm hover:bg-red-700 transition-all flex items-center"
                      >
                        <LogOut size={14} className="mr-1" />
                        ログアウト
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
